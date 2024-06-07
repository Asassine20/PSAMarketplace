import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log('Decoded refresh token:', decoded);
    const newAccessToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
    const newRefreshToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    res.setHeader('Set-Cookie', [
      cookie.serialize('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 1, // 1 minute
        sameSite: 'strict',
        path: '/'
      }),
      cookie.serialize('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'strict',
        path: '/'
      })
    ]);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Invalid refresh token', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
}
