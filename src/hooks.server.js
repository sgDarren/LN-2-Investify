import { verifyToken } from '$lib/server/auth.js';
import { db } from '$lib/server/db.js';

export async function handle({ event, resolve }) {
    const token = event.cookies.get('auth_token');
    
    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            try {
                const user = await db.getUserByEmail(payload.email);
                if (user) {
                    event.locals.user = {
                        id: user._id.toString(),
                        email: user.email,
                        firstName: user.firstname,
                        lastName: user.lastname
                    };
                }
            } catch (error) {
                console.error('Auth hook error:', error);
                // Clear invalid token
                event.cookies.delete('auth_token', { path: '/' });
            }
        } else {
            // Invalid token
            event.cookies.delete('auth_token', { path: '/' });
        }
    }

    return await resolve(event);
}