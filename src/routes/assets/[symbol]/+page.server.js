// src/routes/stocks/[symbol]/+page.server.js

import { error, redirect } from '@sveltejs/kit';
import { ALPHA_VANTAGE_KEY } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  // ❶ Authentifizierung (optional):
  // if (!locals.user) {
  //   throw redirect(302, '/auth/login');
  // }

  // ❷ Symbol aus der URL entnehmen (z. B. /stocks/AAPL)
  const rawSymbol = params.symbol || '';
  const symbol = rawSymbol.toUpperCase().trim(); // „AAPL“

  // ❸ Während wir auf das Alpha Vantage Free-Tier angewiesen sind,
  //     drosseln wir die Abfragen:
  //     - 1x GLOBAL_QUOTE für den aktuellen Kurs
  //     - 1x TIME_SERIES_DAILY_ADJUSTED (compact) für die letzten 100 Tage
  //     => insgesamt 2 Requests pro Symbol.

  // Global Quote URL
  const quoteUrl = new URL('https://www.alphavantage.co/query');
  quoteUrl.searchParams.set('function', 'GLOBAL_QUOTE');
  quoteUrl.searchParams.set('symbol', symbol);
  quoteUrl.searchParams.set('apikey', ALPHA_VANTAGE_KEY);

  // Time Series Daily Adjusted URL (letzte 100 Tage = outputsize=compact)
  const tsUrl = new URL('https://www.alphavantage.co/query');
  tsUrl.searchParams.set('function', 'TIME_SERIES_DAILY_ADJUSTED');
  tsUrl.searchParams.set('symbol', symbol);
  tsUrl.searchParams.set('outputsize', 'compact');
  tsUrl.searchParams.set('apikey', ALPHA_VANTAGE_KEY);

  try {
    // ❹ 1. Request: GLOBAL_QUOTE
    const [quoteRes, tsRes] = await Promise.all([
      fetch(quoteUrl.toString()),
      // Kurze Wartezeit um nicht beide gleichzeitig abzusetzen (um Rate Limiting verringern)
      // Falls du schon in kurzer Zeit >5 Aufrufe laufen hast, dann musst du ggf. hier
      // einen `await new Promise(r => setTimeout(r, 12000))` zwischen den Requests machen.
      fetch(tsUrl.toString())
    ]);

    // ❺ Prüfe, ob beide Responses OK sind
    if (!quoteRes.ok) {
      throw new Error(`Alpha Vantage GLOBAL_QUOTE HTTP ${quoteRes.status}`);
    }
    if (!tsRes.ok) {
      throw new Error(`Alpha Vantage TIME_SERIES HTTP ${tsRes.status}`);
    }

    const quoteJson = await quoteRes.json();
    const tsJson = await tsRes.json();

    // ❻ Fehler prüfen: Alphavantage sendet z.B. { "Note": "..."} oder { "Error Message": "..." }
    if (quoteJson['Error Message'] || quoteJson['Note']) {
      throw new Error(
        quoteJson['Error Message'] || quoteJson['Note'] || 'Unknown GLOBAL_QUOTE error'
      );
    }
    if (tsJson['Error Message'] || tsJson['Note']) {
      throw new Error(
        tsJson['Error Message'] || tsJson['Note'] || 'Unknown TIME_SERIES_DAILY_ADJUSTED error'
      );
    }

    // ❼ GLOBAL_QUOTE parsen
    const globalData = quoteJson['Global Quote'] || {};
    const currentPrice = parseFloat(globalData['05. price'] || '0');
    const currentChange = parseFloat(globalData['09. change'] || '0');
    const currentChangePercent = parseFloat(
      (globalData['10. change percent'] || '0').replace('%', '')
    );

    // ❽ TIME_SERIES_DAILY_ADJUSTED parsen
    //     tsJson["Time Series (Daily)"] ist ein Objekt, in dem Keys die Datumsstrings sind
    //     z. B. { "2025-05-31": { "1. open": "...", ...}, "2025-05-30": { ... }, ... }
    const tsData = tsJson['Time Series (Daily)'] || {};
    const historicalData = Object.entries(tsData).map(([date, obj]) => ({
      date, // „2025-05-31“
      open: parseFloat(obj['1. open']),
      high: parseFloat(obj['2. high']),
      low: parseFloat(obj['3. low']),
      close: parseFloat(obj['4. close']),
      volume: parseInt(obj['6. volume'], 10)
    }));
    // Sortiere absteigend nach Datum (aktuellster Tag zuerst)
    historicalData.sort((a, b) => (a.date < b.date ? 1 : -1));

    // ❾ Gib alle Daten ans Frontend zurück
    return {
      symbol,
      current: {
        price: currentPrice,
        change: currentChange,
        changePercent: currentChangePercent,
        lastUpdated: globalData['07. latest trading day'] || ''
      },
      historicalData
    };
  } catch (err) {
    console.error(`Fehler beim Laden von Alpha Vantage Daten für ${symbol}:`, err);
    // Entweder 404 (wenn Symbol nicht existiert) oder 500
    throw error(500, `Konnte Daten für ${symbol} nicht laden.`);
  }
}
