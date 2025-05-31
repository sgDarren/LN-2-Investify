  import { error, redirect } from '@sveltejs/kit';
  import { COINDESK_API_KEY } from '$env/static/private';

  /** @type {import('./$types').PageServerLoad} */
  export async function load({  }) {
    // 1) Authentifizierung prüfen (falls erforderlich)
    //    Beispiel: Wenn du nur eingeloggte Nutzer erlauben willst:
    // if (!locals.user) {
    //   throw redirect(302, '/auth/login');
    // }

    // 2) Symbol aus der URL entnehmen
    //const symbol = params.symbol.toUpperCase(); // z.B. "AAPL"

    // 3) Bereite den Twelve Data URL vor
    const interval = '1day';      // Tagesdaten
    const outputsize = 100;       // 100 Candles (Tagesschlusskurse)
    const url = `https://api.twelvedata.com/time_series?symbol=AAPL&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

    try {
      // 4) Fetch an Twelve Data schicken
      const res = await fetch(url);
      if (!res.ok) {
        // Wenn HTTP‐Status ≠ 200, werfe einen Fehler
        throw new Error(`Twelve Data HTTP ${res.status}`);
      }

      const json = await res.json();

      // 5) Überprüfe, ob API‐Antwort einen Fehler enthält
      //    (Twelve Data gibt bei ungültigem Symbol z.B. { "code": 400, "message": "Symbol not found" })
      if (json.code && json.message) {
        throw new Error(`Twelve Data Error: ${json.code} – ${json.message}`);
      }

      // 6) Extrahiere die Werte
      //    `json.values` ist ein Array mit Objekten: { datetime: "YYYY-MM-DD", open: "...", high: "...", low: "...", close: "...", volume: "..." }
      const historicalData = json.values.map((entry) => ({
        date: entry.datetime,
        open: parseFloat(entry.open),
        high: parseFloat(entry.high),
        low: parseFloat(entry.low),
        close: parseFloat(entry.close),
        volume: parseInt(entry.volume, 10)
      }));

      // 7) Props an das Frontend zurückgeben
      return {
        symbol,
        historicalData
      };
    } catch (err) {
      console.error(`Fehler beim Laden der historischen Daten für:`, err);
      // 8) Bei Fehler kannst du entweder einen 404 ausliefern oder einfach leere Daten zurückgeben:
      throw error(404, `Daten für Symbol konnten nicht geladen werden.`);
    }
  }
