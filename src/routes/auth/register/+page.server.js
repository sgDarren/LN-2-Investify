import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db.js'; // Default import
import { setAuthCookie } from '$lib/server/auth.js';

export async function load({ cookies }) {
    // Redirect if already authenticated
    const token = cookies.get('auth_token');
    if (token) {
        throw redirect(302, '/dashboard');
    }
}

export const actions = {
    register: async ({ request, cookies }) => {
        const data = await request.formData();
        
        const firstName = data.get('firstName')?.toString()?.trim();
        const lastName = data.get('lastName')?.toString()?.trim();
        const email = data.get('email')?.toString()?.trim();
        const password = data.get('password')?.toString();
        const confirmPassword = data.get('confirmPassword')?.toString();
        const acceptTerms = data.get('acceptTerms')?.toString();

        // Form data for re-hydration
        const formData = { firstName, lastName, email };

        // Validation
        const fieldErrors = {};

        if (!firstName || firstName.length < 2) {
            fieldErrors.firstName = ['Vorname muss mindestens 2 Zeichen lang sein'];
        }

        if (!lastName || lastName.length < 2) {
            fieldErrors.lastName = ['Nachname muss mindestens 2 Zeichen lang sein'];
        }

        if (!email) {
            fieldErrors.email = ['E-Mail-Adresse ist erforderlich'];
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                fieldErrors.email = ['Bitte geben Sie eine gültige E-Mail-Adresse ein'];
            }
        }

        if (!password || password.length < 6) {
            fieldErrors.password = ['Passwort muss mindestens 6 Zeichen lang sein'];
        }

        if (password !== confirmPassword) {
            fieldErrors.confirmPassword = ['Passwörter stimmen nicht überein'];
        }

        if (!acceptTerms || acceptTerms !== 'true') {
            fieldErrors.acceptTerms = ['Sie müssen die Nutzungsbedingungen akzeptieren'];
        }

        if (Object.keys(fieldErrors).length > 0) {
            return fail(400, {
                data: formData,
                fieldErrors,
                error: 'Bitte korrigieren Sie die markierten Felder'
            });
        }

        try {
            const user = await db.createUser(email, password, firstName, lastName);
            
            // Auto-login after registration
            setAuthCookie(cookies, user);

            // Redirect OUTSIDE try/catch
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.message === 'User already exists') {
                return fail(400, {
                    data: formData,
                    fieldErrors: {
                        email: ['Ein Benutzer mit dieser E-Mail-Adresse existiert bereits']
                    },
                    error: 'E-Mail-Adresse bereits registriert'
                });
            }
            
            return fail(500, {
                data: formData,
                error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
            });
        }

        // Redirect here - outside try/catch
        throw redirect(302, '/dashboard');
    }
};