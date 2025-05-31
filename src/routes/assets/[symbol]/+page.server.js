import { error } from '@sveltejs/kit';
import { fetchAssetPrice } from '$lib/server/assets.js';

export async function load({ params }) {
    const { symbol } = params;
    
    try {
        const assetData = await fetchAssetPrice(symbol);
        
        return {
            symbol,
            assetData
        };
    } catch (err) {
        console.error(`Failed to load asset ${symbol}:`, err);
        throw error(404, `Asset ${symbol} not found`);
    }
}

// import db from "$lib/server/db";

// export async function load() {
//   return {
//     artists: await db.getArtists(),
//   }
// }

// export const actions = {
//     delete: async ({request}) => {
//         const data = await request.formData();
//         // console.log(data);
//         await db.deleteArtist(data.get("id"));
//     }
// }