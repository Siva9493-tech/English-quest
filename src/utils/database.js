// Data sync layer: Supabase as source of truth, localStorage as cache.
//
// Strategy
//   • Reads  : fetch from Supabase, then mirror into localStorage cache.
//              If the network/Supabase call fails, fall back to the cache.
//   • Writes : write to localStorage immediately (instant UX + offline) AND
//              push to Supabase. If the Supabase write fails (offline), the
//              record is queued in localStorage and flushed by syncPending()
//              the next time we're online.
//
// Expected Supabase schema (run once in the SQL editor):
//
//   create table sessions (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users not null,
//     data jsonb not null,
//     date text,
//     created_at timestamptz default now()
//   );
//
//   create table corrections (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users not null,
//     wrong text not null,
//     correct text,
//     date text,
//     created_at timestamptz default now()
//   );
//
//   -- enable RLS and add "user can manage own rows" policies on both tables.

import { supabase } from './supabase'
import { getCurrentUser } from './auth'

// Cache keys — kept identical to the legacy localStorage keys so existing
// data and offline reads keep working.
const CACHE = {
  sessions: 'ariaSessionHistory',
  corrections: 'ariaCorrections',
  pendingSessions: 'pendingSessions',
  pendingCorrections: 'pendingCorrections',
}

/* ───────────────────────────── helpers ───────────────────────────── */

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / serialization failures
  }
}

function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

/* ───────────────────────────── sessions ──────────────────────────── */

// Save a session. Writes to cache immediately, then to Supabase (or queues
// it for later if the write fails / we're offline).
export async function saveSession(sessionData) {
  const record = {
    ...sessionData,
    date: sessionData.date || new Date().toDateString(),
    timestamp: sessionData.timestamp || Date.now(),
  }

  // 1) localStorage (cache) — always, keep last 30.
  const cached = readCache(CACHE.sessions)
  cached.push(record)
  writeCache(CACHE.sessions, cached.slice(-30))

  // 2) Supabase — or queue if offline / unauthenticated / failed.
  const user = isOnline() ? await getCurrentUser() : null
  if (!user) {
    queueRecord(CACHE.pendingSessions, record)
    return { queued: true }
  }

  const { error } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, data: record, date: record.date })

  if (error) {
    queueRecord(CACHE.pendingSessions, record)
    return { queued: true, error }
  }
  return { queued: false }
}

// Read sessions: Supabase first (then cache it); fall back to cache offline.
export async function getSessions() {
  const user = isOnline() ? await getCurrentUser() : null
  if (!user) return readCache(CACHE.sessions)

  const { data, error } = await supabase
    .from('sessions')
    .select('data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error || !data) return readCache(CACHE.sessions)

  const sessions = data.map((row) => row.data)
  writeCache(CACHE.sessions, sessions.slice(-30))
  return sessions
}

/* ─────────────────────────── corrections ─────────────────────────── */

// Save a correction. Cache immediately, then Supabase (or queue).
export async function saveCorrection(wrong, correct) {
  const record = {
    wrong,
    correct,
    date: new Date().toDateString(),
    count: 1,
  }

  // 1) localStorage (cache) — keep last 50.
  const cached = readCache(CACHE.corrections)
  cached.push(record)
  writeCache(CACHE.corrections, cached.slice(-50))

  // 2) Supabase — or queue.
  const user = isOnline() ? await getCurrentUser() : null
  if (!user) {
    queueRecord(CACHE.pendingCorrections, record)
    return { queued: true }
  }

  const { error } = await supabase.from('corrections').insert({
    user_id: user.id,
    wrong,
    correct,
    date: record.date,
  })

  if (error) {
    queueRecord(CACHE.pendingCorrections, record)
    return { queued: true, error }
  }
  return { queued: false }
}

// Read corrections: Supabase first (then cache it); cache fallback offline.
export async function getCorrections() {
  const user = isOnline() ? await getCurrentUser() : null
  if (!user) return readCache(CACHE.corrections)

  const { data, error } = await supabase
    .from('corrections')
    .select('wrong, correct, date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error || !data) return readCache(CACHE.corrections)

  writeCache(CACHE.corrections, data.slice(-50))
  return data
}

/* ─────────────────────── offline write queue ─────────────────────── */

function queueRecord(key, record) {
  const queue = readCache(key)
  queue.push(record)
  writeCache(key, queue)
}

// Flush any records queued while offline up to Supabase. Safe to call often
// (e.g. on the window "online" event or on app start). No-op if signed out
// or there's nothing pending.
export async function syncPending() {
  if (!isOnline()) return
  const user = await getCurrentUser()
  if (!user) return

  const pendingSessions = readCache(CACHE.pendingSessions)
  if (pendingSessions.length > 0) {
    const rows = pendingSessions.map((r) => ({
      user_id: user.id,
      data: r,
      date: r.date,
    }))
    const { error } = await supabase.from('sessions').insert(rows)
    if (!error) writeCache(CACHE.pendingSessions, [])
  }

  const pendingCorrections = readCache(CACHE.pendingCorrections)
  if (pendingCorrections.length > 0) {
    const rows = pendingCorrections.map((r) => ({
      user_id: user.id,
      wrong: r.wrong,
      correct: r.correct,
      date: r.date,
    }))
    const { error } = await supabase.from('corrections').insert(rows)
    if (!error) writeCache(CACHE.pendingCorrections, [])
  }
}

// Register an auto-sync listener that flushes the queue when connectivity
// returns. Returns a cleanup function.
export function registerAutoSync() {
  const handler = () => syncPending()
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
