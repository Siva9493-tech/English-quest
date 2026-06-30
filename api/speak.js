// Vercel serverless function — proxies text-to-speech to Google Cloud TTS (primary)
// with ElevenLabs fallback. Keeps all API keys server-side.

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (premade)
const PROVIDER_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function googleTTS(text) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) throw new Error('GOOGLE_TTS_API_KEY not configured');

  const response = await fetchWithTimeout(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92, pitch: 2.0 },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Google TTS ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.audioContent) throw new Error('Google TTS returned no audioContent');

  return Buffer.from(data.audioContent, 'base64');
}

async function elevenLabsTTS(text, voiceId, voiceSettings) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY not configured');

  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  const response = await fetchWithTimeout(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: voiceSettings || {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`ElevenLabs ${response.status}: ${detail.slice(0, 200)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceId, voice_settings } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'No text provided' });
  }

  // 1. Try Google Cloud TTS FIRST (primary - free tier generous)
  try {
    const buffer = await googleTTS(text);
    console.log('[TTS] Using provider: google');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-TTS-Provider', 'google');
    res.setHeader('X-TTS-Voice', 'en-US-Journey-F');
    return res.send(buffer);
  } catch (err) {
    console.warn('[TTS] Google TTS failed:', err.message);
  }

  // 2. Try ElevenLabs FALLBACK (when Google fails)
  try {
    const buffer = await elevenLabsTTS(text, voiceId, voice_settings);
    console.log('[TTS] Using provider: elevenlabs');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-TTS-Provider', 'elevenlabs');
    res.setHeader('X-TTS-Voice', 'Sarah (EXAVITQu4vr4xnSDxMaL)');
    return res.send(buffer);
  } catch (err) {
    console.warn('[TTS] ElevenLabs failed:', err.message);
  }

  // 3. Both failed, return JSON error for browser fallback
  console.log('[TTS] Both server providers failed, returning browser fallback');
  return res.status(502).json({ error: 'tts_failed', fallback: 'browser' });
}