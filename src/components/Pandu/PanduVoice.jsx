// Browser speech helpers (Web Speech API + SpeechSynthesis). No external cost.

export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
}

export function createRecognition() {
  if (!isSpeechSupported()) return null
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = 'en-US'
  return recognition
}

let cachedVoices = []

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

// Voices load asynchronously in some browsers; warm the cache.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

const selectBestVoice = () => {
  const voices =
    (typeof window !== 'undefined' &&
      window.speechSynthesis &&
      window.speechSynthesis.getVoices()) ||
    cachedVoices
  const priority = [
    'Google UK English Female',
    'Microsoft Sonia Online (Natural)',
    'Microsoft Zira Desktop',
    'Samantha',
    'Karen',
    'Moira',
    'Google US English',
  ]
  for (const name of priority) {
    const match = voices.find((v) => v.name.includes(name))
    if (match) return match
  }
  // fallback: first female voice available
  return (
    voices.find((v) => v.name.toLowerCase().includes('female')) || voices[0]
  )
}

// Speak text in a natural female voice. onEnd fires when speech completes.
export function panduSpeak(text, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = selectBestVoice()
  utterance.rate = 0.92
  utterance.pitch = 1.08
  utterance.volume = 1
  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
