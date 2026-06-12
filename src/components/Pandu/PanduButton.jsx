import { useRef, useState } from 'react'
import panduIcon from '../../assets/pandu-icon.png'
import { getPosition, savePosition } from './PanduMemory'

const SIZE = 64
const MARGIN = 24
const MOVE_THRESHOLD = 8
const LONG_PRESS_MS = 5000

const WAVE_COLORS = {
  idle: 'rgba(139, 92, 246, 0.3)',
  listening: 'rgba(239, 68, 68, 0.4)',
  speaking: 'rgba(34, 197, 94, 0.4)',
}

const BORDER_COLORS = {
  idle: '#a78bfa',
  listening: '#ef4444',
  speaking: '#22c55e',
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
  state,
  onTap,
  onOpenPanel,
  onPressStart,
  onCancel,
}) {
  const [corner, setCorner] = useState(() => getPosition())
  const [dragPos, setDragPos] = useState(null)
  const [pressing, setPressing] = useState(false)
  const dragRef = useRef(null)
  const timerRef = useRef(null)

  function handlePointerDown(e) {
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
      startedListening: false,
    }
    // Immediate feedback: show the red dot the moment the finger goes DOWN.
    // For an idle tap this also begins listening right away (not on release).
    if (state === 'idle') {
      setPressing(true)
      dragRef.current.startedListening = true
      onPressStart()
    }
    timerRef.current = setTimeout(() => {
      if (dragRef.current && !dragRef.current.moved) {
        dragRef.current.longPressed = true
        if (dragRef.current.startedListening) onCancel()
        setPressing(false)
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
      // A drag is not a tap — cancel any listening we started on press.
      if (d.startedListening) {
        d.startedListening = false
        setPressing(false)
        onCancel()
      }
    }
    if (d.moved) {
      setDragPos({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 })
    }
  }

  function handlePointerUp(e) {
    clearTimeout(timerRef.current)
    setPressing(false)
    const d = dragRef.current
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
    } else if (!d?.longPressed && !d?.startedListening) {
      // Tap while busy (listening/speaking) — toggle to stop/interrupt.
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

  const effectiveState = pressing && state === 'idle' ? 'listening' : state
  const waveColor = WAVE_COLORS[effectiveState] || WAVE_COLORS.idle
  const waveClass =
    effectiveState === 'speaking' ? 'pandu-wave pandu-wave-speak' : 'pandu-wave'
  const waveDuration = effectiveState === 'listening' ? '1s' : undefined

  return (
    <div
      className="fixed z-[80] select-none"
      style={{ ...positionStyle, width: SIZE, height: SIZE, touchAction: 'none' }}
    >
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
        aria-label="Talk to Leo"
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl transition-transform active:scale-95"
        style={{
          border: `3px solid ${BORDER_COLORS[effectiveState] || BORDER_COLORS.idle}`,
          boxShadow: `0 8px 24px ${waveColor}, 0 0 0 1px rgba(0,0,0,0.04)`,
        }}
      >
        <img
          src={panduIcon}
          alt="Leo"
          draggable={false}
          className="h-12 w-12 rounded-full object-cover"
        />
        {effectiveState === 'listening' && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        )}
      </button>
    </div>
  )
}
