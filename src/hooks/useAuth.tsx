import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API_URL = 'https://atendimento.nextplan.tec.br/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  company_id?: string;
  role?: string;
}

interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔵 AuthProvider: Initializing...');
    
    // Verificar se há token salvo
    const checkSession = async () => {
      const token = localStorage.getItem('govchat_token');
      
      if (!token) {
        console.log('🔴 No token found');
        setLoading(false);
        return;
      }

      try {
        console.log('🔵 Checking token with /auth/me...');
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const data = await response.json();
        console.log('🟢 Session valid:', data);

        const sessionData: Session = {
          access_token: token,
          user: data.user,
        };

        setSession(sessionData);
        setUser(data.user);
      } catch (error) {
        console.error('🔴 Token validation failed:', error);
        localStorage.removeItem('govchat_token');
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar eventos de mudança de auth
    const handleAuthChange = (event: any) => {
      console.log('🔵 Auth state changed:', event.detail);
      const { event: authEvent, session: newSession } = event.detail;
      
      if (authEvent === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else if (authEvent === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
    };

    window.addEventListener('authStateChange', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  const signOut = async () => {
    console.log('🔵 Signing out...');
    localStorage.removeItem('govchat_token');
    setUser(null);
    setSession(null);
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { event: 'SIGNED_OUT', session: null }
    }));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
