<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { goto } from "$app/navigation";
  import PortfolioCard from '$lib/components/PortfolioCard.svelte';
  import PieChart from '$lib/components/PieChart.svelte';
  
  // Props von +page.server.js
  const { data, form } = $props();
  
  // State für Portfolio-Erstellung
  let showCreateForm = $state(false);
  let portfolioName = $state("");
  let isCreating = $state(false);
  let isLoading = $state(true);
  
  // Simulate loading state
  $effect(() => {
    // Set loading to false after data is available
    if (data) {
      setTimeout(() => {
        isLoading = false;
      }, 500); // Small delay for smooth transition
    }
  });
  
  // Redirect wenn nicht eingeloggt (falls data.user nicht vorhanden)
  $effect(() => {
    if (!isLoading && !data.user) {
      goto("/auth/login");
    }
  });
  
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
</script>

<svelte:head>
  <title>Dashboard – Investify</title>
</svelte:head>

<div class="container-fluid py-4">
  <!-- Header -->
  <div class="row mb-4">
    <div class="col">
      <h1 class="h2 {isLoading ? 'skeleton skeleton-text' : ''}">
        {#if !isLoading}
          Willkommen zurück, {data.user?.firstName || data.user?.email?.split('@')[0]}!
        {:else}
          <span class="invisible">Willkommen zurück, Benutzer!</span>
        {/if}
      </h1>
      <p class="text-muted {isLoading ? 'skeleton skeleton-text w-50' : ''}">
        {#if !isLoading}
          Hier ist Ihre Investitionsübersicht
        {:else}
          <span class="invisible">Hier ist Ihre Investitionsübersicht</span>
        {/if}
      </p>
    </div>
  </div>

  <!-- Error Messages -->
  {#if !isLoading}
    {#if data.error}
      <div class="alert alert-warning" role="alert">
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
        <i class="bi bi-check-circle me-2"></i>{form.message || 'Portfolio erfolgreich erstellt'}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    {/if}
  {/if}

  <!-- KPIs -->
  <div class="row g-3 mb-4">
    {#each [
      { icon: 'bi-wallet2', color: 'primary', title: 'Gesamtwert' },
      { icon: 'bi-graph-up-arrow', color: 'success', title: 'Gewinn/Verlust' },
      { icon: 'bi-clock-history', color: 'info', title: 'Tagesänderung' },
      { icon: 'bi-briefcase', color: 'secondary', title: 'Portfolios' }
    ] as kpi, index}
      <div class="col-md-3">
        <div class="card kpi-card">
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="kpi-icon bg-{kpi.color} bg-opacity-10">
                <i class="bi {kpi.icon} text-{kpi.color}"></i>
              </div>
              <div class="ms-3 {isLoading ? 'flex-grow-1' : ''}">
                <h6 class="card-subtitle mb-1 text-muted">{kpi.title}</h6>
                {#if isLoading}
                  <div class="skeleton skeleton-text" style="width: 80%; height: 28px;"></div>
                {:else}
                  <h4 class="card-title mb-0 {index === 1 || index === 2 ? (data.kpis.totalGainLoss >= 0 ? 'text-success' : 'text-danger') : ''}">
                    {#if index === 0}
                      {formatCurrency(data.kpis.totalValue)}
                    {:else if index === 1}
                      {formatPercent(data.kpis.totalGainLossPercent)}
                    {:else if index === 2}
                      {formatPercent(data.kpis.dayChangePercent)}
                    {:else}
                      {data.portfolios.length}
                    {/if}
                  </h4>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Portfolio Distribution Chart -->
  <div class="row mb-4">
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="card-title mb-0">
            <i class="bi bi-pie-chart me-2"></i>
            Portfolio-Verteilung
          </h5>
        </div>
        <div class="card-body">
          {#if isLoading}
            <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
              <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                  <span class="visually-hidden">Lädt...</span>
                </div>
                <p class="text-muted">Chart wird geladen...</p>
              </div>
            </div>
          {:else if data.portfolios.length > 0}
            <PieChart 
              labels={data.pieData.labels} 
              values={data.pieData.values}
              colors={data.pieData.colors}
            />
          {:else}
            <div class="text-center py-5">
              <i class="bi bi-pie-chart display-1 text-muted"></i>
              <p class="text-muted mt-3">Noch keine Portfolios vorhanden</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card h-100">
        <div class="card-header bg-white">
          <h5 class="card-title mb-0">
            <i class="bi bi-info-circle me-2"></i>
            Zusammenfassung
          </h5>
        </div>
        <div class="card-body">
          {#each ['Investiert:', 'Aktueller Wert:', 'Gesamtrendite:'] as label, i}
            <div class="summary-item mb-3 {i === 2 ? '' : ''}">
              <span class="text-muted">{label}</span>
              {#if isLoading}
                <span class="skeleton skeleton-text" style="width: 100px; height: 20px; display: inline-block;"></span>
              {:else}
                <span class="fw-bold float-end {i === 2 && data.kpis.totalGainLoss < 0 ? 'text-danger' : i === 2 && data.kpis.totalGainLoss >= 0 ? 'text-success' : ''}">
                  {#if i === 0}
                    {formatCurrency(data.kpis.totalInvestment)}
                  {:else if i === 1}
                    {formatCurrency(data.kpis.totalValue)}
                  {:else}
                    {formatCurrency(data.kpis.totalGainLoss)}
                  {/if}
                </span>
              {/if}
            </div>
            {#if i === 1}<hr>{/if}
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Transactions -->
  {#if !isLoading && data.recentTransactions && data.recentTransactions.length > 0}
    <div class="row mb-4">
      <div class="col">
        <div class="card">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">
              <i class="bi bi-clock-history me-2"></i>
              Letzte Transaktionen
            </h5>
            <a href="/transactions" class="btn btn-sm btn-outline-primary">Alle anzeigen</a>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Portfolio</th>
                    <th>Typ</th>
                    <th>Symbol</th>
                    <th class="text-end">Menge</th>
                    <th class="text-end">Preis</th>
                    <th class="text-end">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {#each data.recentTransactions as transaction}
                    <tr>
                      <td>{formatDate(transaction.transaction_date)}</td>
                      <td>{transaction.portfolio_name}</td>
                      <td>
                        <span class="badge bg-{transaction.type === 'buy' ? 'success' : 'danger'}">
                          {transaction.type === 'buy' ? 'Kauf' : 'Verkauf'}
                        </span>
                      </td>
                      <td>
                        <strong>{transaction.symbol}</strong>
                      </td>
                      <td class="text-end">{transaction.quantity}</td>
                      <td class="text-end">{formatCurrency(transaction.price, transaction.currency)}</td>
                      <td class="text-end fw-bold">
                        {formatCurrency(transaction.total_amount, transaction.currency)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Portfolios Section -->
  <div class="row mb-4">
    <div class="col">
      <h3 class="mb-3">Meine Portfolios</h3>
      
      <div class="row g-3">
        {#if isLoading}
          <!-- Skeleton Portfolio Cards -->
          {#each [1, 2, 3] as _}
            <div class="col-md-6 col-lg-4">
              <div class="card skeleton-card">
                <div class="card-body">
                  <div class="skeleton skeleton-text mb-2" style="width: 60%; height: 24px;"></div>
                  <div class="skeleton skeleton-text mb-3" style="width: 80%; height: 32px;"></div>
                  <div class="skeleton skeleton-text mb-3" style="width: 40%; height: 16px;"></div>
                  <div class="skeleton skeleton-button" style="width: 100%; height: 38px;"></div>
                </div>
              </div>
            </div>
          {/each}
        {:else}
          {#each data.portfolios as portfolio}
            <div class="col-md-6 col-lg-4">
              <PortfolioCard {portfolio} />
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Create Portfolio Section -->
  {#if !isLoading}
    <div class="row">
      <div class="col text-center">
        {#if !showCreateForm}
          <button 
            class="btn btn-primary btn-lg"
            onclick={() => showCreateForm = true}
          >
            <i class="bi bi-plus-circle me-2"></i>Neues Portfolio erstellen
          </button>
        {:else}
          <div class="card mx-auto" style="max-width: 600px;">
            <div class="card-body">
              <h5 class="card-title mb-3">Neues Portfolio erstellen</h5>
              <form 
                method="POST" 
                action="?/createPortfolio"
                use:enhance={() => {
                  isCreating = true;
                  return async ({ result, update }) => {
                    await update();
                    isCreating = false;
                    
                    if (result.type === 'success' && form?.success) {
                      showCreateForm = false;
                      portfolioName = "";
                    }
                  };
                }}
              >
                <div class="row g-2">
                  <div class="col">
                    <input
                      type="text"
                      class="form-control form-control-lg"
                      name="name"
                      placeholder="Portfolio Name eingeben..."
                      bind:value={portfolioName}
                      required
                      disabled={isCreating}
                    />
                  </div>
                  <div class="col-auto">
                    <button type="submit" class="btn btn-success btn-lg" disabled={isCreating}>
                      {#if isCreating}
                        <span class="spinner-border spinner-border-sm me-1"></span>
                        Erstelle...
                      {:else}
                        Erstellen
                      {/if}
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-secondary btn-lg ms-2"
                      onclick={() => {showCreateForm = false; portfolioName = "";}}
                      disabled={isCreating}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Skeleton Loading Styles */
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
  
  .skeleton-button {
    border-radius: 0.375rem;
  }
  
  .skeleton-card {
    min-height: 200px;
  }
  
  /* Existing Styles */
  .kpi-card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
  }
  
  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  .card-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 1rem 1.5rem;
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .text-success {
    color: #28a745 !important;
  }
  
  .text-danger {
    color: #dc3545 !important;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    padding: 0.75rem 2rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  .table th {
    font-weight: 600;
    color: #6c757d;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .table td {
    vertical-align: middle;
  }
  
  .badge {
    padding: 0.375rem 0.75rem;
    font-weight: 500;
  }
  
  .w-50 {
    width: 50% !important;
  }
  
  .invisible {
    visibility: hidden;
  }
</style>