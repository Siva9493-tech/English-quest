import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SubtopicAccordion from '../components/SubtopicAccordion'
import { getStats, getSubTopic } from '../utils/progress'
import {
  createRecognition,
  isSpeechSupported,
} from '../components/Pandu/PanduVoice'
import { ariaSpeak, stopAria } from '../components/Pandu/AriaVoice'
import {
  askAriaPractice,
  buildPracticeOpening,
  getPracticeSummary,
  pickPracticeType,
  PRACTICE_TYPE_META,
} from '../components/Pandu/PanduGemini'
import { getPanduUser } from '../components/Pandu/PanduMemory'
import { captureEvent } from '../utils/analytics'

const PHASES = [
  { key: 'learn', label: 'Learn', minutes: 15, color: 'from-indigo-500 to-violet-500' },
  { key: 'shadow', label: 'Shadow', minutes: 15, color: 'from-sky-500 to-cyan-500' },
  { key: 'practice', label: 'Practice', minutes: 15, color: 'from-emerald-500 to-green-500' },
]

const PRACTICE_PHASE_INDEX = 2
const TOTAL_MINUTES = PHASES.reduce((sum, p) => sum + p.minutes, 0)

const PHASE_INSTRUCTIONS = {
  0: { // Learn phase
    emoji: '📺',
    title: 'Active Learning',
    instruction: 'Watch the video above. Pause every 3 minutes and note exactly 3 new things — a word, a rule, or a phrase the creator used.',
    tip: '💡 Tip: Write on paper, not phone. Your brain remembers better.',
    color: 'rgba(0, 229, 255, 0.1)',
    border: 'rgba(0, 229, 255, 0.3)',
  },
  1: { // Shadow phase
    emoji: '🗣️',
    title: 'Shadowing',
    instruction: 'Rewind the video 30 seconds. Press play and speak along with the creator — match their exact speed, tone, pauses and accent. Do this 3 times.',
    tip: '💡 Tip: Don\'t just listen — move your lips and speak out loud every time.',
    color: 'rgba(191, 0, 255, 0.1)',
    border: 'rgba(191, 0, 255, 0.3)',
  },
  2: { // Practice phase
    emoji: '🎙️',
    title: 'Speak with Aria',
    instruction: 'Close the video. Speak only in English for the next 15 minutes using what you just learned. Aria will listen, correct and guide you.',
    tip: '💡 Tap the Aria button below to start your practice session now!',
    color: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
    showAriaButton: true,
  },
};

function format(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DailyPractice() {
  const { subtopicId } = useParams()

  const subTopic = useMemo(() => {
    if (subtopicId) return getSubTopic(subtopicId)
    return getStats().nextSubTopic
  }, [subtopicId])

  if (!subTopic) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Daily Practice
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          No subtopic selected.{' '}
          <Link to="/modules" className="hover:underline" style={{ color: 'var(--color-cyan)' }}>
            Pick one from the World Map.
          </Link>
        </p>
      </div>
    )
  }

  return <PracticeSession subTopic={subTopic} />
}

const INITIAL_TIMER = {
  phaseIndex: 0,
  secondsLeft: PHASES[0].minutes * 60,
  finished: false,
}

function tick(t) {
  if (t.finished) return t
  if (t.secondsLeft > 1) return { ...t, secondsLeft: t.secondsLeft - 1 }
  if (t.phaseIndex < PHASES.length - 1) {
    const next = t.phaseIndex + 1
    return { phaseIndex: next, secondsLeft: PHASES[next].minutes * 60, finished: false }
  }
  return { ...t, secondsLeft: 0, finished: true }
}

function PracticeSession({ subTopic }) {
  const [timer, setTimer] = useState(INITIAL_TIMER)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  const { phaseIndex, secondsLeft, finished } = timer
  const inPractice = phaseIndex === PRACTICE_PHASE_INDEX

  useEffect(() => {
    if (!running || finished) return
    intervalRef.current = setInterval(() => setTimer(tick), 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, finished])

  useEffect(() => {
    if (finished) captureEvent('practice_timer_completed')
  }, [finished])

  const phase = PHASES[phaseIndex]
  const phaseTotal = phase.minutes * 60
  const progress = ((phaseTotal - secondsLeft) / phaseTotal) * 100

  function handleStartPause() {
    if (finished) return
    if (!running) captureEvent('practice_timer_started', { phase: PHASES[phaseIndex].key })
    setRunning((r) => !r)
  }

  function handleReset() {
    setRunning(false)
    setTimer(INITIAL_TIMER)
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          to={`/modules/${subTopic.moduleId}`}
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--color-cyan)' }}
        >
          ← {subTopic.moduleTitle}
        </Link>
        <h1 className="mt-1 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {subTopic.title}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {subTopic.videos.length} video
          {subTopic.videos.length > 1 ? 's' : ''} · +10 XP each
        </p>
      </header>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Watch &amp; track your videos
        </p>
        <SubtopicAccordion subTopics={[subTopic]} />
      </section>

      <section
        className="rounded-2xl p-6 transition-all"
        style={
          inPractice
            ? {
                background: 'rgba(20, 20, 35, 0.92)',
                border: '1px solid var(--color-purple)',
                boxShadow: '0 0 28px rgba(191, 0, 255, 0.35)',
              }
            : { background: '#ffffff', border: '1px solid #e2e8f0' }
        }
      >
        <p
          className="mb-3 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: inPractice ? 'var(--color-cyan)' : '#94a3b8' }}
        >
          Focus Timer · {TOTAL_MINUTES} min total
        </p>
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {PHASES.map((p, i) => (
            <span
              key={p.key}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                i === phaseIndex
                  ? 'bg-indigo-600 text-white'
                  : i < phaseIndex
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {p.label} · {p.minutes}m
            </span>
          ))}
        </div>

        <div className="text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: inPractice ? 'var(--color-cyan)' : '#94a3b8' }}
          >
            {finished ? 'All phases done' : `${phase.label} phase`}
          </p>
          <div
            className="my-2 font-mono text-6xl font-extrabold tabular-nums"
            style={{ color: inPractice ? '#e2e8f0' : '#1e293b' }}
          >
            {format(secondsLeft)}
          </div>
        </div>

        <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: inPractice ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${phase.color} transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleStartPause}
            disabled={finished}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {finished ? 'Finished' : running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Reset
          </button>
        </div>

        {/* Phase Instruction Card */}
        {(() => {
          const phase = PHASE_INSTRUCTIONS[phaseIndex] || PHASE_INSTRUCTIONS[0];
          return (
            <div style={{
              background: phase.color,
              border: `1px solid ${phase.border}`,
              borderRadius: '14px',
              padding: '18px 20px',
              marginTop: '16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <span style={{ fontSize: '24px' }}>{phase.emoji}</span>
                <span style={{
                  color: 'var(--text-primary)',
                  fontWeight: '800',
                  fontSize: '15px',
                }}>
                  {phase.title}
                </span>
              </div>
              <p style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: '0 0 10px',
              }}>
                {phase.instruction}
              </p>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
                margin: 0,
                fontStyle: 'italic',
              }}>
                {phase.tip}
              </p>
              
              {/* Aria button for Practice phase */}
              {phase.showAriaButton && (
                <button
                  onClick={() => {
                    // Trigger Aria session start
                    // Find and click the Aria floating button
                    const ariaBtn = document.querySelector('[data-aria-button]');
                    if (ariaBtn) ariaBtn.click();
                  }}
                  style={{
                    marginTop: '14px',
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #22c55e, #00e5ff)',
                    color: '#0a0a0f',
                    fontWeight: '800',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  🎙️ Start Talking with Aria →
                </button>
              )}
            </div>
          );
        })()}
      </section>

      {inPractice ? (
        <AriaPractice moduleId={subTopic.moduleId} timeUp={finished} />
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-amber-800">
            🎲 Mixed Practice unlocks in the final phase
          </h2>
          <p className="mt-2 leading-relaxed text-amber-900">
            Finish the Learn and Shadow phases. In the Practice phase, Aria will
            launch a <strong>random</strong> live session — Q&amp;A, a scenario
            card, or a roleplay — and talk with you out loud for 15 minutes.
          </p>
        </section>
      )}
    </div>
  )
}

/* ───────────────────────── ARIA LIVE PRACTICE ───────────────────────── */

function historyFromMessages(messages) {
  return messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    content: m.text,
  }))
}

function AriaPractice({ moduleId, timeUp }) {
  // Pick the random type + opening line ONCE, when this session mounts.
  const [session] = useState(() => {
    const type = pickPracticeType()
    return { type, opening: buildPracticeOpening(type, moduleId) }
  })
  const [messages, setMessages] = useState(() => [
    { role: 'aria', text: session.opening },
  ])
  const [turn, setTurn] = useState('aria-speaking') // aria-speaking|listening|thinking|idle|summary|done|unsupported
  const [interim, setInterim] = useState('')

  const messagesRef = useRef(messages)
  const recognitionRef = useRef(null)
  const startListenRef = useRef(null)
  const endedRef = useRef(false)
  const summaryDoneRef = useRef(false)
  const chatRef = useRef(null)

  const meta = PRACTICE_TYPE_META[session.type]

  // Keep a live mirror of messages for async callbacks (no setState here).
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Auto-scroll the chat to the newest bubble.
  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, interim])

  // Drive the whole voice loop. All setState happens inside async callbacks,
  // never synchronously in this effect body (keeps react-hooks lint clean).
  useEffect(() => {
    endedRef.current = false

    function startListening() {
      if (endedRef.current) return
      if (!isSpeechSupported()) {
        setTurn('unsupported')
        return
      }
      const rec = createRecognition()
      if (!rec) {
        setTurn('idle')
        return
      }
      recognitionRef.current = rec
      let finalText = ''

      rec.onresult = (e) => {
        let interimText = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const chunk = e.results[i][0].transcript
          if (e.results[i].isFinal) finalText += chunk
          else interimText += chunk
        }
        setInterim(interimText)
      }
      rec.onerror = () => {}
      rec.onend = () => {
        recognitionRef.current = null
        setInterim('')
        if (endedRef.current) return
        const captured = finalText.trim()
        if (captured) handleUserSpeech(captured)
        else setTurn('idle') // wait for the user to tap "Speak"
      }

      try {
        rec.start()
        setTurn('listening')
      } catch {
        setTurn('idle')
      }
    }

    async function handleUserSpeech(text) {
      setMessages((prev) => [...prev, { role: 'user', text }])
      setTurn('thinking')
      const history = historyFromMessages(messagesRef.current)
      const reply = await askAriaPractice(
        text,
        session.type,
        moduleId,
        getPanduUser(),
        history,
      )
      if (endedRef.current) return
      setMessages((prev) => [...prev, { role: 'aria', text: reply }])
      setTurn('aria-speaking')
      await ariaSpeak(reply)
      if (!endedRef.current) startListening()
    }

    startListenRef.current = startListening

    // Speak Aria's opening line, then start listening.
    ariaSpeak(session.opening).then(() => {
      if (!endedRef.current) startListening()
    })

    return () => {
      endedRef.current = true
      stopAria()
      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore
      }
    }
  }, [moduleId, session])

  // When the 45-minute timer ends, stop the loop and deliver the wrap-up.
  useEffect(() => {
    if (!timeUp) return
    endedRef.current = true
    stopAria()
    try {
      recognitionRef.current?.abort()
    } catch {
      // ignore
    }
    if (summaryDoneRef.current) return
    summaryDoneRef.current = true

    let cancelled = false
    const run = async () => {
      setTurn('thinking')
      const history = historyFromMessages(messagesRef.current)
      const summary = await getPracticeSummary(getPanduUser(), history)
      if (cancelled) return
      setMessages((prev) => [...prev, { role: 'aria', text: summary }])
      setTurn('summary')
      ariaSpeak(summary).then(() => setTurn('done'))
    }
    run()

    return () => {
      cancelled = true
    }
  }, [timeUp])

  return (
    <section
      className="overflow-hidden rounded-2xl p-5"
      style={{
        background: 'rgba(20, 20, 35, 0.92)',
        border: '1px solid var(--color-purple)',
        boxShadow: '0 0 28px rgba(191, 0, 255, 0.3)',
      }}
    >
      {/* Random mode banner */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-cyan)' }}
          >
            🎲 Random Mode
          </p>
          <p className="text-lg font-extrabold" style={{ color: '#e2e8f0' }}>
            {meta.label}
          </p>
        </div>
      </div>

      {/* Chat bubbles */}
      <div
        ref={chatRef}
        className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1"
      >
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {interim && turn === 'listening' && (
          <ChatBubble role="user" text={interim} ghost />
        )}
      </div>

      {/* Turn / status indicator */}
      <div className="mt-4">
        <StatusIndicator
          turn={turn}
          onSpeak={() => startListenRef.current?.()}
        />
      </div>
    </section>
  )
}

function ChatBubble({ role, text, ghost }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm"
        style={
          isUser
            ? {
                background: ghost ? 'rgba(37,99,235,0.45)' : '#2563eb',
                color: '#fff',
                borderBottomRightRadius: 4,
              }
            : {
                background:
                  'linear-gradient(135deg, rgba(191,0,255,0.28), rgba(0,245,255,0.16))',
                color: '#e2e8f0',
                border: '1px solid rgba(0,245,255,0.25)',
                borderBottomLeftRadius: 4,
              }
        }
      >
        {!isUser && <span className="mr-1 font-bold">✨ Aria:</span>}
        {text}
      </div>
    </div>
  )
}

function StatusIndicator({ turn, onSpeak }) {
  if (turn === 'unsupported') {
    return (
      <p className="text-center text-sm" style={{ color: '#fca5a5' }}>
        🎙️ Voice practice needs a microphone + Chrome/Edge. Open the app in a
        real browser to talk with Aria.
      </p>
    )
  }
  if (turn === 'aria-speaking' || turn === 'summary') {
    return (
      <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-cyan)' }}>
        🔊 Aria is speaking…
      </p>
    )
  }
  if (turn === 'thinking') {
    return (
      <p className="text-center text-sm font-semibold" style={{ color: '#c4b5fd' }}>
        💭 Aria is thinking…
      </p>
    )
  }
  if (turn === 'listening') {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        <span className="text-sm font-bold" style={{ color: '#fda4af' }}>
          🎙️ Speak now…
        </span>
      </div>
    )
  }
  if (turn === 'done') {
    return (
      <p className="text-center text-sm font-bold" style={{ color: 'var(--color-gold)' }}>
        ✅ Session complete — great work!
      </p>
    )
  }
  // idle → invite the user to (re)start talking
  return (
    <div className="flex justify-center">
      <button type="button" onClick={onSpeak} className="btn-cyber text-sm">
        🎙️ Speak now
      </button>
    </div>
  )
}
