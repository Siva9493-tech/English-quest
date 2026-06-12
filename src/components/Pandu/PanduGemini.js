import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Build the dynamic system prompt from user + progress + history.
export function buildSystemPrompt(userData, progressData, conversationHistory) {
  const name = userData?.name || 'there'
  const nickname = userData?.nickname || 'friend'
  const personality = userData?.personality || 'Friendly & Warm'
  const completed = progressData?.completedCount ?? 0
  const total = progressData?.totalCount ?? 76
  const currentModule =
    progressData?.nextSubTopic?.moduleTitle || 'General English'

  const recent = (conversationHistory || [])
    .slice(-20)
    .map((m) => `${m.role === 'user' ? name : 'Leo'}: ${m.content}`)
    .join('\n')

  return `You are Leo, a friendly English speaking coach.
Your personality is: ${personality}.
You are speaking to ${name}. Call them "${nickname}".

IMPORTANT RULES:
- You speak ONLY in English. Never switch to Telugu, Hindi, or any other language.
- You are voice-only. Keep responses under 3 sentences unless explaining something important.
- You have a warm, natural female voice personality — never robotic, never stiff.
- You remember the user's progress. They have completed ${completed} out of ${total} subtopics.
- Today's focus module is: ${currentModule}.

YOUR DAILY ROUTINE with the user:
1. Start with a warm greeting mentioning their name and one thing they did well recently.
2. Give them the Word of the Day — one useful business/daily word, its meaning, and one example sentence. Make it conversational.
3. Have a short English conversation on today's module topic.
4. Gently correct mistakes INLINE like this: (✏️ try saying "I have been" instead of "I am been") — never make them feel bad.
5. Track: pace (too fast/slow?), pronunciation issues, slang usage, filler words like "um" and "uh".
6. End a session with 3 specific things they did well and 1 thing to improve tomorrow.

PERSONALITY NOTES for ${personality}:
- "Friendly & Warm": casual, use words like "awesome", "you're doing great!", add occasional emoji in text.
- "Matured & Professional": clear diction, structured feedback, like a seasoned female coach.
- "Fun & Energetic": high energy, uses mild slang, very encouraging, celebrates small wins loudly.

RECENT CONVERSATION:
${recent || '(no previous messages yet)'}`
}

// Convert stored history into a valid, strictly-alternating Gemini history
// that starts with a user turn and ends before the new user message.
function toGeminiHistory(history) {
  const mapped = (history || [])
    .filter((m) => m.role === 'user' || m.role === 'model')
    .map((m) => ({ role: m.role, parts: [{ text: String(m.content || '') }] }))

  while (mapped.length && mapped[0].role !== 'user') mapped.shift()

  const out = []
  for (const m of mapped) {
    const last = out[out.length - 1]
    if (last && last.role === m.role) {
      last.parts[0].text += '\n' + m.parts[0].text
    } else {
      out.push({ role: m.role, parts: [{ text: m.parts[0].text }] })
    }
  }
  if (out.length && out[out.length - 1].role === 'user') out.pop()
  return out
}

export async function askPandu(userMessage, userData, progressData, history) {
  if (!API_KEY) {
    return "I can't reach my brain right now — the Gemini API key isn't set up yet."
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const systemPrompt = buildSystemPrompt(userData, progressData, history)

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({
      history: toGeminiHistory(history),
      generationConfig: { maxOutputTokens: 200 },
    })

    const result = await chat.sendMessage(userMessage)
    return result.response.text().trim()
  } catch (err) {
    console.error('Leo Gemini error:', err)
    return "Hmm, I had trouble thinking just now. Could you say that again?"
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

// Leo's opening line, announcing the chosen mode (per the required formats).
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

  return `You are Leo, a warm, encouraging female English speaking coach running a LIVE practice session with ${nickname}.
Personality: ${personality}.
${modeLines[type] || modeLines.qa}

RULES:
- English only. This is VOICE — keep every reply under 3 sentences.
- Correct mistakes GENTLY and INLINE like this: (✏️ try: "I would have" instead of "I would of"). Never lecture.
- Be specific and warm. React to what the user actually said.`
}

export async function askLeoPractice(userMessage, type, moduleId, userData, history) {
  if (!API_KEY) {
    return "My AI brain isn't connected right now, but keep going out loud — you're doing great!"
  }
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const scenario = getPracticeScenario(moduleId)
    const systemPrompt = buildPracticeSystemPrompt(type, scenario, userData)

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({
      history: toGeminiHistory(history),
      generationConfig: { maxOutputTokens: 200 },
    })

    const result = await chat.sendMessage(userMessage)
    return result.response.text().trim()
  } catch (err) {
    console.error('Leo practice error:', err)
    return 'Hmm, I missed that. Could you say it once more?'
  }
}

// End-of-session wrap-up: exactly 2 wins + 1 improvement.
export async function getPracticeSummary(userData, history) {
  if (!API_KEY) {
    return 'Great session! Two wins: you kept speaking and you stayed in English the whole time. One thing to improve: slow down a touch on longer sentences. See you tomorrow!'
  }
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const systemPrompt = `You are Leo wrapping up an English practice session. In under 4 warm sentences, give EXACTLY 2 specific things the user did well and 1 specific thing to improve next time. Speak directly to them.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({
      history: toGeminiHistory(history),
      generationConfig: { maxOutputTokens: 200 },
    })

    const result = await chat.sendMessage(
      'The session timer is up. Give me my wrap-up now.',
    )
    return result.response.text().trim()
  } catch (err) {
    console.error('Leo summary error:', err)
    return 'Awesome work today! You spoke with real confidence and used some great vocabulary. Next time, try pausing a little less between ideas. Proud of you!'
  }
}
