import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

export const useCredits = () => {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const api = useApi();
  const { isAuthenticated, user } = useAuth();

  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated) {
      setCredits(0);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await api.get('/credits/');
      
      if (response.success) {
        setCredits(response.data.amount);
      } else {
        console.error('クレジット取得エラー:', response.error);
      }
    } catch (error) {
      console.error('クレジット取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCredits();
    } else {
      setCredits(0);
    }
  }, [isAuthenticated, fetchCredits]);

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
    }
  }, [user]);

  const decrementCredits = useCallback(() => {
    if (credits <= 0) {
      return false;
    }
    setCredits(prev => prev - 1);
    return true;
  }, [credits]);

  const purchaseCredits = useCallback(async (amount: number) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/credits/purchase', { amount });
      
      if (response.success) {
        setCredits(prev => prev + amount);
        return true;
      } else {
        throw new Error(response.error || 'クレジットの購入に失敗しました');
      }
    } catch (error) {
      console.error('クレジット購入エラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  return {
    credits,
    isLoading,
    fetchCredits,
    decrementCredits,
    purchaseCredits
  };
};
