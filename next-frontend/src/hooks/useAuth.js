import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState(null);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  };

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return;

    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      const data = await response.json();
      console.log('Refresh token response data:', data);
      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setAccessToken(data.accessToken);
        const decoded = decodeToken(data.accessToken);
        if (decoded) {
          setUserId(decoded.userId);
          setEmail(decoded.email);
        }
      } else {
        console.error('Refresh token failed:', data.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.exp * 1000 < Date.now()) {
        refreshToken();
      } else {
        setAccessToken(accessToken);
        if (decoded) {
          setUserId(decoded.userId);
          setEmail(decoded.email);
        }
      }
    }
  }, [refreshToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // Refresh every 14 minutes
    return () => clearInterval(interval);
  }, [refreshToken]);

  return {
    accessToken,
    userId,
    email,
    refreshToken,
  };
};

export default useAuth;
