import { ALPHA_VANTAGE_API_KEY } from '$env/static/private';
import { getCachedPrice, setCachedPrice } from './db.js';

// Rate limiting für API calls
const apiCallQueue = [];
let lastApiCall = 0;
const API_CALL_DELAY = 12000; // 12 Sekunden zwischen Calls (5 calls/minute)

async function throttledApiCall(fn) {
    return new Promise((resolve) => {
        apiCallQueue.push(async () => {
            const now = Date.now();
            const timeSinceLastCall = now - lastApiCall;
            const delay = Math.max(0, API_CALL_DELAY - timeSinceLastCall);
            
            if (delay > 0) {
                await new Promise(r => setTimeout(r, delay));
            }
            
            lastApiCall = Date.now();
            const result = await fn();
            resolve(result);
        });
        
        if (apiCallQueue.length === 1) {
            apiCallQueue[0]();
        }
    });
}

export async function fetchStockPrice(symbol) {
    // Erst Cache prüfen
    const cached = await getCachedPrice(symbol);
    if (cached) {
        console.log(`Using cached price for ${symbol}`);
        return cached;
    }

    try {
        const priceData = await throttledApiCall(async () => {
            console.log(`Fetching price for ${symbol} from Alpha Vantage`);
            
            const response = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Error handling
            if (data['Note']) {
                throw new Error('API call frequency limit reached');
            }
            
            if (data['Error Message']) {
                throw new Error(`Stock not found: ${symbol}`);
            }
            
            const quote = data['Global Quote'];
            if (!quote || Object.keys(quote).length === 0) {
                // Fallback auf Demo-Daten
                console.warn(`No data for ${symbol}, using demo data`);
                return getDemoPrice(symbol);
            }
            
            return {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                lastUpdated: new Date(),
                currency: 'USD',
                type: 'stock'
            };
        });
        
        // Cache speichern
        await setCachedPrice(symbol, priceData);
        apiCallQueue.shift();
        
        // Nächsten Call ausführen falls vorhanden
        if (apiCallQueue.length > 0) {
            apiCallQueue[0]();
        }
        
        return priceData;
    } catch (error) {
        console.error(`Error fetching stock price for ${symbol}:`, error);
        apiCallQueue.shift();
        
        // Fallback auf Demo-Daten
        return getDemoPrice(symbol);
    }
}

// Demo-Daten für Entwicklung/Testing
function getDemoPrice(symbol) {
    const basePrices = {
        'AAPL': 180.50,
        'MSFT': 420.30,
        'GOOGL': 142.80,
        'AMZN': 178.90,
        'TSLA': 242.60,
        'NVDA': 882.40,
        'META': 502.30
    };
    
    const basePrice = basePrices[symbol] || 100;
    const randomChange = (Math.random() - 0.5) * 10;
    const price = basePrice + randomChange;
    
    return {
        symbol,
        price,
        change: randomChange,
        changePercent: (randomChange / basePrice) * 100,
        lastUpdated: new Date(),
        currency: 'USD',
        type: 'stock'
    };
}

export async function fetchAssetPrice(symbol, type = 'stock') {
    return await fetchStockPrice(symbol);
}