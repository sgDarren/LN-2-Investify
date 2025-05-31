import { authStore } from './auth.svelte.js';

let portfolioState = $state({
    positions: [],
    totalValue: 0,
    totalInvestment: 0,
    isLoading: false,
    lastUpdated: null
});

export function createPortfolioStore() {
    // Derived calculations
    const metrics = $derived(() => ({
        totalGainLoss: portfolioState.totalValue - portfolioState.totalInvestment,
        gainLossPercentage: portfolioState.totalInvestment > 0 
            ? ((portfolioState.totalValue / portfolioState.totalInvestment) - 1) * 100 
            : 0,
        positionCount: portfolioState.positions.length
    }));
    
    return {
        // Getters
        get positions() { return portfolioState.positions; },
        get totalValue() { return portfolioState.totalValue; },
        get totalInvestment() { return portfolioState.totalInvestment; },
        get isLoading() { return portfolioState.isLoading; },
        get metrics() { return metrics; },
        
        // Actions
        async loadPortfolio() {
            if (!authStore.isAuthenticated) return;
            
            portfolioState.isLoading = true;
            try {
                const response = await fetch('/api/portfolio');
                if (!response.ok) throw new Error('Failed to load portfolio');
                
                const data = await response.json();
                portfolioState.positions = data.positions;
                portfolioState.totalValue = data.totalValue;
                portfolioState.totalInvestment = data.totalInvestment;
                portfolioState.lastUpdated = new Date();
            } catch (error) {
                console.error('Error loading portfolio:', error);
            } finally {
                portfolioState.isLoading = false;
            }
        },
        
        async addTransaction(transaction) {
            try {
                const response = await fetch('/api/portfolio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transaction)
                });
                
                if (!response.ok) throw new Error('Failed to add transaction');
                
                // Reload portfolio after successful transaction
                await this.loadPortfolio();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        getPositionBySymbol(symbol) {
            return portfolioState.positions.find(p => p.asset_symbol === symbol);
        }
    };
}

export const portfolioStore = createPortfolioStore();