import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthSession } from '../../shared/bridge';

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.desktop.auth.getSession().then(s => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const result = await window.desktop.auth.signIn(email, password);
    if (result.error) return result.error;
    setSession(result.session);
    return null;
  }

  async function signOut(): Promise<void> {
    await window.desktop.auth.signOut();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
