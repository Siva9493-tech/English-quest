// AriaVoice.js
// Human-sounding TTS for Aria
// Priority: Google TTS → ElevenLabs → Browser TTS

import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

// ─── ELEVENLABS (SECONDARY) ──────────────────────
// The API key lives server-side; the browser talks to our /api/speak proxy.
// VOICE_ID is not secret, so it can still come from a build-time env var.
const VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Sarah (premade)

async function elevenLabsSpeak(text) {
  const response = await fetchWithTimeout('/api/speak', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId: VOICE_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  }, 8000);

  if (response.status === 503) {
    const err = await response.json();
    if (err.error === 'TTS_UNAVAILABLE') {
      throw new Error('TTS_UNAVAILABLE');
    }
  }

  if (!response.ok) throw new Error('ElevenLabs failed');

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.play();
  });
}

// ─── BROWSER TTS FALLBACK ──────────────────────
function getBestBrowserVoice() {
  const voices = window.speechSynthesis.getVoices();

  const priority = [
    'Google UK English Female',
    'Microsoft Sonia Online (Natural)',
    'Microsoft Libby Online (Natural)',
    'Microsoft Mia Online (Natural)',
    'Microsoft Zira Desktop',
    'Karen',
    'Samantha',
    'Veena',
    'Google US English',
  ];

  for (const name of priority) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // Last resort: any female or English voice
  return (
    voices.find((v) => v.name.toLowerCase().includes('female')) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0]
  );
}

function browserSpeak(text) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Wait for voices to load if needed
    const setVoice = () => {
      utterance.voice = getBestBrowserVoice();
      utterance.rate = 0.88;
      utterance.pitch = 1.08;
      utterance.volume = 1.0;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onend = resolve;
    utterance.onerror = resolve;

    window.speechSynthesis.speak(utterance);
  });
}

// ─── CLEAN TEXT FOR SPEECH ─────────────────────
function cleanForSpeech(text) {
  return (
    text
      // Remove correction brackets
      .replace(/\[💡[^\]]*\]/g, '')
      .replace(/\[🎯[^\]]*\]/g, '')
      .replace(/\[⭐[^\]]*\]/g, '')
      .replace(/\[📊[^\]]*\]/g, '')
      .replace(/\[💬[^\]]*\]/g, '')
      .replace(/\[⏱️[^\]]*\]/g, '')
      .replace(/\[🔤[^\]]*\]/g, '')
      // Remove markdown
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      // Remove emoji clusters
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .trim()
  );
}

// ─── MAIN EXPORT ───────────────────────────────
export async function ariaSpeak(text) {
  if (!text || text.trim() === '') return;

  const clean = cleanForSpeech(text);
  if (!clean) return;

  // 1) Try ElevenLabs first (server tries Google TTS internally)
  try {
    await elevenLabsSpeak(clean);
    return;
  } catch (err) {
    if (err.message === 'TTS_UNAVAILABLE') {
      console.warn('Aria: All server TTS providers unavailable → browser TTS');
    } else {
      console.warn('Aria: ElevenLabs unavailable →', err.message);
    }
  }

  // 2) Fall back to browser TTS (basic)
  await browserSpeak(clean);
}

// Stop any current speech
export function stopAria() {
  window.speechSynthesis.cancel();
}

// Warm up the browser's voice list on app start. getVoices() populates
// asynchronously in some browsers, so kicking it early means the first
// browser-TTS fallback has a voice ready instead of waiting on
// onvoiceschanged.
export function preloadAriaVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Touch the list now; if it's empty the browser will fire onvoiceschanged
  // once the voices are loaded.
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}