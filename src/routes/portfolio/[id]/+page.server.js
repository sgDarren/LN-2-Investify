// src/routes/portfolio/[id]/+page.server.js
import { error, redirect } from '@sveltejs/kit';
import { 
    getPortfolioById, 
    getPortfolioPositions, 
    getPortfolioTransactions,
    addTransaction 
} from '$lib/server/db.js';
import { fetchAssetPrice } from '$lib/server/assets.js';

export async function load({ params, locals }) {
    if (!locals.user) {
        throw redirect(303, '/auth/login');
    }

    const portfolioId = params.id;

    try {
        // Portfolio laden und Zugriff prüfen
        const portfolio = await getPortfolioById(portfolioId);
        
        if (!portfolio) {
            throw error(404, 'Portfolio nicht gefunden');
        }

        // Sicherheitsprüfung: Gehört das Portfolio dem User?
        if (portfolio.customer_id.toString() !== locals.user.id) {
            throw error(403, 'Kein Zugriff auf dieses Portfolio');
        }

        // Positionen laden
        const positions = await getPortfolioPositions(portfolioId);
        
        // Positionen mit aktuellen Preisen anreichern
        const enrichedPositions = await Promise.all(
            positions.map(async (position) => {
                try {
                    const priceData = await fetchAssetPrice(position.symbol);
                    const currentValue = position.quantity * priceData.price;
                    const gainLoss = currentValue - (position.quantity * position.avg_price);
                    
                    return {
                        ...position,
                        current_price: priceData.price,
                        current_value: currentValue,
                        gain_loss: gainLoss,
                        gain_loss_percent: (gainLoss / (position.quantity * position.avg_price)) * 100,
                        change: priceData.change,
                        changePercent: priceData.changePercent,
                        currency: priceData.currency || 'USD',
                        last_updated: new Date()
                    };
                } catch (error) {
                    console.error(`Failed to get price for ${position.symbol}:`, error);
                    return {
                        ...position,
                        current_price: position.avg_price,
                        current_value: position.quantity * position.avg_price,
                        gain_loss: 0,
                        gain_loss_percent: 0,
                        change: 0,
                        changePercent: 0,
                        currency: 'USD',
                        last_updated: new Date()
                    };
                }
            })
        );

        // Transaktionen laden
        const transactions = await getPortfolioTransactions(portfolioId);
        
        // Portfolio-Statistiken berechnen
        const totalValue = enrichedPositions.reduce((sum, pos) => sum + pos.current_value, 0);
        const totalInvestment = enrichedPositions.reduce((sum, pos) => sum + (pos.quantity * pos.avg_price), 0);
        const totalGainLoss = totalValue - totalInvestment;
        const totalGainLossPercent = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;
        
        // Beste und schlechteste Performer
        const sortedByPerformance = [...enrichedPositions].sort((a, b) => b.gain_loss_percent - a.gain_loss_percent);
        const topPerformers = sortedByPerformance.slice(0, 3);
        const worstPerformers = sortedByPerformance.slice(-3).reverse();

        // Asset-Verteilung für Pie Chart
        const assetDistribution = {
            labels: enrichedPositions.map(p => p.symbol),
            values: enrichedPositions.map(p => p.current_value),
            colors: generateColors(enrichedPositions.length)
        };

        return {
            portfolio: {
                id: portfolio._id.toString(),
                name: portfolio.name,
                created_at: portfolio.created_at
            },
            positions: enrichedPositions,
            transactions: transactions.slice(0, 20), // Letzte 20 Transaktionen
            stats: {
                totalValue,
                totalInvestment,
                totalGainLoss,
                totalGainLossPercent,
                positionCount: enrichedPositions.length,
                transactionCount: transactions.length
            },
            topPerformers,
            worstPerformers,
            assetDistribution
        };
    } catch (err) {
        console.error('Portfolio detail error:', err);
        
        if (err.status) {
            throw err; // Weitergeben von 404/403 Errors
        }
        
        throw error(500, 'Portfolio konnte nicht geladen werden');
    }
}

function generateColors(count) {
    const baseColors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
        '#a8edea', '#fed6e3', '#ff9a9e', '#fecfef'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Hilfsfunktion für DB (falls noch nicht vorhanden)
async function getPortfolioById(portfolioId) {
    const db = await getDb();
    return db.collection('portfolios').findOne({ _id: new ObjectId(portfolioId) });
}

export const actions = {
    // Quick Buy Action
    quickBuy: async ({ request, params, locals }) => {
        if (!locals.user) {
            throw redirect(303, '/auth/login');
        }

        const formData = await request.formData();
        const symbol = formData.get('symbol');
        const quantity = parseFloat(formData.get('quantity'));

        if (!symbol || !quantity || quantity <= 0) {
            return {
                success: false,
                error: 'Ungültige Eingabe'
            };
        }

        try {
            // Aktuelle Preise holen
            const priceData = await fetchAssetPrice(symbol);
            
            // Transaktion hinzufügen
            await addTransaction(params.id, {
                symbol,
                type: 'buy',
                quantity,
                price: priceData.price,
                currency: priceData.currency || 'USD',
                date: new Date()
            });

            return {
                success: true,
                message: `${quantity} ${symbol} erfolgreich gekauft`
            };
        } catch (error) {
            console.error('Quick buy error:', error);
            return {
                success: false,
                error: 'Kauf konnte nicht ausgeführt werden'
            };
        }
    },

    // Quick Sell Action
    quickSell: async ({ request, params, locals }) => {
        if (!locals.user) {
            throw redirect(303, '/auth/login');
        }

        const formData = await request.formData();
        const symbol = formData.get('symbol');
        const quantity = parseFloat(formData.get('quantity'));

        if (!symbol || !quantity || quantity <= 0) {
            return {
                success: false,
                error: 'Ungültige Eingabe'
            };
        }

        try {
            // Position prüfen
            const positions = await getPortfolioPositions(params.id);
            const position = positions.find(p => p.symbol === symbol);
            
            if (!position || position.quantity < quantity) {
                return {
                    success: false,
                    error: 'Nicht genügend Anteile vorhanden'
                };
            }

            // Aktuelle Preise holen
            const priceData = await fetchAssetPrice(symbol);
            
            // Transaktion hinzufügen
            await addTransaction(params.id, {
                symbol,
                type: 'sell',
                quantity,
                price: priceData.price,
                currency: priceData.currency || 'USD',
                date: new Date()
            });

            return {
                success: true,
                message: `${quantity} ${symbol} erfolgreich verkauft`
            };
        } catch (error) {
            console.error('Quick sell error:', error);
            return {
                success: false,
                error: 'Verkauf konnte nicht ausgeführt werden'
            };
        }
    }
};