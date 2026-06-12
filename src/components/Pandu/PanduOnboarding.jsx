import { useEffect, useState } from 'react'
import panduIcon from '../../assets/pandu-icon.png'
import { panduSpeak } from './PanduVoice'
import { savePanduUser } from './PanduMemory'

const NICKNAMES = [
  { value: 'Bro', label: 'Bro 🤝' },
  { value: 'Sis', label: 'Sis 💯' },
  { value: 'Coach', label: 'Coach 🏆' },
  { value: 'Leo', label: 'Leo 🦁' },
]

const PERSONALITIES = [
  {
    value: 'Friendly & Warm',
    emoji: '🌸',
    desc: 'Like a supportive friend — casual, encouraging.',
  },
  {
    value: 'Matured & Professional',
    emoji: '💼',
    desc: 'Clear, articulate, like a real coach.',
  },
  {
    value: 'Fun & Energetic',
    emoji: '⚡',
    desc: 'Upbeat, uses slang, hype energy.',
  },
]

export default function PanduOnboarding({ onComplete }) {
  const [screen, setScreen] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [personality, setPersonality] = useState('')

  // Pandu speaks aloud when the name screen appears.
  useEffect(() => {
    if (screen === 2) panduSpeak('What should I call you?')
  }, [screen])

  function finish() {
    const user = {
      name: name.trim() || 'Friend',
      email: email.trim(),
      nickname: nickname || 'Leo',
      personality: personality || 'Friendly & Warm',
      joinedDate: new Date().toDateString(),
      totalSessions: 0,
      lastSessionDate: null,
    }
    savePanduUser(user)
    onComplete(user)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        {screen === 1 && (
          <div className="space-y-5 text-center">
            <img
              src={panduIcon}
              alt="Leo"
              className="mx-auto h-20 w-20 rounded-full shadow-lg"
            />
            <h2 className="text-2xl font-extrabold text-slate-800">
              Hi! I'm Leo 🦁
            </h2>
            <p className="text-slate-500">
              Your personal English coach. Let's get to know each other first.
            </p>
            <button
              onClick={() => setScreen(2)}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700"
            >
              Let's go →
            </button>
          </div>
        )}

        {screen === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              What should I call you?
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What's your name?"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email? (for future reminders)"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setScreen(3)}
              disabled={!name.trim()}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {screen === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              How should you refer to me?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {NICKNAMES.map((n) => (
                <button
                  key={n.value}
                  onClick={() => setNickname(n.value)}
                  className={`rounded-xl border-2 py-3 font-semibold transition ${
                    nickname === n.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              You can always change this later by talking to me.
            </p>
            <button
              onClick={() => setScreen(4)}
              disabled={!nickname}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {screen === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              How should I speak to you?
            </h2>
            <div className="space-y-3">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPersonality(p.value)}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                    personality === p.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span>
                    <span className="block font-bold text-slate-800">
                      {p.value}
                    </span>
                    <span className="text-sm text-slate-500">{p.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              I'll always use a natural female voice — no robotic stuff, promise
              🎙️
            </p>
            <button
              onClick={finish}
              disabled={!personality}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start Learning →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
