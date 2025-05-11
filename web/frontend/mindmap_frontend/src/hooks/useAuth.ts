import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface User {
  id: number;
  username: string;
  email: string;
  credits: number;
}

export const useAuth = () => {
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    fetchUser
  };
};
