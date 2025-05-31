import { authStore } from './auth.svelte.js';

class PortfolioStore {
    positions = $state([]);
    totalValue = $state(0);
    totalInvestment = $state(0);
    isLoading = $state(false);
    lastUpdated = $state(null);
    
    // Derived calculations mit Runes
    totalGainLoss = $derived(this.totalValue - this.totalInvestment);
    gainLossPercentage = $derived(
        this.totalInvestment > 0 
            ? ((this.totalValue / this.totalInvestment) - 1) * 100 
            : 0
    );
    positionCount = $derived(this.positions.length);
    
    // Actions
    async loadPortfolio() {
        if (!authStore.isAuthenticated) return;
        
        this.isLoading = true;
        try {
            const response = await fetch('/api/portfolio');
            if (!response.ok) throw new Error('Failed to load portfolio');
            
            const data = await response.json();
            this.positions = data.positions;
            this.totalValue = data.totalValue;
            this.totalInvestment = data.totalInvestment;
            this.lastUpdated = new Date();
        } catch (error) {
            console.error('Error loading portfolio:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
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
    }
    
    getPositionBySymbol(symbol) {
        return this.positions.find(p => p.asset_symbol === symbol);
    }
}

// Singleton export mit Runes
export const portfolioStore = new PortfolioStore();