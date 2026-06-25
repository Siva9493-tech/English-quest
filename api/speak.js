export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const { text, voiceId } = req.body;

  // Debug logs
  console.log('ElevenLabs key present:', !!apiKey);
  console.log('Voice ID received:', voiceId);
  console.log('Text length:', text?.length);

  if (!apiKey) {
    return res.status(500).json({
      error: 'ELEVENLABS_API_KEY not configured in Vercel'
    });
  }

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const finalVoiceId = voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    'EXAVITQu4vr4xnSDxMaL'; // Sarah default

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs error:', response.status, errText);
      return res.status(response.status).json({
        error: errText
      });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.byteLength);
    return res.send(Buffer.from(buffer));

  } catch(err) {
    console.error('api/speak error:', err);
    return res.status(500).json({ error: err.message });
  }
}
