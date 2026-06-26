// SM-2 Spaced Repetition Algorithm
// Based on the SuperMemo SM-2 algorithm by Piotr Wozniak

// Quality ratings:
// 0 — complete blackout, wrong
// 1 — wrong, but upon seeing the correct answer it felt familiar
// 2 — wrong, but the correct answer seemed easy to recall
// 3 — correct with serious difficulty
// 4 — correct after a hesitation
// 5 — perfect response

const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const MAX_INTERVAL_DAYS = 365

export function calculateNextReview(quality, ease, interval, repetitions) {
  let newEase = ease
  let newInterval = interval
  let newRepetitions = repetitions

  // Update ease factor based on quality
  newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEase < MIN_EASE) newEase = MIN_EASE

  if (quality < 3) {
    // Failed — reset
    newRepetitions = 0
    newInterval = 1
  } else {
    // Passed — increase interval
    newRepetitions += 1
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEase)
    }
  }

  newInterval = Math.min(newInterval, MAX_INTERVAL_DAYS)

  return {
    ease: Math.round(newEase * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000,
  }
}

export function isDue(correction) {
  if (!correction.nextReview) return true // never reviewed = due now
  return Date.now() >= correction.nextReview
}

export function filterDueCorrections(corrections) {
  return corrections.filter(isDue)
}

export function getCorrectionStats(corrections) {
  const due = filterDueCorrections(corrections)
  const total = corrections.length
  return {
    total,
    dueCount: due.length,
    due: due,
    percentComplete: total > 0 ? Math.round(((total - due.length) / total) * 100) : 0,
  }
}
