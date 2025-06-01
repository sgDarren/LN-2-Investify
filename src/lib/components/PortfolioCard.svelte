<script>
  const { portfolio } = $props();
  
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

<div class="portfolio-card card border-0 shadow-sm h-100">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-start mb-3">
      <h5 class="card-title mb-0">{portfolio.name}</h5>
      <div class="portfolio-icon">
        <i class="bi bi-briefcase"></i>
      </div>
    </div>
    
    <div class="portfolio-value mb-3">
      <h3 class="mb-0">{formatCurrency(portfolio.value || portfolio.total_value)}</h3>
      {#if portfolio.gainLoss !== undefined || portfolio.performance}
        <div class="performance-indicator {(portfolio.gainLoss || portfolio.performance?.value || 0) >= 0 ? 'text-success' : 'text-danger'}">
          <i class="bi bi-{(portfolio.gainLoss || portfolio.performance?.value || 0) >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
          {formatPercent(portfolio.gainLossPercent || portfolio.performance?.value || 0)}
        </div>
      {/if}
    </div>
    
    <div class="portfolio-meta">
      <small class="text-muted">
        <i class="bi bi-calendar3 me-1"></i>
        Erstellt am {formatDate(portfolio.created_at)}
      </small>
    </div>
    
    <div class="mt-3">
      <a href="/portfolio/{portfolio.id || portfolio._id}" class="btn btn-primary btn-sm w-100">
        <i class="bi bi-eye me-2"></i>Details anzeigen
      </a>
    </div>
  </div>
</div>

<style>
  .portfolio-card {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .portfolio-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
  }
  
  .portfolio-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .portfolio-value h3 {
    font-weight: 700;
    color: #2d3748;
  }
  
  .performance-indicator {
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .portfolio-meta {
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    font-weight: 500;
  }
  
  .btn-primary:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%);
    transform: translateY(-1px);
  }
</style>