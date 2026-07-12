import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

function purgeProgressCaches() {
  try {
    // Legacy global key that leaked progress across accounts — remove on every auth transition.
    localStorage.removeItem('completedLessons');
    // Any per-user scoped legacy keys (defensive).
    Object.keys(localStorage)
      .filter((k) => k.startsWith('completedLessons:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Purge on initial mount so a shared browser cannot inherit an old user's cache.
    purgeProgressCaches();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          purgeProgressCaches();
          queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    // Attempt server-side revocation with retries. NEVER report success
    // for a failed security operation — if the server refuses to revoke
    // the session, keep the local session intact so the user isn't
    // silently dropped onto the login page while still signed in server-side.
    const MAX_ATTEMPTS = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        // Default scope is 'global' — revokes across all devices.
        const { error } = await supabase.auth.signOut();
        if (!error) {
          // Server confirmed revocation. Safe to clear local caches now.
          purgeProgressCaches();
          return;
        }
        lastError = error;
        // eslint-disable-next-line no-console
        console.warn(`[signOut] attempt ${attempt} failed:`, error.message, 'status=', (error as { status?: number }).status);
      } catch (err) {
        lastError = err;
        // eslint-disable-next-line no-console
        console.warn(`[signOut] attempt ${attempt} threw:`, err);
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }

    // eslint-disable-next-line no-console
    console.error('[signOut] server refused to revoke session after retries:', lastError);
    toast.error("We couldn't fully sign you out — please try again.");
    // Intentionally do NOT clear the local session or navigate. The user
    // stays on their current page with a valid session until the server
    // actually revokes it on a subsequent attempt.
    throw lastError instanceof Error ? lastError : new Error('sign_out_failed');
  };


  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

