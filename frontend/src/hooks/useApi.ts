import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseApiOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  const request = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (response.status === 401) {
        await logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (e.g. DELETE)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  return { isLoading, error, request, setError };
};

