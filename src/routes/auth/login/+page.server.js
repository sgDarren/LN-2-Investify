import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db.js'; // Default import
import { setAuthCookie } from '$lib/server/auth.js';

export async function load({ cookies }) {
    // Redirect if already authenticated
    const token = cookies.get('auth_token');
    if (token) {
        // Optional: Verify token validity here
        throw redirect(302, '/dashboard');
    }
}

export const actions = {
    checkUser: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString()?.trim();

        if (!email) {
            return fail(400, { error: 'E-Mail ist erforderlich' });
        }

        try {
            // Jetzt können wir getUserByEmail verwenden!
            const user = await db.getUserByEmail(email);
            const exists = !!user;
            
            console.log(`Check user - Email: ${email}, User found:`, !!user, 'Exists:', exists); // DEBUG
            
            return {
                exists,
                email: email.toLowerCase()
            };
        } catch (error) {
            console.error('Check user error:', error);
            return {
                exists: false,
                email: email.toLowerCase()
            };
        }
    },

    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString()?.trim();
        const password = data.get('password')?.toString();

        // Validierung
        if (!email || !password) {
            return fail(400, { 
                email,
                error: 'E-Mail und Passwort sind erforderlich' 
            });
        }

        try {
            const user = await db.authenticateUser(email, password);
            
            if (!user) {
                return fail(401, { 
                    email,
                    error: 'Ungültige Anmeldedaten' 
                });
            }

            // Auth Cookie setzen
            setAuthCookie(cookies, user);

        } catch (error) {
            console.error('Login error:', error);
            return fail(500, { 
                email,
                error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.' 
            });
        }

        // Redirect outside try/catch
        throw redirect(302, '/dashboard');
    }
};