import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const authenticate = (req) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.accessToken;

  console.log('Cookies:', cookies);
  console.log('Token:', token);

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
};

export const getSessionId = (req, res) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.sessionId || null;
};
