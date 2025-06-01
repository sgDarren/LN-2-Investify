import { redirect } from '@sveltejs/kit';
import { authClient } from '$lib/auth-client';

/** @type {import('./$types').PageServerLoad} */
export async function load({ request }) {
  // Session über authClient abrufen
  // Better Auth verwendet normalerweise Cookies für die Session-Verwaltung
  const session = await authClient.getSession({
    fetchOptions: {
      headers: request.headers
    }
  });

  // Wenn der Nutzer bereits eingeloggt ist, direkt zum Dashboard weiterleiten
  if (session?.user) {
    throw redirect(303, '/dashboard');
  }

  return {};
}

export const actions = {};