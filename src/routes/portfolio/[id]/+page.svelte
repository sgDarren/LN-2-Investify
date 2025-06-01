<!-- src/routes/assets/[symbol]/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import LineChart from '$lib/components/LineChart.svelte';
  
  const { data, form } = $props();
  
  // State
  let showBuyModal = $state(false);
  let showSellModal = $state(false);
  let selectedPortfolioId = $state(data.userPortfolios[0]?.id || '');
  let quantity = $state(1);
  let isSubmitting = $state(false);
  
  // Calculated values
  let totalBuyValue = $derived(quantity * data.asset.price);
  let totalSellValue = $derived(quantity * data.asset.price);
  let maxSellQuantity = $derived(data.userPosition?.amount || 0);
  
  // Formatters
  function formatCurrency(value, currency = 'CHF') {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency
    }).format(value);
  }
  
  function formatPercent(value) {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  }
  
  function formatNumber(value) {
    return new Intl.NumberFormat('de-CH').format(value);
  }
  
  function formatMarketCap(value) {
    if (!value) return '–';
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return formatNumber(value);
  }
  
  // Modal handlers
  function openBuyModal() {
    if (!data.isAuthenticated) {
      goto('/auth/login');
      return;
    }
    showBuyModal = true;
    quantity = 1;
  }
  
  function openSellModal() {
    if (!data.isAuthenticated) {
      goto('/auth/login');
      return;
    }
    if (!data.userPosition) {
      alert('Sie besitzen dieses Asset nicht');
      return;
    }
    showSellModal = true;
    quantity = 1;
  }
  
  function closeBuyModal() {
    showBuyModal = false;
    quantity = 1;
  }
  
  function closeSellModal() {
    showSellModal = false;
    quantity = 1;
  }
</script>

<svelte:head>
  <title>{data.asset.symbol} - {data.asset.name} | Investify</title>
</svelte:head>

<div class="container-fluid py-4">
  <!-- Breadcrumb -->
  <nav aria-label="breadcrumb" class="mb-4">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
      <li class="breadcrumb-item"><a href="/assets">Assets</a></li>
      <li class="breadcrumb-item active">{data.asset.symbol}</li>
    </ol>
  </nav>

  <!-- Header -->
  <div class="row mb-4">
    <div class="col">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="d-flex align-items-center mb-2">
            <div class="asset-logo me-3">
              {data.asset.symbol.substring(0, 2)}
            </div>
            <div>
              <h1 class="h2 mb-0">{data.asset.name}</h1>
              <div class="text-muted">
                <span class="badge bg-primary me-2">{data.asset.symbol}</span>
                <span class="badge bg-secondary">{data.asset.type?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="text-end">
          <div class="price-display">
            <h2 class="mb-0">{formatCurrency(data.asset.price, data.asset.currency)}</h2>
            <div class="{data.asset.changePercent >= 0 ? 'text-success' : 'text-danger'}">
              <i class="bi bi-{data.asset.changePercent >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
              {formatCurrency(Math.abs(data.asset.change), data.asset.currency)}
              ({formatPercent(data.asset.changePercent)})
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Alerts -->
  {#if form?.success}
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="bi bi-check-circle me-2"></i>{form.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  {/if}

  {#if form?.error}
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>{form.error}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  {/if}

  <div class="row">
    <!-- Main Content -->
    <div class="col-lg-8">
      <!-- Price Chart -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white">
          <h5 class="mb-0">Kursverlauf (30 Tage)</h5>
        </div>
        <div class="card-body">
          <LineChart data={data.historicalData} height={400} />
        </div>
      </div>

      <!-- Asset Info -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white">
          <h5 class="mb-0">Über {data.asset.name}</h5>
        </div>
        <div class="card-body">
          <p>{data.asset.description}</p>
          
          <div class="row mt-4">
            <div class="col-md-6">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="text-muted">Marktkapitalisierung</td>
                    <td class="text-end fw-bold">{formatMarketCap(data.asset.marketCap)}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Volumen (24h)</td>
                    <td class="text-end fw-bold">{formatNumber(data.asset.volume || 0)}</td>
                  </tr>
                  {#if data.asset.sector}
                    <tr>
                      <td class="text-muted">Sektor</td>
                      <td class="text-end fw-bold">{data.asset.sector}</td>
                    </tr>
                  {/if}
                </tbody>
              </table>
            </div>
            <div class="col-md-6">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="text-muted">Börse</td>
                    <td class="text-end fw-bold">{data.asset.exchange || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Währung</td>
                    <td class="text-end fw-bold">{data.asset.currency}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Letztes Update</td>
                    <td class="text-end fw-bold">
                      {new Date(data.asset.lastUpdated).toLocaleString('de-CH')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Assets -->
      {#if data.relatedAssets.length > 0}
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0">Ähnliche Assets</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              {#each data.relatedAssets as asset}
                <div class="col-md-6">
                  <a href="/assets/{asset.symbol.toLowerCase()}" class="text-decoration-none">
                    <div class="related-asset-card">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <div class="fw-bold">{asset.symbol}</div>
                          <small class="text-muted">{asset.name}</small>
                        </div>
                        <div class="text-end">
                          <div class="fw-bold">{formatCurrency(asset.price, asset.currency)}</div>
                          <small class="{asset.changePercent >= 0 ? 'text-success' : 'text-danger'}">
                            {formatPercent(asset.changePercent)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="col-lg-4">
      <!-- Action Buttons -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="d-grid gap-2">
            <button class="btn btn-success btn-lg" onclick={openBuyModal}>
              <i class="bi bi-cart-plus me-2"></i>Kaufen
            </button>
            <button 
              class="btn btn-danger btn-lg" 
              onclick={openSellModal}
              disabled={!data.userPosition}
            >
              <i class="bi bi-cash-coin me-2"></i>Verkaufen
            </button>
          </div>
        </div>
      </div>

      <!-- User Position -->
      {#if data.userPosition}
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white">
            <h5 class="mb-0">Ihre Position</h5>
          </div>
          <div class="card-body">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td class="text-muted">Anzahl</td>
                  <td class="text-end fw-bold">{data.userPosition.amount}</td>
                </tr>
                <tr>
                  <td class="text-muted">Durchschnittspreis</td>
                  <td class="text-end fw-bold">{formatCurrency(data.userPosition.avg_price)}</td>
                </tr>
                <tr>
                  <td class="text-muted">Aktueller Wert</td>
                  <td class="text-end fw-bold">{formatCurrency(data.userPosition.current_value)}</td>
                </tr>
                <tr>
                  <td class="text-muted">Gewinn/Verlust</td>
                  <td class="text-end fw-bold {data.userPosition.gain_loss >= 0 ? 'text-success' : 'text-danger'}">
                    {formatCurrency(data.userPosition.gain_loss)}
                    <small class="d-block">{formatPercent(data.userPosition.gain_loss_percent)}</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Quick Stats -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white">
          <h5 class="mb-0">Schnellübersicht</h5>
        </div>
        <div class="card-body">
          <div class="quick-stats">
            <div class="stat-item">
              <div class="stat-label">Tageshoch</div>
              <div class="stat-value text-success">
                {formatCurrency(data.asset.price * 1.02, data.asset.currency)}
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Tagestief</div>
              <div class="stat-value text-danger">
                {formatCurrency(data.asset.price * 0.98, data.asset.currency)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Buy Modal -->
{#if showBuyModal}
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-cart-plus me-2"></i>
            {data.asset.symbol} kaufen
          </h5>
          <button type="button" class="btn-close" onclick={closeBuyModal}></button>
        </div>
        
        <form 
          method="POST" 
          action="?/buy"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
              if (form?.success) {
                closeBuyModal();
              }
            };
          }}
        >
          <div class="modal-body">
            <div class="mb-3">
              <label for="buyPortfolio" class="form-label">Portfolio auswählen</label>
              <select 
                class="form-select" 
                id="buyPortfolio" 
                name="portfolioId"
                bind:value={selectedPortfolioId}
                required
                disabled={isSubmitting}
              >
                {#each data.userPortfolios as portfolio}
                  <option value={portfolio.id}>{portfolio.name}</option>
                {/each}
              </select>
            </div>
            
            <div class="mb-3">
              <label for="buyQuantity" class="form-label">Anzahl</label>
              <input 
                type="number" 
                class="form-control" 
                id="buyQuantity" 
                name="quantity"
                bind:value={quantity}
                min="0.01"
                step="0.01"
                required
                disabled={isSubmitting}
              />
              <div class="form-text">
                Preis pro Stück: {formatCurrency(data.asset.price, data.asset.currency)}
              </div>
            </div>
            
            <div class="alert alert-info">
              <div class="d-flex justify-content-between">
                <span>Gesamtbetrag:</span>
                <strong>{formatCurrency(totalBuyValue, data.asset.currency)}</strong>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick={closeBuyModal} disabled={isSubmitting}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-success" disabled={isSubmitting || quantity <= 0}>
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2"></span>
                Kaufe...
              {:else}
                <i class="bi bi-cart-check me-2"></i>
                Kaufen
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Sell Modal -->
{#if showSellModal}
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-cash-coin me-2"></i>
            {data.asset.symbol} verkaufen
          </h5>
          <button type="button" class="btn-close" onclick={closeSellModal}></button>
        </div>
        
        <form 
          method="POST" 
          action="?/sell"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
              if (form?.success) {
                closeSellModal();
              }
            };
          }}
        >
          <div class="modal-body">
            <div class="mb-3">
              <label for="sellPortfolio" class="form-label">Portfolio auswählen</label>
              <select 
                class="form-select" 
                id="sellPortfolio" 
                name="portfolioId"
                bind:value={selectedPortfolioId}
                required
                disabled={isSubmitting}
              >
                {#each data.userPortfolios as portfolio}
                  <option value={portfolio.id}>{portfolio.name}</option>
                {/each}
              </select>
            </div>
            
            <div class="mb-3">
              <label for="sellQuantity" class="form-label">Anzahl</label>
              <input 
                type="number" 
                class="form-control" 
                id="sellQuantity" 
                name="quantity"
                bind:value={quantity}
                min="0.01"
                max={maxSellQuantity}
                step="0.01"
                required
                disabled={isSubmitting}
              />
              <div class="form-text">
                Verfügbar: {maxSellQuantity} Stück
              </div>
            </div>
            
            <div class="alert alert-info">
              <div class="d-flex justify-content-between mb-2">
                <span>Verkaufswert:</span>
                <strong>{formatCurrency(totalSellValue, data.asset.currency)}</strong>
              </div>
              {#if data.userPosition}
                <div class="d-flex justify-content-between">
                  <span>Gewinn/Verlust:</span>
                  <strong class="{(data.asset.price - data.userPosition.avg_price) >= 0 ? 'text-success' : 'text-danger'}">
                    {formatCurrency((data.asset.price - data.userPosition.avg_price) * quantity, data.asset.currency)}
                  </strong>
                </div>
              {/if}
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick={closeSellModal} disabled={isSubmitting}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-danger" disabled={isSubmitting || quantity <= 0 || quantity > maxSellQuantity}>
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2"></span>
                Verkaufe...
              {:else}
                <i class="bi bi-cash-stack me-2"></i>
                Verkaufen
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Asset Logo */
  .asset-logo {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  /* Price Display */
  .price-display h2 {
    font-size: 2.5rem;
    font-weight: 700;
  }

  /* Cards */
  .card {
    border-radius: 12px;
  }

  .card-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 1.25rem;
  }

  /* Related Assets */
  .related-asset-card {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .related-asset-card:hover {
    background-color: #f8f9fa;
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Quick Stats */
  .quick-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .stat-item {
    text-align: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Tables */
  .table td {
    padding: 0.75rem 0;
    border: none;
  }

  .table tbody tr:not(:last-child) td {
    border-bottom: 1px solid #f0f0f0;
  }

  /* Modals */
  .modal {
    animation: fadeIn 0.2s ease;
  }

  .modal-dialog {
    animation: slideIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Buttons */
  .btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  }

  /* Breadcrumb */
  .breadcrumb {
    background: none;
    padding: 0;
  }

  .breadcrumb-item + .breadcrumb-item::before {
    content: "›";
  }

  /* Responsive */
  @media (max-width: 768px) {
    .asset-logo {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }

    .price-display h2 {
      font-size: 2rem;
    }

    .quick-stats {
      grid-template-columns: 1fr;
    }
  }
</style>