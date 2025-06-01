// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';
import { 
    getUserPortfolios, 
    getPortfolioPositions,
    createPortfolio,
    getPortfolioTransactions,
    getUserTransactions
} from '$lib/server/db.js';
import { fetchAssetPrice } from '$lib/server/assets.js';

export async function load({ locals }) {
    // Auth Check
    if (!locals.user) {
        throw redirect(302, '/auth/login');
    }

    try {
        // Portfolios des Users laden
        const portfolios = await getUserPortfolios(locals.user.id);
        
        // KPIs initialisieren
        let totalValue = 0;
        let totalInvestment = 0;
        let dayChange = 0;
        const portfolioDetails = [];
        
        // Für jedes Portfolio Details berechnen
        for (const portfolio of portfolios) {
            const positions = await getPortfolioPositions(portfolio.id);
            
            let portfolioValue = 0;
            let portfolioInvestment = 0;
            let portfolioDayChange = 0;
            
            // Für jede Position aktuelle Preise holen
            for (const position of positions) {
                try {
                    // Berechne Investment (Kostenbasis)
                    const investment = position.quantity * position.avg_price;
                    portfolioInvestment += investment;
                    
                    // Nutze bereits berechnete Werte aus getPortfolioPositions
                    portfolioValue += position.total_value || (position.quantity * position.current_price);
                    
                    // Versuche Tagesveränderung zu berechnen
                    if (position.current_price && position.quantity) {
                        try {
                            const priceData = await fetchAssetPrice(position.symbol);
                            if (priceData && priceData.change) {
                                portfolioDayChange += position.quantity * priceData.change;
                            }
                        } catch (error) {
                            // Ignoriere Fehler bei der Preisabfrage
                            console.error(`Preisabfrage fehlgeschlagen für ${position.symbol}:`, error);
                        }
                    }
                } catch (error) {
                    console.error(`Fehler bei Position ${position.symbol}:`, error);
                }
            }
            
            // Portfolio-Wert wurde bereits in getUserPortfolios berechnet
            // Nutze den berechneten Wert falls vorhanden
            portfolioValue = portfolio.value || portfolioValue;
            
            totalValue += portfolioValue;
            totalInvestment += portfolioInvestment;
            dayChange += portfolioDayChange;
            
            // Portfolio-Details für Frontend
            portfolioDetails.push({
                ...portfolio,
                id: portfolio.id,
                name: portfolio.name,
                value: portfolioValue,
                investment: portfolioInvestment,
                gainLoss: portfolioValue - portfolioInvestment,
                gainLossPercent: portfolioInvestment > 0 
                    ? ((portfolioValue - portfolioInvestment) / portfolioInvestment) * 100 
                    : 0,
                created_at: portfolio.created_at
            });
        }
        
        // Gesamtstatistiken
        const totalGainLoss = totalValue - totalInvestment;
        const totalGainLossPercent = totalInvestment > 0 
            ? (totalGainLoss / totalInvestment) * 100 
            : 0;
        const dayChangePercent = totalValue > 0 
            ? (dayChange / totalValue) * 100 
            : 0;
        
        // Pie Chart Daten
        const pieData = {
            labels: portfolioDetails.map(p => p.name),
            values: portfolioDetails.map(p => p.value),
            colors: generateColors(portfolioDetails.length)
        };
        
        // Letzte Transaktionen (max 10 für Dashboard)
        const recentTransactions = await getUserTransactions(locals.user.id, 10);
        
        return {
            user: locals.user,
            kpis: {
                totalValue,
                totalInvestment,
                totalGainLoss,
                totalGainLossPercent,
                dayChange,
                dayChangePercent
            },
            portfolios: portfolioDetails,
            pieData,
            recentTransactions
        };
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        
        // Fehler-Fallback mit leeren Daten
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
            pieData: { 
                labels: [], 
                values: [], 
                colors: [] 
            },
            recentTransactions: [],
            error: 'Dashboard konnte nicht geladen werden. Bitte versuchen Sie es später erneut.'
        };
    }
}

// Hilfsfunktion für Farben
function generateColors(count) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
        '#a8edea', '#fed6e3'
    ];
    
    // Wiederhole Farben falls mehr Portfolios als Farben
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// Form Actions
export const actions = {
    createPortfolio: async ({ request, locals }) => {
        // Auth Check
        if (!locals.user) {
            throw redirect(302, '/auth/login');
        }

        const data = await request.formData();
        const name = data.get('name')?.toString().trim();

        // Validierung
        if (!name) {
            return {
                success: false,
                error: 'Portfolio Name ist erforderlich'
            };
        }

        if (name.length < 2) {
            return {
                success: false,
                error: 'Portfolio Name muss mindestens 2 Zeichen lang sein'
            };
        }

        if (name.length > 50) {
            return {
                success: false,
                error: 'Portfolio Name darf maximal 50 Zeichen lang sein'
            };
        }

        try {
            // Prüfe ob User bereits ein Portfolio mit diesem Namen hat
            const existingPortfolios = await getUserPortfolios(locals.user.id);
            const nameExists = existingPortfolios.some(
                p => p.name.toLowerCase() === name.toLowerCase()
            );
            
            if (nameExists) {
                return {
                    success: false,
                    error: 'Ein Portfolio mit diesem Namen existiert bereits'
                };
            }

            // Portfolio erstellen
            const newPortfolio = await createPortfolio(locals.user.id, name);
            
            return {
                success: true,
                message: `Portfolio "${name}" wurde erfolgreich erstellt`,
                portfolioId: newPortfolio.id
            };
        } catch (error) {
            console.error('Create portfolio error:', error);
            return {
                success: false,
                error: 'Portfolio konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.'
            };
        }
    }
};