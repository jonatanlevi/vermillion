import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── החלף את שני הערכים האלה ─────────────────────────────
const SUPABASE_URL  = 'YOUR_SUPABASE_URL';   // Settings → API → Project URL
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY'; // Settings → API → anon public
// ──────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
