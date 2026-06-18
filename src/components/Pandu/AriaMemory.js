// AriaMemory.js
// Cross-session memory for Aria.
// Remembers patterns, mistakes, and progress over time.

const MEMORY_KEY = 'ariaLongMemory'

// ─── MEMORY STRUCTURE ─────────────────────────
// {
//   lastSession: { date, grade, quality, topMistake, topicPracticed, duration },
//   mistakePatterns: { word: count },
//   strongAreas: ['grammar', 'vocabulary'],
//   weakAreas: ['pronunciation', 'pace'],
//   totalSessions: number,
//   totalWords: number,
//   streak: number,
//   firstSessionDate: string,
//   recentTopics: [string],
//   personalNotes: [string], // things Aria noticed
// }

export function getAriaMemory() {
  try {
    const data = localStorage.getItem(MEMORY_KEY)
    return data ? JSON.parse(data) : getDefaultMemory()
  } catch {
    return getDefaultMemory()
  }
}

function getDefaultMemory() {
  return {
    lastSession: null,
    mistakePatterns: {},
    strongAreas: [],
    weakAreas: [],
    totalSessions: 0,
    totalWords: 0,
    streak: 0,
    firstSessionDate: new Date().toDateString(),
    recentTopics: [],
    personalNotes: [],
  }
}

export function saveAriaMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
  } catch (e) {
    console.error('Memory save failed:', e)
  }
}

// Update memory after a session ends.
// `summary` comes from SessionTracker, `topic` is the practiced topic (or
// null for free chat), `corrections` is the array from PanduMemory.
export function updateMemoryAfterSession(summary, topic, corrections) {
  const memory = getAriaMemory()

  // Update session stats.
  memory.totalSessions = (memory.totalSessions || 0) + 1
  memory.totalWords = (memory.totalWords || 0) + (summary?.totalWords || 0)

  // Update mistake patterns.
  if (corrections && corrections.length > 0) {
    corrections.forEach((correction) => {
      if (correction.wrong) {
        memory.mistakePatterns[correction.wrong] =
          (memory.mistakePatterns[correction.wrong] || 0) + 1
      }
    })
  }

  // Find top mistake.
  const topMistake = getTopMistakeFromPatterns(memory.mistakePatterns)

  // Update strong/weak areas based on scores.
  if (summary) {
    if (summary.avgQuality >= 80) {
      addToArea(memory.strongAreas, 'fluency')
    } else if (summary.avgQuality < 60) {
      addToArea(memory.weakAreas, 'fluency')
    }

    if (summary.totalFillers === 0) {
      addToArea(memory.strongAreas, 'filler words')
    } else if (summary.totalFillers > 5) {
      addToArea(memory.weakAreas, 'filler words')
    }

    if (summary.paceScore >= 80) {
      addToArea(memory.strongAreas, 'pace')
    } else if (summary.paceScore < 60) {
      addToArea(memory.weakAreas, 'pace')
    }

    if ((summary.avgPronScore || 0) >= 80) {
      addToArea(memory.strongAreas, 'pronunciation')
    } else if ((summary.avgPronScore || 0) < 60) {
      addToArea(memory.weakAreas, 'pronunciation')
    }
  }

  // Keep only the most recent 3 in each area.
  memory.strongAreas = [...new Set(memory.strongAreas)].slice(-3)
  memory.weakAreas = [...new Set(memory.weakAreas)].slice(-3)

  // Save last session info.
  memory.lastSession = {
    date: new Date().toDateString(),
    grade: summary?.fluencyGrade?.grade || 'N/A',
    quality: summary?.avgQuality || 0,
    topMistake: topMistake,
    topicPracticed: topic?.title || 'Free Chat',
    duration: summary?.duration || 0,
  }

  // Track recent topics.
  if (topic?.title) {
    memory.recentTopics = [topic.title, ...(memory.recentTopics || [])].slice(
      0,
      5,
    )
  }

  saveAriaMemory(memory)
  return memory
}

function addToArea(area, item) {
  if (!area.includes(item)) {
    area.push(item)
  }
}

function getTopMistakeFromPatterns(patterns) {
  if (!patterns || Object.keys(patterns).length === 0) {
    return null
  }
  return Object.entries(patterns).sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

// Build a memory context string for Aria's system prompt.
export function buildMemoryContext(memory) {
  if (!memory) return ''

  const parts = []

  // Last session info.
  if (memory.lastSession) {
    const last = memory.lastSession
    const isToday = last.date === new Date().toDateString()
    const isYesterday =
      last.date === new Date(Date.now() - 86400000).toDateString()

    if (!isToday) {
      parts.push(
        `Last session: ${isYesterday ? 'yesterday' : last.date}, ` +
          `grade ${last.grade}, ` +
          `practiced "${last.topicPracticed}"`,
      )
    }
  }

  // Top mistake to watch.
  const topMistake = getTopMistakeFromPatterns(memory.mistakePatterns)
  if (topMistake) {
    parts.push(
      `Most repeated mistake: "${topMistake}" — mention this gently once`,
    )
  }

  // Strong areas to praise.
  if (memory.strongAreas?.length > 0) {
    parts.push(
      `User's strong areas: ${memory.strongAreas.join(', ')} — acknowledge these`,
    )
  }

  // Weak areas to focus on.
  if (memory.weakAreas?.length > 0) {
    parts.push(
      `Areas needing work: ${memory.weakAreas.join(', ')} — gently focus here`,
    )
  }

  // Total sessions milestone.
  if (memory.totalSessions > 0) {
    parts.push(`Total sessions completed: ${memory.totalSessions}`)

    // Milestone messages.
    if (memory.totalSessions === 5) {
      parts.push('This is their 5th session — celebrate this milestone!')
    } else if (memory.totalSessions === 10) {
      parts.push('This is their 10th session — huge achievement, celebrate!')
    } else if (memory.totalSessions === 30) {
      parts.push(
        'This is their 30th session — they are truly committed, celebrate big!',
      )
    }
  }

  return parts.length > 0 ? '\n\nMEMORY CONTEXT:\n' + parts.join('\n') : ''
}

// Generate a personalized opening message.
export function generateOpeningMessage(memory, nickname) {
  const name = nickname || 'friend'

  if (!memory.lastSession) {
    // First session ever.
    return `Hey ${name}! Welcome to your first session! I'm so excited to practice English with you. What would you like to talk about today?`
  }

  const last = memory.lastSession
  const isYesterday =
    last.date === new Date(Date.now() - 86400000).toDateString()
  const topMistake = getTopMistakeFromPatterns(memory.mistakePatterns)

  // Build a personalized greeting.
  if (isYesterday && memory.totalSessions >= 2) {
    // Returning the next day.
    if (topMistake) {
      return `Welcome back ${name}! Great to see you again. Last time you worked on "${last.topicPracticed}" and got a ${last.grade}. Today let's keep an eye on "${topMistake}" — you've been using it a lot. Ready?`
    }
    return `Hey ${name}! You're back — love the consistency! Yesterday's session was ${last.grade} level. Let's beat that today. What's on your mind?`
  }

  if (memory.totalSessions >= 5 && memory.strongAreas?.length > 0) {
    return `${name}! Session ${memory.totalSessions + 1} — you're getting so much better at ${memory.strongAreas[0]}! Let's keep building on that today. Go ahead!`
  }

  // Generic but warm return.
  return `Hey ${name}! Good to have you back for session ${memory.totalSessions + 1}. I'm listening — what shall we talk about today?`
}

// Check if the user deserves a memory-based milestone badge.
export function checkMemoryMilestones(memory) {
  const milestones = []

  if (memory.totalSessions === 1) {
    milestones.push({
      title: 'First Session! 🎉',
      desc: 'You started your English journey!',
    })
  }
  if (memory.totalSessions === 7) {
    milestones.push({
      title: 'One Week Streak! 🔥',
      desc: '7 sessions completed!',
    })
  }
  if (memory.totalWords >= 1000) {
    milestones.push({
      title: '1000 Words Spoken! 💬',
      desc: "You've said over 1000 English words!",
    })
  }
  if (memory.strongAreas?.length >= 3) {
    milestones.push({
      title: 'Well Rounded! ⭐',
      desc: 'Strong in 3 different areas!',
    })
  }

  return milestones
}
