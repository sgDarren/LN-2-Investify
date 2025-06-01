<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PieChart from '$lib/components/PieChart.svelte';
  
  // Props von Server
  const { data, form } = $props();
  
  // State für Modal
  let showModal = $state(false);
  let newPortfolioName = $state('');
  let isSubmitting = $state(false);
  
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
  
  // Modal Handlers
  function openModal() {
    showModal = true;
    newPortfolioName = '';
  }
  
  function closeModal() {
    showModal = false;
    newPortfolioName = '';
  }
</script>

<svelte:head>
  <title>Dashboard - Investify</title>
</svelte:head>

<div class="container-fluid py-4">
  <!-- Header -->
  <div class="row mb-4">
    <div class="col">
      <h1 class="h2 mb-1">Willkommen zurück, {data.user?.firstName}!</h1>
      <p class="text-muted">Hier ist Ihre aktuelle Portfolio-Übersicht</p>
    </div>
  </div>

  <!-- Fehler-Anzeige -->
  {#if data.error}
    <div class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>{data.error}
    </div>
  {/if}

  {#if form?.error}
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>{form.error}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="bi bi-check-circle me-2"></i>{form.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  {/if}

  <!-- KPI Cards -->
  <div class="row g-3 mb-4">
    <!-- Gesamtwert -->
    <div class="col-md-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p class="text-muted small mb-1">Gesamtwert</p>
              <h3 class="mb-0">{formatCurrency(data.kpis.totalValue)}</h3>
            </div>
            <div class="icon-box bg-primary bg-opacity-10 text-primary">
              <i class="bi bi-wallet2"></i>
            </div>
          </div>
          <div class="small text-muted">
            <i class="bi bi-arrow-up-right text-success me-1"></i>
            Aktueller Marktwert
          </div>
        </div>
      </div>
    </div>

    <!-- Gesamtrendite -->
    <div class="col-md-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p class="text-muted small mb-1">Gesamtrendite</p>
              <h3 class="mb-0 {data.kpis.totalGainLoss >= 0 ? 'text-success' : 'text-danger'}">
                {formatCurrency(data.kpis.totalGainLoss)}
              </h3>
            </div>
            <div class="icon-box bg-{data.kpis.totalGainLoss >= 0 ? 'success' : 'danger'} bg-opacity-10 text-{data.kpis.totalGainLoss >= 0 ? 'success' : 'danger'}">
              <i class="bi bi-graph-{data.kpis.totalGainLoss >= 0 ? 'up' : 'down'}-arrow"></i>
            </div>
          </div>
          <div class="small {data.kpis.totalGainLossPercent >= 0 ? 'text-success' : 'text-danger'}">
            <i class="bi bi-{data.kpis.totalGainLossPercent >= 0 ? 'arrow-up' : 'arrow-down'} me-1"></i>
            {formatPercent(data.kpis.totalGainLossPercent)}
          </div>
        </div>
      </div>
    </div>

    <!-- Tagesveränderung -->
    <div class="col-md-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p class="text-muted small mb-1">Tagesveränderung</p>
              <h3 class="mb-0 {data.kpis.dayChange >= 0 ? 'text-success' : 'text-danger'}">
                {formatCurrency(data.kpis.dayChange)}
              </h3>
            </div>
            <div class="icon-box bg-info bg-opacity-10 text-info">
              <i class="bi bi-calendar-day"></i>
            </div>
          </div>
          <div class="small {data.kpis.dayChangePercent >= 0 ? 'text-success' : 'text-danger'}">
            <i class="bi bi-{data.kpis.dayChangePercent >= 0 ? 'arrow-up' : 'arrow-down'} me-1"></i>
            {formatPercent(data.kpis.dayChangePercent)}
          </div>
        </div>
      </div>
    </div>

    <!-- Investiert -->
    <div class="col-md-6 col-lg-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p class="text-muted small mb-1">Investiert</p>
              <h3 class="mb-0">{formatCurrency(data.kpis.totalInvestment)}</h3>
            </div>
            <div class="icon-box bg-warning bg-opacity-10 text-warning">
              <i class="bi bi-cash-stack"></i>
            </div>
          </div>
          <div class="small text-muted">
            <i class="bi bi-info-circle me-1"></i>
            Gesamtinvestition
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-4">
    <!-- Portfolio-Verteilung -->
    <div class="col-lg-8">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Portfolio-Verteilung</h5>
          <button class="btn btn-sm btn-primary" onclick={openModal}>
            <i class="bi bi-plus-circle me-1"></i>Neues Portfolio
          </button>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              {#if data.pieData.labels.length > 0}
                <PieChart 
                  labels={data.pieData.labels}
                  values={data.pieData.values}
                  colors={data.pieData.colors}
                />
              {:else}
                <div class="text-center py-5">
                  <i class="bi bi-pie-chart display-1 text-muted"></i>
                  <p class="text-muted mt-3">Noch keine Portfolios vorhanden</p>
                  <button class="btn btn-primary" onclick={openModal}>
                    Erstes Portfolio erstellen
                  </button>
                </div>
              {/if}
            </div>
            <div class="col-md-6">
              <div class="portfolio-list">
                {#each data.portfolios as portfolio}
                  <div class="portfolio-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 class="mb-1">{portfolio.name}</h6>
                        <small class="text-muted">
                          {formatCurrency(portfolio.value)} 
                          <span class="{portfolio.gainLoss >= 0 ? 'text-success' : 'text-danger'}">
                            ({formatPercent(portfolio.gainLossPercent)})
                          </span>
                        </small>
                      </div>
                      <a href="/portfolio/{portfolio.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </a>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Letzte Transaktionen -->
    <div class="col-lg-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Letzte Transaktionen</h5>
          <a href="/transactions" class="btn btn-sm btn-outline-primary">Alle</a>
        </div>
        <div class="card-body">
          {#if data.recentTransactions.length > 0}
            <div class="transaction-list">
              {#each data.recentTransactions as transaction}
                <div class="transaction-item">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="d-flex align-items-center mb-1">
                        <span class="badge bg-{transaction.type === 'buy' ? 'success' : 'danger'} me-2">
                          {transaction.type === 'buy' ? 'Kauf' : 'Verkauf'}
                        </span>
                        <strong>{transaction.symbol}</strong>
                      </div>
                      <small class="text-muted">
                        {transaction.quantity} @ {formatCurrency(transaction.price)}
                      </small>
                    </div>
                    <div class="text-end">
                      <div class="fw-bold">{formatCurrency(transaction.total_amount)}</div>
                      <small class="text-muted">{formatDate(transaction.transaction_date)}</small>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-4">
              <i class="bi bi-clock-history display-4 text-muted"></i>
              <p class="text-muted mt-2">Noch keine Transaktionen</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="row mt-4">
    <div class="col">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-3">Schnellaktionen</h5>
          <div class="row g-3">
            <div class="col-md-3">
              <a href="/assets" class="btn btn-outline-primary w-100">
                <i class="bi bi-search me-2"></i>Assets durchsuchen
              </a>
            </div>
            <div class="col-md-3">
              <a href="/portfolio" class="btn btn-outline-success w-100">
                <i class="bi bi-briefcase me-2"></i>Portfolio verwalten
              </a>
            </div>
            <div class="col-md-3">
              <a href="/transactions" class="btn btn-outline-info w-100">
                <i class="bi bi-list-ul me-2"></i>Transaktionen
              </a>
            </div>
            <div class="col-md-3">
              <a href="/reports" class="btn btn-outline-warning w-100">
                <i class="bi bi-file-earmark-bar-graph me-2"></i>Berichte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal für neues Portfolio -->
{#if showModal}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Neues Portfolio erstellen</h5>
          <button type="button" class="btn-close" onclick={closeModal}></button>
        </div>
        <form 
          method="POST" 
          action="?/createPortfolio"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
              if (form?.success) {
                closeModal();
                await invalidateAll();
              }
            };
          }}
        >
          <div class="modal-body">
            <div class="mb-3">
              <label for="portfolioName" class="form-label">Portfolio Name</label>
              <input
                type="text"
                class="form-control"
                id="portfolioName"
                name="name"
                bind:value={newPortfolioName}
                placeholder="z.B. Langzeit-Investitionen"
                required
                disabled={isSubmitting}
              />
              <div class="form-text">Wählen Sie einen aussagekräftigen Namen für Ihr Portfolio</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick={closeModal} disabled={isSubmitting}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" disabled={isSubmitting || !newPortfolioName.trim()}>
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2"></span>
                Erstelle...
              {:else}
                <i class="bi bi-plus-circle me-2"></i>
                Portfolio erstellen
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  /* KPI Cards */
  .icon-box {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 1.5rem;
  }

  /* Portfolio List */
  .portfolio-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .portfolio-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
  }

  .portfolio-item:last-child {
    border-bottom: none;
  }

  .portfolio-item:hover {
    background-color: #f8f9fa;
  }

  /* Transaction List */
  .transaction-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .transaction-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;
  }

  .transaction-item:last-child {
    border-bottom: none;
  }

  .transaction-item:hover {
    background-color: #f8f9fa;
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
    padding: 1.25rem;
    font-weight: 600;
  }

  /* Badges */
  .badge {
    padding: 0.375rem 0.75rem;
    font-weight: 500;
    font-size: 0.75rem;
  }

  /* Scrollbar Styling */
  .portfolio-list::-webkit-scrollbar,
  .transaction-list::-webkit-scrollbar {
    width: 6px;
  }

  .portfolio-list::-webkit-scrollbar-track,
  .transaction-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .portfolio-list::-webkit-scrollbar-thumb,
  .transaction-list::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  .portfolio-list::-webkit-scrollbar-thumb:hover,
  .transaction-list::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Modal Animation */
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

  /* Responsive */
  @media (max-width: 768px) {
    .icon-box {
      width: 40px;
      height: 40px;
      font-size: 1.25rem;
    }
  }
</style>
           