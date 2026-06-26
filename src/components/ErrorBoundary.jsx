import { Component } from 'react'

// Error boundaries must be class components — React only calls
// getDerivedStateFromError / componentDidCatch on classes. This catches render
// errors anywhere below it and shows a recovery card instead of a white screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg-base, #0a0a0f)' }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 0 30px var(--border-glow)',
          }}
        >
          <h1
            className="text-xl font-extrabold"
            style={{ color: 'var(--color-cyan)' }}
          >
            ⚠️ Something went wrong
          </h1>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full px-5 py-2 text-sm font-bold transition-all hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
              color: '#0a0a0f',
              border: '1px solid var(--border-glow)',
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    )
  }
}
