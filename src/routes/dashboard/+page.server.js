// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getUserPortfolios, createPortfolio } from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Prüfe Authentifizierung über hooks.server.js
  if (!locals.user) {
    return redirect(302, '/auth/login');
  }

  try {
    // Portfolios laden
    const portfolios = await getUserPortfolios(locals.user.id);
    
    // Pie-Chart-Daten vorbereiten
    const pieLabels = portfolios.map(p => p.name);
    const pieValues = portfolios.map(p => p.value);
    const pieColors = portfolios.map(
      (_, i) => `hsl(${(i * 360) / portfolios.length}, 70%, 50%)`
    );

    return {
       user: locals.user,
      portfolios,
       pieData: {
        labels: pieLabels,
         values: pieValues,
         colors: pieColors
       }
       }
 } catch (error) {
    console.error('Fehler beim Laden der Portfolios:', error);     return {
       user: locals.user,       portfolios: [],
      pieData: { labels: [], values: [], colors: [] },
      error: 'Konnte Portfolios nicht laden.'
    };
  }
 }

/** @type {import('./$types').Actions} */
export const actions = {
  createPortfolio: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }

    const data = await request.formData();
    const name = data.get('name')?.toString().trim();

    if (!name) {
      return {
        success: false,
        error: 'Bitte gebe einen Namen ein.'
      };
    }

    try {
      await createPortfolio(locals.user.id, name);
      return {
        success: true,
        message: 'Portfolio erfolgreich erstellt.'
      };
    } catch (error) {
      console.error('Fehler beim Anlegen eines neuen Portfolios:', error);
      return {
        success: false,
        error: 'Konnte neues Portfolio nicht anlegen.'
      };
    }
  }
};