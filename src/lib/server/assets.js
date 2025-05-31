import { ALPHA_VANTAGE_API_KEY } from '$env/static/private';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const priceCache = new Map();

export async function getCachedPrice(symbol) {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedPrice(symbol, data) {
  priceCache.set(symbol, {
    data,
    timestamp: Date.now()
  });
}

// Alpha Vantage für Aktien
export async function fetchStockPrice(symbol) {
  const cacheKey = `stock_${symbol}`;
  const cached = await getCachedPrice(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(`Stock not found: ${symbol}`);
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. Price'] || !quote['10. Change Percent']) {
      throw new Error(`Ungültige Daten von Alpha Vantage für ${symbol}`);
    }

    const priceData = {
      symbol: quote['01. Symbol'],
      price: parseFloat(quote['05. Price']),
      change: parseFloat(quote['09. Change']),
      changePercent: parseFloat(quote['10. Change Percent'].replace('%', '')),
      lastUpdated: quote['07. Latest Trading Day'],
      type: 'stock'
    };

    setCachedPrice(cacheKey, priceData);
    return priceData;
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    throw error;
  }
}

// Crypto-Funktionen auskommentiert, da vorerst nur Aktien benötigt werden
// export async function fetchCryptoPrice(symbol) {
//   // ...
// }

// export async function fetchHistoricalData(symbol, period = '30d') {
//   // ...
// }

// fetchAssetPrice liefert nun immer nur die Aktien-Daten zurück
export async function fetchAssetPrice(symbol /*, type = 'auto' */) {
  return await fetchStockPrice(symbol);
}

export default {
  fetchAssetPrice,
  fetchStockPrice
  // fetchCryptoPrice,
  // fetchHistoricalData
};
