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
// (e.g. { name, nickname, personality, accent }) saved to the users table.
export async function signUp(email, password, userData) {
  if (!supabase) throw new Error('Supabase not configured');

  // Supabase requires password minimum 6 chars
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const { data, error: signUpError } = await
    supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

  if (signUpError) {
    // Supabase returns 422 "User already registered" when the email exists.
    // Surface a clear, actionable message instead of the raw error.
    const msg = signUpError.message || '';
    if (
      signUpError.status === 422 ||
      signUpError.code === 'user_already_exists' ||
      /already registered|already exists/i.test(msg)
    ) {
      throw new Error('This email is already registered. Please sign in instead.');
    }
    throw signUpError;
  }
  if (!data.user) throw new Error('Signup failed');

  // Save extra user data to users table
  try {
    await supabase.from('users').upsert({
      id: data.user.id,
      email: email.trim(),
      name: userData?.name || '',
      nickname: userData?.nickname || '',
      personality: userData?.personality || 'Friendly & Warm',
      accent: userData?.accent || 'american',
      created_at: new Date().toISOString(),
    });
  } catch(e) {
    console.warn('Could not save user profile:', e);
  }

  // Auto sign in after signup
  const { error: signInError } = await
    supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

  if (signInError) throw signInError;

  return data.user;
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
