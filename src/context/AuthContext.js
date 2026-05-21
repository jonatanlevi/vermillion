import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { supabase, isLocalUserId } from '../services/supabase';
import { clearAllData, getProfile } from '../services/storage';
import { getGhostPlaySession } from '../services/ghostPlaySession';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadingForRef         = useRef(null);

  useEffect(() => {
    let settled = false;

    // Safety net: if getSession() hangs (e.g. Brave Android after account deletion),
    // force setLoading(false) after 5 s so the app never stays on a black screen.
    const bail = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); }
    }, 5000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(bail);
        settled = true;
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
      .catch(() => { clearTimeout(bail); settled = true; setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' && settled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Only set loading=true if a profile fetch isn't already in progress.
        // If loadingForRef already holds this userId, loadProfile will return early
        // without calling setLoading(false) — leaving the app stuck on the spinner.
        if (loadingForRef.current !== u.id) setLoading(true);
        loadProfile(u.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => { clearTimeout(bail); subscription.unsubscribe(); };
  }, []);

  async function loadProfile(userId) {
    if (loadingForRef.current === userId) return;
    loadingForRef.current = userId;
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
      if (loadingForRef.current === userId) loadingForRef.current = null;
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
      if (Platform.OS === 'web') {
        // Strip any stale OAuth params (code, token) from the URL before reload
        // to prevent Supabase PKCE exchange from hanging on the next page load.
        try {
          const clean = new URL(window.location.href);
          ['code', 'access_token', 'refresh_token', 'token_type', 'expires_in'].forEach(p => clean.searchParams.delete(p));
          clean.hash = '';
          window.history.replaceState({}, '', clean.toString());
        } catch (_) {}
        window.location.reload();
      }
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
