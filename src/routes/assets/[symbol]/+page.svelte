<script>
import { onMount } from 'svelte';
import { assetStore } from '$lib/stores/assets.svelte.js';
import { portfolioStore } from '$lib/stores/portfolio.svelte.js';
import PriceChart from '$lib/components/assets/PriceChart.svelte';
import BuyForm from '$lib/components/assets/BuyForm.svelte';

let { data } = $props();

let selectedPeriod = $state('30d');
let historicalData = $state(null);
let isLoadingHistory = $state(false);

let symbol = $derived(data.symbol);
let currentAsset = $derived(assetStore.currentAsset);
let currentPosition = $derived(
    portfolioStore.getPositionBySymbol(symbol)
);
let priceChangeClass = $derived(
    currentAsset?.change >= 0 ? 'text-success' : 'text-danger'
);

// Load historical data
async function loadHistoricalData(period) {
    isLoadingHistory = true;
    try {
        const response = await fetch(`/api/assets/${symbol}/history?period=${period}`);
        if (response.ok) {
            historicalData = await response.json();
        }
    } catch (error) {
        console.error('Failed to load historical data:', error);
    } finally {
        isLoadingHistory = false;
    }
}

onMount(() => {
    if (data.assetData) {
        assetStore.setCurrentAsset(data.assetData);
    }
    loadHistoricalData(selectedPeriod);
});

// Watch for period changes
$effect(() => {
    if (selectedPeriod) {
        loadHistoricalData(selectedPeriod);
    }
});
</script>

<svelte:head>
    <title>{symbol} - Investify</title>
</svelte:head>

<div class="container-fluid">
    <!-- Asset Header -->
    <div class="row mb-4">
        <div class="col">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="/assets">Assets</a></li>
                    <li class="breadcrumb-item active">{symbol}</li>
                </ol>
            </nav>
            
            {#if currentAsset}
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 class="h2">{currentAsset.symbol}</h1>
                        <div class="d-flex align-items-center">
                            <span class="h3 me-3">
                                {new Intl.NumberFormat('de-CH', { 
                                    style: 'currency', 
                                    currency: 'CHF' 
                                }).format(currentAsset.price)}
                            </span>
                            <span class={`badge ${currentAsset.change >= 0 ? 'bg-success' : 'bg-danger'}`}>
                                {currentAsset.change >= 0 ? '+' : ''}{currentAsset.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    
                    {#if currentPosition}
                        <div class="text-end">
                            <div class="text-muted">Your Position</div>
                            <div class="fw-bold">
                                {currentPosition.amount} shares
                            </div>
                            <div class="text-muted">
                                Avg: {new Intl.NumberFormat('de-CH', { 
                                    style: 'currency', 
                                    currency: 'CHF' 
                                }).format(currentPosition.avg_price)}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
    
    <div class="row">
        <!-- Chart Section -->
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">Price Chart</h5>
                        <div class="btn-group" role="group">
                            <input 
                                type="radio" 
                                class="btn-check" 
                                name="period" 
                                id="period7d" 
                                value="7d"
                                bind:group={selectedPeriod}
                            />
                            <label class="btn btn-outline-primary" for="period7d">7D</label>
                            
                            <input 
                                type="radio" 
                                class="btn-check" 
                                name="period" 
                                id="period30d" 
                                value="30d"
                                bind:group={selectedPeriod}
                            />
                            <label class="btn btn-outline-primary" for="period30d">30D</label>
                            
                            <input 
                                type="radio" 
                                class="btn-check" 
                                name="period" 
                                id="period1y" 
                                value="1y"
                                bind:group={selectedPeriod}
                            />
                            <label class="btn btn-outline-primary" for="period1y">1Y</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    {#if isLoadingHistory}
                        <div class="text-center py-5">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading chart...</span>
                            </div>
                        </div>
                    {:else if historicalData}
                        <PriceChart data={historicalData} />
                    {:else}
                        <div class="text-center py-5 text-muted">
                            <p>Chart data unavailable</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        
        <!-- Buy Form Section -->
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">Trade {symbol}</h5>
                </div>
                <div class="card-body">
                    {#if currentAsset}
                        <BuyForm 
                            symbol={currentAsset.symbol} 
                            currentPrice={currentAsset.price} 
                        />
                    {:else}
                        <div class="text-center py-3">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- Asset Info Card -->
            {#if currentAsset}
                <div class="card mt-3">
                    <div class="card-header">
                        <h6 class="card-title mb-0">Asset Information</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <div class="text-muted">Type</div>
                                <div class="fw-bold text-capitalize">{currentAsset.type}</div>
                            </div>
                            <div class="col-6">
                                <div class="text-muted">Last Updated</div>
                                <div class="fw-bold">
                                    {new Date(currentAsset.lastUpdated).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
<!-- 
<script>
  let { data } = $props();
</script>

<h1>List of all Artists</h1>
<a href="/artists/create">+ Add Artist</a>
<table class="table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Origin</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each data.artists as artist}
      <tr>
        <td>
          <a href={"/artists/" + artist._id}>
            {artist._id}
          </a>
        </td>
        <td>
          {artist.name}
        </td>
        <td>
          {artist.origin}
        </td>
        <td>
          <form method="POST" action="?/delete">
            <input type="hidden" name="id" value={artist._id} />
            <button class="btn btn-danger">X</button>
          </form>
        </td>
      </tr>
    {/each}
  </tbody>
</table> -->
