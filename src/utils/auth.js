// Authentication helpers wrapping Supabase Auth.
//
// Every function resolves to { data, error } (Supabase's shape) so callers
// can branch on `error` without try/catch. Profile metadata (name, etc.) is
// stored in the user's `user_metadata` via the `data` option on sign-up and
// `updateUser`.

import { supabase } from './supabase'

// Create a new account. `userData` is an object of profile fields
// (e.g. { name, level, accent }) saved to the user's metadata.
export async function signUp(email, password, userData = {}) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  })
}

// Sign in with email + password.
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Sign in with Google OAuth. Redirects the browser to Google, then back to
// the app root once authenticated. Supabase must have the Google provider
// enabled in the project's Auth settings.
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
}

// Sign the current user out and clear the local session.
export async function signOut() {
  return supabase.auth.signOut()
}

// Return the currently authenticated user, or null if there's no session.
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data?.user ?? null
}

// Get the active session (contains access token + user). Null if signed out.
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

// Update the signed-in user's profile metadata.
// `data` is merged into existing user_metadata by Supabase.
export async function updateUserProfile(data) {
  return supabase.auth.updateUser({ data })
}

// Subscribe to auth state changes (login / logout / token refresh).
// Returns the subscription so callers can unsubscribe on cleanup.
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session)
  })
  return data.subscription
}
