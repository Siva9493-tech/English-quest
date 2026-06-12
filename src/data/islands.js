// Shared world-map metadata for the 14 modules (islands).

export const ISLAND_DATA = {
  m1: { name: 'The Origin Isle', emoji: '🌋', description: 'Where legends begin' },
  m2: { name: 'Vibe Check Cove', emoji: '🏖️', description: 'Social skills unlocked' },
  m3: { name: 'Interrogation Bay', emoji: '🔍', description: 'Ask everything' },
  m4: { name: 'Daily Drip District', emoji: '☕', description: "Everyday W's" },
  m5: { name: 'Routine Ridge', emoji: '⛰️', description: 'Grind season' },
  m6: { name: 'No Cap Cliffs', emoji: '🗣️', description: 'Speak your truth' },
  m7: { name: 'Slay Shores', emoji: '✨', description: 'Main character energy' },
  m8: { name: 'Clarity Peaks', emoji: '🎯', description: 'No more cringe pronunciation' },
  m9: { name: 'Big Brain Bay', emoji: '🧠', description: 'Galaxy brain unlocked' },
  m10: { name: 'Corporate Citadel', emoji: '🏙️', description: 'CEO mode activated' },
  m11: { name: 'Story Sanctum', emoji: '📖', description: 'Deep lore awaits' },
  m12: { name: 'Beat Breakers Reef', emoji: '🎵', description: 'Music hits different' },
  m13: { name: "Poet's Pinnacle", emoji: '🌙', description: 'Deep and dramatic' },
  m14: { name: 'Hall of Legends', emoji: '👑', description: 'SRK level charisma' },
}

export const POSITIONS = {
  m1: { top: '75%', left: '8%' },
  m2: { top: '55%', left: '18%' },
  m3: { top: '30%', left: '12%' },
  m4: { top: '20%', left: '28%' },
  m5: { top: '65%', left: '32%' },
  m6: { top: '40%', left: '42%' },
  m7: { top: '15%', left: '50%' },
  m8: { top: '70%', left: '52%' },
  m9: { top: '35%', left: '62%' },
  m10: { top: '60%', left: '70%' },
  m11: { top: '20%', left: '72%' },
  m12: { top: '45%', left: '82%' },
  m13: { top: '25%', left: '88%' },
  m14: { top: '65%', left: '88%' },
}

// Visiting order m1 -> m14 (used for the connecting path + list order).
export const ISLAND_ORDER = [
  'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7',
  'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14',
]

// Gen-z adventure prefix per subtopic index (cycles when a module has more).
export const ADVENTURE_PREFIXES = [
  '⚔️ Quest 1:', '🔥 Mission 2:', '💎 Challenge 3:',
  '🚀 Expedition 4:', '🎯 Operation 5:', '⚡ Raid 6:',
  '🌟 Journey 7:', '🏆 Boss Fight 8:', '💫 Finale 9:',
]

// Video "stage" names per video index inside an adventure.
// Generic fallback used only when a subtopic has no ADVENTURE_NAMES entry.
export const STAGE_NAMES = [
  '🔓 Stage 1 — The Unlocking',
  '⚡ Stage 2 — Power Surge',
  '💥 Stage 3 — Final Form',
  '🌟 Stage 4 — Bonus Round',
]

// Per-subtopic adventure name + per-video stage names.
// Keyed by subtopicId (e.g. 'm1-s1'). Falls back to the raw title when absent.
export const ADVENTURE_NAMES = {
  // ── 🌋 THE ORIGIN ISLE — Module 1 ──
  'm1-s1': { adventure: '🔤 The Sound Awakening', stages: ['🔓 Drop the ABCs', '⚡ Sounds Go Hard'] },
  'm1-s2': { adventure: '💬 Word on the Street', stages: ['🌱 Starter Pack', '🔥 Level Up Vocab'] },
  'm1-s3': { adventure: '🧍 Who Even Are You', stages: ['👤 Noun Era Begins'] },
  'm1-s4': { adventure: '🎯 The Article Arc', stages: ['📌 A vs An vs The'] },
  'm1-s5': { adventure: '⚡ Verb Mode Activated', stages: ['🏃 Action Unlocked', '🔮 Modal Bosses'] },
  'm1-s6': { adventure: '✨ Describe Everything Era', stages: ['🎨 Adjective Glow Up'] },
  'm1-s7': { adventure: '📍 Location Location Location', stages: ['🗺️ Place Drop', '⏰ Time Drop'] },
  'm1-s8': { adventure: '⏳ The Time Traveller', stages: ['🕰️ Past Lives', '🚀 Future Arc'] },
  'm1-s9': { adventure: '🔡 Punctuation Hits Different', stages: ['✏️ Comma Era'] },
  'm1-s10': { adventure: '📅 Date Drop Season', stages: ['🗓️ The Date Playlist'] },
  'm1-s11': { adventure: '🔗 Connection Arc', stages: ['🤝 FANBOYS Gang'] },
  'm1-s12': { adventure: '🌶️ Idiom Szn', stages: ['🎭 The Idiom Playlist'] },
  'm1-s13': { adventure: '🧩 Phrasal Verb Saga', stages: ['💫 Phrase It Up'] },
  'm1-s14': { adventure: '🏗️ Build Different (SVO)', stages: ['🧱 Subject Era', '🔨 Sentence Crafting'] },
  'm1-s15': { adventure: '🪢 The Merge Arc', stages: ['🧵 Stitch It Up', '🔀 Clause Boss'] },
  'm1-s16': { adventure: '🔄 The Flip Era', stages: ['🔁 Active to Passive', '💡 Voice Switch'] },
  'm1-s17': { adventure: '❌ No More Cringe Grammar', stages: ['🚫 Grammar Crimes Exposed', '✅ Fixed Fr'] },
  'm1-s18': { adventure: '🤯 Random English Lore', stages: ['🧠 Pangram Arc', '💡 Fun Facts Drop', '🎲 Bonus Lore'] },

  // ── 🏖️ VIBE CHECK COVE — Module 2 ──
  'm2-s1': { adventure: '👋 The Hello Glow Up', stages: ['😎 Casual Greet', '🤵 Pro Greet'] },
  'm2-s2': { adventure: '🪞 Main Character Intro', stages: ['🎤 Introduce Yourself', '💼 Pro Version'] },
  'm2-s3': { adventure: '🎯 Answer Like a Pro', stages: ['🗣️ Smooth Replies', '😏 Elegant Answers', '💪 No Awkward Silence'] },
  'm2-s4': { adventure: '🧠 Big Brain Politeness', stages: ['🌸 Soft Tone', '🎩 Executive Vibes', '✨ Polished AF'] },
  'm2-s5': { adventure: '🙏 The Magic Words Arc', stages: ['💖 Please & Thank You Era'] },
  'm2-s6': { adventure: '👨‍👩‍👧 Family Talk Season', stages: ['🏡 Family Vocab Drop', '❤️ Describe Your Fam'] },
  'm2-s7': { adventure: '🎮 Hobby Flex Arc', stages: ['🎯 Hobby Vocab', '🌟 Interest Drop', '💬 Talk Your Passion'] },

  // ── 🔍 INTERROGATION BAY — Module 3 ──
  'm3-s1': { adventure: '❓ The Wh Era', stages: ['🔍 Who What When Where Why'] },
  'm3-s2': { adventure: '✅ Yes or Nah', stages: ['💬 Yes/No Unlocked', '🔄 Flip the Question'] },
  'm3-s3': { adventure: '🎣 The Tag Trap', stages: ['😏 Tag Question Drip', '🪝 Hook the Answer'] },
  'm3-s4': { adventure: '🎙️ Answer Without the Ick', stages: ['😌 Smooth Responder', '🧊 Cool Under Pressure'] },
  'm3-s5': { adventure: '🌀 The Hypothetical Drop', stages: ['🤔 What If Era', '❌ Negative Arc'] },

  // ── ☕ DAILY DRIP DISTRICT — Module 4 ──
  'm4-s1': { adventure: '🌤️ Small Talk, Big W', stages: ['☁️ Weather Convo', '🎸 Hobby Chat', '👨‍👩‍👧 Fam Talk'] },
  'm4-s2': { adventure: '📆 Daily Sauce', stages: ['🌅 Morning Routine Talk', '🌙 Evening Wrap'] },
  'm4-s3': { adventure: '⏰ Routine Arc Begins', stages: ['🔄 Your Day in English'] },
  'm4-s4': { adventure: '🎬 Real Life, Real English', stages: ['🍽️ Restaurant Arc', '🛒 Store Arc'] },
  'm4-s5': { adventure: '💅 Like It or Leave It', stages: ['👍 Like Drop', '👎 Dislike Drop', '😐 Mid Check', '🤷 Neutral Arc'] },
  'm4-s6': { adventure: '🌍 Culture Shock Arc', stages: ['🗺️ Culture Drop 1', '🤝 Culture Drop 2', '👁️ Context Aware', '🧩 Cultural Puzzle', '🌐 Global Mindset'] },

  // ── ⛰️ ROUTINE RIDGE — Module 5 ──
  'm5-s1': { adventure: '☀️ The Daily Grind Arc', stages: ['🌄 Morning Flow', '🌆 Evening Recap'] },
  'm5-s2': { adventure: '🧹 Action Verb Era', stages: ['💪 Chore Boss', '🔧 Task Verbs Unlocked'] },
  'm5-s3': { adventure: '🕰️ Time Traveller 2.0', stages: ['📜 Past Tense Arc', '⏩ Present Activated', '🔭 Future Vision'] },

  // ── 🗣️ NO CAP CLIFFS — Module 6 ──
  'm6-s1': { adventure: '📋 Ask Without the Ick', stages: ['🤲 Polite Request Arc'] },
  'm6-s2': { adventure: '🎭 Tone Check Season', stages: ['🎚️ Tone Setter', '🔊 Modal Flex', '🎯 Tone Locked In', '⚖️ Vibe Balancer'] },
  'm6-s3': { adventure: '🤜 Respectful Beef Arc', stages: ['✅ Agreement Drop', '❌ Disagree Politely', '🤝 Middle Ground'] },
  'm6-s4': { adventure: '🆘 Help Mode On', stages: ['🙋 Ask for Help', '🤝 Offer Help', '💬 Help Phrases', '✨ Assistance Arc'] },
  'm6-s5': { adventure: '😤 Mood = English', stages: ['😡 Angry English', '😄 Happy Vibes', '🤩 Excited Arc'] },

  // ── ✨ SLAY SHORES — Module 7 ──
  'm7-s1': { adventure: '📱 Internet Language Era', stages: ['💻 Slang Drop Vol.1', '📲 Shorts Arc', '😂 Meme English', '🔥 Slang Boss', '🌐 Net Speak'] },
  'm7-s2': { adventure: '🗣️ Talk Like a Local', stages: ['gonna wanna gotta drop', '🔤 Contraction Boss'] },

  // ── 🎯 CLARITY PEAKS — Module 8 ──
  'm8-s1': { adventure: '👄 Mouth Workout Arc', stages: ['🗣️ Articulation Basics', '📢 Clarity Drills', '🎙️ Voice Warmup'] },
  'm8-s2': { adventure: '🏷️ Brand Name Flex', stages: ['👟 Logo Pronunciation', '💎 Luxury Brand Arc', '🌍 Global Names'] },
  'm8-s3': { adventure: '🍜 Food English Era', stages: ['🍽️ Menu Pronunciation Boss'] },
  'm8-s4': { adventure: '😬 No More Cringe Words', stages: ['🚫 Common Mistakes', '✅ Fixed Arc', '💯 Clean Pronunciation', '🏆 Word Boss'] },

  // ── 🧠 BIG BRAIN BAY — Module 9 ──
  'm9-s1': { adventure: '🌶️ Advanced Idiom Arc', stages: ['🎭 Native Level Drop', '🏆 Idiom Boss'] },
  'm9-s2': { adventure: '🧩 Phrasal Verb 2.0', stages: ['⚡ Advanced Phrases', '💼 Pro Usage'] },
  'm9-s3': { adventure: '🤔 Confusing Word Trap', stages: ['⚔️ Affect vs Effect', '🔀 Confusing Pairs', '🎯 Word Clarity Arc'] },
  'm9-s4': { adventure: '❌ Wrong but Confident Era', stages: ['😬 Misuse Exposed', '✅ Correct Version', '💡 No More Mistakes'] },
  'm9-s5': { adventure: '📊 Quantity Check Arc', stages: ['🔢 Few vs Little', '📈 Much vs Many', '💫 Quantifier Boss', '🏆 Final Flex'] },

  // ── 🏙️ CORPORATE CITADEL — Module 10 ──
  'm10-s1': { adventure: '👔 Casual to Corporate Arc', stages: ['😎 Street vs Suite', '💼 Office Mode On', '🎩 Pro Upgrade'] },
  'm10-s2': { adventure: '📧 Email Like a CEO', stages: ['✉️ Subject Line Arc', '📝 Body Craft', '🔏 Sign Off Boss'] },
  'm10-s3': { adventure: '📊 Corporate Lingo Drop', stages: ['🗣️ Buzzword Arc', '📈 Business Vocab', '🏢 Jargon Boss'] },
  'm10-s4': { adventure: '🎤 Corporate Communication Era', stages: ['🔊 Voice Authority', '🤝 Work Convos', '📡 Message Clear', '💡 Pro Presence'] },
  'm10-s5': { adventure: '🤝 Boardroom Arc', stages: ['📋 Meeting Phrases', '💹 Negotiation Drop', '🏆 Deal Boss'] },
  'm10-s6': { adventure: '💼 Interview Final Boss', stages: ['🚪 Entry Arc', '🎯 Tell Me About You', '💰 Salary Arc', '🤝 Close Strong', '🏆 Hired Era'] },
  'm10-s7': { adventure: '☕ Corporate Small Talk Arc', stages: ['🌤️ Office Convo', '😄 Break Room Vibes', '🤵 Exec Small Talk', '🌐 Network Drop'] },
  'm10-s8': { adventure: '📬 Written Word Era', stages: ['✍️ Formal Email Drop', '📩 Reply Arc', '🔐 Pro Writing', '📜 Correspondence Boss'] },

  // ── 📖 STORY SANCTUM — Module 11 ──
  'm11-s1': { adventure: '🌲 Forest Lore Arc', stages: ['📖 Tommy & Rosie Ep1', '🎬 Shorts Breakdown', '🌳 Deep Forest Read'] },
  'm11-s2': { adventure: '👻 Haunted House Arc', stages: ['🏚️ Mansion Entry', '🕯️ Mystery Drop', '😱 Final Reveal'] },
  'm11-s3': { adventure: '🏁 The Race Arc', stages: ['🏃 Jamie Runs'] },
  'm11-s4': { adventure: '🎨 The Artist Era', stages: ["🖌️ Elena's Canvas Pt1", '✨ Resilience Arc'] },
  'm11-s5': { adventure: '💕 Love Story Arc', stages: ['💌 Adrian & Isabella', '🌹 Plot Twist', '🎭 Finale'] },

  // ── 🎵 BEAT BREAKERS REEF — Module 12 ──
  'm12-s1': { adventure: '🕊️ Wiz Khalifa Arc', stages: ['🎤 See You Again Analysis', '📝 Vocab Drop'] },
  'm12-s2': { adventure: '✈️ Passenger Arc', stages: ['🎧 Let Her Go Pt1', '📖 Lyric Deep Dive', '🎵 Melody Grammar', '✨ Vibe Analysis'] },
  'm12-s3': { adventure: '🕺 Uptown Era', stages: ['🎸 Funk Grammar Drop'] },
  'm12-s4': { adventure: '📸 Ed Sheeran Arc', stages: ['💛 Photograph Analysis'] },
  'm12-s5': { adventure: '🌸 Flowers Era', stages: ["🌺 Miley's Vocab Drop"] },

  // ── 🌙 POET'S PINNACLE — Module 13 ──
  'm13-s1': { adventure: "🥀 Rossetti's Feels Arc", stages: ['💔 Remember Poem', '🎭 Intonation Drop', '🌙 Rhythm Boss'] },
  'm13-s2': { adventure: "❄️ Frost's Design Arc", stages: ['🕷️ Design Analysis', '🧊 Deep Lore Drop'] },

  // ── 👑 HALL OF LEGENDS — Module 14 ──
  'm14-s1': { adventure: '🎬 SRK Final Boss Arc', stages: ['🌟 TED Talk Entry', '💫 Charisma Drop', '🎤 Stage Presence', '👑 King Moment', '🔥 Crowd Control', '✨ Legend Arc', '🏆 Milestone 1', '🎯 Milestone 2', '💎 Milestone 3', '🚀 Milestone 4', '👑 Hall of Fame'] },
}
