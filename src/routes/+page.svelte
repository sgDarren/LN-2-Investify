<script>
import { portfolioStore } from '$lib/stores/portfolio.svelte.js';
  import PortfolioSummary from '$lib/components/dashboard/PortfolioSummary.svelte';
  import PortfolioPieChart from '$lib/components/dashboard/PortfolioPieChart.svelte';
  import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';

  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { derived } from 'svelte/store';

  // Better Auth–Session-Store
  const session = authClient.useSession();

  // Den eingeloggten Nutzer aus der Session ableiten
  const user = derived(session, ($session) => $session?.data?.user);

  // Prüfen, ob authentifiziert (Session-Daten vorhanden)
  const isAuthenticated = derived(session, ($session) => !!$session?.data);

  // Positionsdaten aus dem Portfolio-Store
  const positions = derived(portfolioStore, ($ps) => $ps.positions);

  // Sobald die Session-Daten verfügbar sind, Portfolio laden
  $effect(() => {
    if (session.data) {
      portfolioStore.loadPortfolio();
    }
  });

  // Falls nicht eingeloggt, zum Login weiterleiten
  $effect(() => {
    if (session.data === null) {
      // session.data ist entweder `undefined` (ladezustand) oder `null` (kein User)
      // Nur umleiten, wenn definitiv keine Session existiert
      if (session.data === null) {
        goto('/auth/login');
      }
    }
  });
</script>

<svelte:head>
  <title>Investify – Dashboard</title>
</svelte:head>

{#if $isAuthenticated}
  <div class="container-fluid">
    <div class="row mb-4">
      <div class="col">
        <h1 class="h2">
          Willkommen zurück, {$user?.firstName}!
        </h1>
        <p class="text-muted">
          Hier ist Ihre Investitionsübersicht
        </p>
      </div>
    </div>

    <PortfolioSummary {positions} />

    <div class="row mt-4">
      <div class="col-md-8">
        <RecentTransactions />
      </div>
      <div class="col-md-4">
        <PortfolioPieChart {positions} />
      </div>
    </div>
  </div>
{:else}
  <div class="hero-section text-center py-5">
    <div class="container">
      <h1 class="display-4">Willkommen bei Investify</h1>
      <p class="lead">Ihre persönliche Investment-Plattform</p>
      <div class="mt-4">
        <a href="/auth/login" class="btn btn-primary btn-lg me-3">
          Login
        </a>
        <a href="/auth/register" class="btn btn-outline-primary btn-lg">
          Registrieren
        </a>
      </div>
    </div>
  </div>
{/if}

<style>
  .hero-section {
    background-color: #f8f9fa;
  }

  .hero-section h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .hero-section p {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }
</style>
