import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getProfile, loginRequest, type User } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('@TCC:token');

    Promise.resolve(savedToken ? getProfile() : null)
      .then((profile) => {
        if (!profile) {
          return;
        }

        setUser(profile);
        localStorage.setItem('@TCC:user', JSON.stringify(profile));
      })
      .catch(() => {
        localStorage.removeItem('@TCC:token');
        localStorage.removeItem('@TCC:user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { accessToken } = await loginRequest(email, password);
      localStorage.setItem('@TCC:token', accessToken);

      const profile = await getProfile();
      localStorage.setItem('@TCC:user', JSON.stringify(profile));
      setUser(profile);
    } catch (error) {
      localStorage.removeItem('@TCC:token');
      localStorage.removeItem('@TCC:user');
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('@TCC:token');
    setUser(null);
    localStorage.removeItem('@TCC:user');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: user !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
