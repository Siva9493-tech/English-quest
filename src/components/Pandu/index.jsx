import { useEffect, useRef, useState } from 'react'
import PanduButton from './PanduButton'
import PanduPanel from './PanduPanel'
import PanduOnboarding from './PanduOnboarding'
import SessionScorecard from './SessionScorecard'
import TopicSelector from './TopicSelector'
import { createRecognition, isSpeechSupported } from './PanduVoice'
import { ariaSpeak, stopAria } from './AriaVoice'
import { askPandu, setConversationMode } from './PanduGemini'
import {
  pickPracticeType,
  buildPracticeOpening,
  askAriaPractice,
  getPracticeSummary,
} from '../../utils/ariaVoiceUtils'
import {
  analyzeSpeech,
  getAriaFeedback,
  SessionTracker,
  saveSessionSummary,
} from './SpeechAnalyzer'
import {
  getPronunciationTip,
  getPronunciationScore,
} from './PronunciationScorer'
import { analyzeAudioQuality } from './PronunciationAssessor'
import {
  getHistory,
  getPanduUser,
  getRecentHistory,
  isPanduSetup,
  recordSession,
  savePanduUser,
  saveCorrection,
  saveMessage,
  getCorrections,
} from './PanduMemory'
import {
  getAriaMemory,
  generateOpeningMessage,
  updateMemoryAfterSession,
  checkMemoryMilestones,
} from './AriaMemory'
import { getStats } from '../../utils/progress'
import { getUserAccent, getDailyPhrase } from './AccentTrainer'

const PILL_MS = 6000 // keep transcript bubbles visible for 6s
const SILENCE_MS = 15000 // give up listening after 15s if the user never speaks
const SPEECH_END_PAUSE_MS = 3000 // finalize 3s after the user stops talking
const RETRY_AFTER_SILENCE_MS = 800 // pause before listening again on silence
const RETRY_AFTER_ERROR_MS = 2000 // pause before retrying after an error
const TURN_GAP_MS = 500 // natural pause between Aria speaking and listening again
const MAX_SESSION_SECONDS = 1200 // auto-end the call after 20 minutes

// Conversation state machine.
const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
}

const STOP_WORDS = [
  'bye aria',
  'goodbye',
  'end session',
  "that's all",
  'bye',
  'stop',
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function Pandu() {
  const [needsOnboarding, setNeedsOnboarding] = useState(() => !isPanduSetup())
  const [convState, setConvState] = useState(STATES.IDLE)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [userPill, setUserPill] = useState('')
  const [panduPill, setPanduPill] = useState('')
  const [sessionFillerCount, setSessionFillerCount] = useState(0)
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [pronScore, setPronScore] = useState(null)
  // Web Audio API delivery analysis (volume/energy + pause detection).
  const [audioQuality, setAudioQuality] = useState(null)
  const [showScorecard, setShowScorecard] = useState(false)
  const [showTopicSelector, setShowTopicSelector] = useState(false)

  // Shared chat transcript — both the pills and the panel read from this.
  const [messages, setMessages] = useState(() =>
    getHistory().map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  )

  const sessionRef = useRef(false)
  const recognitionRef = useRef(null)
  const pillTimers = useRef({ user: null, pandu: null })
  const trackerRef = useRef(null)
  // Speech API confidence from the most recent recognized utterance.
  const lastConfidenceRef = useRef(null)
  // The chosen practice topic for the active session (null = free chat).
  const selectedTopicRef = useRef(null)
  // The chosen practice type: 'qa', 'prompt', 'roleplay' (null = free chat).
  const practiceTypeRef = useRef(null)
  // Current module ID for practice scenarios.
  const moduleIdRef = useRef(null)

  // Random feedback selector (avoids calling Math.random in render)
  const pickRandomFeedback = useRef(
    (arr) => arr[Math.floor(Math.random() * arr.length)] || null
  ).current

  // Track if mic start has been logged for current session
  const micStartLoggedRef = useRef(false)

  // Clean up voice + recognition on unmount.
  useEffect(() => {
    return () => {
      sessionRef.current = false
      micStartLoggedRef.current = false
      stopAria()
      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore
      }
    }
  }, [])

  // Live session timer; auto-ends the call after MAX_SESSION_SECONDS.
  useEffect(() => {
    if (!sessionActive) return
    const interval = setInterval(() => {
      setSessionSeconds((s) => {
        const next = s + 1
        if (next >= MAX_SESSION_SECONDS) {
          setTimeout(
            () =>
              endSession(
                "We've been talking for 20 minutes — amazing session! See you tomorrow!",
              ),
            0,
          )
          return MAX_SESSION_SECONDS
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive])

  function showUserPill(text) {
    setUserPill(text)
    clearTimeout(pillTimers.current.user)
    pillTimers.current.user = setTimeout(() => setUserPill(''), PILL_MS)
  }

  function showPanduPill(text) {
    setPanduPill(text)
    clearTimeout(pillTimers.current.pandu)
    pillTimers.current.pandu = setTimeout(() => setPanduPill(''), PILL_MS)
  }

  function appendMessage(role, content) {
    saveMessage(role, content)
    setMessages((prev) => [...prev, { role, content, timestamp: Date.now() }])
  }

  // Extract an "instead of X → try Y" tip from Aria's reply and persist it.
  function logCorrectionFromReply(reply) {
    if (!reply) return
    const match = reply.match(
      /instead of\s*["“]([^"”]+)["”]\s*→\s*try\s*["“]([^"”]+)["”]/i,
    )
    if (!match) return
    saveCorrection(match[1].trim(), match[2].trim())
  }

  // Listen for one utterance. Resolves with { transcript, audioBlob };
  // transcript is '' on silence/error and audioBlob is null if recording
  // wasn't possible. A tap can stop early via recognitionRef.
  function listenForSpeech() {
    return new Promise((resolve) => {
      const recognition = createRecognition()
      if (!recognition) {
        resolve({ transcript: '', audioBlob: null })
        return
      }
      recognitionRef.current = recognition

      // Record the mic in parallel with speech recognition so the Web Audio
      // analyzer (PronunciationAssessor) has raw audio to score. This is a
      // separate MediaStream from the one the Speech API manages internally.
      let mediaRecorder = null
      let micStream = null
      const audioChunks = []
      const startRecording = async () => {
        if (typeof MediaRecorder === 'undefined') return
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          mediaRecorder = new MediaRecorder(micStream)
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunks.push(e.data)
          }
          mediaRecorder.start()
        } catch {
          mediaRecorder = null
          micStream?.getTracks().forEach((t) => t.stop())
          micStream = null
        }
      }
      const stopRecording = () =>
        new Promise((res) => {
          const cleanup = () => {
            micStream?.getTracks().forEach((t) => t.stop())
            micStream = null
            res(audioChunks.length ? new Blob(audioChunks) : null)
          }
          if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            cleanup()
            return
          }
          mediaRecorder.onstop = cleanup
          try {
            mediaRecorder.stop()
          } catch {
            cleanup()
          }
        })

      let finalText = ''
      let settled = false
      let speechTimeout = null
      const finish = (value) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        clearTimeout(speechTimeout)
        if (recognitionRef.current === recognition) recognitionRef.current = null
        stopRecording().then((audioBlob) =>
          resolve({ transcript: value, audioBlob }),
        )
      }

      // Overall guard: give up only if the user never says anything at all.
      const timeout = setTimeout(() => {
        try {
          recognition.stop()
        } catch {
          // ignore
        }
      }, SILENCE_MS)

      recognition.onresult = (event) => {
        // The user is speaking — cancel the "never spoke" guard.
        clearTimeout(timeout)
        clearTimeout(speechTimeout)

        // Recognition is continuous, so results accumulate from index 0.
        let interim = ''
        let final = ''
        for (let i = 0; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += chunk + ' '
            // Remember the confidence of the latest final result so the
            // pronunciation scorer can use it.
            const conf = event.results[i][0].confidence
            if (typeof conf === 'number' && conf > 0) {
              lastConfidenceRef.current = conf
            }
          } else interim += chunk
        }
        if (final.trim()) finalText = final.trim()
        showUserPill((final || interim).trim())

        // Wait 3s of silence AFTER the user speaks before finalizing —
        // this gives them time to think and continue their sentence.
        speechTimeout = setTimeout(() => {
          try {
            recognition.stop()
          } catch {
            // ignore
          }
        }, SPEECH_END_PAUSE_MS)
      }
      recognition.onerror = () => finish('')
      recognition.onend = () => finish(finalText)

      try {
        recognition.start()
        startRecording()
        if (!micStartLoggedRef.current) {
          micStartLoggedRef.current = true
          console.log('Aria mic started - waiting for speech...')
        }
      } catch {
        finish('')
      }
    })
  }

  // The continuous phone-call loop: listen → process → speak → repeat.
  async function startConversationLoop() {
    if (!sessionRef.current) return

    try {
      setConvState(STATES.LISTENING)
      const { transcript: userSpeech, audioBlob } = await listenForSpeech()

      if (!sessionRef.current) return

      const clean = (userSpeech || '').trim()
      if (!clean) {
        setTimeout(startConversationLoop, RETRY_AFTER_SILENCE_MS)
        return
      }

      if (STOP_WORDS.some((w) => clean.toLowerCase().includes(w))) {
        await endSession('Bye! Great chat today. Keep practicing!')
        return
      }

      appendMessage('user', clean)
      showUserPill(clean)

      // Let the user re-name themselves mid-conversation ("call me Max").
      const nicknameMatch =
        clean.match(/call me (\w+)/i) ||
        clean.match(/refer to me as (\w+)/i) ||
        clean.match(/my name is (\w+)/i)
      if (nicknameMatch) {
        const raw = nicknameMatch[1]
        const newNickname = raw.charAt(0).toUpperCase() + raw.slice(1)
        const userData = getPanduUser()
        if (userData) {
          userData.nickname = newNickname
          savePanduUser(userData)
        }
        const ackReply =
          `Got it! I'll call you ${newNickname} from now on. ` +
          `So ${newNickname}, what shall we talk about?`
        appendMessage('model', ackReply)
        showPanduPill(ackReply)
        setConvState(STATES.SPEAKING)
        await ariaSpeak(ackReply)
        await sleep(TURN_GAP_MS)
        if (sessionRef.current) startConversationLoop()
        return
      }

      // Analyze the user's speech for fillers, pace and quality.
      const analysis = analyzeSpeech(clean)
      if (trackerRef.current && analysis) {
        trackerRef.current.add(analysis)
      }
      setCurrentAnalysis(analysis)
      setSessionFillerCount((prev) => prev + (analysis?.totalFillers || 0))
      const speechFeedback = getAriaFeedback(analysis)

      // Pronunciation analysis (uses Speech API confidence when available).
      const confidence = lastConfidenceRef.current
      const pScore = getPronunciationScore(clean, confidence)
      setPronScore(pScore)
      if (trackerRef.current) trackerRef.current.addPronScore(pScore)
      const pronTip = getPronunciationTip(clean)

      // Web Audio API delivery analysis on the recorded blob — scores volume
      // consistency and pauses. Runs locally, no external API.
      if (audioBlob) {
        analyzeAudioQuality(audioBlob).then((result) => {
          if (result && sessionRef.current) setAudioQuality(result)
        })
      }

      // Only weave ONE feedback note into Aria's reply per turn, picked
      // at random so tips alternate between speech and pronunciation.
      const allFeedback = [speechFeedback, pronTip].filter(Boolean)
      const feedbackToSend = pickRandomFeedback(allFeedback)

      setConvState(STATES.PROCESSING)
      const stats = getStats()
      const topic = selectedTopicRef.current
      const practiceType = practiceTypeRef.current
      const moduleId = moduleIdRef.current
      const isPracticeMode = !!practiceType
      
      const topicContext = topic
        ? `Today's practice topic: ${topic.title} — ${topic.desc}. Keep the conversation focused on this.`
        : 'Free conversation mode'
      const progressData = `Module: ${
        stats?.nextSubTopic?.moduleTitle || 'General'
      }, Topic: ${topicContext}, XP: ${stats?.earnedXp || 0}`

      // Append the chosen feedback so Aria can weave it into her reply.
      const messageWithFeedback = feedbackToSend
        ? clean +
          '\n[SYSTEM: After your natural reply, also include this feedback: ' +
          feedbackToSend +
          ']'
        : clean

      let reply
      if (isPracticeMode) {
        // Use practice mode API with specialized system prompt
        reply = await askAriaPractice(
          messageWithFeedback,
          practiceType,
          moduleId,
          getPanduUser(),
          getRecentHistory(),
        )
      } else {
        // Free chat mode
        reply = await askPandu(
          messageWithFeedback,
          getPanduUser(),
          progressData,
          getRecentHistory(),
        )
      }

      if (!sessionRef.current) return

      appendMessage('model', reply)
      logCorrectionFromReply(reply)
      showPanduPill(reply)

      setConvState(STATES.SPEAKING)
      await ariaSpeak(reply)

      await sleep(TURN_GAP_MS)
      if (sessionRef.current) startConversationLoop()
    } catch (error) {
      console.error('Conversation error:', error)
      if (sessionRef.current) {
        setTimeout(startConversationLoop, RETRY_AFTER_ERROR_MS)
      }
    }
  }

  async function startSession() {
    if (sessionRef.current) return

    const userData = getPanduUser()
    if (!userData) {
      setNeedsOnboarding(true)
      return
    }

    if (!isSpeechSupported()) {
      showPanduPill('Please use Chrome or Edge for the best voice experience.')
      return
    }

    // Ask for mic permission up front so the loop isn't blocked mid-turn.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      showPanduPill(
        'I need mic access to talk with you! Please click Allow when your browser asks 🎙️',
      )
      return
    }

    // Let the user pick a topic before the conversation begins.
    setShowTopicSelector(true)
  }

  // Start the actual conversation once a topic (or free chat) is chosen.
  async function startSessionWithTopic(topic) {
    if (sessionRef.current) return
    setShowTopicSelector(false)
    selectedTopicRef.current = topic

    const userData = getPanduUser()

    sessionRef.current = true
    trackerRef.current = new SessionTracker()
    setSessionSeconds(0)
    setSessionFillerCount(0)
    setCurrentAnalysis(null)
    setPronScore(null)
    setAudioQuality(null)
    lastConfidenceRef.current = null
    setSessionActive(true)
    setConversationMode(true)
    recordSession()

    const name = userData?.nickname || userData?.name || 'friend'
    
    // Determine module ID for practice scenarios
    const stats = getStats()
    const moduleId = stats?.nextSubTopic?.moduleId || 'm1'
    moduleIdRef.current = moduleId
    
    // Pick practice type for structured sessions (not free chat)
    const isFreeChat = !topic
    let practiceType = null
    if (!isFreeChat) {
      practiceType = pickPracticeType()
      practiceTypeRef.current = practiceType
    }
    
    // Build greeting based on mode
    const memory = getAriaMemory()
    let greeting
    if (isFreeChat) {
      greeting = generateOpeningMessage(memory, name)
    } else {
      greeting = buildPracticeOpening(practiceType, moduleId)
    }

    appendMessage('model', greeting)
    showPanduPill(greeting)
    setConvState(STATES.SPEAKING)
    await ariaSpeak(greeting)

    // Accent phrase of the day — spoken right after the greeting so it never
    // overlaps with the live listening loop.
    if (sessionRef.current) {
      const dailyPhrase = getDailyPhrase(getUserAccent())
      const phraseIntro =
        `Oh, and your ${dailyPhrase.accent} phrase of the day: ` +
        `"${dailyPhrase.phrase}" — it means ${dailyPhrase.meaning}. ` +
        `Try using it today!`
      appendMessage('model', phraseIntro)
      showPanduPill(phraseIntro)
      await ariaSpeak(phraseIntro)
    }

    if (sessionRef.current) startConversationLoop()
  }

  async function endSession(farewell) {
    if (!sessionRef.current && !sessionActive) return
    sessionRef.current = false
    micStartLoggedRef.current = false
    // Capture the practiced topic before clearing it — memory needs it below.
    const sessionTopic = selectedTopicRef.current
    const practiceType = practiceTypeRef.current
    const isPracticeMode = !!practiceType
    
    selectedTopicRef.current = null
    practiceTypeRef.current = null
    moduleIdRef.current = null

    try {
      recognitionRef.current?.abort()
    } catch {
      // ignore
    }
    recognitionRef.current = null

    if (farewell) {
      setConvState(STATES.SPEAKING)
      appendMessage('model', farewell)
      showPanduPill(farewell)
      await ariaSpeak(farewell)
    } else {
      stopAria()
    }

    // Persist session stats for history.
    let summary = null
    if (trackerRef.current) {
      summary = trackerRef.current.getSummary()
      if (summary) saveSessionSummary(summary)
      trackerRef.current = null
    }

    // Update Aria's cross-session memory and check for milestone badges.
    if (summary) {
      const memory = updateMemoryAfterSession(
        summary,
        sessionTopic,
        getCorrections(),
      )
      const milestones = checkMemoryMilestones(memory)
      if (milestones.length > 0) {
        try {
          localStorage.setItem('ariaMilestones', JSON.stringify(milestones))
        } catch {
          // ignore storage errors
        }
      }
    }

    if (summary) {
      // Update the daily streak (any real speech counts).
      try {
        const today = new Date().toDateString()
        const lastActive = localStorage.getItem('lastActiveDate')
        let streak = parseInt(localStorage.getItem('streak') || '0', 10)
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        if (lastActive === yesterday) {
          streak += 1
        } else if (lastActive !== today) {
          streak = 1
        }

        localStorage.setItem('streak', streak.toString())
        localStorage.setItem('lastActiveDate', today)
      } catch {
        // ignore storage errors
      }
    }

    // Only show the scorecard for a session with meaningful content:
    // at least 30 words spoken across at least 3 exchanges.
    const meaningful =
      summary && summary.totalWords >= 30 && summary.exchanges >= 3

    if (meaningful) {
      try {
        localStorage.setItem('lastSessionSummary', JSON.stringify(summary))
      } catch {
        // ignore storage errors
      }

      // Let Aria speak a wrap-up summary
      let spokenSummary
      if (isPracticeMode) {
        // Use structured practice summary (2 wins + 1 improvement)
        const practiceSummary = await getPracticeSummary(getPanduUser(), messages)
        spokenSummary = practiceSummary
      } else {
        // Free chat summary
        const { fluencyGrade, totalFillers, avgQuality } = summary
        spokenSummary =
          `Great session! You scored ${fluencyGrade.grade} ` +
          `with ${avgQuality} percent quality. ` +
          (totalFillers === 0
            ? 'And zero filler words — amazing!'
            : 'Watch out for filler words next time.') +
          ' See your full scorecard now!'
      }

      setConvState(STATES.SPEAKING)
      await ariaSpeak(spokenSummary)

      // Show scorecard after a short delay (let Aria finish speaking first).
      setTimeout(() => {
        setShowScorecard(true)
      }, 1500)
    } else if (!farewell) {
      // Too short and nothing was said on the way out — quick, friendly bye.
      setConvState(STATES.SPEAKING)
      await ariaSpeak(
        "Quick chat! Come back for a longer session — I'll be here!",
      )
    }

    setSessionFillerCount(0)
    setCurrentAnalysis(null)
    setPronScore(null)
    setAudioQuality(null)
    setConversationMode(false)
    setSessionActive(false)
    setConvState(STATES.IDLE)
  }

  function toggleSession() {
    if (sessionRef.current) {
      endSession('Talk soon! Keep it up!')
    } else {
      startSession()
    }
  }

  function handleOnboardingComplete() {
    setNeedsOnboarding(false)
  }

  if (needsOnboarding) {
    return <PanduOnboarding onComplete={handleOnboardingComplete} />
  }

  const showPills = userPill || panduPill || convState === STATES.LISTENING

  return (
    <>
      {/* transcript pills above the button */}
      {showPills && (
        <div className="fixed bottom-44 right-6 z-[81] flex max-w-[260px] flex-col items-end gap-2">
          {convState === STATES.LISTENING && !userPill && (
            <div className="flex items-center gap-2 rounded-2xl rounded-br-sm bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Listening…
            </div>
          )}
          {userPill && (
            <div className="rounded-2xl rounded-br-sm bg-white px-3 py-2 text-sm text-slate-700 shadow-lg">
              {userPill}
            </div>
          )}
          {panduPill && (
            <div className="rounded-2xl rounded-br-sm bg-indigo-600 px-3 py-2 text-sm text-white shadow-lg">
              {panduPill}
            </div>
          )}
        </div>
      )}

      <PanduButton
        convState={convState}
        sessionActive={sessionActive}
        onTap={toggleSession}
        onOpenPanel={() => setPanelOpen(true)}
      />

      <PanduPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        sessionActive={sessionActive}
        convState={convState}
        sessionSeconds={sessionSeconds}
        messages={messages}
        onToggleSession={toggleSession}
        sessionFillerCount={sessionFillerCount}
        currentAnalysis={currentAnalysis}
        pronScore={pronScore}
        audioQuality={audioQuality}
      />

      {showScorecard && (
        <SessionScorecard
          onClose={() => {
            setShowScorecard(false)
            // Clear last summary so it doesn't show again on refresh.
            localStorage.removeItem('lastSessionSummary')
          }}
        />
      )}

      {showTopicSelector && (
        <TopicSelector
          onSelect={(topic) => startSessionWithTopic(topic)}
          onSkip={() => startSessionWithTopic(null)}
        />
      )}
    </>
  )
}
