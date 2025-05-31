<!-- src/routes/auth/login/+page.svelte -->
<svelte:options runes={true} />

<script>
  import { authStore } from "$lib/stores/auth.svelte.js";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  // Reactive state mit Svelte 5 Runes
  let email = $state("");
  let password = $state("");
  let error = $state("");
  let showPassword = $state(false);

  // Redirect wenn bereits eingeloggt
  onMount(() => {
    if (authStore.isAuthenticated) {
      goto("/dashboard");
    }
  });

  async function handleLogin() {
    error = "";

    // Basis-Validierung
    if (!email.trim()) {
      error = "Bitte geben Sie Ihre E-Mail-Adresse ein.";
      return;
    }

    if (!password.trim()) {
      error = "Bitte geben Sie Ihr Passwort ein.";
      return;
    }

    // Email-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      return;
    }

    const result = await authStore.login(email.trim(), password);

    if (!result.success) {
      error =
        result.error ||
        "Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.";
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  // Separate Handler-Funktionen für Svelte 5
  function clearError() {
    error = "";
  }

  function setDemoCredentials() {
    email = "demo@investify.com";
    password = "demo123";
  }
</script>

<svelte:head>
  <title>Anmelden - Investify</title>
  <meta
    name="description"
    content="Melden Sie sich bei Investify an und verwalten Sie Ihr Portfolio intelligent."
  />
</svelte:head>

<div class="login-container">
  <div class="container-fluid vh-100">
    <div class="row h-100 g-0">
      <!-- Left Side - Branding & Features -->
      <div class="col-lg-7 bg-gradient-primary d-flex align-items-center">
        <div class="branding-content">
          <div class="text-center text-white px-5">
            <!-- Logo & Brand -->
            <div class="brand-section mb-5">
              <div class="logo-container mb-4">
                <i class="bi bi-graph-up-arrow display-1"></i>
              </div>
              <h1 class="display-3 fw-bold mb-3">Investify</h1>
              <p class="lead fs-4 mb-0">
                Ihre zentrale Plattform für intelligentes Investieren
              </p>
            </div>

            <!-- Feature Highlights -->
            <div class="features-grid">
              <div class="row g-4">
                <div class="col-md-4">
                  <div class="feature-card">
                    <div class="feature-icon mb-3">
                      <i class="bi bi-speedometer2 fs-1"></i>
                    </div>
                    <h5 class="fw-semibold">Real-time Dashboard</h5>
                    <p class="small opacity-90">
                      Live-Übersicht Ihrer Investments mit aktuellen Kursdaten
                    </p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="feature-card">
                    <div class="feature-icon mb-3">
                      <i class="bi bi-briefcase fs-1"></i>
                    </div>
                    <h5 class="fw-semibold">Portfolio-Management</h5>
                    <p class="small opacity-90">
                      Verwalten Sie Aktien, ETFs und Kryptowährungen zentral
                    </p>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="feature-card">
                    <div class="feature-icon mb-3">
                      <i class="bi bi-bar-chart fs-1"></i>
                    </div>
                    <h5 class="fw-semibold">Performance Analytics</h5>
                    <p class="small opacity-90">
                      Detaillierte Analysen und Gewinn-/Verlust-Berechnungen
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trust Indicators -->
            <div
              class="trust-section mt-5 pt-4 border-top border-white border-opacity-25"
            >
              <div class="row align-items-center">
                <div class="col-md-6">
                  <div class="d-flex align-items-center justify-content-center">
                    <i class="bi bi-shield-check fs-4 me-2"></i>
                    <span class="small">Sicher & Verschlüsselt</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="d-flex align-items-center justify-content-center">
                    <i class="bi bi-clock fs-4 me-2"></i>
                    <span class="small">24/7 Verfügbar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form -->
      <div
        class="col-lg-5 d-flex align-items-center justify-content-center bg-light"
      >
        <div class="login-form-container">
          <div class="login-form px-4 px-lg-5">
            <!-- Form Header -->
            <div class="text-center mb-5">
              <h2 class="fw-bold text-dark mb-2">Willkommen zurück</h2>
              <p class="text-muted">
                Melden Sie sich in Ihrem Investify-Konto an
              </p>
            </div>

            <!-- Error Alert -->
            {#if error}
              <div
                class="alert alert-danger alert-dismissible fade show"
                role="alert"
              >
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{error}
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  onclick={clearError}
                ></button>
              </div>
            {/if}

            <!-- Login Form -->
            <form onsubmit={handleLogin} class="needs-validation" novalidate>
              <!-- Email Input -->
              <div class="mb-4">
                <label for="email" class="form-label fw-semibold"
                  >E-Mail-Adresse</label
                >
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control form-control-lg border-start-0 ps-0"
                    id="email"
                    bind:value={email}
                    placeholder="ihre@email.com"
                    required
                    autocomplete="email"
                  />
                </div>
              </div>

              <!-- Password Input -->
              <div class="mb-4">
                <label for="password" class="form-label fw-semibold"
                  >Passwort</label
                >
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    class="form-control form-control-lg border-start-0 border-end-0 ps-0"
                    id="password"
                    bind:value={password}
                    placeholder="Ihr Passwort"
                    required
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary border-start-0"
                    onclick={togglePasswordVisibility}
                    aria-label="Passwort anzeigen/verbergen"
                  >
                    <i class="bi {showPassword ? 'bi-eye-slash' : 'bi-eye'}"
                    ></i>
                  </button>
                </div>
              </div>

              <!-- Remember Me & Forgot Password -->
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                  />
                  <label
                    class="form-check-label text-muted small"
                    for="rememberMe"
                  >
                    Angemeldet bleiben
                  </label>
                </div>
                <a
                  href="/auth/forgot-password"
                  class="text-decoration-none small"
                >
                  Passwort vergessen?
                </a>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="btn btn-primary btn-lg w-100 mb-4"
                disabled={authStore.isLoading}
              >
                {#if authStore.isLoading}
                  <span
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Anmelden...
                {:else}
                  <i class="bi bi-box-arrow-in-right me-2"></i>
                  Anmelden
                {/if}
              </button>
            </form>

            <!-- Register Link -->
            <div class="text-center">
              <p class="text-muted mb-0">
                Noch kein Konto?
                <a
                  href="/auth/register"
                  class="text-decoration-none fw-semibold"
                >
                  Jetzt kostenlos registrieren
                </a>
              </p>
            </div>

            <!-- Demo Login (für Entwicklung) -->
            <div class="mt-4 pt-4 border-top">
              <div class="text-center">
                <p class="small text-muted mb-2">Für Demo-Zwecke:</p>
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  onclick={setDemoCredentials}
                >
                  <i class="bi bi-person-gear me-1"></i>
                  Demo-Login verwenden
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }

  .bg-gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
  }

  .bg-gradient-primary::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    background-repeat: repeat;
    opacity: 0.1;
  }

  .branding-content {
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .logo-container {
    position: relative;
  }

  .feature-card {
    text-align: center;
    padding: 1.5rem 1rem;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition:
      transform 0.3s ease,
      background 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
  }

  .feature-icon {
    opacity: 0.9;
  }

  .login-form-container {
    width: 100%;
    max-width: 500px;
  }

  .form-control:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  }

  .input-group-text {
    border-color: #dee2e6;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  .btn-primary:disabled {
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 991.98px) {
    .bg-gradient-primary {
      min-height: 40vh;
    }

    .branding-content {
      padding: 2rem 0;
    }

    .features-grid {
      display: none;
    }

    .trust-section {
      margin-top: 2rem !important;
      padding-top: 2rem !important;
    }
  }

  @media (max-width: 575.98px) {
    .login-form {
      padding: 1rem !important;
    }

    .brand-section h1 {
      font-size: 2.5rem !important;
    }
  }
</style>
