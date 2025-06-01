<script>
  let { portfolio } = $props();
  
  // Formatiere Wert
  const formattedValue = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(portfolio.total_value || 0);
  
  // Formatiere Datum
  const formattedDate = new Date(portfolio.created_at).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Dummy Performance-Daten (würden normalerweise berechnet werden)
  const performance = portfolio.performance || {
    value: Math.random() * 10 - 5, // -5% bis +5%
    isPositive: Math.random() > 0.5
  };
</script>

<div class="portfolio-card h-100">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-start mb-3">
      <h5 class="card-title mb-0">{portfolio.name}</h5>
      <div class="portfolio-icon">
        <i class="bi bi-briefcase-fill"></i>
      </div>
    </div>
    
    <div class="portfolio-value mb-3">
      <div class="value-label">Gesamtwert</div>
      <div class="value-amount">{formattedValue}</div>
    </div>
    
    <div class="portfolio-performance mb-3">
      <span class="performance-label">Performance</span>
      <span class="performance-value" class:positive={performance.isPositive} class:negative={!performance.isPositive}>
        {performance.isPositive ? '+' : ''}{performance.value.toFixed(2)}%
      </span>
    </div>
    
    <div class="portfolio-meta">
      <small class="text-muted">
        <i class="bi bi-calendar3 me-1"></i>
        Erstellt am {formattedDate}
      </small>
    </div>
    
    <div class="card-actions mt-3">
      <a href="/portfolio/{portfolio._id}" class="btn btn-sm btn-primary w-100">
        <i class="bi bi-eye me-1"></i>Details anzeigen
      </a>
    </div>
  </div>
</div>

<style>
  .portfolio-card {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .portfolio-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .portfolio-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
  }
  
  .portfolio-value {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
  }
  
  .value-label {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
  }
  
  .value-amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .portfolio-performance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .performance-label {
    font-size: 0.875rem;
    color: #6c757d;
  }
  
  .performance-value {
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .performance-value.positive {
    color: #28a745;
  }
  
  .performance-value.negative {
    color: #dc3545;
  }
  
  .portfolio-meta {
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }
  
  .card-actions {
    padding-top: 1rem;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
</style>