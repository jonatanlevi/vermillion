import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const LOCAL_USER_KEY = '@vermillion/local_user_id';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    '[supabase] Missing env vars — set EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env then restart Expo.'
  );
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON || '', {
  auth: {
    storage:            Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: Platform.OS === 'web',
    // Web OAuth (Vercel / SPA): Supabase returns ?code=… — PKCE is required. Implicit flow breaks login.
    flowType:           'pkce',
  },
});

export function isGhostUserId(id) {
  return typeof id === 'string' && id.startsWith('ghost_');
}

export function isLocalUserId(id) {
  return (typeof id === 'string' && id.startsWith('local_')) || isGhostUserId(id);
}

async function readLocalUserId() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(LOCAL_USER_KEY);
  }
  return AsyncStorage.getItem(LOCAL_USER_KEY);
}

async function writeLocalUserId(id) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_USER_KEY, id);
    return;
  }
  await AsyncStorage.setItem(LOCAL_USER_KEY, id);
}

/** Clears device-local fallback identity (used when Supabase auth is unavailable). */
export async function clearDeviceLocalIdentity() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(LOCAL_USER_KEY);
    return;
  }
  await AsyncStorage.removeItem(LOCAL_USER_KEY);
}

async function ensureProfileExists(user) {
  const userId = user?.id;
  if (!userId || isLocalUserId(userId)) return;
  try {
    const payload = { id: userId };
    if (user?.email) payload.email = user.email;
    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  } catch (e) {
    console.warn('[supabase] ensureProfileExists:', e?.message || e);
  }
}

async function getOrCreateLocalUserOnly() {
  let lid = await readLocalUserId();
  if (!lid) {
    lid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await writeLocalUserId(lid);
  }
  return { id: lid };
}

export async function getOrCreateUser() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return getOrCreateLocalUserOnly();
  }

  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    let user = session?.user;
    if (user) {
      await ensureProfileExists(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    user = data?.user;
    if (!user) throw new Error('Anonymous sign-in returned no user');

    await ensureProfileExists(user);
    return user;
  } catch (e) {
    console.warn(
      '[supabase] Remote session unavailable — using on-device profile. ' +
        'Enable Anonymous sign-in in Supabase Auth if you want cloud sync.',
      e?.message || e
    );
    return getOrCreateLocalUserOnly();
  }
}
