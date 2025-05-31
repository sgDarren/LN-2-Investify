import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export function generateToken(user) {
    return jwt.sign(
        { 
            userId: user.id, 
            email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export function setAuthCookie(cookies, user) {
    const token = generateToken(user);
    cookies.set('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    return token;
}

export function clearAuthCookie(cookies) {
    cookies.delete('auth_token', { path: '/' });
}
