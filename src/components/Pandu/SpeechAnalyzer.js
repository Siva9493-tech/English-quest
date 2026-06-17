// SpeechAnalyzer.js
// Analyzes user speech for filler words,
// pace, and sentence quality

const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know',
  'basically', 'literally', 'actually',
  'so', 'right', 'okay so', 'kind of',
  'sort of', 'i mean', 'you see',
]

// Analyze a single speech transcript
export function analyzeSpeech(transcript) {
  if (!transcript) return null

  const text = transcript.toLowerCase().trim()
  const words = text.split(/\s+/)
  const wordCount = words.length

  // Count filler words
  const fillerCount = {}
  let totalFillers = 0

  FILLER_WORDS.forEach((filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      fillerCount[filler] = matches.length
      totalFillers += matches.length
    }
  })

  // Pace rating based on word count
  // Average spoken English = 130 words/min
  // In 8 seconds (our listen window) = ~17 words
  let pace = 'good'
  if (wordCount < 3) pace = 'too_short'
  else if (wordCount < 8) pace = 'slow'
  else if (wordCount > 40) pace = 'fast'
  else pace = 'good'

  // Sentence complexity
  const hasComplexSentence =
    text.includes('because') ||
    text.includes('although') ||
    text.includes('however') ||
    text.includes('therefore') ||
    text.includes('which')

  // Repetition check
  const uniqueWords = new Set(words)
  const repetitionRatio = uniqueWords.size / wordCount

  return {
    wordCount,
    totalFillers,
    fillerCount,
    pace,
    hasComplexSentence,
    repetitionRatio: Math.round(repetitionRatio * 100),
    quality: getQualityScore(
      wordCount,
      totalFillers,
      pace,
      hasComplexSentence,
    ),
  }
}

function getQualityScore(wordCount, fillers, pace, complex) {
  let score = 100
  score -= fillers * 10
  if (pace === 'too_short') score -= 30
  if (pace === 'slow') score -= 10
  if (pace === 'fast') score -= 15
  if (complex) score += 10
  return Math.max(0, Math.min(100, score))
}

// Get feedback message for Aria to add
export function getAriaFeedback(analysis) {
  if (!analysis) return null

  const tips = []

  // Filler word feedback
  if (analysis.totalFillers >= 3) {
    const topFiller = Object.entries(analysis.fillerCount).sort(
      (a, b) => b[1] - a[1],
    )[0]

    tips.push(
      `[🎯 Heads up: I heard "${topFiller[0]}" ` +
        `${topFiller[1]} times — try replacing it ` +
        `with a short pause for more confidence!]`,
    )
  }

  // Pace feedback
  if (analysis.pace === 'too_short') {
    tips.push(
      `[💬 Try to give fuller answers — ` +
        `even 2-3 sentences helps you practice more!]`,
    )
  } else if (analysis.pace === 'fast') {
    tips.push(
      `[⏱️ Slow down a little — ` +
        `you're speaking very fast. ` +
        `Pace yourself for clarity!]`,
    )
  }

  // Praise complex sentences
  if (analysis.hasComplexSentence && analysis.totalFillers === 0) {
    tips.push(
      `[⭐ Love the sentence structure — ` +
        `that was really well constructed!]`,
    )
  }

  return tips.length > 0 ? tips[0] : null
}

// Session-level statistics tracker
export class SessionTracker {
  constructor() {
    this.analyses = []
    this.startTime = Date.now()
  }

  add(analysis) {
    if (analysis) this.analyses.push(analysis)
  }

  getSummary() {
    if (this.analyses.length === 0) return null

    const totalFillers = this.analyses.reduce(
      (sum, a) => sum + a.totalFillers,
      0,
    )
    const avgQuality = Math.round(
      this.analyses.reduce((sum, a) => sum + a.quality, 0) /
        this.analyses.length,
    )
    const totalWords = this.analyses.reduce(
      (sum, a) => sum + a.wordCount,
      0,
    )
    const goodPace = this.analyses.filter((a) => a.pace === 'good').length
    const paceScore = Math.round((goodPace / this.analyses.length) * 100)
    const duration = Math.round(
      (Date.now() - this.startTime) / 1000 / 60,
    )

    return {
      duration,
      totalWords,
      totalFillers,
      avgQuality,
      paceScore,
      exchanges: this.analyses.length,
      fluencyGrade: getFluencyGrade(avgQuality),
    }
  }
}

function getFluencyGrade(score) {
  if (score >= 90) return { grade: 'A', label: 'Excellent! 🌟' }
  if (score >= 75) return { grade: 'B', label: 'Good job! 👍' }
  if (score >= 60) return { grade: 'C', label: 'Keep going! 💪' }
  return { grade: 'D', label: 'Practice more! 📚' }
}

// Save session summary to localStorage
export function saveSessionSummary(summary) {
  try {
    const sessions = getSessionHistory()
    sessions.push({
      ...summary,
      date: new Date().toDateString(),
      timestamp: Date.now(),
    })
    localStorage.setItem(
      'ariaSessionHistory',
      JSON.stringify(sessions.slice(-30)),
    )
  } catch (e) {
    console.error(e)
  }
}

export function getSessionHistory() {
  try {
    return JSON.parse(localStorage.getItem('ariaSessionHistory')) || []
  } catch {
    return []
  }
}
