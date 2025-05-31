import { redirect } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/server/auth.js';

export const actions = {
    default: async ({ cookies }) => {
        clearAuthCookie(cookies);
        throw redirect(302, '/auth/login');
    }
};

// Auch als GET-Handler für direkte Aufrufe
export async function GET({ cookies }) {
    clearAuthCookie(cookies);
    throw redirect(302, '/auth/login');
}

// POST-Handler für fetch-Aufrufe
export async function POST({ cookies }) {
    clearAuthCookie(cookies);
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}