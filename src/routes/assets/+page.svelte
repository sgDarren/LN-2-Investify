<!-- src/routes/assets/+page.svelte -->
<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  // Loading state
  let isLoading = $state(true);

  // Reactive Variablen für Filter
  let searchQuery = $state(data?.currentFilter?.search || '');
  let selectedCategory = $state(data?.currentFilter?.category || 'all');
  let sortBy = $state(data?.currentFilter?.sort || 'marketCap');
  
  // Loading-States für Actions
  let buyingSymbol = $state(null);
  let sellingSymbol = $state(null);

  // Initialize loading state
  $effect(() => {
    if (data) {
      setTimeout(() => {
        isLoading = false;
      }, 500); // Smooth transition
    }
  });

  // Aus den Portfolio-Positionen eine Lookup-Map erstellen
  let positionsBySymbol = $derived(() => {
    const map = {};
    if (!isLoading && data?.positions) {
      data.positions.forEach((p) => {
        map[p.symbol] = p;
      });
    }
    return map;
  });

  // Preis-Formatierung
  function formatPrice(value, currency = 'USD') {
    const locale = currency === 'CHF' ? 'de-CH' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(value || 0);
  }

  // Marktkapitalisierung formatieren
  function formatMarketCap(value) {
    if (!value) return '–';
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  }

  // Filter anwenden - navigiert zur gleichen Seite mit neuen URL-Parametern
  function applyFilters() {
    if (isLoading) return;
    
    const params = new URLSearchParams();
    
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (sortBy !== 'marketCap') params.set('sort', sortBy);
    
    const queryString = params.toString();
    goto(queryString ? `?${queryString}` : '/assets');
  }

  // Schnellkauf-Handler
  function handleQuickBuy(symbol) {
    if (!data?.user) {
      goto('/auth/login');
      return;
    }
    goto(`/trade/buy?symbol=${symbol}`);
  }

  // Schnellverkauf-Handler
  function handleQuickSell(symbol) {
    if (!data?.user) {
      goto('/auth/login');
      return;
    }
    goto(`/trade/sell?symbol=${symbol}`);
  }

  // Details-Seite öffnen
  function viewDetails(symbol) {
    if (isLoading) return;
    goto(`/assets/${symbol.toLowerCase()}`);
  }
</script>

<svelte:head>
  <title>Asset Übersicht – Investify</title>
  <meta name="description" content="Übersicht aller verfügbaren Assets mit aktuellen Kursen und Portfoliopositionen" />
</svelte:head>

<div class="container-fluid py-4">
  <!-- Überschrift und Statistiken -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h2 mb-0">Asset Übersicht</h1>
        {#if !isLoading && data?.user}
          <div class="text-end">
            <small class="text-muted">Angemeldet als {data.user.email}</small>
          </div>
        {/if}
      </div>
      
      <!-- Statistik-Cards -->
      <div class="row g-3 mb-4">
        {#each [
          { bg: 'primary', title: 'Assets verfügbar', value: 'totalAssets' },
          { bg: 'success', title: 'Gewinner heute', value: 'gainers' },
          { bg: 'danger', title: 'Verlierer heute', value: 'losers' },
          { bg: 'info', title: 'Ø Veränderung', value: 'avgChange', suffix: '%' }
        ] as stat}
          <div class="col-6 col-md-3">
            <div class="card bg-{stat.bg} text-white">
              <div class="card-body text-center">
                {#if isLoading}
                  <div class="skeleton skeleton-text mx-auto" style="width: 60px; height: 36px; background: rgba(255,255,255,0.2);"></div>
                  <p class="card-text small mb-0 mt-2">{stat.title}</p>
                {:else}
                  <h5 class="card-title h2">
                    {stat.value === 'avgChange' 
                      ? data.stats[stat.value].toFixed(2) 
                      : data.stats[stat.value]}{stat.suffix || ''}
                  </h5>
                  <p class="card-text small mb-0">{stat.title}</p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Filter-Bereich -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <div class="row g-3">
            <!-- Suchfeld -->
            <div class="col-md-4">
              <label for="search" class="form-label">Suche</label>
              <input 
                type="text" 
                class="form-control" 
                id="search"
                placeholder="Symbol oder Name suchen..."
                bind:value={searchQuery}
                on:input={applyFilters}
                disabled={isLoading}
              />
            </div>
            
            <!-- Kategorie-Filter -->
            <div class="col-md-4">
              <label for="category" class="form-label">Kategorie</label>
              <select 
                class="form-select" 
                id="category"
                bind:value={selectedCategory}
                on:change={applyFilters}
                disabled={isLoading}
              >
                <option value="all">Alle Kategorien</option>
                {#if !isLoading && data?.categories}
                  {#each data.categories as category}
                    <option value={category}>{category.toUpperCase()}</option>
                  {/each}
                {/if}
              </select>
            </div>
            
            <!-- Sortierung -->
            <div class="col-md-4">
              <label for="sort" class="form-label">Sortierung</label>
              <select 
                class="form-select" 
                id="sort"
                bind:value={sortBy}
                on:change={applyFilters}
                disabled={isLoading}
              >
                <option value="marketCap">Marktkapitalisierung</option>
                <option value="symbol">Symbol A-Z</option>
                <option value="price">Preis (hoch-niedrig)</option>
                <option value="change">Veränderung %</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Success/Error Messages -->
  {#if !isLoading}
    {#if form?.success}
      <div class="alert alert-success alert-dismissible fade show" role="alert">
        <i class="bi bi-check-circle me-2"></i>
        {form.message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    {/if}

    {#if form?.error}
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {form.error}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    {/if}
  {/if}

  <!-- Asset-Tabelle -->
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            Assets {!isLoading && data?.assets ? `(${data.assets.length})` : ''}
            {#if !isLoading && selectedCategory !== 'all'}
              <span class="badge bg-secondary ms-2">{selectedCategory.toUpperCase()}</span>
            {/if}
          </h5>
          <small class="text-muted">
            Letzte Aktualisierung: {new Date().toLocaleTimeString('de-CH')}
          </small>
        </div>
        
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Asset</th>
                <th>Typ</th>
                <th class="text-end">Preis</th>
                <th class="text-end">24h Änderung</th>
                <th class="text-end">Marktkapitalisierung</th>
                <th class="text-center">Portfolio</th>
                <th class="text-end">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {#if isLoading}
                <!-- Skeleton Rows -->
                {#each Array(10) as _, i}
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="skeleton rounded-circle me-3" style="width: 40px; height: 40px;"></div>
                        <div>
                          <div class="skeleton skeleton-text mb-1" style="width: 80px; height: 16px;"></div>
                          <div class="skeleton skeleton-text" style="width: 120px; height: 14px;"></div>
                        </div>
                      </div>
                    </td>
                    <td><div class="skeleton skeleton-text" style="width: 60px; height: 24px;"></div></td>
                    <td class="text-end">
                      <div class="skeleton skeleton-text ms-auto mb-1" style="width: 80px; height: 16px;"></div>
                      <div class="skeleton skeleton-text ms-auto" style="width: 60px; height: 14px;"></div>
                    </td>
                    <td class="text-end">
                      <div class="skeleton skeleton-text ms-auto mb-1" style="width: 60px; height: 16px;"></div>
                      <div class="skeleton skeleton-text ms-auto" style="width: 80px; height: 14px;"></div>
                    </td>
                    <td class="text-end">
                      <div class="skeleton skeleton-text ms-auto" style="width: 70px; height: 16px;"></div>
                    </td>
                    <td class="text-center">
                      <div class="skeleton skeleton-text mx-auto" style="width: 50px; height: 20px;"></div>
                    </td>
                    <td class="text-end">
                      <div class="skeleton skeleton-text ms-auto" style="width: 180px; height: 32px; border-radius: 4px;"></div>
                    </td>
                  </tr>
                {/each}
              {:else if data?.assets && data.assets.length > 0}
                {#each data.assets as asset (asset.symbol)}
                  <tr class="cursor-pointer" on:click={() => viewDetails(asset.symbol)}>
                    <!-- Asset Info -->
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="me-3">
                          <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" 
                               style="width: 40px; height: 40px; font-size: 14px;">
                            {asset.symbol.substring(0, 2)}
                          </div>
                        </div>
                        <div>
                          <div class="fw-bold">{asset.symbol}</div>
                          <small class="text-muted">{asset.name || asset.symbol}</small>
                        </div>
                      </div>
                    </td>
                    
                    <!-- Typ -->
                    <td>
                      <span class="badge bg-{asset.type === 'stock' ? 'primary' : asset.type === 'crypto' ? 'warning' : 'info'}">
                        {asset.type?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    
                    <!-- Preis -->
                    <td class="text-end">
                      <div class="fw-bold">{formatPrice(asset.price, asset.currency)}</div>
                      {#if asset.volume}
                        <small class="text-muted">Vol: {formatMarketCap(asset.volume)}</small>
                      {/if}
                    </td>
                    
                    <!-- 24h Änderung -->
                    <td class="text-end">
                      <div class="d-flex flex-column align-items-end">
                        <span class="fw-bold {asset.changePercent >= 0 ? 'text-success' : 'text-danger'}">
                          {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent?.toFixed(2) || '0.00'}%
                        </span>
                        <small class="text-muted">
                          {asset.change >= 0 ? '+' : ''}{formatPrice(asset.change, asset.currency)}
                        </small>
                      </div>
                    </td>
                    
                    <!-- Marktkapitalisierung -->
                    <td class="text-end">
                      <span class="fw-bold">{formatMarketCap(asset.marketCap)}</span>
                      {#if asset.currency}
                        <small class="text-muted d-block">{asset.currency}</small>
                      {/if}
                    </td>
                    
                    <!-- Portfolio Position -->
                    <td class="text-center">
                      {#if positionsBySymbol()[asset.symbol]}
                        {@const position = positionsBySymbol()[asset.symbol]}
                        <div class="badge bg-success">
                          {position.amount} Stück
                        </div>
                        <small class="text-muted d-block">
                          @ {formatPrice(position.avg_price, asset.currency)}
                        </small>
                      {:else}
                        <span class="text-muted">–</span>
                      {/if}
                    </td>
                    
                    <!-- Aktionen -->
                    <td class="text-end" on:click|stopPropagation>
                      <div class="btn-group btn-group-sm" role="group">
                        <button 
                          type="button" 
                          class="btn btn-outline-success"
                          disabled={buyingSymbol === asset.symbol}
                          on:click={() => handleQuickBuy(asset.symbol)}
                        >
                          {#if buyingSymbol === asset.symbol}
                            <span class="spinner-border spinner-border-sm me-1"></span>
                          {:else}
                            <i class="bi bi-cart-plus me-1"></i>
                          {/if}
                          Buy
                        </button>
                        
                        <button 
                          type="button" 
                          class="btn btn-outline-danger"
                          disabled={sellingSymbol === asset.symbol || !positionsBySymbol()[asset.symbol]}
                          on:click={() => handleQuickSell(asset.symbol)}
                        >
                          {#if sellingSymbol === asset.symbol}
                            <span class="spinner-border spinner-border-sm me-1"></span>
                          {:else}
                            <i class="bi bi-cash-stack me-1"></i>
                          {/if}
                          Sell
                        </button>
                        
                        <button 
                          type="button" 
                          class="btn btn-outline-primary"
                          on:click={() => viewDetails(asset.symbol)}
                        >
                          <i class="bi bi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td colspan="7">
                    <div class="text-center py-5">
                      <i class="bi bi-search display-1 text-muted"></i>
                      <h4 class="text-muted mt-3">Keine Assets gefunden</h4>
                      <p class="text-muted">
                        {#if searchQuery}
                          Keine Assets entsprechen Ihrer Suche "{searchQuery}".
                        {:else}
                          In dieser Kategorie sind keine Assets verfügbar.
                        {/if}
                      </p>
                    </div>
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
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
  }
  
  /* Existing Styles */
  .cursor-pointer {
    cursor: pointer;
  }
  
  .cursor-pointer:hover {
    background-color: var(--bs-gray-50);
  }
  
  .btn-group .btn {
    font-size: 0.875rem;
    padding: 0.375rem 0.5rem;
  }
  
  .badge {
    font-size: 0.75em;
  }
  
  .table td {
    vertical-align: middle;
  }
  
  .alert {
    margin-top: 1rem;
  }
  
  /* Disable interactions during loading */
  .table tbody tr {
    transition: background-color 0.2s ease;
  }
  
  tr:has(.skeleton) {
    cursor: default !important;
  }
  
  tr:has(.skeleton):hover {
    background-color: transparent !important;}
    </style>