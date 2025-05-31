/** @type {import('./$types').PageServerLoad} */
export async function load() {
    return {};
};

// Empfohlene Runes-basierte Architektur
// State Management für Portfolio-Daten
let portfolioState = $state({
  assets: [],
  totalValue: 0,
  totalInvestment: 0,
  performancePercentage: 0
});

// Derived Values für Berechnungen
let portfolioMetrics = $derived(() => ({
  totalGainLoss: portfolioState.totalValue - portfolioState.totalInvestment,
  gainLossPercentage: ((portfolioState.totalValue / portfolioState.totalInvestment) - 1) * 100
}));