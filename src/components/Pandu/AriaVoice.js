// AriaVoice.js
// Human-sounding TTS for Aria
// Uses Kokoro-82M v1.0 → falls back to
// best available browser voice

let kokoroPipeline = null;
let kokoroLoading = false;
let kokoroFailed = false;
let currentUtterance = null;

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

  try {
    // Try Kokoro first
    if (!kokoroFailed) {
      await kokoroSpeak(clean);
      return;
    }
  } catch (err) {
    console.warn('Aria: Kokoro speak failed, using browser TTS');
    kokoroFailed = true;
  }

  // Fallback to browser TTS
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
