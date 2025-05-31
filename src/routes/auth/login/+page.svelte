<script>
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { goto } from "$app/navigation";

  // Reactive state mit Svelte 5 Runes
  let email = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let userExists = $state(null); // null = not checked, true/false = checked
  let isCheckingUser = $state(false); // Verhindere multiple calls
  let lastCheckedEmail = $state(""); // Track welche email gecheckt wurde

  // Form data from page.form - noch als store da page ein Store ist
  let form = $derived($page.form);

  // Reset user check when email changes
  $effect(() => {
    if (email.trim() !== lastCheckedEmail) {
      userExists = null;
      // Don't reset lastCheckedEmail here to avoid infinite loops
    }
  });

  // RICHTIGER Weg: Server Action mit Form + enhance
  async function checkUser() {
    const currentEmail = email.trim();
    
    if (!currentEmail) {
      userExists = null;
      return;
    }
    
    // Verhindere multiple calls für die gleiche Email
    if (isCheckingUser || lastCheckedEmail === currentEmail) {
      console.log('Already checking or already checked:', currentEmail);
      return;
    }
    
    isCheckingUser = true;
    lastCheckedEmail = currentEmail;
    console.log('Starting user check for:', currentEmail);
    
    // Trigger das versteckte Form
    const form = document.getElementById('checkUserForm');
    const emailInput = document.getElementById('checkUserEmail');
    emailInput.value = currentEmail;
    
    // Submit via enhance - das ist der SvelteKit Way!
    const submitEvent = new Event('submit', { cancelable: true });
    form.dispatchEvent(submitEvent);
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function setDemoCredentials() {
    email = "demo@investify.com";
    password = "demo123";
  }
</script>

<svelte:head>
  <title>Anmelden - Investify</title>
</svelte:head>

<div class="login-container">
  <div class="container-fluid vh-100">
    <div class="row h-100 g-0">
      <!-- Left Side - Branding (same as before) -->
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

      <!-- Right Side - Login Form -->
      <div class="col-lg-5 d-flex align-items-center justify-content-center bg-light">
        <div class="login-form-container">
          <div class="login-form px-4 px-lg-5">
            <div class="text-center mb-5">
              <h2 class="fw-bold text-dark mb-2">Willkommen zurück</h2>
              <p class="text-muted">Melden Sie sich in Ihrem Investify-Konto an</p>
            </div>

            {#if form?.error}
              <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{form.error}
              </div>
            {/if}

            <form 
              method="POST" 
              action="?/login"
              use:enhance={({ formData }) => {
                isSubmitting = true;
                
                return async ({ result, update }) => {
                  isSubmitting = false;
                  await update();
                };
              }}
            >
              <!-- Email Input -->
              <div class="mb-4">
                <label for="email" class="form-label fw-semibold">E-Mail-Adresse</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control form-control-lg border-start-0 ps-0"
                    id="email"
                    name="email"
                    bind:value={email}
                    placeholder="ihre@email.com"
                    required
                    autocomplete="email"
                    on:blur={checkUser}
                  />
                </div>
                {#if userExists === false}
                  <div class="form-text text-info">
                    <i class="bi bi-info-circle me-1"></i>
                    Benutzer nicht gefunden. Sie werden zur Registrierung weitergeleitet...
                  </div>
                {:else if userExists === true}
                  <div class="form-text text-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Benutzer gefunden! Bitte geben Sie Ihr Passwort ein.
                  </div>
                {/if}
              </div>

              <!-- Password Input - nur anzeigen wenn User existiert oder noch nicht gecheckt -->
              {#if userExists === null || userExists === true}
                <div class="mb-4">
                  <label for="password" class="form-label fw-semibold">Passwort</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white border-end-0">
                      <i class="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      class="form-control form-control-lg border-start-0 border-end-0 ps-0"
                      id="password"
                      name="password"
                      bind:value={password}
                      placeholder="Ihr Passwort"
                      required={userExists === true}
                      autocomplete="current-password"
                      disabled={userExists === false}
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary border-start-0"
                      on:click={togglePasswordVisibility}
                      disabled={userExists === false}
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
                      disabled={userExists === false}
                    />
                    <label class="form-check-label text-muted small" for="rememberMe">
                      Angemeldet bleiben
                    </label>
                  </div>
                  <a href="/auth/forgot-password" class="text-decoration-none small">
                    Passwort vergessen?
                  </a>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary btn-lg w-100 mb-4"
                  disabled={isSubmitting || userExists === false || !email.trim() || (userExists === true && !password.trim())}
                >
                  {#if isSubmitting}
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    {userExists === null ? 'Prüfe Benutzer...' : 'Anmelden...'}
                  {:else}
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    Anmelden
                  {/if}
                </button>
              {:else}
                <!-- User existiert nicht - zeige nur Info -->
                <div class="alert alert-info" role="alert">
                  <i class="bi bi-info-circle me-2"></i>
                  Kein Konto gefunden. Sie werden zur Registrierung weitergeleitet...
                </div>
              {/if}
            </form>

            <div class="text-center">
              <p class="text-muted mb-0">
                Noch kein Konto?
                <a href="/auth/register" class="text-decoration-none fw-semibold">
                  Jetzt kostenlos registrieren
                </a>
              </p>
            </div>

            <div class="mt-4 pt-4 border-top">
              <div class="text-center">
                <p class="small text-muted mb-2">Für Demo-Zwecke:</p>
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  on:click={setDemoCredentials}
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
