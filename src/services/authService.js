import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// ─── החלף את זה ──────────────────────────────────────────
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID'; // Google Cloud Console → OAuth 2.0 Client IDs → Web client ID
// ──────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const redirectUrl = AuthSession.makeRedirectUri({ useProxy: true });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'success') {
    const url = result.url;
    const params = new URLSearchParams(url.split('#')[1]);
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      const { data: session, error: sessionError } = await supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return session;
    }
  }

  throw new Error('Google sign-in cancelled');
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return subscription;
}
