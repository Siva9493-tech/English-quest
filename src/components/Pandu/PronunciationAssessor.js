// PronunciationAssessor.js
// Web Audio API based audio-quality analyzer.
// No external API needed — runs entirely in the browser.
//
// Takes a recorded audio Blob (from MediaRecorder) and scores the
// delivery on volume/energy consistency and the number of silent
// pauses, then returns a friendly feedback line.

export async function analyzeAudioQuality(audioBlob) {
  let audioCtx = null
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioCtx()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

    const data = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate

    // Calculate RMS (volume/energy)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i]
    }
    const rms = Math.sqrt(sum / data.length)

    // Detect pauses (silence gaps), sampling in 100ms chunks
    let pauseCount = 0
    let inPause = false
    const silenceThreshold = 0.01
    const chunkSize = Math.max(1, Math.floor(sampleRate * 0.1))

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const chunkRms = Math.sqrt(
        chunk.reduce((s, v) => s + v * v, 0) / chunk.length,
      )
      if (chunkRms < silenceThreshold) {
        if (!inPause) {
          pauseCount++
          inPause = true
        }
      } else {
        inPause = false
      }
    }

    // Score based on volume consistency and pauses
    const volumeScore = Math.min(100, Math.round(rms * 1000))
    const pauseScore = Math.max(0, 100 - pauseCount * 10)
    const overallScore = Math.round((volumeScore + pauseScore) / 2)

    audioCtx.close()

    return {
      score: overallScore,
      volumeScore,
      pauseScore,
      pauseCount,
      feedback:
        overallScore >= 80
          ? 'Clear and confident delivery! 🌟'
          : overallScore >= 60
            ? 'Good energy — try reducing pauses'
            : 'Speak more clearly and consistently',
    }
  } catch (err) {
    console.error('Audio analysis failed:', err)
    if (audioCtx) {
      try {
        audioCtx.close()
      } catch {
        // ignore
      }
    }
    return null
  }
}
