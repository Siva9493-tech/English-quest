import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './utils/analytics'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const IS_PROD = import.meta.env.PROD || window.location.hostname !== 'localhost'

if (IS_PROD && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.PROD ? 'production' : 'development',
    tracesSampleRate: 0.2,
  })
}

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
