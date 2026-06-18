// AccentTrainer.js
// British vs American English training system

// Key differences between British and American English
const ACCENT_DATA = {
  british: {
    name: 'British English',
    flag: '🇬🇧',
    shortName: 'British',

    // Vocabulary differences
    vocabulary: [
      { british: 'lift', american: 'elevator',
        tip: 'In British English, it\'s a "lift" not elevator' },
      { british: 'flat', american: 'apartment',
        tip: 'British say "flat", Americans say "apartment"' },
      { british: 'biscuit', american: 'cookie',
        tip: 'A British biscuit is an American cookie' },
      { british: 'boot', american: 'trunk',
        tip: 'Car boot (British) = car trunk (American)' },
      { british: 'bonnet', american: 'hood',
        tip: 'Car bonnet (British) = car hood (American)' },
      { british: 'motorway', american: 'highway/freeway',
        tip: 'Motorway (British) = highway (American)' },
      { british: 'chemist', american: 'pharmacy/drugstore',
        tip: 'Chemist shop (British) = pharmacy (American)' },
      { british: 'trainers', american: 'sneakers',
        tip: 'Trainers (British) = sneakers (American)' },
      { british: 'rubbish', american: 'garbage/trash',
        tip: 'Rubbish (British) = garbage/trash (American)' },
      { british: 'holiday', american: 'vacation',
        tip: 'Going on holiday (British) = vacation (American)' },
      { british: 'autumn', american: 'fall',
        tip: 'Autumn (British) = fall (American)' },
      { british: 'maths', american: 'math',
        tip: 'British say "maths" with S, Americans say "math"' },
      { british: 'mobile', american: 'cell phone',
        tip: 'Mobile phone (British) = cell phone (American)' },
      { british: 'post', american: 'mail',
        tip: 'Post (British) = mail (American)' },
      { british: 'queue', american: 'line',
        tip: 'Standing in a queue (British) = standing in line (American)' },
    ],

    // Pronunciation patterns
    pronunciation: [
      { pattern: 'water', british: 'WAH-tah', american: 'WAH-ter',
        tip: 'British: drop the R at end — "WAH-tah"' },
      { pattern: 'car', british: 'KAH', american: 'KAR',
        tip: 'British: non-rhotic — no R sound at end' },
      { pattern: 'bath', british: 'BAHTH (long A)', american: 'BATH (short A)',
        tip: 'British use long A sound — "BAHTH" like "father"' },
      { pattern: 'dance', british: 'DAHNS', american: 'DANS',
        tip: 'British: long A — "DAHNS" rhymes with "chance" with BAHN' },
      { pattern: 'schedule', british: 'SHED-yool', american: 'SKED-yool',
        tip: 'British say "SHED-yool", Americans say "SKED-yool"' },
      { pattern: 'vitamin', british: 'VIT-a-min', american: 'VY-ta-min',
        tip: 'British: short I — "VIT-a-min", Americans: long I — "VY-ta-min"' },
      { pattern: 'laboratory', british: 'lab-OR-a-tree', american: 'LAB-ra-tory',
        tip: 'Different stress: British stress OR, Americans stress LAB' },
      { pattern: 't (between vowels)', british: 'crisp T', american: 'flap D sound',
        tip: 'Americans say "WAH-der" for water, British say clear T' },
    ],

    // Common phrases
    phrases: [
      { british: 'Cheers!', meaning: 'Thanks / Goodbye / Toast' },
      { british: 'Brilliant!', meaning: 'Excellent / Great' },
      { british: 'Rubbish!', meaning: 'That\'s nonsense / bad quality' },
      { british: 'Quite', meaning: 'Rather / Somewhat (used for emphasis)' },
      { british: 'Sorted', meaning: 'Fixed / Organized / Done' },
      { british: 'Fancy', meaning: 'Want to / Would you like to' },
      { british: 'Cheeky', meaning: 'Slightly rude but in a fun way' },
      { british: 'Gutted', meaning: 'Very disappointed' },
      { british: 'Knackered', meaning: 'Very tired' },
      { british: 'Mate', meaning: 'Friend (casual)' },
    ],

    systemTone: `Use British English vocabulary and expressions.
Say "brilliant" instead of "awesome", "quite" instead of "very",
"rubbish" instead of "terrible", "sorted" instead of "done".
Correct user when they use American terms and suggest British alternatives.
Teach British pronunciation patterns gently.`,
  },

  american: {
    name: 'American English',
    flag: '🇺🇸',
    shortName: 'American',

    vocabulary: [
      { american: 'elevator', british: 'lift',
        tip: 'Say "elevator" not "lift" in American English' },
      { american: 'apartment', british: 'flat',
        tip: 'Say "apartment" not "flat" in American English' },
      { american: 'cookie', british: 'biscuit',
        tip: 'Say "cookie" for sweet baked treats' },
      { american: 'trunk', british: 'boot',
        tip: 'Car trunk — not boot' },
      { american: 'hood', british: 'bonnet',
        tip: 'Car hood — not bonnet' },
      { american: 'freeway/highway', british: 'motorway',
        tip: 'Freeway or highway — not motorway' },
      { american: 'drugstore/pharmacy', british: 'chemist',
        tip: 'Say "pharmacy" or "drugstore"' },
      { american: 'sneakers', british: 'trainers',
        tip: 'Say "sneakers" not trainers' },
      { american: 'trash/garbage', british: 'rubbish',
        tip: 'Say "trash" or "garbage" not rubbish' },
      { american: 'vacation', british: 'holiday',
        tip: 'Say "vacation" not holiday (for trips)' },
      { american: 'fall', british: 'autumn',
        tip: 'Americans say "fall" for the season' },
      { american: 'math', british: 'maths',
        tip: 'Say "math" without the S' },
      { american: 'cell phone', british: 'mobile',
        tip: 'Say "cell phone" or just "phone"' },
      { american: 'mail', british: 'post',
        tip: 'Say "mail" not post' },
      { american: 'line', british: 'queue',
        tip: 'Say "stand in line" not queue' },
    ],

    pronunciation: [
      { pattern: 'r (after vowels)', american: 'always pronounced',
        tip: 'Americans always pronounce R — "car" = KAR, "water" = WAH-ter' },
      { pattern: 't (between vowels)', american: 'flap/D sound',
        tip: 'Americans say "WAH-der" for water, "BEH-der" for better' },
      { pattern: 'a in words like bath', american: 'short A',
        tip: 'American "bath" has short A — rhymes with "math"' },
      { pattern: 'o in words like hot', american: 'AH sound',
        tip: 'American "hot" sounds like "haht" — open AH' },
      { pattern: 'schedule', american: 'SKED-yool',
        tip: 'Americans say "SKED-yool" — hard SK sound' },
    ],

    phrases: [
      { american: 'Awesome!', meaning: 'Great / Excellent' },
      { american: 'No problem', meaning: 'You\'re welcome / It\'s fine' },
      { american: 'Sure!', meaning: 'Yes / Of course' },
      { american: 'You bet!', meaning: 'Absolutely / Of course' },
      { american: 'My bad', meaning: 'My mistake / Sorry' },
      { american: 'Hang out', meaning: 'Spend time casually with friends' },
      { american: 'Dude', meaning: 'Casual term for a person / friend' },
      { american: 'Totally', meaning: 'Completely / Absolutely' },
      { american: 'What\'s up?', meaning: 'How are you? / Hello' },
      { american: 'Catch you later', meaning: 'Goodbye / See you later' },
    ],

    systemTone: `Use American English vocabulary and expressions.
Say "awesome" for praise, "trash" not rubbish, "vacation" not holiday.
Correct user when they use British terms and suggest American alternatives.
Teach American pronunciation patterns — especially the R sound and flap T.`,
  },
};

// Get accent data by preference
export function getAccentData(accent) {
  return ACCENT_DATA[accent] || ACCENT_DATA.american;
}

// Get user's saved accent preference
export function getUserAccent() {
  return localStorage.getItem('ariaAccentPreference')
    || 'american';
}

// Save accent preference
export function setUserAccent(accent) {
  localStorage.setItem('ariaAccentPreference', accent);
}

// Get random vocabulary tip for current accent
export function getRandomVocabTip(accent) {
  const data = getAccentData(accent);
  const vocab = data.vocabulary;
  const random = vocab[Math.floor(Math.random() * vocab.length)];

  if (accent === 'british') {
    return `[🇬🇧 British vocab: say "${random.british}" instead of "${random.american}" — ${random.tip}]`;
  } else {
    return `[🇺🇸 American vocab: say "${random.american}" instead of "${random.british}" — ${random.tip}]`;
  }
}

// Get random phrase for the day
export function getDailyPhrase(accent) {
  const data = getAccentData(accent);
  const phrases = data.phrases;
  const random = phrases[Math.floor(Math.random() * phrases.length)];

  const key = accent === 'british' ? random.british : random.american;
  return {
    phrase: key,
    meaning: random.meaning,
    accent: data.shortName,
  };
}

// Build accent-specific system prompt addition
export function buildAccentSystemPrompt(accent) {
  const data = getAccentData(accent);
  return `\nACCENT TRAINING MODE: ${data.name} ${data.flag}\n${data.systemTone}`;
}

// Get accent practice topics
export function getAccentTopics(accent) {
  if (accent === 'british') {
    return [
      { id: 'a1', emoji: '🇬🇧', title: 'British Vocab Drop',
        desc: 'Use 5 British words naturally in conversation' },
      { id: 'a2', emoji: '☕', title: 'Proper British Chat',
        desc: 'Sound like a true Brit — cheers, brilliant, sorted!' },
      { id: 'a3', emoji: '🎩', title: 'RP Pronunciation',
        desc: 'Practice Received Pronunciation sounds' },
    ];
  } else {
    return [
      { id: 'a1', emoji: '🇺🇸', title: 'American Accent Drop',
        desc: 'Use 5 American expressions naturally' },
      { id: 'a2', emoji: '🏈', title: 'American Small Talk',
        desc: 'Sound like a native — awesome, totally, my bad!' },
      { id: 'a3', emoji: '🎬', title: 'Hollywood English',
        desc: 'Talk like you\'re in an American TV show' },
    ];
  }
}
