import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextData } from '@/types/auth';
import type { User } from '@/types/auth';
import { getProfile, loginRequest, registerRequest } from '@/api/auth';

const AuthContext = createContext<AuthContextData | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};

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

  const register = async (name: string, email: string, password: string) => {
    await registerRequest(name, email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('@TCC:token');
    setUser(null);
    localStorage.removeItem('@TCC:user');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: user !== null, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}


