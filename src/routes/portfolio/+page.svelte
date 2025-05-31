<script>
import { onMount } from 'svelte';
import { portfolioStore } from '$lib/stores/portfolio.svelte.js';
import { assetStore } from '$lib/stores/assets.svelte.js';
import AssetCard from '$lib/components/AssetCard.svelte';

let positions = $derived(portfolioStore.positions);
let isLoading = $derived(portfolioStore.isLoading);
let totalValue = $derived(portfolioStore.totalValue);
let totalGainLoss = $derived(portfolioStore.totalGainLoss);

let searchTerm = $state('');
let selectedFilter = $state('all');

let filteredPositions = $derived(() => {
    if (!positions) return [];
    
    return positions.filter(position => {
        const matchesSearch = position.asset_symbol.toLowerCase()
            .includes(searchTerm.toLowerCase());
        
        const matchesFilter = selectedFilter === 'all' || 
            (selectedFilter === 'gainers' && position.gain_loss > 0) ||
            (selectedFilter === 'losers' && position.gain_loss < 0);
            
        return matchesSearch && matchesFilter;
    });
});

onMount(() => {
    portfolioStore.loadPortfolio();
});

async function refreshPrices() {
    for (const position of positions) {
        try {
            await assetStore.fetchPrice(position.asset_symbol);
        } catch (error) {
            console.error(`Failed to refresh ${position.asset_symbol}:`, error);
        }
    }
    await portfolioStore.loadPortfolio();
}
</script>

<svelte:head>
    <title>Portfolio - Investify</title>
</svelte:head>

<div class="container-fluid">
    <div class="row mb-4">
        <div class="col">
            <div class="d-flex justify-content-between align-items-center">
                <h1 class="h2">Your Portfolio</h1>
                <button 
                    class="btn btn-outline-primary" 
                    onclick={refreshPrices}
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <span class="spinner-border spinner-border-sm me-2"></span>
                    {/if}
                    Refresh Prices
                </button>
            </div>
        </div>
    </div>
    
    <!-- Filter Controls -->
    <div class="row mb-3">
        <div class="col-md-6">
            <input 
                type="text" 
                class="form-control" 
                placeholder="Search assets..."
                bind:value={searchTerm}
            />
        </div>
        <div class="col-md-3">
            <select class="form-select" bind:value={selectedFilter}>
                <option value="all">All Positions</option>
                <option value="gainers">Gainers</option>
                <option value="losers">Losers</option>
            </select>
        </div>
    </div>
    
    <!-- Portfolio Grid -->
    {#if isLoading}
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    {:else if filteredPositions.length === 0}
        <div class="text-center py-5">
            <h3>No positions found</h3>
            <p class="text-muted">
                {#if searchTerm}
                    No assets match your search criteria.
                {:else}
                    Start investing to see your portfolio here.
                {/if}
            </p>
            <a href="/assets" class="btn btn-primary">Browse Assets</a>
        </div>
    {:else}
        <div class="row">
            {#each filteredPositions as position (position.asset_symbol)}
                <div class="col-md-6 col-lg-4 mb-3">
                    <AssetCard {position} />
                </div>
            {/each}
        </div>
    {/if}
</div>