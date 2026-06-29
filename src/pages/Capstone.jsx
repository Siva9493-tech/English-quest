import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isCapstoneUnlocked } from '../utils/progress'
import { createRecognition, isSpeechSupported } from '../components/Pandu/PanduVoice'
import { ariaSpeak, stopAria } from '../components/Pandu/AriaVoice'
import { getCapstoneEvaluation, PRACTICE_SCENARIOS } from '../components/Pandu/PanduGemini'
import { getPanduUser } from '../components/Pandu/PanduMemory'

const SPEECH_SECONDS = 5 * 60 // 5-minute continuous speech

// ── Part 1: grammar rules drawn from Module 1 (The Origin Isle) ──
const M1_GRAMMAR_RULES = [
  'Use the right article — "a", "an" or "the" — every time',
  'Switch cleanly between past, present and future tenses',
  'Turn at least one sentence from passive into active voice',
  'Join two ideas with a FANBOYS connector (and, but, so…)',
  'Keep a clean Subject-Verb-Object structure',
  'Use a modal verb (can, should, would, must) correctly',
  'Drop in a well-placed adjective to describe something vividly',
]

// ── Part 3: modern slang drawn from Module 7 (Slay Shores) ──
const M7_SLANG = [
  'no cap',
  "it's giving",
  'lowkey',
  'bussin',
  'main character energy',
  'fr fr',
  'slay',
  'vibe check',
]

function pickRandom(list, count) {
  const pool = [...list]
  const out = []
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(i, 1)[0])
  }
  return out
}

// Build the 3-part challenge once per attempt.
function buildChallenge() {
  return {
    grammar: pickRandom(M1_GRAMMAR_RULES, 2),
    business: PRACTICE_SCENARIOS.m10.prompt,
    slang: pickRandom(M7_SLANG, 3),
  }
}

function format(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Capstone() {
  const navigate = useNavigate()
  const unlocked = useMemo(() => isCapstoneUnlocked(), [])

  if (!unlocked) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-7xl">🔒</div>
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          The Capstone is locked
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Clear all 14 islands to 100% to unlock the Final Boss challenge.
        </p>
        <button type="button" onClick={() => navigate('/modules')} className="btn-cyber">
          ← Back to the World Map
        </button>
      </div>
    )
  }

  return <CapstoneChallenge />
}

function CapstoneChallenge() {
  const [challenge] = useState(buildChallenge)
  // phase: intro | recording | evaluating | done | unsupported
  const [phase, setPhase] = useState('intro')
  const [secondsLeft, setSecondsLeft] = useState(SPEECH_SECONDS)
  const [interim, setInterim] = useState('')
  const [result, setResult] = useState(null) // { score, feedback }
  const [certUrl, setCertUrl] = useState(null)

  const transcriptRef = useRef('')
  const recognitionRef = useRef(null)
  const recordingRef = useRef(false)
  const intervalRef = useRef(null)

  const user = useMemo(() => getPanduUser(), [])

  // ── Recognition: keep one continuous stream alive for the whole 5 minutes ──
  function startRecognition() {
    if (!isSpeechSupported()) {
      setPhase('unsupported')
      return false
    }
    const rec = createRecognition()
    if (!rec) {
      setPhase('unsupported')
      return false
    }
    recognitionRef.current = rec

    rec.onresult = (e) => {
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript
        if (e.results[i].isFinal) transcriptRef.current += chunk + ' '
        else interimText += chunk
      }
      setInterim(interimText)
    }
    rec.onerror = () => {}
    // The browser may auto-end the stream; restart it while we're still recording.
    rec.onend = () => {
      recognitionRef.current = null
      if (!recordingRef.current) return
      const rec2 = createRecognition()
      if (!rec2) return
      rec2.onresult = rec.onresult
      rec2.onerror = rec.onerror
      rec2.onend = rec.onend
      recognitionRef.current = rec2
      try {
        rec2.start()
      } catch {
        // ignore restart failure
      }
    }

    try {
      rec.start()
      return true
    } catch {
      setPhase('unsupported')
      return false
    }
  }

  function stopRecognition() {
    recordingRef.current = false
    try {
      recognitionRef.current?.abort()
    } catch {
      // ignore
    }
    recognitionRef.current = null
    setInterim('')
  }

  function handleStart() {
    transcriptRef.current = ''
    recordingRef.current = true
    setSecondsLeft(SPEECH_SECONDS)
    const ok = startRecognition()
    if (!ok) return
    setPhase('recording')
    ariaSpeak(
      "This is it — your Capstone! Combine your grammar, a business scenario, and some slang into one smooth five-minute speech. Take a breath, and begin whenever you're ready.",
    )
  }

  // Countdown while recording; auto-finish at zero.
  useEffect(() => {
    if (phase !== 'recording') return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          finishAndEvaluate()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function finishAndEvaluate() {
    if (phase === 'evaluating' || phase === 'done') return
    clearInterval(intervalRef.current)
    stopRecognition()
    stopAria()
    setPhase('evaluating')

    const evaluation = await getCapstoneEvaluation(transcriptRef.current, user)
    setResult(evaluation)

    const name = user?.name || 'EnglishQuest Champion'
    const url = drawCertificate(name, todayLabel(), evaluation.score)
    setCertUrl(url)

    setPhase('done')
    ariaSpeak(evaluation.feedback)
  }

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      stopRecognition()
      stopAria()
    }
  }, [])

  return (
    <div className="space-y-6">
      <header className="text-center">
        <Link
          to="/modules"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--color-cyan)' }}
        >
          ← World Map
        </Link>
        <h1
          className="text-glow-gold mt-1 text-3xl font-extrabold"
          style={{ color: 'var(--color-gold)' }}
        >
          👑 The Capstone — Final Boss
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          One continuous 5-minute speech · all 14 islands cleared
        </p>
      </header>

      {/* The 3-part challenge brief */}
      <section className="grid gap-4 sm:grid-cols-3">
        <ChallengeCard
          n={1}
          emoji="🌋"
          title="Grammar (M1)"
          tint="rgba(0,245,255,0.3)"
        >
          <ul className="list-disc space-y-1 pl-4">
            {challenge.grammar.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </ChallengeCard>

        <ChallengeCard
          n={2}
          emoji="🏙️"
          title="Business (M10)"
          tint="rgba(191,0,255,0.3)"
        >
          <p>{challenge.business}</p>
        </ChallengeCard>

        <ChallengeCard
          n={3}
          emoji="✨"
          title="Slang (M7)"
          tint="rgba(255,0,110,0.3)"
        >
          <p className="mb-1">Weave these in naturally:</p>
          <div className="flex flex-wrap gap-1.5">
            {challenge.slang.map((s) => (
              <span
                key={s}
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: 'rgba(255,0,110,0.15)', color: '#fda4af' }}
              >
                “{s}”
              </span>
            ))}
          </div>
        </ChallengeCard>
      </section>

      {/* Timer + recorder */}
      {phase !== 'done' && (
        <section
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(20, 20, 35, 0.92)',
            border: '1px solid var(--color-gold)',
            boxShadow: '0 0 28px rgba(201, 168, 76, 0.35)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-cyan)' }}
          >
            {phase === 'recording'
              ? '🎙️ Recording — speak continuously'
              : phase === 'evaluating'
                ? '💭 Aria is grading your speech…'
                : 'Speech Timer'}
          </p>
          <div
            className="my-3 font-mono text-6xl font-extrabold tabular-nums"
            style={{ color: '#e2e8f0' }}
          >
            {format(secondsLeft)}
          </div>

          {phase === 'recording' && (
            <div className="mx-auto mb-4 min-h-[2.5rem] max-w-xl text-sm italic" style={{ color: 'var(--text-muted)' }}>
              {interim || 'Listening…'}
            </div>
          )}

          {phase === 'intro' && (
            <button type="button" onClick={handleStart} className="btn-cyber">
              🎬 Start the 5-minute speech
            </button>
          )}
          {phase === 'recording' && (
            <button type="button" onClick={finishAndEvaluate} className="btn-cyber">
              ✅ Finish & get my score
            </button>
          )}
          {phase === 'evaluating' && (
            <p className="text-sm font-semibold" style={{ color: '#c4b5fd' }}>
              Hang tight…
            </p>
          )}
          {phase === 'unsupported' && (
            <p className="text-sm" style={{ color: '#fca5a5' }}>
              🎙️ The Capstone needs a microphone + Chrome/Edge. Open the app in a
              real browser to record your speech.
            </p>
          )}
        </section>
      )}

      {/* Result + certificate */}
      {phase === 'done' && result && (
        <section
          className="space-y-5 rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(20, 20, 35, 0.92)',
            border: '1px solid var(--color-gold)',
            boxShadow: '0 0 40px rgba(201, 168, 76, 0.5)',
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-cyan)' }}>
              Final Score
            </p>
            <div className="text-6xl font-extrabold" style={{ color: 'var(--color-gold)' }}>
              {result.score}
              <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>
                /100
              </span>
            </div>
          </div>

          <p className="mx-auto max-w-xl leading-relaxed" style={{ color: '#e2e8f0' }}>
            <span className="font-bold">✨ Aria:</span> {result.feedback}
          </p>

          {certUrl && (
            <div className="space-y-3">
              <img
                src={certUrl}
                alt="EnglishQuest Certificate of Completion"
                className="mx-auto w-full max-w-2xl rounded-xl"
                style={{ border: '1px solid var(--border-glow)' }}
              />
              <div>
                <a
                  href={certUrl}
                  download="EnglishQuest-Certificate.png"
                  className="btn-cyber inline-block"
                >
                  ⬇️ Download your certificate
                </a>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function ChallengeCard({ n, emoji, title, tint, children }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(20, 20, 35, 0.85)',
        border: `1px solid ${tint}`,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-cyan)' }}>
            Part {n}
          </p>
          <p className="text-sm font-extrabold" style={{ color: '#e2e8f0' }}>
            {title}
          </p>
        </div>
      </div>
      <div className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
        {children}
      </div>
    </div>
  )
}

/* ───────────────────────── CERTIFICATE (Canvas API) ───────────────────────── */

// Render a completion certificate to an offscreen canvas and return a PNG data URL.
function drawCertificate(name, dateStr, score) {
  const W = 1000
  const H = 700
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b0b14')
  bg.addColorStop(1, '#161427')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Outer gold frame
  ctx.strokeStyle = '#c9a84c'
  ctx.lineWidth = 8
  ctx.strokeRect(30, 30, W - 60, H - 60)
  ctx.strokeStyle = 'rgba(0, 245, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.strokeRect(48, 48, W - 96, H - 96)

  ctx.textAlign = 'center'

  // Crown + brand
  ctx.font = '60px serif'
  ctx.fillText('👑', W / 2, 150)

  ctx.fillStyle = '#00f5ff'
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText('EnglishQuest', W / 2, 200)

  // Title
  ctx.fillStyle = '#c9a84c'
  ctx.font = 'bold 46px Georgia, serif'
  ctx.fillText('Certificate of Completion', W / 2, 270)

  // Presented to
  ctx.fillStyle = '#94a3b8'
  ctx.font = 'italic 22px Georgia, serif'
  ctx.fillText('This certifies that', W / 2, 340)

  // Name
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px Georgia, serif'
  ctx.fillText(name, W / 2, 410)

  // Body
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '22px Georgia, serif'
  ctx.fillText('has cleared all 14 modules and conquered the Capstone Challenge', W / 2, 470)

  // Score badge
  ctx.fillStyle = '#c9a84c'
  ctx.font = 'bold 40px Georgia, serif'
  ctx.fillText(`Final Score: ${score}/100`, W / 2, 540)

  // Date + signature line
  ctx.fillStyle = '#94a3b8'
  ctx.font = '20px Georgia, serif'
  ctx.fillText(dateStr, W / 2, 610)

  ctx.fillStyle = '#bf00ff'
  ctx.font = 'italic 22px Georgia, serif'
  ctx.fillText('— Aria, your English coach ✨', W / 2, 645)

  return canvas.toDataURL('image/png')
}
