<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import PieChart from '$lib/components/PieChart.svelte';

  // Props von der Server-Load-Funktion
  const { data, form } = $props();
  
  // Reactive State für Formular
  let newName = $state('');
  let isSubmitting = $state(false);
  
  // Destructure server data
  const { portfolios, pieData, error: loadError } = data;
</script>

<svelte:head>
  <title>Dashboard – Investoria</title>
</svelte:head>

<div class="container py-4">
  <h1 class="mb-4">Mein Dashboard</h1>

  {#if loadError}
    <div class="alert alert-danger" role="alert">{loadError}</div>
  {/if}

  {#if form?.error}
    <div class="alert alert-danger" role="alert">{form.error}</div>
  {/if}

  {#if form?.success && form?.message}
    <div class="alert alert-success" role="alert">{form.message}</div>
  {/if}

  <!-- PieChart-Übersicht -->
  <div class="card mb-4">
    <div class="card-header">
      <h5 class="mb-0">Portfolio-Aufteilung</h5>
    </div>
    <div class="card-body">
      {#if pieData.labels.length > 0}
        <PieChart 
          labels={pieData.labels} 
          values={pieData.values} 
          colors={pieData.colors} 
        />
      {:else}
        <p class="text-muted text-center">Keine Portfolios vorhanden</p>
      {/if}
    </div>
  </div>

  <!-- Portfolio-Liste -->
  <div class="card mb-4">
    <div class="card-header">
      <h5 class="mb-0">Meine Portfolios</h5>
    </div>
    <div class="card-body">
      {#if portfolios.length === 0}
        <p class="text-muted">Noch keine Portfolios angelegt.</p>
      {:else}
        <ul class="list-group">
          {#each portfolios as portfolio (portfolio.id)}
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <span>{portfolio.name}</span>
              <span class="badge bg-primary rounded-pill">
                {portfolio.value.toLocaleString('de-CH', { style: 'currency', currency: 'EUR' })}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  <!-- Neues Portfolio hinzufügen -->
  <div class="card">
    <div class="card-header">
      <h5 class="mb-0">Neues Portfolio erstellen</h5>
    </div>
    <div class="card-body">
      <form 
        method="POST" 
        action="?/createPortfolio"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            newName = '';
            isSubmitting = false;
            // Daten neu laden
            await invalidateAll();
          };
        }}
      >
        <div class="input-group">
          <input
            type="text"
            name="name"
            class="form-control"
            placeholder="Portfolio-Name"
            bind:value={newName}
            disabled={isSubmitting}
            required
          />
          <button 
            class="btn btn-success" 
            type="submit"
            disabled={isSubmitting || !newName.trim()}
          >
            {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
  }
  .card {
    border-radius: 0.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .card-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }
</style>