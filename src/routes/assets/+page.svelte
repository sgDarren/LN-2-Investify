<script>
  let { data } = $props();

  // Aus den geladenen Portfolio-Positionen eine Lookup-Map nach Symbol erstellen
  const positionsBySymbol = {};
  data.positions?.forEach((p) => {
    positionsBySymbol[p.symbol] = p;
  });

  // Hilfsfunktion, um Preis passend zu formatieren (CHF für Aktien, USD für Krypto)
  function formatPrice(value, type) {
    const locale = type === 'stock' ? 'de-CH' : 'en-US';
    const currency = type === 'stock' ? 'CHF' : 'USD';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(value);
  }
</script>

<svelte:head>
  <title>Asset Übersicht – Investify</title>
</svelte:head>

<div class="container-fluid">
  <h1 class="mt-4">Asset Übersicht</h1>

  {#if data.error}
    <div class="alert alert-danger mt-3">{data.error}</div>
  {/if}

  <div class="table-responsive mt-3">
    <table class="table table-hover align-middle">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Preis</th>
          <th>Veränderung (%)</th>
          <th>Typ</th>
          <th>Eigene Position</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.assets as asset}
          <tr>
            <!-- Symbol -->
            <td>{asset.symbol}</td>

            <!-- Preis (CHF für Aktien, USD für Krypto) -->
            <td>{formatPrice(asset.price, asset.type)}</td>

            <!-- Prozentuale Veränderung farbig -->
            <td>
              <span class={asset.change >= 0 ? 'text-success' : 'text-danger'}>
                {asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
              </span>
            </td>

            <!-- Asset-Typ („stock“ oder „crypto“) -->
            <td class="text-capitalize">{asset.type}</td>

            <!-- Eigene Position (Anzahl Stück & Durchschnittspreis) -->
            <td>
              {#if positionsBySymbol[asset.symbol]}
                {positionsBySymbol[asset.symbol].amount} Stück @
                {formatPrice(positionsBySymbol[asset.symbol].avg_price, asset.type)}
              {:else}
                –
              {/if}
            </td>

            <!-- Link zur Detailseite -->
            <td>
              <a
                class="btn btn-sm btn-outline-primary"
                href={`/assets/${asset.symbol.toLowerCase()}`}>
                Details
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
