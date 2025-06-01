<!-- src/routes/portfolio/[id]/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import LineChart from '$lib/components/LineChart.svelte';
  import PieChart from '$lib/components/PieChart.svelte';
  
  // Props von Server
  const { data, form } = $props();
  
  // State für Modals
  let showBuyModal = $state(false);
  let showSellModal = $state(false);
  let selectedSymbol = $state('');
  let quantity = $state(1);
  let isSubmitting = $state(false);
  
  // Tab State
  let activeTab = $state('overview');
  
  // Formatierung
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
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('de-CH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Modal Handlers
  function openBuyModal(symbol) {
    selectedSymbol = symbol;
    showBuyModal = true;
    quantity = 1;
  }
  
  function openSellModal(symbol, maxQuantity) {
    selectedSymbol = symbol;
    showSellModal = true;
    quantity = Math.min(1, maxQuantity);
  }
  
  function closeBuyModal() {
    showBuyModal = false;
    selectedSymbol = '';
    quantity = 1;
  }
  
  function closeSellModal() {
    showSellModal = false;
    selectedSymbol = '';
    quantity = 1;
  }
  
  // Chart data für Portfolio-Performance
  const performanceChartData = $derived({
    labels: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
    }),
    datasets: [{
      label: 'Portfolio-Wert',
      data: Array.from({ length: 30 }, (_, i) => {
        // Simulierte Daten - in Produktion würden diese vom Server kommen
        const baseValue = data.stats.totalInvestment;
        const trend = (i / 29) * (data.stats.totalGainLoss / baseValue);
        const volatility = (Math.random() - 0.5) * 0.02;
        return baseValue * (1 + trend + volatility);
      }),
      borderColor: data.stats.totalGainLoss >= 0 ? '#28a745' : '#dc3545',
      backgroundColor: data.stats.totalGainLoss >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
      fill: true
    }]
  });
</script>

<svelte:head>
  <title>{data.portfolio.name} - Portfolio Details | Investify</title>
</svelte:head>

<div class="container-fluid py-4">
  <!-- Breadcrumb -->
  <nav aria-label="breadcrumb" class="mb-4">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
      <li class="breadcrumb-item"><a href="/dashboard">Portfolios</a></li>
      <li class="breadcrumb-item active">{data.portfolio.name}</li>
    </ol>
  </nav>

  <!-- Header -->
  <div class="row mb-4">
    <div class="col">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1 class="h2 mb-1">{data.portfolio.name}</h1>
          <p class="text-muted mb-0">
            Erstellt am {formatDate(data.portfolio.created_at)}
          </p>
        </div>
        <div>
          <a href="/transactions/new?portfolio={data.portfolio.id}" class="btn btn-primary">
            <i class="bi bi-plus-circle me-2"></i>Neue Transaktion
          </a>
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

  <!-- KPI Cards -->
  <div class="row g-3 mb-4">
    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="text-muted small mb-1">Gesamtwert</p>
              <h3 class="mb-0">{formatCurrency(data.stats.totalValue)}</h3>
            </div>
            <div class="icon-box bg-primary bg-opacity-10 text-primary">
              <i class="bi bi-wallet2"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="text-muted small mb-1">Gewinn/Verlust</p>
              <h3 class="mb-0 {data.stats.totalGainLoss >= 0 ? 'text-success' : 'text-danger'}">
                {formatCurrency(data.stats.totalGainLoss)}
              </h3>
              <small class="{data.stats.totalGainLossPercent >= 0 ? 'text-success' : 'text-danger'}">
                {formatPercent(data.stats.totalGainLossPercent)}
              </small>
            </div>
            <div class="icon-box bg-{data.stats.totalGainLoss >= 0 ? 'success' : 'danger'} bg-opacity-10 text-{data.stats.totalGainLoss >= 0 ? 'success' : 'danger'}">
              <i class="bi bi-graph-{data.stats.totalGainLoss >= 0 ? 'up' : 'down'}-arrow"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="text-muted small mb-1">Positionen</p>
              <h3 class="mb-0">{data.stats.positionCount}</h3>
            </div>
            <div class="icon-box bg-info bg-opacity-10 text-info">
              <i class="bi bi-collection"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="text-muted small mb-1">Transaktionen</p>
              <h3 class="mb-0">{data.stats.transactionCount}</h3>
            </div>
            <div class="icon-box bg-warning bg-opacity-10 text-warning">
              <i class="bi bi-arrow-left-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        class="nav-link {activeTab === 'positions' ? 'active' : ''}" 
        onclick={() => activeTab = 'positions'}
      >
        <i class="bi bi-collection me-2"></i>Positionen ({data.positions.length})
      </button>
    </li>
    <li class="nav-item">
      <button 
        class="nav-link {activeTab === 'transactions' ? 'active' : ''}" 
        onclick={() => activeTab = 'transactions'}
      >
        <i class="bi bi-list-ul me-2"></i>Transaktionen
      </button>
    </li>
  </ul>

  <!-- Tab Content -->
  {#if activeTab === 'overview'}
    <div class="row g-4">
      <!-- Performance Chart -->
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0">Portfolio-Performance (30 Tage)</h5>
          </div>
          <div class="card-body">
            <LineChart data={performanceChartData} height={300} />
          </div>
        </div>
      </div>

      <!-- Asset Distribution -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0">Asset-Verteilung</h5>
          </div>
          <div class="card-body">
            <PieChart 
              labels={data.assetDistribution.labels}
              values={data.assetDistribution.values}
              colors={data.assetDistribution.colors}
            />
          </div>
        </div>
      </div>

      <!-- Top & Worst Performers -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0 text-success">
              <i class="bi bi-arrow-up-circle me-2"></i>Top Performer
            </h5>
          </div>
          <div class="card-body">
            {#if data.topPerformers.length > 0}
              <div class="performer-list">
                {#each data.topPerformers as position}
                  <div class="performer-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{position.symbol}</strong>
                        <small class="text-muted d-block">{position.quantity} Stück</small>
                      </div>
                      <div class="text-end">
                        <div class="text-success fw-bold">{formatPercent(position.gain_loss_percent)}</div>
                        <small class="text-muted">{formatCurrency(position.gain_loss)}</small>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-muted text-center mb-0">Keine Daten verfügbar</p>
            {/if}
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0 text-danger">
              <i class="bi bi-arrow-down-circle me-2"></i>Schlechteste Performer
            </h5>
          </div>
          <div class="card-body">
            {#if data.worstPerformers.length > 0}
              <div class="performer-list">
                {#each data.worstPerformers as position}
                  <div class="performer-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{position.symbol}</strong>
                        <small class="text-muted d-block">{position.quantity} Stück</small>
                      </div>
                      <div class="text-end">
                        <div class="text-danger fw-bold">{formatPercent(position.gain_loss_percent)}</div>
                        <small class="text-muted">{formatCurrency(position.gain_loss)}</small>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-muted text-center mb-0">Keine Daten verfügbar</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === 'positions'}
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        {#if data.positions.length > 0}
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Anzahl</th>
                  <th class="text-end">Durchschnittspreis</th>
                  <th class="text-end">Aktueller Preis</th>
                  <th class="text-end">Aktueller Wert</th>
                  <th class="text-end">Gewinn/Verlust</th>
                  <th class="text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {#each data.positions as position}
                  <tr>
                    <td>
                      <a href="/assets/{position.symbol.toLowerCase()}" class="text-decoration-none">
                        <strong>{position.symbol}</strong>
                      </a>
                    </td>
                    <td>{position.quantity}</td>
                    <td class="text-end">{formatCurrency(position.avg_price, position.currency)}</td>
                    <td class="text-end">
                      {formatCurrency(position.current_price, position.currency)}
                      <small class="d-block {position.changePercent >= 0 ? 'text-success' : 'text-danger'}">
                        {formatPercent(position.changePercent)}
                      </small>
                    </td>
                    <td class="text-end fw-bold">{formatCurrency(position.current_value, position.currency)}</td>
                    <td class="text-end">
                      <div class="{position.gain_loss >= 0 ? 'text-success' : 'text-danger'} fw-bold">
                        {formatCurrency(position.gain_loss, position.currency)}
                      </div>
                      <small class="{position.gain_loss_percent >= 0 ? 'text-success' : 'text-danger'}">
                        {formatPercent(position.gain_loss_percent)}
                      </small>
                    </td>
                    <td class="text-center">
                      <div class="btn-group btn-group-sm">
                        <button 
                          class="btn btn-outline-success"
                          onclick={() => openBuyModal(position.symbol)}
                          title="Kaufen"
                        >
                          <i class="bi bi-plus"></i>
                        </button>
                        <button 
                          class="btn btn-outline-danger"
                          onclick={() => openSellModal(position.symbol, position.quantity)}
                          title="Verkaufen"
                        >
                          <i class="bi bi-dash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr class="fw-bold">
                  <td colspan="4">Gesamt</td>
                  <td class="text-end">{formatCurrency(data.stats.totalValue)}</td>
                  <td class="text-end {data.stats.totalGainLoss >= 0 ? 'text-success' : 'text-danger'}">
                    {formatCurrency(data.stats.totalGainLoss)}
                    <small class="d-block">{formatPercent(data.stats.totalGainLossPercent)}</small>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        {:else}
          <div class="text-center py-5">
            <i class="bi bi-inbox display-1 text-muted"></i>
            <p class="text-muted mt-3">Noch keine Positionen in diesem Portfolio</p>
            <a href="/assets" class="btn btn-primary">
              <i class="bi bi-search me-2"></i>Assets durchsuchen
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'transactions'}
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        {#if data.transactions.length > 0}
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Typ</th>
                  <th>Symbol</th>
                  <th class="text-end">Anzahl</th>
                  <th class="text-end">Preis</th>
                  <th class="text-end">Gebühren</th>
                  <th class="text-end">Gesamtbetrag</th>
                </tr>
              </thead>
              <tbody>
                {#each data.transactions as transaction}
                  <tr>
                    <td>{formatDateTime(transaction.transaction_date)}</td>
                    <td>
                      <span class="badge bg-{transaction.type === 'buy' ? 'success' : 'danger'}">
                        {transaction.type === 'buy' ? 'Kauf' : 'Verkauf'}
                      </span>
                    </td>
                    <td>
                      <a href="/assets/{transaction.symbol.toLowerCase()}" class="text-decoration-none">
                        <strong>{transaction.symbol}</strong>
                      </a>
                    </td>
                    <td class="text-end">{transaction.quantity}</td>
                    <td class="text-end">{formatCurrency(transaction.price, transaction.currency)}</td>
                    <td class="text-end">{formatCurrency(transaction.fees || 0, transaction.currency)}</td>
                    <td class="text-end fw-bold">
                      {formatCurrency(transaction.total_amount, transaction.currency)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          {#if data.transactions.length >= 20}
            <div class="text-center mt-3">
              <a href="/transactions?portfolio={data.portfolio.id}" class="btn btn-outline-primary">
                Alle Transaktionen anzeigen
              </a>
            </div>
          {/if}
        {:else}
          <div class="text-center py-5">
            <i class="bi bi-clock-history display-1 text-muted"></i>
            <p class="text-muted mt-3">Noch keine Transaktionen in diesem Portfolio</p>
            <a href="/transactions/new?portfolio={data.portfolio.id}" class="btn btn-primary">
              <i class="bi bi-plus-circle me-2"></i>Erste Transaktion hinzufügen
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Buy Modal -->
{#if showBuyModal}
  <div class="modal fade show d-block" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-cart-plus me-2"></i>
            {selectedSymbol} kaufen
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
                await invalidateAll();
              }
            };
          }}
        >
          <input type="hidden" name="symbol" value={selectedSymbol} />
          
          <div class="modal-body">
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
            </div>
            
            <div class="alert alert-info">
              <small>Der aktuelle Marktpreis wird beim Kauf verwendet.</small>
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
            {selectedSymbol} verkaufen
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
                await invalidateAll();
              }
            };
          }}
        >
          <input type="hidden" name="symbol" value={selectedSymbol} />
          
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
                step="0.01"
                required
                disabled={isSubmitting}
              />
              <div class="form-text">
                Verfügbar: {data.positions.find(p => p.symbol === selectedSymbol)?.quantity || 0} Stück
              </div>
            </div>
            
            <div class="alert alert-info">
              <small>Der aktuelle Marktpreis wird beim Verkauf verwendet.</small>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick={closeSellModal} disabled={isSubmitting}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-danger" disabled={isSubmitting || quantity <= 0}>
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
  /* Icon Boxes */
  .icon-box {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 1.5rem;
  }

  /* Nav Tabs */
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
    border-radius: 12px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
  }

  .card-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 1.25rem;
    font-weight: 600;
  }

  /* Performer Lists */
  .performer-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .performer-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
  }

  .performer-item:last-child {
    border-bottom: none;
  }

  .performer-item:hover {
    background-color: #f8f9fa;
  }

  /* Tables */
  .table {
    margin-bottom: 0;
  }

  .table th {
    font-weight: 600;
    color: #6c757d;
    border-bottom: 2px solid #e0e0e0;
    padding: 1rem 0.75rem;
  }

  .table td {
    padding: 1rem 0.75rem;
    vertical-align: middle;
  }

  .table tbody tr:hover {
    background-color: #f8f9fa;
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

  /* Badges */
  .badge {
    padding: 0.375rem 0.75rem;
    font-weight: 500;
    font-size: 0.75rem;
  }

  /* Button Groups */
  .btn-group-sm .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
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

  /* Scrollbar */
  .performer-list::-webkit-scrollbar {
    width: 6px;
  }

  .performer-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .performer-list::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  .performer-list::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .nav-tabs .nav-link {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .icon-box {
      width: 40px;
      height: 40px;
      font-size: 1.25rem;
    }

    .table {
      font-size: 0.875rem;
    }

    .table th,
    .table td {
      padding: 0.75rem 0.5rem;
    }
  }
</style>