// Authentication helpers wrapping Supabase Auth.
//
// Every function resolves to { data, error } (Supabase's shape) so callers
// can branch on `error` without try/catch. Profile metadata (name, etc.) is
// stored in the user's `user_metadata` via the `data` option on sign-up and
// `updateUser`.

import { supabase } from './supabase'

// When Supabase isn't configured (null client), auth is unavailable — surface a
// consistent { data, error } shape so callers don't crash.
const noClientError = {
  data: { user: null, session: null },
  error: new Error('Supabase not configured'),
}

// Create a new account. `userData` is an object of profile fields
// (e.g. { name, level, accent }) saved to the user's metadata.
export async function signUp(email, password, userData = {}) {
  if (!supabase) return noClientError

  try {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    })
    if (signUpError) throw signUpError

    // Auto sign in immediately after a successful sign-up so the user lands
    // in an authenticated session without a second manual step. (If the
    // project requires email confirmation this will return an error, which
    // we surface to the caller.)
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError

    return { data, error: null }
  } catch (error) {
    return { data: { user: null, session: null }, error }
  }
}

// Sign in with email + password.
export async function signIn(email, password) {
  if (!supabase) return noClientError
  return supabase.auth.signInWithPassword({ email, password })
}

// Sign in with Google OAuth. Redirects the browser to Google, then back to
// the app root once authenticated. Supabase must have the Google provider
// enabled in the project's Auth settings.
export async function signInWithGoogle() {
  if (!supabase) return noClientError
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
}

// Sign the current user out and clear the local session.
export async function signOut() {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}

// Return the currently authenticated user, or null if there's no session.
export async function getCurrentUser() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data?.user ?? null
}

// Get the active session (contains access token + user). Null if signed out.
export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

// Update the signed-in user's profile metadata.
// `data` is merged into existing user_metadata by Supabase.
export async function updateUserProfile(data) {
  if (!supabase) return noClientError
  return supabase.auth.updateUser({ data })
}

// Subscribe to auth state changes (login / logout / token refresh).
// Returns the subscription so callers can unsubscribe on cleanup.
export function onAuthStateChange(callback) {
  // No client → no auth events; return a no-op subscription so cleanup is safe.
  if (!supabase) return { unsubscribe() {} }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session)
  })
  return data.subscription
}
