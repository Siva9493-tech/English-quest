import modules from '../data/modules'

const COMPLETED_VIDEOS_KEY = 'completedVideos'
const STREAK_KEY = 'streak'
const LAST_ACTIVE_KEY = 'lastActiveDate'
const XP_PER_VIDEO = 10

// Local date as YYYY-MM-DD (avoids UTC off-by-one from toISOString()).
function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayKey() {
  return dateKey(new Date())
}

function yesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

// Called when a video is completed. Updates streak based on lastActiveDate:
// yesterday -> +1, today -> unchanged, older/none -> reset to 1.
function recordActivity() {
  const today = todayKey()
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY)
  let streak = getStreak()

  if (lastActive === today) {
    // already counted today; leave streak as-is
  } else if (lastActive === yesterdayKey()) {
    streak += 1
  } else {
    streak = 1
  }

  try {
    localStorage.setItem(STREAK_KEY, String(streak))
    localStorage.setItem(LAST_ACTIVE_KEY, today)
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
  return streak
}

export function videoKey(subTopicId, videoId) {
  return `${subTopicId}_${videoId}`
}

export function getCompletedVideoIds() {
  try {
    const raw = localStorage.getItem(COMPLETED_VIDEOS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveCompletedVideoIds(set) {
  try {
    localStorage.setItem(COMPLETED_VIDEOS_KEY, JSON.stringify([...set]))
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}

export function getStreak() {
  const raw = Number(localStorage.getItem(STREAK_KEY))
  return Number.isFinite(raw) && raw > 0 ? raw : 0
}

export function hasWatched(subtopicId, videoId) {
  try {
    return localStorage.getItem(`watched_${subtopicId}_${videoId}`) === 'true'
  } catch {
    return false
  }
}

export function getWatchStartTime(subtopicId, videoId) {
  try {
    const val = localStorage.getItem(`watchStart_${subtopicId}_${videoId}`)
    return val ? parseInt(val) : null
  } catch {
    return null
  }
}

export function isVideoCompleted(subTopicId, videoId, completedSet) {
  const set = completedSet ?? getCompletedVideoIds()
  return set.has(videoKey(subTopicId, videoId))
}

export function isSubtopicFullyCompleted(subTopic, completedSet) {
  const set = completedSet ?? getCompletedVideoIds()
  return (
    subTopic.videos.length > 0 &&
    subTopic.videos.every((v) => set.has(videoKey(subTopic.id, v.id)))
  )
}

// Toggle a single video's completion. Returns { completed, subtopicNowComplete }.
export function toggleVideo(subTopicId, videoId) {
  const set = getCompletedVideoIds()
  const key = videoKey(subTopicId, videoId)
  let completed
  if (set.has(key)) {
    set.delete(key)
    completed = false
  } else {
    set.add(key)
    completed = true
  }
  saveCompletedVideoIds(set)

  if (completed) recordActivity()

  const subTopic = findSubTopic(subTopicId)
  const subtopicNowComplete = subTopic
    ? isSubtopicFullyCompleted(subTopic, set)
    : false

  return { completed, subtopicNowComplete }
}

function findSubTopic(subTopicId) {
  for (const m of modules) {
    const s = m.subTopics.find((x) => x.id === subTopicId)
    if (s) return s
  }
  return null
}

export function getSubTopic(subTopicId) {
  for (const m of modules) {
    const s = m.subTopics.find((x) => x.id === subTopicId)
    if (s) return { ...s, moduleId: m.id, moduleTitle: m.title }
  }
  return null
}

export function getAllVideos() {
  return modules.flatMap((m) =>
    m.subTopics.flatMap((s) =>
      s.videos.map((v) => ({ ...v, subTopicId: s.id })),
    ),
  )
}

export function getModuleDetail(moduleId) {
  const module = modules.find((m) => m.id === moduleId)
  if (!module) return null
  const completed = getCompletedVideoIds()
  return {
    id: module.id,
    title: module.title,
    subTopics: module.subTopics.map((s) => ({
      ...s,
      videos: s.videos.map((v) => ({
        ...v,
        completed: completed.has(videoKey(s.id, v.id)),
      })),
      isFullyCompleted: isSubtopicFullyCompleted(s, completed),
    })),
  }
}

export function getModuleStats() {
  const completed = getCompletedVideoIds()
  let prevHalfDone = true

  return modules.map((m) => {
    const total = m.subTopics.length
    const done = m.subTopics.filter((s) =>
      isSubtopicFullyCompleted(s, completed),
    ).length
    const percent = total > 0 ? done / total : 0
    const isComplete = total > 0 && done === total
    const locked = !prevHalfDone
    prevHalfDone = percent >= 0.5

    return {
      id: m.id,
      title: m.title,
      done,
      total,
      percent: Math.round(percent * 100),
      isComplete,
      locked,
    }
  })
}

// The Capstone Module unlocks only once every one of the 14 modules is at 100%.
export function isCapstoneUnlocked() {
  const moduleStats = getModuleStats()
  return moduleStats.every((m) => m.isComplete)
}

export function getStats() {
  const completed = getCompletedVideoIds()
  const allVideos = getAllVideos()
  const totalXp = allVideos.length * XP_PER_VIDEO
  const earnedVideos = allVideos.filter((v) =>
    completed.has(videoKey(v.subTopicId, v.id)),
  ).length
  const earnedXp = earnedVideos * XP_PER_VIDEO

  const allSubTopics = modules.flatMap((m) =>
    m.subTopics.map((s) => ({ ...s, moduleId: m.id, moduleTitle: m.title })),
  )
  const completedCount = allSubTopics.filter((s) =>
    isSubtopicFullyCompleted(s, completed),
  ).length
  const nextSubTopic =
    allSubTopics.find((s) => !isSubtopicFullyCompleted(s, completed)) ?? null

  return {
    totalXp,
    earnedXp,
    completedCount,
    totalCount: allSubTopics.length,
    nextSubTopic,
    watchedVideosCount: countWatchedVideos(),
  }
}

function countWatchedVideos() {
  try {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        key.startsWith('watched_') &&
        localStorage.getItem(key) === 'true'
      ) {
        count += 1
      }
    }
    return count
  } catch {
    return 0
  }
}

const BADGES = [
  { id: 'first-step', label: 'First Step', emoji: '🎯', threshold: 1 },
  { id: 'week-warrior', label: 'Week Warrior', emoji: '⚔️', threshold: 5 },
  { id: 'halfway-hero', label: 'Halfway Hero', emoji: '🦸', threshold: 38 },
  { id: 'english-boss', label: 'English Boss', emoji: '👑', threshold: 76 },
]

export function getBadges() {
  const completed = getCompletedVideoIds()
  const completedCount = modules.reduce(
    (sum, m) =>
      sum +
      m.subTopics.filter((s) => isSubtopicFullyCompleted(s, completed)).length,
    0,
  )

  return BADGES.map((b) => ({
    ...b,
    unlocked: completedCount >= b.threshold,
  }))
}
