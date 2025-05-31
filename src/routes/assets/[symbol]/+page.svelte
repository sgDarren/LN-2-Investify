<!-- src/routes/stocks/[symbol]/+page.svelte -->

<script>
  import { goto } from '$app/navigation';
  import PriceChart from '$lib/components/PriceChart.svelte';

  // In Runes Mode: Props via $props()
  let { data } = $props();
  const { symbol, current, historicalData } = data;

  // Handler für Buy/​Sell
  function handleBuy() {
    // Hier könntest du z. B. zu einem Kauf-Formular navigieren:
    goto(`/trade/buy?symbol=${symbol}`);
  }

  function handleSell() {
    // Oder zu einem Verkaufs-Formular:
    goto(`/trade/sell?symbol=${symbol}`);
  }
</script>

<svelte:head>
  <title>{symbol} – Detailansicht</title>
</svelte:head>

<div class="container mt-4">
  <!-- Überschrift mit Symbol und aktuellem Kurs -->
  <div class="d-flex justify-content-between align-items-center mb-3">
    <div>
      <h1 class="h3">{symbol}</h1>
      <div class="d-flex align-items-center">
        <span class="h4 me-2">
          {new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'USD'
          }).format(current.price)}
        </span>
        <span class={`badge ${current.change >= 0 ? 'bg-success' : 'bg-danger'}`}>
          {current.change >= 0 ? '+' : ''}{current.change.toFixed(2)} ({current.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
    <div class="text-muted">
      Letzte Aktualisierung: {current.lastUpdated}
    </div>
  </div>

  <!-- Chart-Container -->
  <div class="card mb-4">
    <div class="card-header">
      <h5 class="mb-0">Preisverlauf (letzte Tage)</h5>
    </div>
    <div class="card-body">
      {#if historicalData && historicalData.length > 0}
        <!-- PriceChart erwartet ein Array von Objekten mit { date, open, high, low, close, volume } -->
        <PriceChart data={historicalData} />
      {:else}
        <div class="text-center py-5 text-muted">
          Keine historischen Daten verfügbar.
        </div>
      {/if}
    </div>
  </div>

  <!-- Buy & Sell Buttons -->
  <div class="d-flex justify-content-center gap-3">
    <button class="btn btn-primary btn-lg px-4" on:click={handleBuy}>
      <i class="bi bi-cart-plus me-2"></i>Buy
    </button>
    <button class="btn btn-outline-danger btn-lg px-4" on:click={handleSell}>
      <i class="bi bi-cash-stack me-2"></i>Sell
    </button>
  </div>
</div>

<style>
  .container {
    max-width: 900px;
  }
  .badge {
    font-size: 1rem;
    padding: 0.5em 0.75em;
  }
  .btn i {
    vertical-align: -0.125em;
  }
</style>
