import { ALPHA_VANTAGE_API_KEY, COINGECKO_API_KEY } from '$env/static/private';

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
    const cached = await getCachedPrice(`stock_${symbol}`);
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
        const priceData = {
            symbol: quote['01. Symbol'],
            price: parseFloat(quote['05. Price']),
            change: parseFloat(quote['09. Change']),
            changePercent: parseFloat(quote['10. Change Percent'].replace('%', '')),
            lastUpdated: quote['07. Latest Trading Day'],
            type: 'stock'
        };
        
        setCachedPrice(`stock_${symbol}`, priceData);
        return priceData;
    } catch (error) {
        console.error(`Error fetching stock price for ${symbol}:`, error);
        throw error;
    }
}

// CoinGecko für Kryptowährungen
export async function fetchCryptoPrice(symbol) {
    const cached = await getCachedPrice(`crypto_${symbol}`);
    if (cached) return cached;
    
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        
        if (!data[symbol]) {
            throw new Error(`Crypto not found: ${symbol}`);
        }
        
        const priceData = {
            symbol: symbol.toUpperCase(),
            price: data[symbol].usd,
            change: data[symbol].usd_24h_change || 0,
            changePercent: data[symbol].usd_24h_change || 0,
            lastUpdated: new Date().toISOString(),
            type: 'crypto'
        };
        
        setCachedPrice(`crypto_${symbol}`, priceData);
        return priceData;
    } catch (error) {
        console.error(`Error fetching crypto price for ${symbol}:`, error);
        throw error;
    }
}

export async function fetchAssetPrice(symbol, type = 'auto') {
    if (type === 'stock' || (type === 'auto' && symbol.length <= 5)) {
        return await fetchStockPrice(symbol);
    } else if (type === 'crypto' || type === 'auto') {
        return await fetchCryptoPrice(symbol.toLowerCase());
    }
    throw new Error(`Unknown asset type: ${type}`);
}

// Historische Daten für Charts
export async function fetchHistoricalData(symbol, period = '30d') {
    const cached = await getCachedPrice(`history_${symbol}_${period}`);
    if (cached) return cached;
    
    try {
        // Vereinfacht: nur für Krypto via CoinGecko
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await response.json();
        
        const historicalData = {
            symbol: symbol.toUpperCase(),
            prices: data.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp).toISOString(),
                price: price
            })),
            period
        };
        
        setCachedPrice(`history_${symbol}_${period}`, historicalData);
        return historicalData;
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        throw error;
    }
}

export default {
    fetchAssetPrice,
    fetchStockPrice,
    fetchCryptoPrice,
    fetchHistoricalData
};