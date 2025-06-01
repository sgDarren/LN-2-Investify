<script>
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  
  // Better Auth Session
  const session = authClient.useSession();
  
  // Weiterleitung wenn eingeloggt
  $effect(() => {
    if ($session.data) {
      goto('/dashboard');
    }
  });
</script>

<svelte:head>
  <title>Investify</title>
</svelte:head>

<div class="container">
  <h1>Willkommen bei Investify</h1>
  <p>Bitte melden Sie sich an, um fortzufahren.</p>
  
  <div class="buttons">
    <a href="/auth/login" class="btn-primary">Anmelden</a>
    <a href="/auth/register" class="btn-secondary">Registrieren</a>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 20px;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    color: #666;
  }
  
  .buttons {
    display: flex;
    gap: 1rem;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  
  .btn-primary {
    background: #667eea;
    color: white;
  }
  
  .btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-2px);
  }
  
  .btn-secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
  }
  
  .btn-secondary:hover {
    background: #f7fafc;
    transform: translateY(-2px);
  }
</style>