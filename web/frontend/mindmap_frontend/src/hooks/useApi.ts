import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: any;
}

export const useApi = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const get = useCallback(async (endpoint: string): Promise<ApiResponse> => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || '不明なエラーが発生しました'
        };
      }
      
      return {
        success: true,
        data,
        ...data
      };
    } catch (error) {
      console.error('APIエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const post = useCallback(async (endpoint: string, body: any): Promise<ApiResponse> => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let requestBody;
      if (endpoint === '/token') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const formData = new URLSearchParams();
        for (const key in body) {
          formData.append(key, body[key]);
        }
        requestBody = formData;
      } else {
        requestBody = JSON.stringify(body);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: requestBody
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || '不明なエラーが発生しました'
        };
      }
      
      return {
        success: true,
        data,
        ...data
      };
    } catch (error) {
      console.error('APIエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const put = useCallback(async (endpoint: string, body: any): Promise<ApiResponse> => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || '不明なエラーが発生しました'
        };
      }
      
      return {
        success: true,
        data,
        ...data
      };
    } catch (error) {
      console.error('APIエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const del = useCallback(async (endpoint: string): Promise<ApiResponse> => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.status === 204) {
        return {
          success: true
        };
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || '不明なエラーが発生しました'
        };
      }
      
      return {
        success: true,
        data,
        ...data
      };
    } catch (error) {
      console.error('APIエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    get,
    post,
    put,
    del
  };
};
