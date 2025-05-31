export async function load({ locals }) {

  if (locals.user) {
    console.log('[+layout.server] eingeloggter User:', locals.user);
  } else {
    console.log('[+layout.server] kein eingeloggter User gefunden');
  }

  return {
    user: locals.user || null
  };
}
