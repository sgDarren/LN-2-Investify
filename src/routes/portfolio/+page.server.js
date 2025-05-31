import { redirect } from '@sveltejs/kit';
import { getPortfolioByCustomerId } from '$lib/server/db.js';
import { fetchAssetPrice } from '$lib/server/assets.js';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(303, '/auth/login');
    }
    
    try {
        const positions = await getPortfolioByCustomerId(locals.user.id);
        
        // Enrich with current prices
        const enrichedPositions = await Promise.all(
            positions.map(async (position) => {
                try {
                    const currentPrice = await fetchAssetPrice(position.asset_symbol);
                    const currentValue = position.amount * currentPrice.price;
                    const gainLoss = currentValue - position.total_value;
                    
                    return {
                        ...position,
                        current_price: currentPrice.price,
                        current_value: currentValue,
                        gain_loss: gainLoss,
                        gain_loss_percentage: (gainLoss / position.total_value) * 100
                    };
                } catch (error) {
                    console.error(`Failed to get price for ${position.asset_symbol}:`, error);
                    return {
                        ...position,
                        current_price: 0,
                        current_value: 0,
                        gain_loss: 0,
                        gain_loss_percentage: 0
                    };
                }
            })
        );
        
        const totalValue = enrichedPositions.reduce((sum, pos) => sum + pos.current_value, 0);
        const totalInvestment = enrichedPositions.reduce((sum, pos) => sum + pos.total_value, 0);
        
        return {
            positions: enrichedPositions,
            totalValue,
            totalInvestment
        };
    } catch (err) {
        console.error('Failed to load portfolio:', err);
        return {
            positions: [],
            totalValue: 0,
            totalInvestment: 0
        };
    }
}