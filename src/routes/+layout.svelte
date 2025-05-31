<script>
import { onMount } from 'svelte';
import { page } from '$app/stores';
import { authStore } from '$lib/stores/auth.svelte.js';
import Navbar from '$lib/components/ui/Navbar.svelte';

let { data, children } = $props();

let isAuthenticated = $derived(authStore.isAuthenticated);
let currentPath = $derived($page.url.pathname);
let isAuthPage = $derived(
    currentPath.startsWith('/auth/') || currentPath === '/'
);

onMount(() => {
    // Set user from SSR data
    if (data.user) {
        authStore.setUser(data.user);
    }
});
</script>

<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<!-- Always show navbar -->
<Navbar />

<!-- Main content with auth protection -->
<main class="main-content">
    {#if !isAuthenticated && !isAuthPage}
        <!-- Redirect non-authenticated users -->
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6 text-center">
                    <h2>Please Login</h2>
                    <p class="text-muted">You need to be logged in to access this page.</p>
                    <a href="/auth/login" class="btn btn-primary">Login</a>
                </div>
            </div>
        </div>
    {:else}
        {@render children()}
    {/if}
</main>

<style>
    .main-content {
        min-height: calc(100vh - 56px); /* Account for navbar height */
        padding-top: 2rem;
    }
    
    :global(body) {
        background-color: #f8f9fa;
    }
    
    :global(.navbar) {
        box-shadow: 0 2px 4px rgba(0,0,0,.1);
    }
</style>