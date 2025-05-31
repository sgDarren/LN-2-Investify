import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { setAuthCookie, verifyToken } from '$lib/server/auth.js';

export async function load({ cookies }) {
  // Wenn bereits eingeloggt, nur ein Flag zurückgeben.
  const token = cookies.get('auth_token');
  return {
    alreadyLoggedIn: !!(token && verifyToken(token))
  };
}

export const actions = {
  checkUser: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString()?.trim();

    if (!email) {
      return fail(400, { error: 'E-Mail ist erforderlich' });
    }

    try {
      const user = await db.getUserByEmail(email);
      const exists = !!user;
      console.log(
        `Check user - Email: ${email}, User found:`,
        exists
      );
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

  // 1) Den rohen E-Mail- und Passwort-Wert holen (kann auch null sein)
  const rawEmail = data.get('email');
  const rawPassword = data.get('password');

  // 2) Nur dann trim() bzw. string‐Wert verwenden, wenn tatsächlich ein String da ist
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  const password = typeof rawPassword === 'string' ? rawPassword : '';

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

      // Auth‐Cookie setzen
      setAuthCookie(cookies, user);

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return fail(500, {
        email,
        error: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      });
    }
  }
};
