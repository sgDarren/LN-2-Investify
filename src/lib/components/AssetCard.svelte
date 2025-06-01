<script>
  let { asset, position = null } = $props();
  
  // Formatiere Preis
  const formattedPrice = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: asset.currency || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: asset.category === 'Crypto' ? 4 : 2
  }).format(asset.price || 0);
  
  // Icon basierend auf Kategorie
  const categoryIcon = {
    'Crypto': 'bi-currency-bitcoin',
    'Stocks': 'bi-graph-up',
    'ETF': 'bi-collection',
    'Bonds': 'bi-bank',
    'Commodities': 'bi-gem'
  }[asset.category] || 'bi-coin';
  
  // Kategorie-Farben
  const categoryColor = {
    'Crypto': '#f7931a',
    'Stocks': '#667eea',
    'ETF': '#43e97b',
    'Bonds': '#4facfe',
    'Commodities': '#fa709a'
  }[asset.category] || '#667eea';
  
  // Position-Daten wenn vorhanden
  const positionValue = position ? position.quantity * asset.price : 0;
  const gainLoss = position ? positionValue - (position.quantity * position.avg_price) : 0;
  const gainLossPercent = position && position.avg_price > 0 
    ? ((asset.price - position.avg_price) / position.avg_price) * 100 
    : 0;
</script>

<div class="asset-card h-100">
  <div class="card-body">
    <!-- Header -->
    <div class="asset-header mb-3">
      <div class="asset-icon" style="background-color: {categoryColor}20; color: {categoryColor}">
        <i class="bi {categoryIcon}"></i>
      </div>
      <div class="asset-info">
        <h6 class="asset-symbol mb-0">{asset.symbol}</h6>
        {#if asset.name}
          <small class="text-muted">{asset.name}</small>
        {/if}
      </div>
      <div class="asset-category">
        <span class="badge" style="background-color: {categoryColor}15; color: {categoryColor}">
          {asset.category}
        </span>
      </div>
    </div>
    
    <!-- Price -->
    <div class="asset-price mb-3">
      <div class="price-label">Aktueller Kurs</div>
      <div class="price-value">{formattedPrice}</div>
    </div>
    
    <!-- Position Details (wenn vorhanden) -->
    {#if position}
      <div class="position-details">
        <div class="detail-row">
          <span class="detail-label">Menge:</span>
          <span class="detail-value">{position.quantity}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ø-Kurs:</span>
          <span class="detail-value">
            {new Intl.NumberFormat('de-CH', {
              style: 'currency',
              currency: asset.currency || 'EUR',
              minimumFractionDigits: 2
            }).format(position.avg_price)}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Wert:</span>
          <span class="detail-value fw-bold">
            {new Intl.NumberFormat('de-CH', {
              style: 'currency',
              currency: asset.currency || 'EUR'
            }).format(positionValue)}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">G/V:</span>
          <span class="detail-value" class:text-success={gainLoss >= 0} class:text-danger={gainLoss < 0}>
            {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    {/if}
    
    <!-- Actions -->
    <div class="card-actions mt-3">
      {#if position}
        <a href="/assets/{asset.symbol}" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-eye me-1"></i>Details
        </a>
        <button class="btn btn-sm btn-outline-success">
          <i class="bi bi-plus-circle me-1"></i>Kaufen
        </button>
      {:else}
        <a href="/assets/{asset.symbol}" class="btn btn-sm btn-primary w-100">
          <i class="bi bi-info-circle me-1"></i>Mehr erfahren
        </a>
      {/if}
    </div>
  </div>
</div>

<style>
  .asset-card {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .asset-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .card-body {
    padding: 1.25rem;
  }
  
  .asset-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .asset-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .asset-info {
    flex: 1;
    min-width: 0;
  }
  
  .asset-symbol {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.2;
  }
  
  .asset-category {
    flex-shrink: 0;
  }
  
  .badge {
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
  }
  
  .asset-price {
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 8px;
  }
  
  .price-label {
    font-size: 0.75rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
  }
  
  .price-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .position-details {
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }
  
  .detail-label {
    font-size: 0.875rem;
    color: #6c757d;
  }
  
  .detail-value {
    font-size: 0.875rem;
    color: #1a1a1a;
    font-weight: 500;
  }
  
  .card-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .card-actions .btn {
    flex: 1;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
  
  .btn-outline-primary {
    color: #667eea;
    border-color: #667eea;
  }
  
  .btn-outline-primary:hover {
    background: #667eea;
    color: white;
  }
  
  .btn-outline-success {
    color: #28a745;
    border-color: #28a745;
  }
  
  .btn-outline-success:hover {
    background: #28a745;
    color: white;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
  }
  
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .text-success {
    color: #28a745 !important;
  }
  
  .text-danger {
    color: #dc3545 !important;
  }
</style>