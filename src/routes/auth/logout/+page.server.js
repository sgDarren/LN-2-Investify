import { redirect } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/server/auth.js';

export async function load({ cookies }) {
    clearAuthCookie(cookies);
    throw redirect(302, '/auth/login');
}