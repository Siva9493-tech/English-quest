// Vercel serverless function — proxies text-to-speech to ElevenLabs.
// Keeps ELEVENLABS_API_KEY server-side so it is never shipped to the browser.

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (premade)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY is not configured' });
  }

  const { text, voiceId, voice_settings } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  const voice =
    voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: voice_settings || {
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
      console.error('ElevenLabs error:', response.status, detail);
      return res
        .status(response.status)
        .json({ error: 'ElevenLabs request failed' });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('ElevenLabs proxy error:', err);
    return res.status(502).json({ error: 'Upstream request failed' });
  }
}
