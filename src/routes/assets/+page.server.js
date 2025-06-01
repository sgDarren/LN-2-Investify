// src/routes/assets/+page.server.js

import { error, redirect } from '@sveltejs/kit'; // redirect hinzugefügt
import { 
  getAllAssets, 
  getAssetsByCategory, 
  getAssetCategories,
  getUserPortfolioPositions 
} from '$lib/server/db.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
  try {
    // 1) Authentifizierung prüfen (optional)
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }

    // 2) URL-Parameter für Filterung auslesen
    const categoryFilter = url.searchParams.get('category') || 'all';
    const searchQuery = url.searchParams.get('search') || '';

    // 3) Assets laden - entweder alle oder gefiltert nach Kategorie
    let assets;
    if (categoryFilter === 'all') {
      assets = await getAllAssets();
    } else {
      assets = await getAssetsByCategory(categoryFilter);
    }

    // 4) Suchfilter anwenden (falls vorhanden)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      assets = assets.filter(asset => 
        asset.symbol.toLowerCase().includes(query) ||
        (asset.name && asset.name.toLowerCase().includes(query)) ||
        (asset.description && asset.description.toLowerCase().includes(query))
      );
    }

    // 5) Verfügbare Kategorien für Filter-Dropdown laden
    const categories = await getAssetCategories();

    // 6) Portfolio-Positionen des Benutzers laden (falls eingeloggt)
    let positions = [];
    if (locals.user) {
      try {
        positions = await getUserPortfolioPositions(locals.user.id);
      } catch (err) {
        console.warn('Portfolio-Positionen konnten nicht geladen werden:', err);
        // Nicht kritisch - weiter ohne Portfolio-Daten
      }
    }

    // 7) Assets nach Marktkapitalisierung oder Alphabet sortieren
    const sortBy = url.searchParams.get('sort') || 'marketCap';
    if (sortBy === 'marketCap') {
      assets.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    } else if (sortBy === 'symbol') {
      assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortBy === 'change') {
      assets.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
    } else if (sortBy === 'price') {
      assets.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    // 8) Statistiken berechnen
    const stats = {
      totalAssets: assets.length,
      gainers: assets.filter(a => (a.changePercent || 0) > 0).length,
      losers: assets.filter(a => (a.changePercent || 0) < 0).length,
      avgChange: assets.length > 0 
        ? assets.reduce((sum, a) => sum + (a.changePercent || 0), 0) / assets.length 
        : 0
    };

    // 9) Daten an Frontend zurückgeben
    return {
      assets,
      positions,
      categories,
      currentFilter: {
        category: categoryFilter,
        search: searchQuery,
        sort: sortBy
      },
      stats,
      user: locals.user || null
    };

  } catch (err) {
    console.error('Fehler beim Laden der Asset-Übersicht:', err);
    
    // Bei DB-Fehlern: Fallback-Daten oder Fehlerseite
    throw error(500, {
      message: 'Asset-Daten konnten nicht geladen werden',
      details: err.message
    });
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  // Action für Schnellkauf direkt aus der Übersicht
  quickBuy: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Anmeldung erforderlich');
    }

    const data = await request.formData();
    const symbol = data.get('symbol');
    const amount = parseFloat(data.get('amount') || '1');

    if (!symbol || amount <= 0) {
      throw error(400, 'Ungültige Parameter');
    }

    try {
      // Hier würde die Kauflogik implementiert werden
      // Beispiel: await executeBuyOrder(locals.user.id, symbol, amount);
      
      return {
        success: true,
        message: `Kauf von ${amount} ${symbol} erfolgreich`
      };
    } catch (err) {
      console.error('Fehler beim Schnellkauf:', err);
      throw error(500, 'Kauf konnte nicht ausgeführt werden');
    }
  },

  // Action für Schnellverkauf
  quickSell: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'Anmeldung erforderlich');
    }

    const data = await request.formData();
    const symbol = data.get('symbol');
    const amount = parseFloat(data.get('amount') || '1');

    if (!symbol || amount <= 0) {
      throw error(400, 'Ungültige Parameter');
    }

    try {
      // Hier würde die Verkaufslogik implementiert werden
      // Beispiel: await executeSellOrder(locals.user.id, symbol, amount);
      
      return {
        success: true,
        message: `Verkauf von ${amount} ${symbol} erfolgreich`
      };
    } catch (err) {
      console.error('Fehler beim Schnellverkauf:', err);
      throw error(500, 'Verkauf konnte nicht ausgeführt werden');
    }
  }
};