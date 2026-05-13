'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// ─── Unified User Type (works for both Supabase & Local) ───
interface PharmaUser {
  id: string;
  email: string;
  displayName?: string;
  authMode: 'supabase' | 'local';
}

// ─── Auth mode type for explicit selection ───
type PreferredAuthMode = 'supabase' | 'local';

interface SignUpResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
  autoSignedIn?: boolean;
}

interface AuthContextType {
  user: PharmaUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  authMode: 'supabase' | 'local' | 'none';
  isSupabaseAvailable: boolean;
  signIn: (email: string, password: string, preferredMode?: PreferredAuthMode) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string, preferredMode?: PreferredAuthMode) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  authMode: 'none',
  isSupabaseAvailable: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

const LOCAL_USER_KEY = 'pharmainsight-local-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PharmaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'supabase' | 'local' | 'none'>('none');
  const supabaseAvailable = isSupabaseConfigured();

  // ─── Initialize Auth on mount ───
  useEffect(() => {
    let mounted = true;
    let supabaseSubscription: { unsubscribe: () => void } | null = null;

    async function initializeAuth() {
      // Check for existing local session first
      try {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.email) {
            if (mounted) {
              setUser(parsed);
              setAuthMode('local');
              setLoading(false);
              return;
            }
          }
        }
      } catch { /* ignore parse errors */ }

      // Try Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (mounted && currentSession?.user) {
              const supaUser = currentSession.user;
              setUser({
                id: supaUser.id,
                email: supaUser.email ?? '',
                displayName: supaUser.user_metadata?.display_name || '',
                authMode: 'supabase',
              });
              setAuthMode('supabase');
              setLoading(false);

              // Listen for auth state changes
              const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (_event, newSession) => {
                  if (mounted) {
                    if (newSession?.user) {
                      const u = newSession.user;
                      setUser({
                        id: u.id,
                        email: u.email ?? '',
                        displayName: u.user_metadata?.display_name || '',
                        authMode: 'supabase',
                      });
                      setAuthMode('supabase');
                    } else {
                      setUser(null);
                      setAuthMode('none');
                    }
                    setLoading(false);
                  }
                }
              );
              supabaseSubscription = subscription;
              return;
            }
          }
        } catch {
          // Supabase failed, fall through
        }
      }

      if (mounted) {
        setUser(null);
        setAuthMode('none');
        setLoading(false);
      }
    }

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      supabaseSubscription?.unsubscribe();
    };
  }, []);

  // ─── Sign In (supports both modes) ───
  const signIn = useCallback(async (
    email: string,
    password: string,
    preferredMode?: PreferredAuthMode
  ): Promise<{ error: string | null }> => {
    // Determine which auth mode to use
    const useSupabase = preferredMode === 'supabase' && isSupabaseConfigured();
    const useLocal = preferredMode === 'local' || !isSupabaseConfigured();

    // ─── Cloud Auth (Supabase) ───
    if (useSupabase) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email ?? email,
                displayName: session.user.user_metadata?.display_name || '',
                authMode: 'supabase',
              });
              setAuthMode('supabase');
              // Upsert user profile in Supabase (creates if missing, using actual schema)
              try {
                await supabase.from('user_profiles').upsert({
                  id: session.user.id,
                  full_name: session.user.user_metadata?.display_name || '',
                }, { onConflict: 'id' });
              } catch { /* profile upsert is non-critical */ }
            }
            return { error: null };
          }
          return { error: error.message };
        }
      } catch {
        return { error: 'Cloud auth is unreachable. Please check your connection or try Local Auth.' };
      }
    }

    // ─── Local Auth (SQLite) ───
    if (useLocal || preferredMode === 'local') {
      try {
        const res = await fetch('/api/auth/local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signin', email, password }),
        });
        const data = await res.json();

        if (data.error) {
          return { error: data.error };
        }

        const localUser: PharmaUser = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName || '',
          authMode: 'local',
        };
        setUser(localUser);
        setAuthMode('local');
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
        return { error: null };
      } catch {
        return { error: 'Local sign in failed. Please try again.' };
      }
    }

    return { error: 'No auth method available.' };
  }, []);

  // ─── Sign Up (supports both modes) ───
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string,
    preferredMode?: PreferredAuthMode
  ): Promise<{ error: string | null }> => {
    // Determine which auth mode to use
    const useSupabase = preferredMode === 'supabase' && isSupabaseConfigured();
    const useLocal = preferredMode === 'local' || !isSupabaseConfigured();

    // ─── Cloud Auth (Supabase) ───
    if (useSupabase) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName || undefined,
              },
            },
          });
          if (!error) {
            // Check if user was auto-confirmed (session returned immediately)
            if (data.session && data.user) {
              setUser({
                id: data.user.id,
                email: data.user.email ?? email,
                displayName: data.user.user_metadata?.display_name || '',
                authMode: 'supabase',
              });
              setAuthMode('supabase');
              // Create user profile in Supabase (using actual schema: id, full_name, institution)
              try {
                await supabase.from('user_profiles').upsert({
                  id: data.user.id,
                  full_name: displayName || data.user.user_metadata?.display_name || '',
                }, { onConflict: 'id' });
              } catch { /* profile create is non-critical */ }
              return { error: null, autoSignedIn: true };
            }
            // No session = email confirmation required
            // Still try to create profile if user object exists
            if (data.user) {
              try {
                await supabase.from('user_profiles').upsert({
                  id: data.user.id,
                  full_name: displayName || data.user.user_metadata?.display_name || '',
                }, { onConflict: 'id' });
              } catch { /* profile create is non-critical */ }
            }
            return { error: null, needsEmailConfirmation: true };
          }
          return { error: error.message };
        }
      } catch {
        return { error: 'Cloud auth is unreachable. Please check your connection or try Local Auth.' };
      }
    }

    // ─── Local Auth (SQLite) ───
    if (useLocal || preferredMode === 'local') {
      try {
        const res = await fetch('/api/auth/local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signup', email, password, displayName }),
        });
        const data = await res.json();

        if (data.error) {
          return { error: data.error };
        }

        // Auto sign in after local signup
        const localUser: PharmaUser = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName || '',
          authMode: 'local',
        };
        setUser(localUser);
        setAuthMode('local');
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
        return { error: null, autoSignedIn: true };
      } catch {
        return { error: 'Local sign up failed. Please try again.' };
      }
    }

    return { error: 'No auth method available.' };
  }, []);

  // ─── Sign Out ───
  const signOut = useCallback(async () => {
    // Clear local session
    localStorage.removeItem(LOCAL_USER_KEY);

    // Sign out from Supabase if active
    if (authMode === 'supabase') {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch { /* ignore */ }
    }

    setUser(null);
    setAuthMode('none');
  }, [authMode]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    authMode,
    isSupabaseAvailable: supabaseAvailable,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
export type { PreferredAuthMode, SignUpResult };
