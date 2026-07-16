'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { PermissionMap } from '@/lib/permissions';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  role: 'admin' | 'user';
  is_approved: boolean;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at?: string;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  permissions: PermissionMap | null;
  loading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  permissions: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshPermissions: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (data) {
      setProfile(data as UserProfile);
    } else {
      setProfile(null);
    }
  }, []);

  const fetchPermissions = useCallback(async (uid: string, role: string) => {
    if (role === 'admin') {
      setPermissions(null);
      return;
    }
    const { data } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', uid);
    if (data) {
      const map: PermissionMap = {};
      for (const p of data) {
        map[p.module_key] = p as any;
      }
      setPermissions(map);
    } else {
      setPermissions({});
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setPermissions(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchPermissions(profile.id, profile.role);
    } else {
      setPermissions(null);
    }
  }, [profile, fetchPermissions]);

  const signIn = async (emailOrUsername: string, password: string) => {
    const input = emailOrUsername.trim();

    let email = input;
    if (!input.includes('@')) {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('username', input)
        .maybeSingle();
      if (profileRow?.email) {
        email = profileRow.email;
      } else {
        return { error: 'Kullanıcı adı veya e-posta bulunamadı.' };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }

    (async () => {
      await supabase.rpc('update_last_login');
      await supabase.rpc('log_activity', {
        p_action: 'Giriş',
        p_module: 'auth',
        p_details: `Kullanıcı giriş yaptı: ${email}`,
      });
    })();

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    (async () => {
      await supabase.rpc('log_activity', {
        p_action: 'Çıkış',
        p_module: 'auth',
        p_details: 'Kullanıcı çıkış yaptı',
      });
    })();
    await supabase.auth.signOut();
    setProfile(null);
    setPermissions(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const refreshPermissions = async () => {
    if (profile) {
      await fetchPermissions(profile.id, profile.role);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, permissions, loading, signIn, signUp, signOut, refreshProfile, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
