import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { clearAllData } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
        else setLoading(false);
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

  async function deleteAccount() {
    try {
      // delete_user must run BEFORE clearAllData — clearAllData calls signOut which kills the session
      try { await supabase.rpc('delete_user'); } catch (_) {}
      await clearAllData();
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
