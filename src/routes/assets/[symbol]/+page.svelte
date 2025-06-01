<!-- src/routes/assets/[symbol]/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import LineChart from '$lib/components/LineChart.svelte';
  import AssetCard from '$lib/components/AssetCard.svelte';

  // Props von +page.server.js
  const { data, form } = $props();
  
  // State Management mit Runes
  let activeTab = $state('overview');
  let showBuyModal = $state(false);
  let showSellModal = $state(false);
  let quantity = $state(1);
  let selectedPortfolio = $state('');
  let isSubmitting = $state(false);
  let isLoading = $state(true);

  // Simulate loading
  $effect(() => {
    if (data) {
      setTimeout(() => {
        isLoading = false;
      }, 300);
    }
  });

  // Asset aus data extrahieren
  const asset = $derived(data?.asset);
  const position = $derived(data?.position);
  const portfolios = $derived(data?.portfolios || []);
  const priceHistory = $derived(data?.priceHistory || []);

  // Chart-Daten für Preisverlauf
  const chartData = $derived(() => {
    if (!priceHistory || priceHistory.length === 0) {
      // Simulierte Daten für Demo
      const days = 30;
      const basePrice = asset?.price || 100;
      const prices = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const volatility = (Math.random() - 0.5) * 0.05;
        const trend = (i / days) * ((asset?.changePercent || 0) / 100);
        const price = basePrice * (1 + trend + volatility);
        
        prices.push({
          date: date.toISOString(),
          price: Math.max(price, 0.01)
        });
      }
      
      return {
        symbol: asset?.symbol,
        prices
      };
    }
    
    return {
      symbol: asset?.symbol,
      prices: priceHistory
    };
  });

  // Formatierung
  function formatCurrency(value, currency = 'CHF') {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency
    }).format(value || 0);
  }

  function formatPercent(value) {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  }

  function formatNumber(value) {
    if (!value) return '0';
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toLocaleString();
  }

  // Modal Handlers
  function openBuyModal() {
    if (!data?.user) {
      goto('/auth/login');
      return;
    }
    if (portfolios.length === 0) {
      goto('/dashboard');
      return;
    }
    selectedPortfolio = portfolios[0]?.id || '';
    showBuyModal = true;
  }

  function openSellModal() {
    if (!data?.user) {
      goto('/auth/login');
      return;
    }
    if (!position) {
      return;
    }
    selectedPortfolio = position.portfolio_id || '';
    quantity = Math.min(1, position.quantity);
    showSellModal = true;
  }

  function closeBuyModal() {
    showBuyModal = false;
    quantity = 1;
    selectedPortfolio = '';
  }

  function closeSellModal() {
    showSellModal = false;
    quantity = 1;
    selectedPortfolio = '';
  }

  // Category Icon/Color mapping
  const categoryConfig = $derived(() => {
    const configs = {
      'Crypto': { icon: 'bi-currency-bitcoin', color: '#f7931a' },
      'Stocks': { icon: 'bi-graph-up', color: '#667eea' },
      'ETF': { icon: 'bi-collection', color: '#43e97b' },
      'Bonds': { icon: 'bi-bank', color: '#4facfe' },
      'Commodities': { icon: 'bi-gem', color: '#fa709a' }
    };
    return configs[asset?.category] || { icon: 'bi-coin', color: '#667eea' };
  });
</script>

<svelte:head>
  <title>{asset?.symbol || 'Asset'} - Details | Investify</title>
  <meta name="description" content="Detailansicht für {asset?.name || asset?.symbol} mit aktuellen Kursen, Charts und Handelsmöglichkeiten" />
</svelte:head>

<div class="container-fluid py-4">
  <!-- Breadcrumb -->
  <nav aria-label="breadcrumb" class="mb-4">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
      <li class="breadcrumb-item"><a href="/assets">Assets</a></li>
      <li class="breadcrumb-item active">{asset?.symbol || 'Loading...'}</li>
    </ol>
  </nav>

  {#if isLoading}
    <!-- Skeleton Loading -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <div class="skeleton skeleton-text mb-2" style="width: 200px; height: 32px;"></div>
                <div class="skeleton skeleton-text mb-3" style="width: 300px; height: 20px;"></div>
                <div class="skeleton skeleton-text mb-4" style="width: 150px; height: 48px;"></div>
              </div>
              <div class="col-md-4">
                <div class="skeleton" style="width: 100%; height: 200px; border-radius: 8px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if asset}
    <!-- Asset Header -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card asset-header-card">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <div class="d-flex align-items-center mb-3">
                  <div class="asset-icon me-3" style="background-color: {categoryConfig.color}20; color: {categoryConfig.color}">
                    <i class="bi {categoryConfig.icon}"></i>
                  </div>
                  <div>
                    <h1 class="h2 mb-1">{asset.symbol}</h1>
                    <p class="text-muted mb-0">{asset.name || asset.symbol}</p>
                    <span class="badge mt-1" style="background-color: {categoryConfig.color}15; color: {categoryConfig.color}">
                      {asset.category || asset.type}
                    </span>
                  </div>
                </div>

                <!-- Price Info -->
                <div class="price-section">
                  <div class="current-price mb-2">
                    <span class="h1 fw-bold">{formatCurrency(asset.price, asset.currency)}</span>
                    <span class="price-change ms-3 {asset.changePercent >= 0 ? 'text-success' : 'text-danger'}">
                      <i class="bi bi-arrow-{asset.changePercent >= 0 ? 'up' : 'down'}"></i>
                      {formatPercent(asset.changePercent || 0)}
                      <small class="ms-1">({formatCurrency(asset.change || 0, asset.currency)})</small>
                    </span>
                  </div>
                  <small class="text-muted">
                    Letzte Aktualisierung: {new Date(asset.lastUpdated || Date.now()).toLocaleString('de-CH')}
                  </small>
                </div>
              </div>

              <div class="col-md-4">
                <!-- Action Buttons -->
                <div class="action-buttons text-end">
                  {#if position}
                    <div class="position-info mb-3 p-3 bg-light rounded">
                      <h6 class="text-muted mb-2">Ihre Position</h6>
                      <div class="fw-bold">{position.quantity} Stück</div>
                      <div class="text-muted small">Ø {formatCurrency(position.avg_price, asset.currency)}</div>
                      <div class="mt-2 {position.unrealized_pnl >= 0 ? 'text-success' : 'text-danger'}">
                        {formatCurrency(position.unrealized_pnl, asset.currency)}
                        <small>({formatPercent(position.unrealized_pnl_percent)})</small>
                      </div>
                    </div>
                  {/if}

                  <div class="btn-group w-100" role="group">
                    <button 
                      class="btn btn-success btn-lg"
                      onclick={openBuyModal}
                      disabled={!data?.user}
                    >
                      <i class="bi bi-cart-plus me-2"></i>Kaufen
                    </button>
                    <button 
                      class="btn btn-danger btn-lg"
                      onclick={openSellModal}
                      disabled={!position}
                    >
                      <i class="bi bi-cash-stack me-2"></i>Verkaufen
                    </button>
                  </div>

                  {#if !data?.user}
                    <small class="text-muted d-block mt-2 text-center">
                      <a href="/auth/login">Anmelden</a> zum Handeln
                    </small>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Market Data Cards -->
    <div class="row g-3 mb-4">
      {#each [
        { label: 'Marktkapitalisierung', value: formatNumber(asset.marketCap), icon: 'bi-pie-chart', color: 'primary' },
        { label: 'Volumen (24h)', value: formatNumber(asset.volume), icon: 'bi-bar-chart', color: 'info' },
        { label: 'Sektor', value: asset.sector || 'N/A', icon: 'bi-building', color: 'secondary' },
        { label: 'Börse', value: asset.exchange || 'N/A', icon: 'bi-bank2', color: 'warning' }
      ] as metric}
        <div class="col-md-3">
          <div class="card metric-card">
            <div class="card-body text-center">
              <div class="metric-icon mb-2">
                <i class="bi {metric.icon} text-{metric.color}"></i>
              </div>
              <h6 class="metric-label text-muted">{metric.label}</h6>
              <div class="metric-value fw-bold">{metric.value}</div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button 
          class="nav-link {activeTab === 'overview' ? 'active' : ''}"
          onclick={() => activeTab = 'overview'}
        >
          <i class="bi bi-graph-up me-2"></i>Übersicht
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link {activeTab === 'chart' ? 'active' : ''}"
          onclick={() => activeTab = 'chart'}
        >
          <i class="bi bi-activity me-2"></i>Chart
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="nav-link {activeTab === 'details' ? 'active' : ''}"
          onclick={() => activeTab = 'details'}
        >
          <i class="bi bi-info-circle me-2"></i>Details
        </button>
      </li>
    </ul>

    <!-- Tab Content -->
    {#if activeTab === 'overview'}
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Kursverlauf (30 Tage)</h5>
            </div>
            <div class="card-body">
              <LineChart data={chartData} height={400} />
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0">Schnellzugriff</h5>
            </div>
            <div class="card-body">
              <AssetCard {asset} {position} />
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if activeTab === 'chart'}
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Interaktiver Chart</h5>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary active">1T</button>
            <button class="btn btn-outline-secondary">7T</button>
            <button class="btn btn-outline-secondary">1M</button>
            <button class="btn btn-outline-secondary">3M</button>
            <button class="btn btn-outline-secondary">1J</button>
          </div>
        </div>
        <div class="card-body">
          <LineChart data={chartData} height={500} />
        </div>
      </div>
    {/if}

    {#if activeTab === 'details'}
      <div class="row">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Asset-Informationen</h5>
            </div>
            <div class="card-body">
              {#if asset.description}
                <div class="mb-4">
                  <h6>Beschreibung</h6>
                  <p class="text-muted">{asset.description}</p>
                </div>
              {/if}

              <div class="row">
                <div class="col-md-6">
                  <h6>Grunddaten</h6>
                  <table class="table table-sm">
                    <tbody>
                      <tr>
                        <td>Symbol</td>
                        <td><strong>{asset.symbol}</strong></td>
                      </tr>
                      <tr>
                        <td>Name</td>
                        <td>{asset.name || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td>Typ</td>
                        <td>{asset.type}</td>
                      </tr>
                      <tr>
                        <td>Kategorie</td>
                        <td>{asset.category}</td>
                      </tr>
                      <tr>
                        <td>Währung</td>
                        <td>{asset.currency}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div class="col-md-6">
                  <h6>Marktdaten</h6>
                  <table class="table table-sm">
                    <tbody>
                      <tr>
                        <td>Aktueller Preis</td>
                        <td><strong>{formatCurrency(asset.price, asset.currency)}</strong></td>
                      </tr>
                      <tr>
                        <td>Tagesänderung</td>
                        <td class="{asset.changePercent >= 0 ? 'text-success' : 'text-danger'}">
                          {formatPercent(asset.changePercent || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td>Marktkapitalisierung</td>
                        <td>{formatNumber(asset.marketCap)}</td>
                      </tr>
                      <tr>
                        <td>Volumen</td>
                        <td>{formatNumber(asset.volume)}</td>
                      </tr>
                      <tr>
                        <td>Sektor</td>
                        <td>{asset.sector || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          {#if position}
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">Ihre Position</h5>
              </div>
              <div class="card-body">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td>Anzahl</td>
                      <td><strong>{position.quantity}</strong></td>
                    </tr>
                    <tr>
                      <td>Durchschnittspreis</td>
                      <td>{formatCurrency(position.avg_price, asset.currency)}</td>
                    </tr>
                    <tr>
                      <td>Aktueller Wert</td>
                      <td><strong>{formatCurrency(position.total_value, asset.currency)}</strong></td>
                    </tr>
                    <tr>
                      <td>Unrealisierter G/V</td>
                      <td class="{position.unrealized_pnl >= 0 ? 'text-success' : 'text-danger'}">
                        {formatCurrency(position.unrealized_pnl, asset.currency)}
                        <small class="d-block">{formatPercent(position.unrealized_pnl_percent)}</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          {:else}
            <div class="card">
              <div class="card-body text-center">
                <i class="bi bi-info-circle display-4 text-muted mb-3"></i>
                <p class="text-muted">Sie haben keine Position in diesem Asset.</p>
                <button class="btn btn-primary" onclick={openBuyModal}>
                  <i class="bi bi-cart-plus me-2"></i>Jetzt kaufen
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    <!-- Asset Not Found -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
            <h3 class="mt-3">Asset nicht gefunden</h3>
            <p class="text-muted">Das angeforderte Asset konnte nicht geladen werden.</p>
            <a href="/assets" class="btn btn-primary">
              <i class="bi bi-arrow-left me-2"></i>Zurück zur Übersicht
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Success/Error Messages -->
{#if form?.success}
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div class="toast show">
      <div class="toast-header bg-success text-white">
        <i class="bi bi-check-circle me-2"></i>
        <strong class="me-auto">Erfolg</strong>
      </div>
      <div class="toast-body">
        {form.message}
      </div>
    </div>
  </div>
{/if}

{#if form?.error}
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div class="toast show">
      <div class="toast-header bg-danger text-white">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong class="me-auto">Fehler</strong>
      </div>
      <div class="toast-body">
        {form.error}
      </div>
    </div>
  </div>
{/if}

<!-- Buy Modal -->
{#if showBuyModal}
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-cart-plus me-2"></i>
            {asset?.symbol} kaufen
          </h5>
          <button type="button" class="btn-close" onclick={closeBuyModal}></button>
        </div>
        
        <form 
          method="POST" 
          action="?/quickBuy"
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
              <label for="portfolio" class="form-label">Portfolio</label>
              <select 
                class="form-select" 
                id="portfolio" 
                name="portfolio_id"
                bind:value={selectedPortfolio}
                required
              >
                {#each portfolios as portfolio}
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
              />
            </div>
            
            <div class="alert alert-info">
              <strong>Geschätzter Wert:</strong> {formatCurrency((quantity || 0) * (asset?.price || 0), asset?.currency)}
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick={closeBuyModal}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-success" disabled={isSubmitting}>
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
            {asset?.symbol} verkaufen
          </h5>
          <button type="button" class="btn-close" onclick={closeSellModal}></button>
        </div>
        
        <form 
          method="POST" 
          action="?/quickSell"
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
              <label for="sellQuantity" class="form-label">Anzahl</label>
              <input 
                type="number" 
                class="form-control" 
                id="sellQuantity" 
                name="quantity"
                bind:value={quantity}
                min="0.01"
                max={position?.quantity || 0}
                step="0.01"
                required
              />
              <div class="form-text">
                Verfügbar: {position?.quantity || 0} Stück
              </div>
            </div>
            
            <div class="alert alert-info">
              <strong>Geschätzter Erlös:</strong> {formatCurrency((quantity || 0) * (asset?.price || 0), asset?.currency)}
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick={closeSellModal}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-danger" disabled={isSubmitting}>
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
  /* Skeleton Loading */
  .skeleton {
    position: relative;
    overflow: hidden;
    background-color: #e0e0e0;
    border-radius: 4px;
  }
  
  .skeleton::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.5) 60%,
      rgba(255, 255, 255, 0)
    );
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
  
  .skeleton-text {
    display: inline-block;
    height: 1em;
    margin-bottom: 0.25em;
  }

  /* Asset Header */
  .asset-header-card {
    border: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-radius: 16px;
  }

  .asset-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .price-change {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Metric Cards */
  .metric-card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-radius: 12px;
    transition: transform 0.3s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
  }

  .metric-icon {
    font-size: 2rem;
  }

  .metric-label {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .metric-value {
    font-size: 1.125rem;
  }

  /* Navigation Tabs */
  .nav-tabs {
    border-bottom: 2px solid #e0e0e0;
  }

  .nav-tabs .nav-link {
    color: #6c757d;
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .nav-tabs .nav-link:hover {
    color: #667eea;
    background-color: #f8f9fa;
  }

  .nav-tabs .nav-link.active {
    color: #667eea;
    background-color: transparent;
    border-bottom: 3px solid #667eea;
  }

  /* Cards */
  .card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-radius: 12px;
  }

  .card-header {
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
    border-radius: 12px 12px 0 0 !important;
  }

  /* Position Info */
  .position-info {
    border: 1px solid #e0e0e0;
  }

  /* Action Buttons */
  .action-buttons .btn {
    font-weight: 600;
    padding: 0.75rem 1.5rem;
  }

  /* Breadcrumb */
  .breadcrumb {
    background: none;
    padding: 0;
    margin: 0;
  }

  .breadcrumb-item + .breadcrumb-item::before {
    content: "›";
    color: #6c757d;
  }

  /* Modals */
  .modal {
    animation: fadeIn 0.3s ease;
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

  /* Toast Notifications */
  .toast {
    min-width: 300px;
  }

  .toast-header {
    border-bottom: none;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .asset-icon {
      width: 48px;
      height: 48px;
      font-size: 1.5rem;
    }

    .action-buttons .btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .nav-tabs .nav-link {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .metric-card .card-body {
      padding: 1rem 0.75rem;
    }
  }
</style>