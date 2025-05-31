import { verifyToken } from '$lib/server/auth.js';
import { getCustomerById } from '$lib/server/db.js';

export async function handle({ event, resolve }) {
    const token = event.cookies.get('auth_token');
    
    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            try {
                const user = await getCustomerById(payload.userId);
                if (user) {
                    event.locals.user = {
                        id: user._id.toString(),
                        email: user.email,
                        firstName: user.firstname,
                        lastName: user.lastname
                    };
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        }
    }
    
    return resolve(event);
}