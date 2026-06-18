// PronunciationScorer.js
// Detects likely pronunciation issues from
// speech-to-text transcripts
// Uses common Indian English pronunciation patterns

// Words commonly mispronounced by Indian speakers
// format: { word, issue, correct, tip }
const INDIAN_ENGLISH_PATTERNS = [
  // Silent letters
  { word: 'knife', issue: 'silent k',
    tip: 'The K is silent — say "nyfe"' },
  { word: 'knight', issue: 'silent k',
    tip: 'The K is silent — say "nyte"' },
  { word: 'wrong', issue: 'silent w',
    tip: 'The W is silent — say "rong"' },
  { word: 'write', issue: 'silent w',
    tip: 'The W is silent — say "ryte"' },

  // Commonly confused words (speech-to-text clues)
  { word: 'comfortable', issue: 'syllable stress',
    tip: 'Say "CUMF-ter-ble" not "com-FOR-ta-ble"' },
  { word: 'vegetable', issue: 'syllable stress',
    tip: 'Say "VEJ-ta-ble" not "veg-E-ta-ble"' },
  { word: 'temperature', issue: 'syllable stress',
    tip: 'Say "TEM-pra-ture" not "tem-per-A-ture"' },
  { word: 'specifically', issue: 'stress',
    tip: 'Stress the "CIF" — spe-CIF-ic-ally' },
  { word: 'basically', issue: 'common mispronounce',
    tip: 'Say "BAY-sic-lee" clearly' },
  { word: 'literally', issue: 'common mispronounce',
    tip: 'Say "LIT-er-al-lee" — 4 syllables' },
  { word: 'especially', issue: 'stress',
    tip: 'Say "e-SPE-shally" — stress SPE' },
  { word: 'pronunciation', issue: 'meta word',
    tip: 'Note: it\'s pro-NUN-ciation not pro-NOUN-ciation' },
  { word: 'wednesday', issue: 'silent letters',
    tip: 'Say "WENZ-day" — silent D' },
  { word: 'february', issue: 'silent r',
    tip: 'Say "FEB-yoo-ary" in casual speech' },
  { word: 'clothes', issue: 'silent e',
    tip: 'Say "KLOHZ" — the TH is nearly silent' },
  { word: 'colonel', issue: 'spelling vs sound',
    tip: 'Say "KER-nel" — not how it looks!' },
  { word: 'receipt', issue: 'silent p',
    tip: 'Say "re-SEET" — P is silent' },
  { word: 'debt', issue: 'silent b',
    tip: 'Say "DET" — B is silent' },
  { word: 'subtle', issue: 'silent b',
    tip: 'Say "SUT-ul" — B is silent' },
  { word: 'island', issue: 'silent s',
    tip: 'Say "EYE-land" — S is silent' },
  { word: 'hour', issue: 'silent h',
    tip: 'Say "OW-er" — H is silent' },
  { word: 'honest', issue: 'silent h',
    tip: 'Say "ON-est" — H is silent' },
  { word: 'vehicle', issue: 'stress',
    tip: 'Say "VEE-i-kul" — stress VEE' },
  { word: 'athlete', issue: 'syllables',
    tip: 'Say "ATH-leet" — only 2 syllables' },
  { word: 'escape', issue: 'common error',
    tip: 'Say "es-CAPE" not "ex-cape"' },
  { word: 'ask', issue: 'indian english',
    tip: 'Say "AAASK" with open A sound' },
  { word: 'this', issue: 'th sound',
    tip: 'Put tongue between teeth for TH sound' },
  { word: 'the', issue: 'th sound',
    tip: 'Soft TH — tongue briefly between teeth' },
  { word: 'three', issue: 'th sound',
    tip: 'TH sound — not "tree" or "free"' },
  { word: 'think', issue: 'th sound',
    tip: 'TH sound — not "tink" or "fink"' },
  { word: 'that', issue: 'th sound',
    tip: 'Voiced TH — "dhat" is close but use tongue' },
  { word: 'world', issue: 'l placement',
    tip: 'Say "WERLD" — the L comes after R' },
  { word: 'girl', issue: 'vowel sound',
    tip: 'Say "GURL" — rhymes with curl' },
  { word: 'bird', issue: 'vowel sound',
    tip: 'Say "BURD" — rhymes with heard' },
  { word: 'work', issue: 'vowel sound',
    tip: 'Say "WURK" — rhymes with lurk' },
]

// Check transcript for pronunciation-sensitive words
export function scanForPronunciationIssues(transcript) {
  if (!transcript) return []

  const text = transcript.toLowerCase()
  const words = text.split(/\s+/)
  const issues = []

  INDIAN_ENGLISH_PATTERNS.forEach((pattern) => {
    if (words.includes(pattern.word) || text.includes(pattern.word)) {
      issues.push({
        word: pattern.word,
        issue: pattern.issue,
        tip: pattern.tip,
      })
    }
  })

  return issues
}

// TH-sound detector (very common Indian English issue)
export function detectThIssues(transcript) {
  if (!transcript) return false
  const thWords = [
    'the', 'this', 'that', 'these',
    'those', 'they', 'their', 'there', 'then',
    'than', 'think', 'thought', 'through', 'three',
    'throw', 'thank', 'thing', 'both', 'with',
  ]

  const words = transcript.toLowerCase().split(/\s+/)
  return thWords.some((w) => words.includes(w))
}

// Generate pronunciation tip for Aria to mention
export function getPronunciationTip(transcript) {
  const issues = scanForPronunciationIssues(transcript)
  const hasTh = detectThIssues(transcript)

  // Prioritize TH sound as it's most common issue
  if (hasTh && Math.random() > 0.6) {
    return `[🔤 Pronunciation note: Make sure the TH sounds in words like "the" and "this" use your tongue between your teeth — a common thing to practice!]`
  }

  if (issues.length > 0) {
    // Pick one random issue to mention
    const issue = issues[Math.floor(Math.random() * issues.length)]
    return `[🔤 Quick pronunciation tip: "${issue.word}" — ${issue.tip}]`
  }

  return null
}

// Score pronunciation based on transcript quality
// (uses word confidence from Speech API if available)
export function getPronunciationScore(transcript, confidence) {
  if (!transcript) return null

  const issues = scanForPronunciationIssues(transcript)
  const wordCount = transcript.split(/\s+/).length

  // Base score from Speech API confidence
  let score = confidence ? Math.round(confidence * 100) : 75

  // Deduct for known problem words
  score -= issues.length * 5

  // Bonus for longer sentences (more fluent)
  if (wordCount > 10) score += 5
  if (wordCount > 20) score += 5

  return Math.max(40, Math.min(100, score))
}
