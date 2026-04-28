import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    '[supabase] Missing env vars — set EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env then restart Expo.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType:           'pkce',
  },
});

export async function getOrCreateUser() {
  const { data: { session } } = await supabase.auth.getSession();
  let user = session?.user;
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    user = data.user;
  }
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!existing) {
    await supabase.from('profiles').insert({ id: user.id });
  }
  return user;
}
