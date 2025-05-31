import { json } from '@sveltejs/kit';
import { createUser, authenticateUser, generateToken } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
    try {
        const { action, ...data } = await request.json();
        
        if (action === 'register') {
            const { email, password, firstName, lastName } = data;
            const user = await createUser(email, password, firstName, lastName);
            const token = generateToken(user.id);
            
            cookies.set('auth_token', token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });
            
            return json({ user });
        }
        
        if (action === 'login') {
            const { email, password } = data;
            const user = await authenticateUser(email, password);
            const token = generateToken(user.id);
            
            cookies.set('auth_token', token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });
            
            return json({ user });
        }
        
        return json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return json({ error: error.message }, { status: 400 });
    }
}