<!-- <script>
    /** @type {{ data: import('./$types').PageData }} */
    let { data } = $props();
</script> -->
<!-- src/routes/portfolio/+page.svelte -->
<svelte:options runes={true} />

<script>
  import { portfolioStore, priceStore } from '$lib/stores';
  import PieChart from '$lib/components/charts/PieChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import KPIPanel from '$lib/components/charts/KPIPanel.svelte';
  import PortfolioTable from './PortfolioTable.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Loading from '$lib/components/ui/Loading.svelte';
  import { onMount } from 'svelte';

  let loading = $state(false);

  // Derived values mit Runes
  let totalValue = $derived(
    $portfolioStore.holdings?.reduce(
      (sum, holding) =>
        sum + (holding.amount * ($priceStore.prices[holding.assetSymbol] || holding.purchasePrice)),
      0
    ) || 0
  );

  let totalInvested = $derived(
    $portfolioStore.holdings?.reduce(
      (sum, holding) => sum + holding.amount * holding.purchasePrice,
      0
    ) || 0
  );

  let performance = $derived({
    absolute: totalValue - totalInvested,
    percentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0
  });

  let allocationData = $derived(
    $portfolioStore.holdings?.map(holding => ({
      label: holding.assetSymbol,
      value:
        holding.amount * ($priceStore.prices[holding.assetSymbol] || holding.purchasePrice),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    })) || []
  );

  // Effect für initiale Datenladung
  $effect(() => {
    if (!$portfolioStore.initialized) {
      loadData();
    }
  });

  async function loadData() {
    loading = true;
    try {
      await portfolioStore.loadPortfolio();
      await priceStore.updatePrices($portfolioStore.holdings.map(h => h.assetSymbol));
    } finally {
      loading = false;
    }
  }
</script>

<div class="container-fluid py-4">
  <div class="row mb-4">
    <div class="col-12">
      <h1 class="h3 mb-0">Portfolio Dashboard</h1>
      <p class="text-muted">Überblick über Ihre Investitionen</p>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-5">
      <Loading size="lg" text="Lade Portfolio-Daten..." center />
    </div>
  {:else}
    <!-- KPI Panel -->
    <div class="row mb-4">
      <div class="col-12">
        <KPIPanel {totalValue} {totalInvested} {performance} />
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row mb-4">
      <div class="col-lg-6">
        <Card title="Asset Allocation">
          <PieChart data={allocationData} />
        </Card>
      </div>
      <div class="col-lg-6">
        <Card title="Portfolio Performance">
          <LineChart />
        </Card>
      </div>
    </div>

    <!-- Portfolio Table -->
    <div class="row">
      <div class="col-12">
        <Card title="Holdings">
          <PortfolioTable holdings={$portfolioStore.holdings} />
        </Card>
      </div>
    </div>
  {/if}
</div>
