// AriaVoice.js
// Human-sounding TTS for Aria
// Priority: ElevenLabs → Kokoro-82M v1.0 →
// best available browser voice

let kokoroPipeline = null;
let kokoroLoading = false;
let kokoroFailed = false;
let currentUtterance = null;

// ─── ELEVENLABS (PRIMARY) ──────────────────────
// The API key lives server-side; the browser talks to our /api/speak proxy.
// VOICE_ID is not secret, so it can still come from a build-time env var.
const VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Sarah (premade)

// Track monthly character usage to stay under the free tier limit
function checkElevenLabsBudget(text) {
  // Reset counter when the month changes
  const thisMonth = String(new Date().getMonth());
  const lastReset = localStorage.getItem('elevenLabsReset');
  if (lastReset !== thisMonth) {
    localStorage.setItem('elevenLabsChars', '0');
    localStorage.setItem('elevenLabsReset', thisMonth);
  }

  const charCount = parseInt(
    localStorage.getItem('elevenLabsChars') || '0',
    10,
  );

  if (charCount + text.length > 9000) {
    // Near the limit — skip to Kokoro
    throw new Error('Monthly limit approaching');
  }

  localStorage.setItem('elevenLabsChars', String(charCount + text.length));
}

async function elevenLabsSpeak(text) {
  checkElevenLabsBudget(text);

  const response = await fetch('/api/speak', {
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
  });

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

// ─── KOKORO INIT ───────────────────────────────
async function initKokoro() {
  if (kokoroPipeline) return kokoroPipeline;
  if (kokoroLoading) return null;
  if (kokoroFailed) return null;

  try {
    kokoroLoading = true;
    console.log('Aria: Loading Kokoro voice...');

    const { pipeline } = await import('@huggingface/transformers');

    kokoroPipeline = await pipeline(
      'text-to-speech',
      'onnx-community/Kokoro-82M-v1.0',
      {
        dtype: 'fp32',
        device: 'wasm',
      },
    );

    kokoroLoading = false;
    console.log('Aria: Kokoro voice ready ✅');
    localStorage.setItem('ariaVoiceLoaded', 'true');
    return kokoroPipeline;
  } catch (err) {
    kokoroLoading = false;
    kokoroFailed = true;
    console.warn('Aria: Kokoro failed →', err.message);
    return null;
  }
}

// ─── KOKORO SPEAK ──────────────────────────────
async function kokoroSpeak(text) {
  const tts = await initKokoro();
  if (!tts) throw new Error('Kokoro not available');

  const result = await tts(text, {
    voice: 'af_heart', // warm American female
    speed: 0.92,
  });

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const buffer = await audioCtx.decodeAudioData(result.audio.buffer.slice(0));

  return new Promise((resolve) => {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => {
      audioCtx.close();
      resolve();
    };
    source.start(0);
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
    currentUtterance = utterance;

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

  // 1) Try ElevenLabs first (best quality)
  try {
    await elevenLabsSpeak(clean);
    return;
  } catch (err) {
    console.warn('Aria: ElevenLabs unavailable →', err.message);
  }

  // 2) Fall back to Kokoro (good quality)
  try {
    if (!kokoroFailed) {
      await kokoroSpeak(clean);
      return;
    }
  } catch (err) {
    console.warn('Aria: Kokoro speak failed, using browser TTS');
    kokoroFailed = true;
  }

  // 3) Fall back to browser TTS (basic)
  await browserSpeak(clean);
}

// Stop any current speech
export function stopAria() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

// Preload Kokoro in background on app start
// so first message plays instantly
export function preloadAriaVoice() {
  // Only preload if not already done
  const alreadyLoaded = localStorage.getItem('ariaVoiceLoaded');

  if (!alreadyLoaded) {
    // Delay preload by 3 seconds so app
    // loads fast first
    setTimeout(() => {
      initKokoro().catch(() => {
        console.log('Aria: Will use browser voice');
      });
    }, 3000);
  } else {
    // Already cached — load immediately
    initKokoro().catch(() => {});
  }
}