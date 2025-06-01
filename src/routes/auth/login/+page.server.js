import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Better Auth stellt die Session über locals bereit
  const session = await locals.getSession?.();
  
  // Wenn der Nutzer bereits eingeloggt ist, direkt zum Dashboard weiterleiten
  if (session?.user) {
    throw redirect(303, '/dashboard');
  }
  
  return {};
}