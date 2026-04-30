import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google via Supabase OAuth.
 * Web:    Supabase handles the full redirect inside the browser.
 * Native: We open Supabase's auth URL inside an in-app browser, then
 *         exchange the returned `code` for a Supabase session.
 *
 * Required Supabase Dashboard setup (Auth → URL Configuration):
 *   Site URL:        production origin (e.g. https://your-app.vercel.app)
 *   Redirect URLs:   same origin, http://localhost:8081, http://localhost:19006,
 *                    vermillion://** (Expo native)
 *
 * Required Google Cloud Console (OAuth client) — Authorized redirect URIs:
 *   https://eevmgafxfghygdaucqad.supabase.co/auth/v1/callback
 */
export async function signInWithGoogle() {
  const redirectTo =
    Platform.OS === 'web'
      ? window.location.origin
      : Linking.createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) throw error;

  if (Platform.OS === 'web') {
    return; // Supabase already redirected the browser
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in cancelled');
  }

  // PKCE flow: exchange the `code` query param for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
  if (exchangeError) throw exchangeError;
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
    .maybeSingle();
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
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
    callback(session?.user ?? null);
  });
  return subscription;
}
