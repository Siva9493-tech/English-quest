// localStorage manager for all Pandu data.

const KEYS = {
  user: 'panduUser', // onboarding data
  position: 'panduPosition', // button corner preference
  history: 'panduHistory', // array of {role, content, timestamp, date}
  wordLog: 'panduWordLog', // array of words of the day already given
}

export function isPanduSetup() {
  try {
    return !!localStorage.getItem(KEYS.user)
  } catch {
    return false
  }
}

export function getPanduUser() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.user))
  } catch {
    return null
  }
}

export function savePanduUser(user) {
  try {
    localStorage.setItem(KEYS.user, JSON.stringify(user))
  } catch {
    // ignore write failures
  }
}

// Increment session counters; call once per opened voice session.
export function recordSession() {
  const user = getPanduUser()
  if (!user) return
  const today = new Date().toDateString()
  const updated = {
    ...user,
    totalSessions: (user.totalSessions || 0) + 1,
    lastSessionDate: today,
  }
  savePanduUser(updated)
  return updated
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.history)) || []
  } catch {
    return []
  }
}

// role is 'user' or 'model' (Gemini-compatible).
export function saveMessage(role, content) {
  const history = getHistory()
  history.push({
    role,
    content,
    timestamp: Date.now(),
    date: new Date().toDateString(),
  })
  const trimmed = history.slice(-200)
  try {
    localStorage.setItem(KEYS.history, JSON.stringify(trimmed))
  } catch {
    // ignore write failures
  }
  return trimmed
}

export function getRecentHistory() {
  return getHistory().slice(-20)
}

export function getPosition() {
  try {
    return localStorage.getItem(KEYS.position) || 'bottom-right'
  } catch {
    return 'bottom-right'
  }
}

export function savePosition(corner) {
  try {
    localStorage.setItem(KEYS.position, corner)
  } catch {
    // ignore write failures
  }
}

export function getWordLog() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.wordLog)) || []
  } catch {
    return []
  }
}

export function addWordToLog(word) {
  const log = getWordLog()
  log.push(word)
  try {
    localStorage.setItem(KEYS.wordLog, JSON.stringify(log))
  } catch {
    // ignore write failures
  }
}
