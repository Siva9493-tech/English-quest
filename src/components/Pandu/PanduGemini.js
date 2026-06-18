// Aria's brain — powered by Groq (OpenAI-compatible chat completions API).
// (File name kept as PanduGemini.js so existing imports keep working.)

import { getCorrections } from './PanduMemory'
import { getAriaMemory, buildMemoryContext } from './AriaMemory'
import { getUserAccent, buildAccentSystemPrompt } from './AccentTrainer'

// All Groq traffic now flows through our own /api/chat serverless proxy,
// which holds GROQ_API_KEY server-side. No API key is exposed to the browser.
const CHAT_URL = '/api/chat'
const MODEL = 'llama-3.3-70b-versatile'

// Low-level call: send a messages[] array to the proxy, return the reply text.
async function chatCompletion(messages, { maxTokens = 150, temperature = 0.8 } = {}) {
  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    console.error('Chat proxy error:', err)
    throw new Error(err.error?.message || err.error || `HTTP ${response.status}`)
  }

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content
  return reply ? reply.trim() : ''
}

// Conversation mode flag - passed from index.jsx to enable continuous mode
let isConversationMode = false

export function setConversationMode(enabled) {
  isConversationMode = enabled
}

export async function askPandu(userMessage, userData, progressData, history) {
  try {
    const name = userData?.name || 'friend'
    const nickname = userData?.nickname || userData?.name || 'friend'
    const progress = progressData || 'beginner'

    // Pull recent corrections so Aria remembers what to watch for.
    const recentCorrections = getCorrections()
      .slice(-5)
      .map((c) => `"${c.wrong}" → "${c.correct}"`)
      .join(', ')
    const correctionContext = recentCorrections
      ? `\nRecent mistakes to watch: ${recentCorrections}`
      : ''

    // Cross-session memory: what Aria remembers about this user over time.
    const memoryContext = buildMemoryContext(getAriaMemory())

    // Accent training: tune vocabulary, corrections and tips to the user's pick.
    const accentContext = buildAccentSystemPrompt(getUserAccent())

    const basePrompt = `You are Aria, a warm friendly female English coach talking to ${name}.
ALWAYS refer to them as "${nickname}" — this is what they want to be called. Use "${nickname}" naturally and often; never use their full name, and don't go a whole reply addressing them only as "you" without warming it up with "${nickname}".

CONVERSATION STYLE:
- Chat naturally and warmly first
- You are like a smart older sister, not a teacher
- Keep replies under 3 sentences
- Always end with a follow up question
- Never repeat what the user just said
- Use contractions: you're, it's, don't, won't
- Use casual connectors: "Right,", "Oh nice,", "Got it,"

CORRECTION SYSTEM (follow strictly):
1. CHAT FIRST — always respond to what user said naturally and completely first
2. CORRECT AFTER — only at the very END of your reply, add ONE correction max
3. CORRECTION FORMAT — use this exact style:
   [💡 ${nickname}, quick tip: instead of "wrong phrase" → try "correct phrase" next time!]
4. SKIP CORRECTION if the mistake is minor or if you already corrected something similar in the last 3 messages
5. PATTERN ALERT — after every 5 messages, if you noticed a repeated mistake, say:
   [📊 Pattern spotted: You often mix up "X" and "Y" — let's watch that!]
6. NEVER correct more than once per reply
7. NEVER use the pencil emoji ✏️ ALWAYS use 💡 for tips
8. PRAISE good sentences naturally: "Love how you said that!", "That was perfect!", "Great sentence structure!"

FILLER WORD AWARENESS:
If user uses um/uh/like/you know more than twice in one message, gently mention ONCE:
[🎯 Tip: Try to replace "um" with a short pause — it sounds more confident!]

TOPICS YOU CAN DISCUSS:
- English practice for current module: ${progress}
- General chat: weather, news, daily life, career
- Indian context: Bollywood, cricket, tech, food
- Anything the user brings up naturally

WHAT YOU NEVER DO:
- Never say "Certainly!" or "Absolutely!"
- Never start with "Great question!"
- Never be formal or stiff
- Never correct twice in one reply
- Never make user feel bad about mistakes${correctionContext}${memoryContext}${accentContext}`

    const conversationModePrompt = isConversationMode ? `
CONVERSATION MODE RULES:
- This is a LIVE voice conversation, not a chat
- Keep ALL replies under 3 sentences maximum
- Never use bullet points or lists — speak naturally
- Use contractions: you're, it's, don't, won't
- Add natural conversation connectors: "Right,", "Yeah,", "Okay so,", "Got it,"
- After answering, ALWAYS end with either:
  a) A follow-up question to keep conversation going
  b) A short prompt like "Your turn!" or "Go ahead!"
  c) "What do you think?" to invite response
- This keeps the conversation flowing naturally

CORRECTION RULES (strict):
- If you notice a grammar mistake, mention it ONLY at the very END of your reply in brackets like this: [💡 tip: say 'correct version' next time]
- Never interrupt your reply mid-sentence with corrections. Keep it encouraging not critical.
- Only correct if the mistake is significant; max ONE per reply
- Never correct the same mistake twice in a session
- Never correct filler words more than once per session

ENERGY RULES:
- Match user's energy level
- If they sound confused → slow down, be gentle
- If they sound confident → be more casual and fun
- If they make good progress → celebrate it!
  "That was perfect!", "Love that!", "Nailed it!"

TOPICS:
- English practice for current module
- General conversation — weather, news, life, career
- Indian context is totally fine
- Bollywood, cricket, tech, startup culture = all good` : ''

    const systemPrompt = basePrompt + conversationModePrompt

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history?.slice(-10).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content,
      })) || []),
      { role: 'user', content: userMessage },
    ]

    const reply = await chatCompletion(messages, { maxTokens: 150, temperature: 0.8 })

    if (!reply) return "Hmm, I didn't catch that. Could you say that again?"
    return reply
  } catch (error) {
    console.error('Aria fetch error:', error)
    return `Connection error: ${error.message}`
  }
}

/* ───────────────────────── MIXED PRACTICE MODE ───────────────────────── */

// Per-module practice content. Each entry: { qa: [...], prompt, roleplay }.
export const PRACTICE_SCENARIOS = {
  m1: {
    qa: [
      "What is the difference between 'a' and 'an'? Give 3 examples.",
      'Explain active voice vs passive voice in your own words.',
    ],
    prompt:
      "You're writing a WhatsApp message to your professor asking for an extension. Use formal English.",
    roleplay: {
      character: 'your strict English teacher',
      opener: "I just read your assignment. Let's discuss it.",
    },
  },
  m2: {
    qa: [
      "Introduce yourself as if you're at a job interview.",
      'How would you describe your family to a new friend?',
    ],
    prompt:
      'You just met someone at a networking event. Make small talk for 90 seconds.',
    roleplay: {
      character: 'a new international student at your college',
      opener: 'Hey! I just joined. Mind showing me around?',
    },
  },
  m3: {
    qa: [
      'Ask me five different Wh-questions about my weekend.',
      "Turn 'You like coffee' into a tag question and explain why.",
    ],
    prompt:
      "You're a journalist interviewing a celebrity. Ask interesting questions for 90 seconds.",
    roleplay: {
      character: "a curious child who asks 'why' about everything",
      opener: 'Why is the sky blue? And why do we have to sleep?',
    },
  },
  m4: {
    qa: [
      'How would you make small talk with a stranger at a bus stop?',
      'Describe your typical weekend to a friend.',
    ],
    prompt:
      'You bump into an old friend at a coffee shop after two years. Catch up for 90 seconds.',
    roleplay: {
      character: 'a friendly barista at your favourite cafe',
      opener: 'Morning! The usual today, or feeling adventurous?',
    },
  },
  m5: {
    qa: [
      'Walk me through your morning routine step by step.',
      'What did you do yesterday, and what will you do tomorrow?',
    ],
    prompt:
      'Describe a perfect day from morning to night, using past, present and future tenses.',
    roleplay: {
      character: 'your fitness coach checking your daily habits',
      opener: 'So, tell me — what does a normal day look like for you?',
    },
  },
  m6: {
    qa: [
      "Politely disagree with: 'Money is the most important thing in life.'",
      'Ask your neighbour to lower their music, politely.',
    ],
    prompt:
      'Your friend wants to drop out of college. Share your honest opinion and advice for 90 seconds.',
    roleplay: {
      character: 'a friend asking for your honest opinion on their startup idea',
      opener: 'Be real with me — should I quit my job for this idea?',
    },
  },
  m7: {
    qa: [
      'Use three internet slang words in real sentences and explain them.',
      "What do 'no cap' and \"it's giving\" mean? Use them naturally.",
    ],
    prompt:
      'Explain a recent trend to someone older using modern slang, then translate it to formal English.',
    roleplay: {
      character: 'a Gen-Z friend texting you in slang',
      opener: 'lowkey this assignment is bussin fr, you fw it?',
    },
  },
  m8: {
    qa: [
      "Pronounce clearly: 'comfortable', 'vegetable', 'Wednesday'.",
      "What's the sound difference between 'ship' and 'sheep'? Say both.",
    ],
    prompt:
      'Read a few tricky brand names and a tongue twister aloud, focusing on clarity, for 90 seconds.',
    roleplay: {
      character: 'a speech coach drilling tricky pronunciations',
      opener: "Let's warm up. Say: 'the sixth sick sheikh's sixth sheep'.",
    },
  },
  m9: {
    qa: [
      "Use the idiom 'bite the bullet' in a real situation.",
      "Explain the difference between 'affect' and 'effect' with examples.",
    ],
    prompt:
      "Argue for or against this using advanced vocabulary: 'Social media does more harm than good.'",
    roleplay: {
      character: 'a university debate partner',
      opener: "Today's motion: technology makes us lonelier. You're for it. Begin.",
    },
  },
  m10: {
    qa: [
      "How do you professionally disagree with your manager's idea?",
      'Write a subject line for an urgent project deadline email.',
    ],
    prompt:
      "You're in a meeting and someone asks your opinion on a controversial strategy. Respond professionally.",
    roleplay: {
      character: 'an HR manager conducting your final interview round',
      opener: 'Welcome. So tell me, why do you want this role?',
    },
  },
  m11: {
    qa: [
      'Summarize a short story you remember in five sentences.',
      'What makes a story character memorable? Give an example.',
    ],
    prompt:
      'Tell me a 90-second story about an unexpected adventure. Make me feel the emotion.',
    roleplay: {
      character: 'a book-club friend discussing a novel',
      opener: 'So what did you think of the ending? I did not see it coming!',
    },
  },
  m12: {
    qa: [
      'What is your favourite song lyric and what does it mean to you?',
      'Explain a metaphor used in a song you like.',
    ],
    prompt:
      'Describe how a favourite song makes you feel and why, for 90 seconds.',
    roleplay: {
      character: 'a music podcast host interviewing you',
      opener: 'Welcome to the show! Tell us — which song changed your life?',
    },
  },
  m13: {
    qa: [
      "What emotion does the word 'remember' bring up, and why?",
      'Explain what imagery means in poetry, with an example.',
    ],
    prompt:
      'Describe a sunset as if you were writing a poem, out loud, for 90 seconds.',
    roleplay: {
      character: 'a poet mentoring you in a quiet cafe',
      opener: 'Read me a line you love. Now tell me — why does it move you?',
    },
  },
  m14: {
    qa: [
      'Deliver a 30-second motivational line like a movie star.',
      'What makes a speech charismatic? Name three techniques.',
    ],
    prompt:
      'Give a 90-second acceptance speech for an award you just won. Own the stage.',
    roleplay: {
      character: 'a charming talk-show host interviewing you',
      opener: 'Ladies and gentlemen, our guest! So, how does it feel to be here?',
    },
  },
  default: {
    qa: [
      'Tell me about something you learned today in English.',
      'Describe your favourite hobby and why you enjoy it.',
    ],
    prompt:
      'Talk about your goals for learning English for 90 seconds. Be specific.',
    roleplay: {
      character: 'a friendly English-speaking pen pal',
      opener: "Hey! I'm so excited to finally chat. Tell me about your day!",
    },
  },
}

// Display metadata for each random practice type.
export const PRACTICE_TYPE_META = {
  qa: { key: 'qa', label: 'Q&A', emoji: '❓' },
  prompt: { key: 'prompt', label: 'Prompt Card', emoji: '🃏' },
  roleplay: { key: 'roleplay', label: 'Roleplay', emoji: '🎭' },
}

const PRACTICE_TYPE_KEYS = ['qa', 'prompt', 'roleplay']

// Randomly pick one of the 3 practice types.
export function pickPracticeType() {
  return PRACTICE_TYPE_KEYS[Math.floor(Math.random() * 3)]
}

export function getPracticeScenario(moduleId) {
  return PRACTICE_SCENARIOS[moduleId] || PRACTICE_SCENARIOS.default
}

// Aria's opening line, announcing the chosen mode (per the required formats).
export function buildPracticeOpening(type, moduleId) {
  const scenario = getPracticeScenario(moduleId)
  if (type === 'qa') {
    const qs = scenario.qa
    const q = qs[Math.floor(Math.random() * qs.length)]
    return `Alright, Q&A mode! Here's your first question: ${q}`
  }
  if (type === 'prompt') {
    return `Scenario time! ${scenario.prompt} You have 90 seconds. Go!`
  }
  return `Roleplay! I'm ${scenario.roleplay.character}. ${scenario.roleplay.opener} Your turn!`
}

function buildPracticeSystemPrompt(type, scenario, userData) {
  const nickname = userData?.nickname || 'friend'
  const personality = userData?.personality || 'Friendly & Warm'

  const modeLines = {
    qa: `MODE: Q&A. Ask ONE question at a time about the topic. After each answer, give one quick "win" and one gentle correction, then ask the next question. Aim for 3-4 questions total.`,
    prompt: `MODE: Prompt Card. The user is responding to this scenario: "${scenario.prompt}". After they speak, briefly analyse their vocabulary, pace and any grammar errors, then give a short follow-up to keep them going.`,
    roleplay: `MODE: Roleplay. Stay fully in character as ${scenario.roleplay?.character}. Keep a natural back-and-forth conversation going for the whole session. Only break character for tiny inline corrections.`,
  }

  return `You are Aria, a warm, encouraging female English speaking coach running a LIVE practice session with ${nickname}. You have warm, natural energy like a smart older sister who is also a coach.
Personality: ${personality}.
${modeLines[type] || modeLines.qa}

RULES:
- English only. This is VOICE — keep every reply under 3 sentences.
- If you notice a grammar mistake, mention it ONLY at the very END of your reply in brackets like this: [💡 tip: say 'correct version' next time]. Never interrupt your reply mid-sentence with corrections. Keep it encouraging not critical.
- Be specific and warm. React to what the user actually said.
- Speak in a warm, natural way. Use contractions like 'you're', 'it's', 'don't' — never formal stiff sentences. Your voice has natural pauses.`
}

// Map stored history ({role:'user'|'model', content}) to OpenRouter messages.
function toChatMessages(history) {
  return (history || [])
    .filter((m) => m.role === 'user' || m.role === 'model')
    .slice(-10)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || ''),
    }))
}

export async function askAriaPractice(userMessage, type, moduleId, userData, history) {
  try {
    const scenario = getPracticeScenario(moduleId)
    const systemPrompt = buildPracticeSystemPrompt(type, scenario, userData)

    const messages = [
      { role: 'system', content: systemPrompt },
      ...toChatMessages(history),
      { role: 'user', content: userMessage },
    ]
    const reply = await chatCompletion(messages, { maxTokens: 200 })
    return reply || 'Hmm, I missed that. Could you say it once more?'
  } catch (err) {
    console.error('Aria practice error:', err)
    return 'Hmm, I missed that. Could you say it once more?'
  }
}

/* ───────────────────────── CAPSTONE EVALUATION ───────────────────────── */

// Final boss evaluation. Aria reads the full 5-minute speech transcript and
// scores how well the speaker combined all three required elements (grammar
// from M1, a business scenario from M10, and modern slang from M7).
// Returns { score: 0-100, feedback: string }.
export async function getCapstoneEvaluation(transcript, userData) {
  const nickname = userData?.nickname || userData?.name || 'friend'
  const clean = (transcript || '').trim()

  // Nothing captured — don't bother the model, just fail gracefully.
  if (!clean) {
    return {
      score: 0,
      feedback: `I didn't catch any of your speech, ${nickname}. Make sure your mic is on and give the Capstone another go — I know you've got this!`,
    }
  }

  try {
    const systemPrompt = `You are Aria, a warm but fair English coach grading the FINAL Capstone challenge for ${nickname}, who has completed all 14 modules.
The student delivered one continuous 5-minute speech that had to combine THREE elements:
1. GRAMMAR — correct, varied grammar and sentence structure (Module 1).
2. BUSINESS — a professional/business scenario delivered with corporate-appropriate English (Module 10).
3. SLANG — natural modern/internet slang woven in tastefully (Module 7).

Grade holistically out of 100. Reward speakers who blend all three smoothly; deduct when an element is missing, forced, or grammatically weak. Be encouraging but honest.

Respond with ONLY a single line of valid JSON, no markdown, in exactly this shape:
{"score": <integer 0-100>, "feedback": "<2-3 warm sentences: one win, one element they nailed, one thing to improve>"}`

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Here is the full transcript of my 5-minute Capstone speech. Grade it now:\n\n"${clean}"`,
      },
    ]

    const reply = await chatCompletion(messages, {
      maxTokens: 300,
      temperature: 0.4,
    })

    return parseEvaluation(reply, nickname)
  } catch (err) {
    console.error('Aria capstone evaluation error:', err)
    return {
      score: 0,
      feedback: `I had trouble scoring that one, ${nickname} — connection hiccup on my end. Your effort still counts; try submitting again in a moment!`,
    }
  }
}

// Pull { score, feedback } out of Aria's reply, tolerating stray prose or
// code fences around the JSON.
function parseEvaluation(reply, nickname) {
  const fallback = {
    score: 75,
    feedback: `Strong work, ${nickname}! You kept the speech going and brought real energy. Keep polishing how smoothly you switch between formal and casual English.`,
  }
  if (!reply) return fallback

  const match = reply.match(/\{[\s\S]*\}/)
  if (!match) return fallback

  try {
    const parsed = JSON.parse(match[0])
    let score = Number(parsed.score)
    if (!Number.isFinite(score)) score = fallback.score
    score = Math.max(0, Math.min(100, Math.round(score)))
    const feedback =
      typeof parsed.feedback === 'string' && parsed.feedback.trim()
        ? parsed.feedback.trim()
        : fallback.feedback
    return { score, feedback }
  } catch {
    return fallback
  }
}

// End-of-session wrap-up: exactly 2 wins + 1 improvement.
export async function getPracticeSummary(userData, history) {
  try {
    const systemPrompt = `You are Aria wrapping up an English practice session. In under 4 warm sentences, give EXACTLY 2 specific things the user did well and 1 specific thing to improve next time. Speak directly to them. Speak in a warm, natural way. Use contractions like 'you're', 'it's', 'don't' — never formal stiff sentences. Your voice has natural pauses.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...toChatMessages(history),
      { role: 'user', content: 'The session timer is up. Give me my wrap-up now.' },
    ]
    const reply = await chatCompletion(messages, { maxTokens: 200 })
    return (
      reply ||
      'Awesome work today! You spoke with real confidence and used some great vocabulary. Next time, try pausing a little less between ideas. Proud of you!'
    )
  } catch (err) {
    console.error('Aria summary error:', err)
    return 'Awesome work today! You spoke with real confidence and used some great vocabulary. Next time, try pausing a little less between ideas. Proud of you!'
  }
}
