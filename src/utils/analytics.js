import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
const IS_PROD = import.meta.env.PROD || window.location.hostname !== 'localhost'

export function initAnalytics() {
  if (!IS_PROD || !POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
  })
}

export function captureEvent(event, properties = {}) {
  if (!IS_PROD || !POSTHOG_KEY) return
  posthog.capture(event, properties)
}

export function identifyUser(userId, traits = {}) {
  if (!IS_PROD || !POSTHOG_KEY) return
  posthog.identify(userId, traits)
}
