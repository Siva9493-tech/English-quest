import { useState } from 'react'
import panduIcon from '../../assets/pandu-icon.png'

// Aria's avatar. Shows the icon image, but if it fails to load (or the file
// doesn't exist) it falls back to a beautiful gradient circle with the
// letter "A". Pass a numeric `size` (px) plus any extra className/style.
export default function AriaAvatar({ size = 48, className = '', style = {} }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={className}
        aria-label="Aria"
        style={{
          width: size,
          height: size,
          borderRadius: '100%',
          background: 'linear-gradient(135deg, #bf00ff, #00e5ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: size * 0.5,
          lineHeight: 1,
          userSelect: 'none',
          ...style,
        }}
      >
        A
      </div>
    )
  }

  return (
    <img
      src={panduIcon}
      alt="Aria"
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '100%',
        objectFit: 'cover',
        ...style,
      }}
    />
  )
}
