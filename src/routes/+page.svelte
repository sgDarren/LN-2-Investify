<script>
import { onMount } from 'svelte';
import { authStore } from '$lib/stores/auth.svelte.js';
import { portfolioStore } from '$lib/stores/portfolio.svelte.js';
// import PortfolioSummary from '$lib/components/dashboard/PortfolioSummary.svelte';
// import PortfolioPieChart from '$lib/components/dashboard/PortfolioPieChart.svelte';
// import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';

let { data } = $props();

let user = $derived(authStore.user);
let isAuthenticated = $derived(authStore.isAuthenticated);
let positions = $derived(portfolioStore.positions);

onMount(() => {
    if (data.user) {
        authStore.setUser(data.user);
        portfolioStore.loadPortfolio();
    }
});
</script>

<svelte:head>
    <title>Investify - Dashboard</title>
</svelte:head>

{#if isAuthenticated}
    <div class="container-fluid">
        <div class="row mb-4">
            <div class="col">
                <h1 class="h2">Welcome back, {user?.firstName}!</h1>
                <p class="text-muted">Here's your investment overview</p>
            </div>
        </div>
        
        <PortfolioSummary />
        
        <div class="row mt-4">
            <div class="col-md-8">
                <RecentTransactions />
            </div>
            <div class="col-md-4">
                <PortfolioPieChart />
            </div>
        </div>
    </div>
{:else}
    <div class="hero-section text-center py-5">
        <div class="container">
            <h1 class="display-4">Welcome to Investify</h1>
            <p class="lead">Your personal investment platform</p>
            <div class="mt-4">
                <a href="/auth/login" class="btn btn-primary btn-lg me-3">Login</a>
                <a href="/auth/register" class="btn btn-outline-primary btn-lg">Sign Up</a>
            </div>
        </div>
    </div>
{/if}