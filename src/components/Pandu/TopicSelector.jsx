import { useState } from 'react'
import { getStats } from '../../utils/progress'
import { getUserAccent, getAccentTopics } from './AccentTrainer'

// Topic pools per module
const MODULE_TOPICS = {
  m1: [
    { id: 't1', emoji: '🔤', title: 'Grammar Battle', desc: 'Use 5 different tenses in conversation' },
    { id: 't2', emoji: '📝', title: 'Sentence Builder', desc: 'Build complex sentences using conjunctions' },
    { id: 't3', emoji: '🎯', title: 'Error Hunt', desc: 'Spot and fix common grammar mistakes' },
  ],
  m2: [
    { id: 't1', emoji: '👋', title: 'Stranger Mode', desc: 'Introduce yourself to a new person' },
    { id: 't2', emoji: '🎉', title: 'Party Talk', desc: 'Make small talk at a social event' },
    { id: 't3', emoji: '💼', title: 'Pro Intro', desc: 'Introduce yourself in a job setting' },
  ],
  m3: [
    { id: 't1', emoji: '🕵️', title: 'Question Master', desc: 'Ask 10 different types of questions' },
    { id: 't2', emoji: '🎤', title: 'Interview Mode', desc: 'Answer tricky interview questions' },
    { id: 't3', emoji: '🤔', title: 'Hypothetical', desc: 'Discuss what-if scenarios' },
  ],
  m4: [
    { id: 't1', emoji: '☕', title: 'Coffee Chat', desc: 'Casual conversation about your day' },
    { id: 't2', emoji: '🌤️', title: 'Weather Talk', desc: 'Discuss weather and plans' },
    { id: 't3', emoji: '🎬', title: 'Movie Night', desc: 'Talk about your favorite movies' },
  ],
  m5: [
    { id: 't1', emoji: '🌅', title: 'Morning Routine', desc: 'Describe your daily morning in detail' },
    { id: 't2', emoji: '🍽️', title: 'Food Talk', desc: 'Discuss meals and eating habits' },
    { id: 't3', emoji: '⏰', title: 'Time Master', desc: 'Use past present future naturally' },
  ],
  m6: [
    { id: 't1', emoji: '🤝', title: 'Negotiator', desc: 'Make polite requests and respond' },
    { id: 't2', emoji: '💬', title: 'Opinion Round', desc: 'Share and defend your opinions' },
    { id: 't3', emoji: '😤', title: 'Mood Express', desc: 'Express different emotions in English' },
  ],
  m7: [
    { id: 't1', emoji: '📱', title: 'Slang Master', desc: 'Use 5 gen-z slang words naturally' },
    { id: 't2', emoji: '🐸', title: 'Internet Talk', desc: 'Explain internet culture in English' },
    { id: 't3', emoji: '✂️', title: 'Contraction King', desc: 'Use informal contractions throughout' },
  ],
  m8: [
    { id: 't1', emoji: '👄', title: 'Pronunciation Check', desc: 'Practice tricky word pronunciations' },
    { id: 't2', emoji: '🏷️', title: 'Brand Name Drop', desc: 'Use popular brand names correctly' },
    { id: 't3', emoji: '🍜', title: 'Food Menu', desc: 'Order food with correct pronunciation' },
  ],
  m9: [
    { id: 't1', emoji: '🌶️', title: 'Idiom Drop', desc: 'Use 3 idioms naturally in chat' },
    { id: 't2', emoji: '🧠', title: 'Word Swap', desc: 'Replace misused words with correct ones' },
    { id: 't3', emoji: '🔀', title: 'Confusing Pairs', desc: 'Master affect/effect, lose/loose etc.' },
  ],
  m10: [
    { id: 't1', emoji: '📧', title: 'Email Draft', desc: 'Write and read a professional email aloud' },
    { id: 't2', emoji: '🏢', title: 'Board Room', desc: 'Lead a professional meeting discussion' },
    { id: 't3', emoji: '💼', title: 'Interview Boss', desc: 'Nail common interview questions' },
  ],
  m11: [
    { id: 't1', emoji: '📖', title: 'Story Time', desc: 'Retell a story you heard or read' },
    { id: 't2', emoji: '🔍', title: 'Vocab Hunt', desc: 'Use 5 new words from recent readings' },
    { id: 't3', emoji: '✍️', title: 'Summary Mode', desc: 'Summarize a passage in 3 sentences' },
  ],
  m12: [
    { id: 't1', emoji: '🎵', title: 'Lyric Analysis', desc: 'Discuss meaning of song lyrics' },
    { id: 't2', emoji: '🎤', title: 'Sing & Learn', desc: 'Use phrases from songs naturally' },
    { id: 't3', emoji: '🎸', title: 'Slang from Songs', desc: 'Explain slang from music' },
  ],
  m13: [
    { id: 't1', emoji: '🌙', title: 'Poetry Feels', desc: 'Discuss emotions in a poem' },
    { id: 't2', emoji: '🎭', title: 'Dramatic Read', desc: 'Read a poem with proper intonation' },
    { id: 't3', emoji: '✒️', title: 'Metaphor Hunt', desc: 'Find and explain metaphors' },
  ],
  m14: [
    { id: 't1', emoji: '🎬', title: 'SRK Mode', desc: 'Speak with confidence and charisma' },
    { id: 't2', emoji: '👑', title: 'TED Talk', desc: 'Give a 2-min speech on any topic' },
    { id: 't3', emoji: '🔥', title: 'Stage Presence', desc: 'Use pause and tone like a pro speaker' },
  ],
}

const DEFAULT_TOPICS = [
  { id: 't1', emoji: '💬', title: 'Free Chat', desc: 'Talk about anything on your mind' },
  { id: 't2', emoji: '📰', title: 'News Talk', desc: 'Discuss something from today' },
  { id: 't3', emoji: '🌍', title: 'Global Topics', desc: 'Talk about the world around you' },
]

export default function TopicSelector({ onSelect, onSkip }) {
  const [selected, setSelected] = useState(null)
  const stats = getStats()

  // Module the learner is currently working through (e.g. "m1").
  const currentModuleId = stats?.nextSubTopic?.moduleId || 'm1'

  const topics = MODULE_TOPICS[currentModuleId] || DEFAULT_TOPICS

  // Accent training topics, namespaced so their ids never clash with the
  // regular module topics ("t1" vs "accent_a1").
  const accent = getUserAccent()
  const accentFlag = accent === 'british' ? '🇬🇧' : '🇺🇸'
  const accentTopics = getAccentTopics(accent).map((t) => ({
    ...t,
    id: 'accent_' + t.id,
  }))

  // Single lookup table for the Start button across both sections.
  const allTopics = [...topics, ...accentTopics]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99998,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glow)',
          borderRadius: '20px',
          padding: '28px 24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 0 50px rgba(0,229,255,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p
            style={{
              color: 'var(--color-cyan)',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              margin: '0 0 6px',
            }}
          >
            🎙️ ARIA IS READY
          </p>
          <h2
            style={{
              color: 'var(--text-primary)',
              fontSize: '20px',
              fontWeight: '800',
              margin: '0 0 4px',
            }}
          >
            What should we practice?
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              margin: 0,
            }}
          >
            Pick a topic or skip to free chat
          </p>
        </div>

        {/* Topic Cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelected(topic.id)}
              style={{
                background:
                  selected === topic.id
                    ? 'rgba(0,229,255,0.15)'
                    : 'var(--bg-surface)',
                border: `1px solid ${
                  selected === topic.id
                    ? 'var(--color-cyan)'
                    : 'var(--border-glow)'
                }`,
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow:
                  selected === topic.id
                    ? '0 0 15px rgba(0,229,255,0.2)'
                    : 'none',
              }}
            >
              <span style={{ fontSize: '28px' }}>{topic.emoji}</span>
              <div>
                <div
                  style={{
                    color:
                      selected === topic.id
                        ? 'var(--color-cyan)'
                        : 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginBottom: '2px',
                  }}
                >
                  {topic.title}
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  {topic.desc}
                </div>
              </div>
              {selected === topic.id && (
                <span
                  style={{
                    marginLeft: 'auto',
                    color: 'var(--color-cyan)',
                    fontSize: '18px',
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}

          {/* Accent Training Section */}
          <div
            style={{
              borderTop: '1px solid var(--border-glow)',
              paddingTop: '12px',
              marginTop: '4px',
            }}
          >
            <p
              style={{
                color: 'var(--color-cyan)',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                margin: '0 0 8px',
              }}
            >
              {accentFlag} ACCENT TRAINING
            </p>
            {accentTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelected(topic.id)}
                style={{
                  background:
                    selected === topic.id
                      ? 'rgba(0,229,255,0.15)'
                      : 'var(--bg-surface)',
                  border: `1px solid ${
                    selected === topic.id
                      ? 'var(--color-cyan)'
                      : 'var(--border-glow)'
                  }`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  width: '100%',
                  marginBottom: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '24px' }}>{topic.emoji}</span>
                <div>
                  <div
                    style={{
                      color:
                        selected === topic.id
                          ? 'var(--color-cyan)'
                          : 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '13px',
                    }}
                  >
                    {topic.title}
                  </div>
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                    }}
                  >
                    {topic.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glow)',
              color: 'var(--text-muted)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Free Chat
          </button>
          <button
            onClick={() => {
              const topic = allTopics.find((t) => t.id === selected)
              onSelect(topic || topics[0])
            }}
            style={{
              flex: 2,
              padding: '12px',
              background:
                'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
              border: 'none',
              color: '#0a0a0f',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '800',
            }}
          >
            Start Practice! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
