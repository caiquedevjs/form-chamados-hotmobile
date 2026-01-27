import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '../services/api';


// ✅ 1. Crie a interface User (Isso resolve o erro ts(2304))
interface User {
  id: number;
  nome: string;
  email: string;
  cor?: string; // Opcional, pois pode não vir sempre
  // Adicione outros campos se o seu backend retornar (ex: avatar, role, etc)
}

// 2. Define o formato dos dados do Contexto
interface AuthContextData {
  signed: boolean;
  user: User | null; // ✅ Mudei de 'object' para 'User'
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// 3. Cria o contexto
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // ✅ Mudei de <object | null> para <User | null>
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Certifique-se que o backend retorna { access_token, user }
      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        signed: !!user, 
        user, 
        login, 
        logout, 
        loading,
        setUser // ✅ IMPORTANTE: Adicionei o setUser aqui para o Modal de Perfil funcionar!
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}