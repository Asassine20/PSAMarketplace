import { useEffect, useCallback } from 'react';
import jwtDecode from 'jwt-decode';

const useAuth = () => {
  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return;

    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } else {
      // Handle refresh token failure (e.g., redirect to login)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login'; // Redirect to login page
    }
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const decoded = jwtDecode(accessToken);
      if (decoded.exp * 1000 < Date.now()) {
        // Token has expired
        refreshToken();
      }
    }
  }, [refreshToken]);

  return {
    refreshToken,
  };
};

export default useAuth;
