/*
TEST CHECKLIST:
- [ ] Test Google TTS: Temporarily disable ElevenLabs to see if Google plays (Primary)
- [ ] Test ElevenLabs: Temporarily disable Google TTS to see if ElevenLabs plays (Secondary)
- [ ] Test Browser TTS: Disable both server options to see if Browser TTS plays (Final Fallback)
- [ ] Test Markdown: Verify that **bold** and *italic* are stripped before sending to TTS
- [ ] Test Emoji: Verify that emojis are stripped
- [ ] Test Stop: Verify that stop() cancels both HTML Audio and SpeechSynthesis
*/

// AriaVoice.js — 3-tier TTS: Google Cloud → ElevenLabs → Browser

const AriaVoice = {
  currentAudio: null,
  isSpeaking: false,

  async speak(text, options = {}) {
    // Stop any current speech
    this.stop();
    
    if (!text || text.trim() === '') return;

    // Clean text for TTS (remove markdown, emoji, special chars)
    const cleanText = this.cleanTextForTTS(text);

    // Try tier 1: Google Cloud TTS via /api/speak proxy
    const success = await this.tryServerTTS(cleanText);
    if (success) return;

    // Try tier 2: Browser TTS (always available)
    await this.tryBrowserTTS(cleanText, options);
  },

  cleanTextForTTS(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')     // remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')          // remove italic
      .replace(/💡|✅|❌|🎯|👍|😊|🌟/g, '') // remove emoji
      .replace(/\[.*?\]/g, '')              // remove brackets
      .replace(/→/g, 'to')                  // replace arrows
      .trim();
  },

  async tryServerTTS(text) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.fallback === 'browser') {
          console.log('[AriaVoice] Server TTS failed, falling back to browser');
          return false;
        }
        return false;
      }

      const provider = response.headers.get('X-TTS-Provider') || 'server';
      console.log(`[AriaVoice] Using TTS provider: ${provider}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return await this.playAudio(audioUrl);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[AriaVoice] Server TTS timed out, using browser TTS');
      } else {
        console.log('[AriaVoice] Server TTS error:', error.message);
      }
      return false;
    }
  },

  playAudio(audioUrl) {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isSpeaking = true;

      audio.onended = () => {
        this.isSpeaking = false;
        URL.revokeObjectURL(audioUrl); // cleanup memory
        resolve(true);
      };

      audio.onerror = (e) => {
        console.log('[AriaVoice] Audio playback error:', e);
        this.isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        resolve(false);
      };

      audio.play().catch((e) => {
        console.log('[AriaVoice] Audio play() failed:', e);
        this.isSpeaking = false;
        resolve(false);
      });
    });
  },

  async tryBrowserTTS(text, options = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.log('[AriaVoice] Browser TTS not supported');
        resolve(false);
        return;
      }

      console.log('[AriaVoice] Using browser TTS (fallback)');
      this.isSpeaking = true;

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a good female English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') ||  // macOS
        v.name.includes('Google US English') ||
        v.name.includes('Microsoft Aria') ||
        (v.lang === 'en-US' && v.name.toLowerCase().includes('female'))
      ) || voices.find(v => v.lang === 'en-US') || voices[0];

      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.1;
      utterance.volume = options.volume || 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve(true);
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        console.log('[AriaVoice] Browser TTS error:', e);
        resolve(false);
      };

      // Cancel any existing speech then start
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  },

  stop() {
    // Stop HTML Audio element
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    // Stop browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  },

  isCurrentlySpeaking() {
    return this.isSpeaking;
  }
};

export default AriaVoice;
