import { useEffect, useRef, useState } from 'react'
import PanduButton from './PanduButton'
import PanduPanel from './PanduPanel'
import PanduOnboarding from './PanduOnboarding'
import {
  createRecognition,
  isSpeechSupported,
  panduSpeak,
  stopSpeaking,
} from './PanduVoice'
import { askPandu } from './PanduGemini'
import {
  getPanduUser,
  isPanduSetup,
  recordSession,
  saveMessage,
} from './PanduMemory'
import { getStats } from '../../utils/progress'

const PILL_MS = 4000

export default function Pandu() {
  const [needsOnboarding, setNeedsOnboarding] = useState(() => !isPanduSetup())
  const [state, setState] = useState('idle') // idle | listening | speaking
  const [panelOpen, setPanelOpen] = useState(false)
  const [userPill, setUserPill] = useState('')
  const [panduPill, setPanduPill] = useState('')

  const recognitionRef = useRef(null)
  const finalRef = useRef('')
  const pillTimers = useRef({ user: null, pandu: null })

  useEffect(() => {
    const recognition = recognitionRef
    return () => {
      stopSpeaking()
      try {
        recognition.current?.abort()
      } catch {
        // ignore
      }
    }
  }, [])

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

  async function processSpeech(transcript) {
    const text = transcript.trim()
    if (!text) {
      setState('idle')
      return
    }
    saveMessage('user', text)
    const progress = getStats()
    const reply = await askPandu(text, getPanduUser(), progress, [])
    saveMessage('model', reply)
    showPanduPill(reply)
    setState('speaking')
    panduSpeak(reply, () => setState('idle'))
  }

  function startListening() {
    if (!isSpeechSupported()) {
      showPanduPill('Please use Chrome for the best voice experience.')
      return
    }
    const recognition = createRecognition()
    if (!recognition) return
    recognitionRef.current = recognition
    finalRef.current = ''
    recordSession()

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) final += chunk
        else interim += chunk
      }
      if (final) finalRef.current = final
      showUserPill(final || interim)
    }
    recognition.onerror = () => setState('idle')
    recognition.onend = () => {
      const captured = finalRef.current
      recognitionRef.current = null
      if (captured) processSpeech(captured)
      else setState('idle')
    }

    try {
      recognition.start()
      console.log('Leo mic started - waiting for speech...')
      setState('listening')
    } catch {
      setState('idle')
    }
  }

  // Abort listening without processing speech (used when a press becomes a drag).
  function cancelListening() {
    const rec = recognitionRef.current
    finalRef.current = ''
    recognitionRef.current = null
    if (rec) {
      try {
        rec.abort()
      } catch {
        // ignore
      }
    }
    setState('idle')
  }

  function handlePressStart() {
    if (state === 'idle') startListening()
  }

  function handleTap() {
    if (state === 'speaking') {
      stopSpeaking()
      setState('idle')
      return
    }
    if (state === 'listening') {
      try {
        recognitionRef.current?.stop()
      } catch {
        // ignore
      }
      return
    }
    startListening()
  }

  function handleOnboardingComplete() {
    setNeedsOnboarding(false)
  }

  if (needsOnboarding) {
    return <PanduOnboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <>
      {/* transcript pills above the button */}
      {(userPill || panduPill || state === 'listening') && (
        <div className="fixed bottom-24 right-6 z-[81] flex max-w-[260px] flex-col items-end gap-2">
          {state === 'listening' && !userPill && (
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
        state={state}
        onTap={handleTap}
        onOpenPanel={() => setPanelOpen(true)}
        onPressStart={handlePressStart}
        onCancel={cancelListening}
      />

      <PanduPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}
