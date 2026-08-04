import User from '../models/User.js';
import jwt from 'jsonwebtoken';
export const authMiddleware = async (req, res, next) => {
    try {
    // Accept either transport. The cookie covers normal browser navigation,
    // while the Bearer header is what services/api.js actually sends (and the
    // only thing that works for non-browser clients). Supporting the cookie
    // alone made every authenticated request fail with a 401.
    const header = req.headers.authorization || '';
    const bearerToken = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    const token = req.cookies?.token || bearerToken;
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
        return res.status(401).json({ message: 'User not found, authorization denied' });
    }
    req.user = user;
    next();
} catch (error) {
    // An invalid/expired/malformed token is a client auth problem, not a
    // server fault, so it must answer 401 rather than 500.
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
        res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        return res.status(401).json({ message: 'Invalid or expired token, authorization denied' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
} 
} ;


