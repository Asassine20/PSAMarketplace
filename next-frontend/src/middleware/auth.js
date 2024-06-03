import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

export const getSessionId = (req, res) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  let sessionId = cookies.sessionId;

  if (!sessionId) {
    sessionId = Math.floor(Math.random() * 1e17).toString();
    res.setHeader('Set-Cookie', cookie.serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
      path: '/'
    }));
  }

  return sessionId;
};
