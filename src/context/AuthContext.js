import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase, isLocalUserId } from '../services/supabase';
import { clearAllData, getProfile } from '../services/storage';
import { getGhostPlaySession } from '../services/ghostPlaySession';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
          return;
        }
        const ghost = await getGhostPlaySession();
        if (ghost?.ghostId) {
          setUser({ id: ghost.ghostId, email: ghost.email || '' });
          loadProfile(ghost.ghostId);
          return;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) { setLoading(true); loadProfile(u.id); }
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    try {
      if (isLocalUserId(userId)) {
        const local = await getProfile();
        setProfile(local ? { id: userId, ...local } : { id: userId });
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('[auth] loadProfile:', error.message || error);
        setProfile(null);
      } else {
        setProfile(data ?? null);
      }
    } catch (e) {
      console.warn('[auth] loadProfile threw:', e?.message || e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    if (Platform.OS === 'web') window.location.reload();
  }

  async function resetOnboarding() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      await supabase.from('profiles').update({
        profile_intake_complete: false,
        onboarding_complete: false,
        name: null,
        first_name: null,
        last_name: null,
        phone: null,
        date_of_birth: null,
        id_number_last4: null,
        avatar_style: {},
      }).eq('id', userId);

      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (
              k.startsWith('@vermillion/intake_complete/') ||
              k.startsWith('@vermillion/onboarding_complete/') ||
              k.startsWith('@vermillion/terms_accepted/')
            )) localStorage.removeItem(k);
          }
        } catch {}
      }

      // Refresh profile state without page reload — caller navigates to CompleteProfile
      await loadProfile(userId);
    } catch (_) {}
  }

  async function deleteAccount() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Reset registration flags FIRST — while RLS is still valid (before delete_user may kill the session).
      if (userId) {
        try {
          await supabase.from('profiles').update({
            profile_intake_complete: false,
            onboarding_complete: false,
            terms_accepted_at: null,
            terms_version: null,
          }).eq('id', userId);
        } catch (_) {}
      }

      // delete_user must run BEFORE clearAllData — clearAllData ends with signOut which kills the session
      try { await supabase.rpc('delete_user'); } catch (_) {}
      // Pass userId so clearAllData can clean up even if delete_user killed the session
      await clearAllData(userId);
    } finally {
      setUser(null);
      setProfile(null);
      if (Platform.OS === 'web') window.location.reload();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        deleteAccount,
        resetOnboarding,
        reloadProfile: () => user && loadProfile(user.id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
