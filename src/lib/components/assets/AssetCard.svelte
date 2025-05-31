<!-- src/lib/components/assets/AssetCard.svelte -->
<script>
  // Props - position wird von Parent Component übergeben (Svelte 5 Runes)
  let { position } = $props();
  
  // Computed values für bessere Lesbarkeit (Svelte 5 Runes)
  let isPositive = $derived(position.gain_loss >= 0);
  let gainLossClass = $derived(isPositive ? 'text-success' : 'text-danger');
  let gainLossIcon = $derived(isPositive ? 'bi-arrow-up' : 'bi-arrow-down');
  
  // State für Loading-Zustände (falls benötigt)
  let isProcessing = $state(false);
  
  // Formatierung Funktionen
  function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
  
  function formatPercent(value) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
  
  function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  // Event Handlers
  function handleBuy() {
    isProcessing = true;
    console.log('Buy more', position.asset_symbol);
    // TODO: Implement buy logic
    setTimeout(() => isProcessing = false, 1000);
  }
  
  function handleSell() {
    isProcessing = true;
    console.log('Sell', position.asset_symbol);
    // TODO: Implement sell logic
    setTimeout(() => isProcessing = false, 1000);
  }
  
  function handleViewDetails() {
    console.log('View details', position.asset_symbol);
    // TODO: Navigate to asset details
  }
</script>

<div class="card h-100 shadow-sm border-0">
  <div class="card-body">
    <!-- Header mit Symbol und Name -->
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h5 class="card-title mb-1 fw-bold">{position.asset_symbol}</h5>
        {#if position.asset_name}
          <p class="text-muted small mb-0">{position.asset_name}</p>
        {/if}
      </div>
      
      <!-- Kategorie Badge -->
      {#if position.category}
        <span class="badge bg-light text-dark">
          {position.category.toUpperCase()}
        </span>
      {/if}
    </div>

    <!-- Holdings Info -->
    <div class="row mb-3">
      <div class="col-6">
        <div class="text-center">
          <div class="fw-semibold">{formatNumber(position.amount, 0)}</div>
          <small class="text-muted">Shares</small>
        </div>
      </div>
      <div class="col-6">
        <div class="text-center">
          <div class="fw-semibold">{formatCurrency(position.avg_price, position.currency)}</div>
          <small class="text-muted">Avg. Price</small>
        </div>
      </div>
    </div>

    <!-- Current Price -->
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <span class="text-muted">Current Price:</span>
        <span class="fw-bold">{formatCurrency(position.current_price, position.currency)}</span>
      </div>
    </div>

    <!-- Total Value -->
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <span class="text-muted">Total Value:</span>
        <span class="fw-bold fs-5">{formatCurrency(position.total_value, position.currency)}</span>
      </div>
    </div>

    <!-- Gain/Loss -->
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <span class="text-muted">Gain/Loss:</span>
        <div class="text-end">
          <div class="{gainLossClass} fw-bold">
            <i class="bi {gainLossIcon} me-1"></i>
            {formatCurrency(Math.abs(position.gain_loss), position.currency)}
          </div>
          <small class="{gainLossClass}">
            {formatPercent(position.gain_loss_percent || 0)}
          </small>
        </div>
      </div>
    </div>

    <!-- Progress Bar für Performance -->
    {#if position.gain_loss_percent}
      <div class="mb-3">
        <div class="progress" style="height: 6px;">
          <div 
            class="progress-bar {isPositive ? 'bg-success' : 'bg-danger'}"
            style="width: {Math.min(Math.abs(position.gain_loss_percent), 100)}%"
          ></div>
        </div>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="d-grid gap-2">
      <div class="btn-group" role="group">
        <button 
          type="button" 
          class="btn btn-outline-success btn-sm"
          on:click={handleBuy}
          disabled={isProcessing}
        >
          {#if isProcessing}
            <span class="spinner-border spinner-border-sm me-1"></span>
          {:else}
            <i class="bi bi-plus-circle me-1"></i>
          {/if}
          Buy
        </button>
        <button 
          type="button" 
          class="btn btn-outline-danger btn-sm"
          on:click={handleSell}
          disabled={isProcessing}
        >
          {#if isProcessing}
            <span class="spinner-border spinner-border-sm me-1"></span>
          {:else}
            <i class="bi bi-dash-circle me-1"></i>
          {/if}
          Sell
        </button>
        <button 
          type="button" 
          class="btn btn-outline-info btn-sm"
          on:click={handleViewDetails}
          disabled={isProcessing}
        >
          <i class="bi bi-info-circle me-1"></i>
          Details
        </button>
      </div>
    </div>

    <!-- Last Updated -->
    {#if position.last_updated}
      <div class="mt-2 text-center">
        <small class="text-muted">
          Updated: {new Date(position.last_updated).toLocaleString('de-DE')}
        </small>
      </div>
    {/if}
  </div>
</div>

<style>
  .card {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  }
  
  .progress {
    border-radius: 10px;
    background-color: #f8f9fa;
  }
  
  .progress-bar {
    border-radius: 10px;
  }
  
  .btn-group .btn {
    font-size: 0.875rem;
  }
  
  .badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
  
  .spinner-border-sm {
    width: 0.875rem;
    height: 0.875rem;
  }
</style>