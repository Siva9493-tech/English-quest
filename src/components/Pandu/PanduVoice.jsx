// Browser speech-recognition helpers (Web Speech API). No external cost.
// Speech *synthesis* (Aria's voice) now lives in AriaVoice.js.

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
  // Keep listening even if the user pauses mid-sentence; the conversation
  // loop decides when an utterance is "done" via a post-speech silence timer.
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'
  return recognition
}
