<script>
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  // Better Auth Session Store
  const session = authClient.useSession();

  // Form state
  let email = "";
  let password = "";
  let showPassword = false;
  let isSubmitting = false;
  let error = "";

  // Wenn bereits eingeloggt, direkt weiterleiten
  $effect(() => {
    if ($session.data) {
      goto("/dashboard");
    }
  });

  // Handle form submission
  async function handleLogin(event) {
    event.preventDefault();
    error = "";
    isSubmitting = true;

    const { data, error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password: password
    });

    if (signInError) {
      error = signInError.message || "Anmeldung fehlgeschlagen";
      isSubmitting = false;
      return;
    }

    // Bei Erfolg zum Dashboard
    goto("/dashboard");
  }

  // Passwort anzeigen/verbergen
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Anmelden – Investify</title>
</svelte:head>

<div class="login-container">
  <div class="container-fluid vh-100">
    <div class="row h-100 g-0">
      <!-- Left Side – Branding -->
      <div class="col-lg-7 bg-gradient-primary d-flex align-items-center">
        <div class="branding-content">
          <div class="text-center text-white px-5">
            <div class="brand-section mb-5">
              <div class="logo-container mb-4">
                <i class="bi bi-graph-up-arrow display-1"></i>
              </div>
              <h1 class="display-3 fw-bold mb-3">Investify</h1>
              <p class="lead fs-4 mb-0">
                Ihre zentrale Plattform für intelligentes Investieren
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side – Login Form -->
      <div class="col-lg-5 d-flex align-items-center justify-content-center bg-light">
        <div class="login-form-container">
          <div class="login-form px-4 px-lg-5">
            <div class="text-center mb-5">
              <h2 class="fw-bold text-dark mb-2">Willkommen zurück</h2>
              <p class="text-muted">Melden Sie sich in Ihrem Investify-Konto an</p>
            </div>

            {#if error}
              <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{error}
              </div>
            {/if}

            <form on:submit={handleLogin}>
              <!-- E-Mail -->
              <div class="mb-4">
                <label for="email" class="form-label fw-semibold">E-Mail-Adresse</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    class="form-control form-control-lg border-start-0 ps-0"
                    placeholder="ihre@email.com"
                    bind:value={email}
                    required
                    autocomplete="email"
                  />
                </div>
              </div>

              <!-- Passwort -->
              <div class="mb-4">
                <label for="password" class="form-label fw-semibold">Passwort</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    class="form-control form-control-lg border-start-0 border-end-0 ps-0"
                    placeholder="Ihr Passwort"
                    bind:value={password}
                    required
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary border-start-0"
                    on:click={togglePasswordVisibility}
                    aria-label="Passwort anzeigen/verbergen"
                  >
                    <i class="bi {showPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                  </button>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="rememberMe"
                  />
                  <label class="form-check-label text-muted small" for="rememberMe">
                    Angemeldet bleiben
                  </label>
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-lg w-100 mb-4"
                disabled={isSubmitting}
              >
                {#if isSubmitting}
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Anmelden…
                {:else}
                  <i class="bi bi-box-arrow-in-right me-2"></i>Anmelden
                {/if}
              </button>
            </form>

            <div class="text-center">
              <p class="text-muted mb-0">
                Noch kein Konto?
                <a href="/auth/register" class="text-decoration-none fw-semibold">
                  Jetzt kostenlos registrieren
                </a>
              </p>
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