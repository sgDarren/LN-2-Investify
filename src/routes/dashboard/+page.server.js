import { redirect } from '@sveltejs/kit';
import { 
    getUserPortfolios, 
    getPortfolioPositions,
    createPortfolio,
    getPortfolioTransactions 
} from '$lib/server/db.js';
import { fetchAssetPrice } from '$lib/server/assets.js';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(302, '/auth/login');
    }

    try {
        const portfolios = await getUserPortfolios(locals.user.id);
        
        // KPIs berechnen
        let totalValue = 0;
        let totalInvestment = 0;
        let dayChange = 0;
        const portfolioDetails = [];
        
        for (const portfolio of portfolios) {
            const positions = await getPortfolioPositions(portfolio.id);
            let portfolioValue = 0;
            let portfolioInvestment = 0;
            let portfolioDayChange = 0;
            
            for (const position of positions) {
                try {
                    const priceData = await fetchAssetPrice(position.symbol);
                    const currentValue = position.quantity * priceData.price;
                    const investment = position.quantity * position.avg_price;
                    
                    portfolioValue += currentValue;
                    portfolioInvestment += investment;
                    portfolioDayChange += position.quantity * priceData.change;
                } catch (error) {
                    console.error(`Error fetching price for ${position.symbol}:`, error);
                }
            }
            
            totalValue += portfolioValue;
            totalInvestment += portfolioInvestment;
            dayChange += portfolioDayChange;
            
            portfolioDetails.push({
                ...portfolio,
                value: portfolioValue,
                investment: portfolioInvestment,
                gainLoss: portfolioValue - portfolioInvestment,
                gainLossPercent: portfolioInvestment > 0 
                    ? ((portfolioValue - portfolioInvestment) / portfolioInvestment) * 100 
                    : 0
            });
        }
        
        // Pie Chart Daten
        const pieData = {
            labels: portfolioDetails.map(p => p.name),
            values: portfolioDetails.map(p => p.value),
            colors: generateColors(portfolioDetails.length)
        };
        
        // Recent Transactions
        let recentTransactions = [];
        for (const portfolio of portfolios) {
            const transactions = await getPortfolioTransactions(portfolio.id);
            recentTransactions = [...recentTransactions, 
                ...transactions.slice(0, 5).map(t => ({
                    ...t,
                    portfolio_name: portfolio.name
                }))
            ];
        }
        recentTransactions.sort((a, b) => 
            new Date(b.transaction_date) - new Date(a.transaction_date)
        );
        recentTransactions = recentTransactions.slice(0, 10);
        
        return {
            user: locals.user,
            kpis: {
                totalValue,
                totalInvestment,
                totalGainLoss: totalValue - totalInvestment,
                totalGainLossPercent: totalInvestment > 0 
                    ? ((totalValue - totalInvestment) / totalInvestment) * 100 
                    : 0,
                dayChange,
                dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0
            },
            portfolios: portfolioDetails,
            pieData,
            recentTransactions
        };
    } catch (error) {
        console.error('Dashboard load error:', error);
        return {
            user: locals.user,
            kpis: {
                totalValue: 0,
                totalInvestment: 0,
                totalGainLoss: 0,
                totalGainLossPercent: 0,
                dayChange: 0,
                dayChangePercent: 0
            },
            portfolios: [],
            pieData: { labels: [], values: [], colors: [] },
            recentTransactions: [],
            error: 'Dashboard konnte nicht geladen werden'
        };
    }
}

function generateColors(count) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
    ];
    return colors.slice(0, count);
}

export const actions = {
    createPortfolio: async ({ request, locals }) => {
        if (!locals.user) {
            throw redirect(302, '/auth/login');
        }

        const data = await request.formData();
        const name = data.get('name')?.toString().trim();

        if (!name) {
            return {
                success: false,
                error: 'Portfolio Name ist erforderlich'
            };
        }

        try {
            await createPortfolio(locals.user.id, name);
            return {
                success: true,
                message: 'Portfolio erfolgreich erstellt'
            };
        } catch (error) {
            console.error('Create portfolio error:', error);
            return {
                success: false,
                error: 'Portfolio konnte nicht erstellt werden'
            };
        }
    }
};