import { useState, useEffect } from 'react';
import { getStats, getModuleStats, getStreak } from '../utils/progress';
import { getAriaMemory } from '../components/Pandu/AriaMemory';
import { getSessionHistory } from '../components/Pandu/SpeechAnalyzer';
import { getCorrections, getPanduUser } from '../components/Pandu/PanduMemory';
import { getUserAccent, setUserAccent } from '../components/Pandu/AccentTrainer';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [memory, setMemory] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [moduleStats, setModuleStats] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setStats(getStats());
    setMemory(getAriaMemory());
    setSessions(getSessionHistory());
    setCorrections(getCorrections());
    setModuleStats(getModuleStats());
  }, []);

  const userData = getPanduUser();
  const accent = getUserAccent();

  // Build calendar heatmap data (last 30 days)
  const getHeatmapData = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toDateString();
      const session = sessions.find(
        s => s.date === dateStr
      );
      days.push({
        date: dateStr,
        dayLabel: date.toLocaleDateString('en',
          { weekday: 'short' }),
        dateLabel: date.getDate(),
        hasSession: !!session,
        grade: session?.fluencyGrade?.grade || null,
        quality: session?.avgQuality || 0,
      });
    }
    return days;
  };

  // Get top mistakes
  const getTopMistakes = () => {
    const counts = {};
    corrections.forEach(c => {
      if (c.wrong) {
        counts[c.wrong] = (counts[c.wrong] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
  };

  // Get weekly XP trend (last 7 sessions)
  const getWeeklyTrend = () => {
    return sessions
      .slice(-7)
      .map((s, i) => ({
        label: `S${i + 1}`,
        quality: s.avgQuality || 0,
        words: s.totalWords || 0,
        grade: s.fluencyGrade?.grade || 'N/A',
      }));
  };

  const heatmap = getHeatmapData();
  const topMistakes = getTopMistakes();
  const weeklyTrend = getWeeklyTrend();

  const totalModulesDone = moduleStats.filter(
    m => m.isComplete
  ).length;
  const totalModules = moduleStats.length;

  return (
    <div style={{
      padding: '24px 20px',
      maxWidth: '900px',
      margin: '0 auto',
    }}>

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{
          color: 'var(--color-cyan)',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.1em',
          margin: '0 0 6px',
        }}>
          📊 YOUR JOURNEY
        </p>
        <h1 style={{
          color: 'var(--text-primary)',
          fontSize: '28px',
          fontWeight: '900',
          margin: '0 0 4px',
        }}>
          Analytics
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '14px',
          margin: 0,
        }}>
          {userData?.name}'s English Quest progress
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {[
          { id: 'overview', label: '🏠 Overview' },
          { id: 'aria', label: '🎙️ Aria Sessions' },
          { id: 'modules', label: '🗺️ Modules' },
          { id: 'mistakes', label: '💡 Corrections' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: `1px solid ${
                activeTab === tab.id
                  ? 'var(--color-cyan)'
                  : 'var(--border-glow)'
              }`,
              background: activeTab === tab.id
                ? 'rgba(0,229,255,0.15)'
                : 'var(--bg-surface)',
              color: activeTab === tab.id
                ? 'var(--color-cyan)'
                : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div>
          {/* Big Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {[
              {
                icon: '⭐',
                value: stats?.earnedXp || 0,
                label: 'Total XP',
                color: 'var(--color-gold)',
              },
              {
                icon: '🔥',
                value: getStreak(),
                label: 'Day Streak',
                color: '#ff6b35',
              },
              {
                icon: '🎙️',
                value: (memory?.totalSessions || sessions.length || 0),
                label: 'Aria Sessions',
                color: 'var(--color-cyan)',
              },
              {
                icon: '💬',
                value: (memory?.totalWords || sessions.reduce(
                  (sum, s) => sum + (s.totalWords || 0), 0
                )),
                label: 'Words Spoken',
                color: 'var(--color-purple)',
              },
              {
                icon: '🗺️',
                value: `${totalModulesDone}/${totalModules}`,
                label: 'Modules Done',
                color: '#22c55e',
              },
              {
                icon: accent === 'british' ? '🇬🇧' : '🇺🇸',
                value: accent === 'british'
                  ? 'British' : 'American',
                label: 'Accent Mode',
                color: 'var(--color-pink)',
              },
            ].map((stat, i) => (
              <div key={i} className="cyber-card" style={{
                padding: '16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>
                  {stat.icon}
                </div>
                <div style={{
                  color: stat.color,
                  fontSize: '22px',
                  fontWeight: '900',
                  marginBottom: '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* 30-Day Activity Heatmap */}
          <div className="cyber-card" style={{
            padding: '20px',
            marginBottom: '20px',
          }}>
            <p style={{
              color: 'var(--color-cyan)',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              margin: '0 0 16px',
            }}>
              📅 30-DAY ACTIVITY
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '4px',
            }}>
              {heatmap.map((day, i) => (
                <div
                  key={i}
                  title={`${day.date}${day.hasSession ? ` — Grade ${day.grade}` : ' — No session'}`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '4px',
                    background: day.hasSession
                      ? day.quality >= 80
                        ? 'rgba(34, 197, 94, 0.8)'
                        : day.quality >= 60
                        ? 'rgba(0, 229, 255, 0.6)'
                        : 'rgba(255, 215, 0, 0.5)'
                      : 'var(--bg-surface)',
                    border: '1px solid var(--border-glow)',
                    cursor: 'default',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e =>
                    e.target.style.transform = 'scale(1.3)'
                  }
                  onMouseLeave={e =>
                    e.target.style.transform = 'scale(1)'
                  }
                />
              ))}
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              <span>
                <span style={{
                  display: 'inline-block',
                  width: '10px', height: '10px',
                  borderRadius: '2px',
                  background: 'rgba(34,197,94,0.8)',
                  marginRight: '4px',
                }}/>
                Excellent (A)
              </span>
              <span>
                <span style={{
                  display: 'inline-block',
                  width: '10px', height: '10px',
                  borderRadius: '2px',
                  background: 'rgba(0,229,255,0.6)',
                  marginRight: '4px',
                }}/>
                Good (B)
              </span>
              <span>
                <span style={{
                  display: 'inline-block',
                  width: '10px', height: '10px',
                  borderRadius: '2px',
                  background: 'rgba(255,215,0,0.5)',
                  marginRight: '4px',
                }}/>
                Practice more (C/D)
              </span>
            </div>
          </div>

          {/* Strong vs Weak Areas */}
          {memory && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div className="cyber-card" style={{ padding: '16px' }}>
                <p style={{
                  color: '#22c55e',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  margin: '0 0 12px',
                }}>
                  ✅ STRONG AREAS
                </p>
                {(memory.strongAreas?.length > 0)
                  ? memory.strongAreas.map((area, i) => (
                    <div key={i} style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      🌟 {area}
                    </div>
                  ))
                  : <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '13px'
                    }}>
                      Complete more sessions to unlock!
                    </p>
                }
              </div>
              <div className="cyber-card" style={{ padding: '16px' }}>
                <p style={{
                  color: '#ff006e',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  margin: '0 0 12px',
                }}>
                  📝 FOCUS AREAS
                </p>
                {(memory.weakAreas?.length > 0)
                  ? memory.weakAreas.map((area, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,0,110,0.1)',
                      border: '1px solid rgba(255,0,110,0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      🎯 {area}
                    </div>
                  ))
                  : <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '13px'
                    }}>
                      Complete more sessions to unlock!
                    </p>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ARIA SESSIONS TAB ── */}
      {activeTab === 'aria' && (
        <div>
          {/* Weekly Quality Trend */}
          {weeklyTrend.length > 0 && (
            <div className="cyber-card" style={{
              padding: '20px',
              marginBottom: '20px',
            }}>
              <p style={{
                color: 'var(--color-cyan)',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                margin: '0 0 16px',
              }}>
                📈 QUALITY TREND (LAST 7 SESSIONS)
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '100px',
              }}>
                {weeklyTrend.map((s, i) => (
                  <div key={i} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '10px',
                    }}>
                      {s.quality}%
                    </span>
                    <div style={{
                      width: '100%',
                      height: `${s.quality}px`,
                      background: s.quality >= 80
                        ? 'linear-gradient(180deg, #22c55e, rgba(34,197,94,0.3))'
                        : s.quality >= 60
                        ? 'linear-gradient(180deg, var(--color-cyan), rgba(0,229,255,0.3))'
                        : 'linear-gradient(180deg, #ffd700, rgba(255,215,0,0.3))',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                    }}/>
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '10px',
                    }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions List */}
          <div className="cyber-card" style={{ padding: '20px' }}>
            <p style={{
              color: 'var(--color-cyan)',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              margin: '0 0 16px',
            }}>
              🕐 RECENT SESSIONS
            </p>
            {sessions.length === 0 ? (
              <p style={{
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '20px 0',
              }}>
                No sessions yet — tap Aria to start! 🎙️
              </p>
            ) : (
              sessions.slice().reverse().slice(0, 10).map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < 9
                    ? '1px solid var(--border-glow)'
                    : 'none',
                }}>
                  <div>
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '2px',
                    }}>
                      {s.date}
                    </div>
                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                    }}>
                      {s.duration}min • {s.totalWords} words • {s.exchanges} exchanges
                    </div>
                  </div>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: s.fluencyGrade?.grade === 'A'
                      ? 'rgba(34,197,94,0.2)'
                      : s.fluencyGrade?.grade === 'B'
                      ? 'rgba(0,229,255,0.2)'
                      : 'rgba(255,215,0,0.2)',
                    border: `2px solid ${
                      s.fluencyGrade?.grade === 'A' ? '#22c55e'
                      : s.fluencyGrade?.grade === 'B' ? 'var(--color-cyan)'
                      : '#ffd700'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '16px',
                    color: 'var(--text-primary)',
                  }}>
                    {s.fluencyGrade?.grade || '?'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODULES TAB ── */}
      {activeTab === 'modules' && (
        <div>
          {moduleStats.map((mod, i) => (
            <div key={i} className="cyber-card" style={{
              padding: '16px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{
                width: '40px', height: '40px',
                borderRadius: '50%',
                background: mod.isComplete
                  ? 'rgba(34,197,94,0.2)'
                  : mod.percent > 0
                  ? 'rgba(0,229,255,0.15)'
                  : 'var(--bg-surface)',
                border: `2px solid ${
                  mod.isComplete ? '#22c55e'
                  : mod.percent > 0 ? 'var(--color-cyan)'
                  : 'var(--border-glow)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}>
                {mod.isComplete ? '✅'
                  : mod.locked ? '🔒'
                  : mod.percent > 0 ? '⚡'
                  : '○'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: '700',
                  marginBottom: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {mod.title}
                </div>
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '999px',
                  height: '6px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${mod.percent || 0}%`,
                    height: '100%',
                    background: mod.isComplete
                      ? '#22c55e'
                      : 'linear-gradient(90deg, var(--color-cyan), var(--color-purple))',
                    transition: 'width 0.8s ease',
                  }}/>
                </div>
              </div>
              <div style={{
                color: mod.isComplete
                  ? '#22c55e' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: '700',
                flexShrink: 0,
              }}>
                {mod.percent || 0}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CORRECTIONS TAB ── */}
      {activeTab === 'mistakes' && (
        <div>
          <div className="cyber-card" style={{
            padding: '20px',
            marginBottom: '16px',
          }}>
            <p style={{
              color: 'var(--color-cyan)',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              margin: '0 0 16px',
            }}>
              🏆 TOP CORRECTIONS TO PRACTICE
            </p>
            {topMistakes.length === 0 ? (
              <p style={{
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '20px 0',
              }}>
                No corrections recorded yet!
                Start chatting with Aria 🎙️
              </p>
            ) : (
              topMistakes.map((m, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '10px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <span style={{
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255,0,110,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '900',
                      color: '#ff006e',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      "{m.word}"
                    </span>
                  </div>
                  <span style={{
                    background: 'rgba(255,0,110,0.15)',
                    border: '1px solid rgba(255,0,110,0.3)',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#ff006e',
                    fontWeight: '700',
                  }}>
                    {m.count}x
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Total corrections stat */}
          <div className="cyber-card" style={{
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: '900',
              color: 'var(--color-cyan)',
            }}>
              {corrections.length}
            </div>
            <div style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}>
              Total corrections received from Aria
            </div>
            <div style={{
              color: 'var(--text-muted)',
              fontSize: '12px',
              marginTop: '4px',
            }}>
              Every correction = one step closer to fluency 💪
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
