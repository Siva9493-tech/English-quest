import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, signInWithGoogle } from '../utils/auth'

// Auth screen: email/password sign-in & sign-up plus Google OAuth.
// Styled to match the app's cyberpunk theme (CSS vars + .cyber-card).
export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      if (isSignup) {
        const { data, error } = await signUp(email, password, { name })
        if (error) throw error
        // If email confirmation is required there's no active session yet.
        if (!data.session) {
          setNotice('Check your email to confirm your account, then sign in.')
          setMode('signin')
          return
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    const { error } = await signInWithGoogle()
    // On success the browser redirects to Google, so we only land here on error.
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="cyber-card"
        style={{ width: '100%', maxWidth: '420px', padding: '32px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p
            style={{
              color: 'var(--color-cyan)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              margin: '0 0 8px',
            }}
          >
            🗺️ ENGLISHQUEST
          </p>
          <h1
            style={{
              color: 'var(--text-primary)',
              fontSize: '26px',
              fontWeight: 900,
              margin: 0,
            }}
          >
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              margin: '6px 0 0',
            }}
          >
            {isSignup
              ? 'Start your fluency journey with Aria'
              : 'Sign in to continue your journey'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          {isSignup && (
            <Field
              label="Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Your name"
              required
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          {error && <Banner color="#ff006e">{error}</Banner>}
          {notice && <Banner color="var(--color-cyan)">{notice}</Banner>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background:
                'linear-gradient(90deg, var(--color-cyan), var(--color-purple))',
              color: '#04111a',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.03em',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading
              ? 'Please wait…'
              : isSignup
                ? 'Sign Up'
                : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '20px 0',
          }}
        >
          <span style={{ flex: 1, height: '1px', background: 'var(--border-glow)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>OR</span>
          <span style={{ flex: 1, height: '1px', background: 'var(--border-glow)' }} />
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            border: '1px solid var(--border-glow)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '16px' }}>🔵</span>
          Continue with Google
        </button>

        {/* Toggle sign-in / sign-up */}
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            margin: '22px 0 0',
          }}
        >
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? 'signin' : 'signup')
              setError('')
              setNotice('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-cyan)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              fontSize: '13px',
            }}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

/* ── small presentational helpers ── */

function Field({ label, type, value, onChange, placeholder, required }) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '11px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border-glow)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
        }}
      />
    </label>
  )
}

function Banner({ color, children }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        border: `1px solid ${color}`,
        background: 'rgba(255,255,255,0.03)',
        color,
        fontSize: '13px',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  )
}
