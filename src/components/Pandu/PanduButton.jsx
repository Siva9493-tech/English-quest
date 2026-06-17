import { useEffect, useRef, useState } from 'react'
import AriaAvatar from './AriaAvatar'
import { getPosition, savePosition } from './PanduMemory'

const SIZE = 64
const MARGIN = 24
const MOVE_THRESHOLD = 8
const LONG_PRESS_MS = 5000
const LOADING_POLL_MS = 2000
const LOADING_TIMEOUT_MS = 30000

// Wave-ring color per conversation state.
const WAVE_COLORS = {
  idle: 'rgba(139, 92, 246, 0.3)',
  listening: 'rgba(0, 229, 255, 0.5)',
  processing: 'rgba(191, 0, 255, 0.45)',
  speaking: 'rgba(34, 197, 94, 0.45)',
}

const BORDER_COLORS = {
  idle: '#a78bfa',
  listening: '#00e5ff',
  processing: '#bf00ff',
  speaking: '#22c55e',
}

const STATE_PILL = {
  listening: '🎙️ Listening…',
  processing: '💭 Thinking…',
  speaking: '🔊 Aria speaking…',
}

function cornerStyle(corner) {
  switch (corner) {
    case 'top-left':
      return { top: MARGIN, left: MARGIN }
    case 'top-right':
      return { top: MARGIN, right: MARGIN }
    case 'bottom-left':
      return { bottom: MARGIN, left: MARGIN }
    default:
      return { bottom: MARGIN, right: MARGIN }
  }
}

function nearestCorner(cx, cy) {
  const vertical = cy < window.innerHeight / 2 ? 'top' : 'bottom'
  const horizontal = cx < window.innerWidth / 2 ? 'left' : 'right'
  return `${vertical}-${horizontal}`
}

export default function PanduButton({
  convState,
  sessionActive,
  onTap,
  onOpenPanel,
}) {
  const [corner, setCorner] = useState(() => getPosition())
  const [dragPos, setDragPos] = useState(null)
  const [voiceLoading, setVoiceLoading] = useState(
    () => !localStorage.getItem('ariaVoiceLoaded'),
  )
  const dragRef = useRef(null)
  const timerRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const pollRef = useRef(null)

  // Test Groq connection on load.
  useEffect(() => {
    const testKey = import.meta.env.VITE_GROQ_API_KEY
    console.log(
      'Aria API Key status:',
      testKey ? `loaded (${testKey.length} chars)` : 'MISSING - check .env',
    )
  }, [])

  // On first ever visit the Kokoro voice model downloads in the background.
  // Poll for the "ariaVoiceLoaded" flag and hide the indicator once it's set
  // (or give up after the timeout, e.g. when it falls back to browser TTS).
  useEffect(() => {
    if (!voiceLoading) return

    pollRef.current = setInterval(() => {
      if (localStorage.getItem('ariaVoiceLoaded')) {
        setVoiceLoading(false)
      }
    }, LOADING_POLL_MS)

    loadingTimerRef.current = setTimeout(() => {
      setVoiceLoading(false)
    }, LOADING_TIMEOUT_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    }
  }, [voiceLoading])

  function handlePointerDown(e) {
    // Only the primary (left) button drives drag + the session tap.
    // Right / middle clicks are reserved for opening the panel (contextmenu)
    // and must never start a session toggle.
    if (e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore capture errors
    }
    dragRef.current = {
      downX: e.clientX,
      downY: e.clientY,
      moved: false,
      longPressed: false,
    }
    // Long-press (no drag) opens the full panel.
    timerRef.current = setTimeout(() => {
      if (dragRef.current && !dragRef.current.moved) {
        dragRef.current.longPressed = true
        onOpenPanel()
      }
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(e) {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.downX
    const dy = e.clientY - d.downY
    if (!d.moved && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      d.moved = true
      clearTimeout(timerRef.current)
    }
    if (d.moved) {
      setDragPos({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 })
    }
  }

  function handlePointerUp(e) {
    const d = dragRef.current
    // No tracked primary-button press (e.g. this was a right-click) — do
    // nothing so the panel toggle stays fully independent of the session.
    if (!d) return
    clearTimeout(timerRef.current)
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore release errors
    }
    if (d?.moved) {
      const c = nearestCorner(e.clientX, e.clientY)
      setCorner(c)
      savePosition(c)
      setDragPos(null)
    } else if (!d?.longPressed) {
      // A plain tap toggles the conversation session (start / stop).
      onTap()
    }
  }

  function handleContextMenu(e) {
    if (e.ctrlKey) {
      e.preventDefault()
      onOpenPanel()
    }
  }

  const positionStyle = dragPos
    ? { left: dragPos.x, top: dragPos.y }
    : cornerStyle(corner)

  const effectiveState = sessionActive ? convState : 'idle'
  const waveColor = WAVE_COLORS[effectiveState] || WAVE_COLORS.idle
  const borderColor = BORDER_COLORS[effectiveState] || BORDER_COLORS.idle
  const waveClass =
    effectiveState === 'speaking' ? 'pandu-wave pandu-wave-speak' : 'pandu-wave'
  const waveDuration = effectiveState === 'listening' ? '1s' : undefined
  const pillLabel = sessionActive ? STATE_PILL[convState] : null

  return (
    <div
      className="fixed z-[80] select-none"
      style={{ ...positionStyle, width: SIZE, height: SIZE, touchAction: 'none' }}
    >
      {/* live conversation-state pill above the button */}
      {pillLabel && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            background:
              convState === 'listening'
                ? 'rgba(0, 229, 255, 0.15)'
                : convState === 'speaking'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(191, 0, 255, 0.15)',
            border: `1px solid ${borderColor}`,
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(10px)',
          }}
        >
          {pillLabel}
        </div>
      )}

      {/* expanding wave rings */}
      <span
        className={waveClass}
        style={{
          inset: 0,
          backgroundColor: waveColor,
          animationDuration: waveDuration,
        }}
      />
      <span
        className={waveClass}
        style={{
          inset: 0,
          backgroundColor: waveColor,
          animationDuration: waveDuration,
        }}
      />

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        aria-label={sessionActive ? 'End conversation with Aria' : 'Talk to Aria'}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl transition-transform active:scale-95"
        style={{
          border: `3px solid ${borderColor}`,
          boxShadow: `0 8px 24px ${waveColor}, 0 0 0 1px rgba(0,0,0,0.04)`,
        }}
      >
        <AriaAvatar size={48} />
        {sessionActive && convState === 'listening' && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </button>
      {voiceLoading && (
        <div className="mt-2 text-center text-xs font-medium animate-pulse" style={{ color: 'var(--color-cyan)' }}>
          🎙️ Loading voice…
        </div>
      )}
    </div>
  )
}
