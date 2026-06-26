export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceId } = req.body;
  
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'No text provided' });
  }

  const cleanText = text
    .replace(/\[💡[^\]]*\]/g, '')
    .replace(/\[🎯[^\]]*\]/g, '')
    .replace(/\[⭐[^\]]*\]/g, '')
    .replace(/\[📊[^\]]*\]/g, '')
    .replace(/\[🔤[^\]]*\]/g, '')
    .replace(/\*\*/g, '')
    .trim();

  // ── OPTION 1: Google Cloud TTS ──────────────────────
  const googleKey = process.env.GOOGLE_TTS_API_KEY;
  
  if (googleKey) {
    try {
      console.log('Trying Google TTS...');
      
      const googleRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: cleanText },
            voice: {
              languageCode: 'en-US',
              name: 'en-US-Journey-F',
              ssmlGender: 'FEMALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 0.93,
              pitch: 1.0,
              effectsProfileId: ['headphone-class-device']
            }
          })
        }
      );

      if (googleRes.ok) {
        const data = await googleRes.json();
        const audioBuffer = Buffer.from(data.audioContent, 'base64');
        console.log('Google TTS success ✅');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('X-TTS-Provider', 'google');
        return res.send(audioBuffer);
      } else {
        const err = await googleRes.json();
        console.warn('Google TTS failed:', err.error?.message);
      }
    } catch (err) {
      console.warn('Google TTS error:', err.message);
    }
  } else {
    console.log('No GOOGLE_TTS_API_KEY — skipping Google TTS');
  }

  // ── OPTION 2: ElevenLabs fallback ───────────────────
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  
  if (elevenKey) {
    try {
      console.log('Falling back to ElevenLabs...');
      
      const finalVoiceId = voiceId ||
        process.env.ELEVENLABS_VOICE_ID ||
        'EXAVITQu4vr4xnSDxMaL'; // Sarah

      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.3,
              use_speaker_boost: true,
            }
          })
        }
      );

      if (elevenRes.ok) {
        const buffer = await elevenRes.arrayBuffer();
        console.log('ElevenLabs success ✅');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('X-TTS-Provider', 'elevenlabs');
        return res.send(Buffer.from(buffer));
      } else {
        const errText = await elevenRes.text();
        console.warn('ElevenLabs failed:', elevenRes.status, errText);
      }
    } catch (err) {
      console.warn('ElevenLabs error:', err.message);
    }
  } else {
    console.log('No ELEVENLABS_API_KEY — skipping ElevenLabs');
  }

  // ── OPTION 3: Both failed ────────────────────────────
  console.error('All TTS providers failed');
  return res.status(503).json({ 
    error: 'TTS_UNAVAILABLE',
    message: 'All voice providers failed — browser TTS will be used'
  });
}