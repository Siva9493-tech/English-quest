// localStorage manager for all Pandu data.

const KEYS = {
  user: 'panduUser', // onboarding data
  position: 'panduPosition', // button corner preference
  history: 'panduHistory', // array of {role, content, timestamp, date}
  wordLog: 'panduWordLog', // array of words of the day already given
  corrections: 'ariaCorrections', // array of {wrong, correct, date, count}
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
    const data = localStorage.getItem('panduUser')
    if (!data) return null
    const parsed = JSON.parse(data)
    if (!parsed || !parsed.name || parsed.name.trim() === '') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function savePanduUser(user) {
  try {
    localStorage.setItem(KEYS.user, JSON.stringify(user))
    return true
  } catch (error) {
    console.error('Failed to save user data:', error)
    return false
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

/* ───────────────────────── CORRECTION HISTORY ───────────────────────── */

// Save a correction to history.
export function saveCorrection(wrong, correct, date) {
  try {
    const corrections = getCorrections()
    // Check if this same correction already exists
    const existing = corrections.find(
      (c) => c.wrong.toLowerCase() === wrong.toLowerCase()
    )
    if (existing) {
      // Increment count and reset SRS (they made it again)
      existing.count = (existing.count || 1) + 1
      existing.date = date || new Date().toDateString()
      existing.nextReview = Date.now() // due immediately since they still need help
    } else {
      corrections.push({
        wrong,
        correct,
        date: date || new Date().toDateString(),
        count: 1,
        // SRS fields
        repetitions: 0,
        ease: 2.5,
        interval: 0,
        nextReview: Date.now(), // due immediately
        created: Date.now(),
      })
    }
    const trimmed = corrections.slice(-100)
    localStorage.setItem(KEYS.corrections, JSON.stringify(trimmed))
  } catch (e) {
    console.error(e)
  }
}

// Get all corrections.
export function getCorrections() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.corrections)) || []
  } catch {
    return []
  }
}

// Get corrections logged today.
export function getTodayCorrections() {
  try {
    const all = getCorrections()
    const today = new Date().toDateString()
    return all.filter((c) => c.date === today)
  } catch {
    return []
  }
}

// Get the most repeated mistake.
export function getTopMistake() {
  try {
    const all = getCorrections()
    if (all.length === 0) return null
    const counts = {}
    all.forEach((c) => {
      counts[c.wrong] = (counts[c.wrong] || 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? { word: top[0], count: top[1] } : null
  } catch {
    return null
  }
}
