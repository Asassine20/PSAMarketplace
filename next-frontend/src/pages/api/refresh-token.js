import jwt from 'jsonwebtoken';

const REFRESH_TOKEN_SECRET = 'your_refresh_token_secret';
const ACCESS_TOKEN_SECRET = 'your_access_token_secret';

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
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign({ email: decoded.email }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ email: decoded.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
}
