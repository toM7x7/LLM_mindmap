import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';

interface User {
  id: number;
  username: string;
  email: string;
  credits?: number;
  is_active: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const api = useApi();

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      const response = await api.get('/users/me');
      
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/token', {
        username: email, // FastAPIのOAuth2PasswordRequestFormに合わせる
        password
      });
      
      if (response.success && response.access_token) {
        localStorage.setItem('token', response.access_token);
        await fetchUser();
        return true;
      } else {
        throw new Error(response.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/users/', {
        username,
        email,
        password
      });
      
      if (response.success) {
        return await login(email, password);
      } else {
        throw new Error(response.error || '登録に失敗しました');
      }
    } catch (error) {
      console.error('登録エラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      login,
      register,
      logout,
      fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
