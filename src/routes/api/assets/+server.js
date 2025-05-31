import { json } from '@sveltejs/kit';
import { fetchAssetPrice } from '$lib/server/assets.js';

export async function GET({ url }) {
    const symbol = url.searchParams.get('symbol');
    const type = url.searchParams.get('type') || 'auto';
    
    if (!symbol) {
        return json({ error: 'Symbol parameter required' }, { status: 400 });
    }
    
    try {
        const priceData = await fetchAssetPrice(symbol, type);
        return json(priceData);
    } catch (error) {
        return json({ error: error.message }, { status: 404 });
    }
}