import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'customer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role as AppRole | null;
    } catch (e) {
      console.error('Error in fetchUserRole:', e);
      return null;
    }
  };

  const ensureUserExists = async (authUser: User) => {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('id', authUser.id)
        .maybeSingle();

      const metadata = authUser.user_metadata || {};
      const firstName = metadata.first_name || null;
      const lastName = metadata.last_name || null;

      if (!existingUser) {
        // Create user with customer role and name from metadata
        const { error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            role: 'customer',
            first_name: firstName,
            last_name: lastName,
          });
        
        if (error) {
          console.error('Error creating user:', error);
        }
      } else if (firstName && lastName && !existingUser.first_name && !existingUser.last_name) {
        // Update existing user if name is missing but available in metadata
        await supabase
          .from('users')
          .update({ first_name: firstName, last_name: lastName })
          .eq('id', authUser.id);
      }
    } catch (e) {
      console.error('Error in ensureUserExists:', e);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching and user creation with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            await ensureUserExists(session.user);
            const userRole = await fetchUserRole(session.user.id);
            setRole(userRole || 'customer');
          }, 0);
        } else {
          setRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          ensureUserExists(session.user).then(() => {
            fetchUserRole(session.user.id).then(r => setRole(r || 'customer'));
          }).catch((e) => console.error('ensureUserExists failed:', e));
        }
      })
      .catch(async (e) => {
        // Invalid/expired refresh token — clear stale session so app can render
        console.warn('getSession failed, clearing stale auth:', e);
        try { await supabase.auth.signOut(); } catch {}
        setSession(null);
        setUser(null);
        setRole(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Use Supabase's built-in check - shouldCreateUser: false will return error if user doesn't exist
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: false,
      },
    });
    
    // Transform Supabase error message to Lithuanian
    if (error) {
      if (error.message.includes('Signups not allowed') || error.message.includes('not allowed')) {
        return { error: new Error('Šis el. paštas nėra užregistruotas. Prašome susikurti paskyrą.') };
      }
      return { error: error as Error };
    }
    
    return { error: null };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: metadata?.firstName,
          last_name: metadata?.lastName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    isLoading,
    isAdmin: role === 'admin',
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
