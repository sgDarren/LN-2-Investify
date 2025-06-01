<script>
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  // Better Auth session store
  const session = authClient.useSession();

  // Form state with Svelte 5 runes
  let firstName = $state("");
  let lastName = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let acceptTerms = $state(false);
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let isSubmitting = $state(false);
  let authError = $state("");

  // Field errors for validation
  let fieldErrors = $state({});

  // Redirect if already authenticated
  $effect(() => {
    if ($session.data) {
      goto("/dashboard");
    }
  });

  // Get email from URL params if present
  $effect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      if (emailParam) {
        email = emailParam;
      }
    }
  });

  // Client-side validation
  function validateForm() {
    const errors = {};

    if (!firstName || firstName.trim().length < 2) {
      errors.firstName = "Vorname muss mindestens 2 Zeichen lang sein";
    }

    if (!lastName || lastName.trim().length < 2) {
      errors.lastName = "Nachname muss mindestens 2 Zeichen lang sein";
    }

    if (!email) {
      errors.email = "E-Mail-Adresse ist erforderlich";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein";
      }
    }

    if (!password || password.length < 6) {
      errors.password = "Passwort muss mindestens 6 Zeichen lang sein";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwörter stimmen nicht überein";
    }

    if (!acceptTerms) {
      errors.acceptTerms = "Sie müssen die Nutzungsbedingungen akzeptieren";
    }

    fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  // Handle registration with Better Auth
  async function handleRegister(event) {
    event.preventDefault();
    console.log("handleRegister called"); // Debug
    
    // Clear previous errors
    authError = "";
    
    // Validate form
    if (!validateForm()) {
      console.log("Validation failed", fieldErrors); // Debug
      return;
    }

    isSubmitting = true;
    console.log("Attempting registration with:", { // Debug
      email: email.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`
    });

    try {
      // Register with Better Auth
      const { data, error } = await authClient.signUp.email({
        email: email.trim(),
        password: password,
        name: `${firstName.trim()} ${lastName.trim()}`,
        callbackURL: "/dashboard"
      });

      console.log("Registration response:", { data, error }); // Debug

      if (error) {
        authError = error.message || "Registrierung fehlgeschlagen";
        
        // Handle specific errors
        if (error.message?.includes("already exists") || error.message?.includes("already registered")) {
          fieldErrors = { email: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits" };
        }
      } else {
        // Success - Better Auth will handle the redirect
        console.log("Registration successful, redirecting..."); // Debug
        goto("/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);
      authError = "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
    } finally {
      isSubmitting = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function toggleConfirmPasswordVisibility() {
    showConfirmPassword = !showConfirmPassword;
  }
</script>

<svelte:head>
  <title>Registrieren – Investify</title>
</svelte:head>

<div class="register-container">
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
              <p class="lead fs-4 mb-5">
                Ihre zentrale Plattform für intelligentes Investieren
              </p>
            </div>

            <!-- Benefits -->
            <div class="row g-4 mt-4">
              <div class="col-md-4">
                <div class="benefit-card">
                  <i class="bi bi-shield-check display-4 mb-3 benefit-icon"></i>
                  <h5 class="fw-semibold">Sicher & Geschützt</h5>
                  <p class="small mb-0 opacity-90">
                    Höchste Sicherheitsstandards für Ihre Daten
                  </p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="benefit-card">
                  <i class="bi bi-graph-up display-4 mb-3 benefit-icon"></i>
                  <h5 class="fw-semibold">Smart Investieren</h5>
                  <p class="small mb-0 opacity-90">
                    Intelligente Tools für bessere Entscheidungen
                  </p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="benefit-card">
                  <i class="bi bi-people display-4 mb-3 benefit-icon"></i>
                  <h5 class="fw-semibold">Community</h5>
                  <p class="small mb-0 opacity-90">
                    Lernen Sie von erfahrenen Investoren
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side – Registration Form -->
      <div class="col-lg-5 d-flex align-items-center justify-content-center bg-light">
        <div class="register-form-container">
          <div class="register-form px-4 px-lg-5">
            <div class="text-center mb-4">
              <h2 class="fw-bold text-dark mb-2">Konto erstellen</h2>
              <p class="text-muted">Erstellen Sie Ihr kostenloses Investify-Konto</p>
            </div>

            {#if authError}
              <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{authError}
              </div>
            {/if}

            <form on:submit={handleRegister}>
              <!-- Name Fields -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="firstName" class="form-label fw-semibold">Vorname</label>
                  <input
                    type="text"
                    class="form-control form-control-lg"
                    class:is-invalid={fieldErrors.firstName}
                    id="firstName"
                    name="firstName"
                    bind:value={firstName}
                    placeholder="Max"
                    required
                  />
                  {#if fieldErrors.firstName}
                    <div class="invalid-feedback">{fieldErrors.firstName}</div>
                  {/if}
                </div>
                <div class="col-md-6">
                  <label for="lastName" class="form-label fw-semibold">Nachname</label>
                  <input
                    type="text"
                    class="form-control form-control-lg"
                    class:is-invalid={fieldErrors.lastName}
                    id="lastName"
                    name="lastName"
                    bind:value={lastName}
                    placeholder="Mustermann"
                    required
                  />
                  {#if fieldErrors.lastName}
                    <div class="invalid-feedback">{fieldErrors.lastName}</div>
                  {/if}
                </div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label for="email" class="form-label fw-semibold">E-Mail-Adresse</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    class="form-control form-control-lg border-start-0 ps-0"
                    class:is-invalid={fieldErrors.email}
                    id="email"
                    name="email"
                    bind:value={email}
                    placeholder="ihre@email.com"
                    required
                    autocomplete="email"
                  />
                </div>
                {#if fieldErrors.email}
                  <div class="invalid-feedback">{fieldErrors.email}</div>
                {/if}
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label for="password" class="form-label fw-semibold">Passwort</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    class="form-control form-control-lg border-start-0 border-end-0 ps-0"
                    class:is-invalid={fieldErrors.password}
                    id="password"
                    name="password"
                    bind:value={password}
                    placeholder="Mindestens 6 Zeichen"
                    required
                    autocomplete="new-password"
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
                {#if fieldErrors.password}
                  <div class="invalid-feedback">{fieldErrors.password}</div>
                {/if}
              </div>

              <!-- Confirm Password -->
              <div class="mb-4">
                <label for="confirmPassword" class="form-label fw-semibold">Passwort bestätigen</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-lock-fill text-muted"></i>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    class="form-control form-control-lg border-start-0 border-end-0 ps-0"
                    class:is-invalid={fieldErrors.confirmPassword}
                    id="confirmPassword"
                    name="confirmPassword"
                    bind:value={confirmPassword}
                    placeholder="Passwort wiederholen"
                    required
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary border-start-0"
                    on:click={toggleConfirmPasswordVisibility}
                    aria-label="Passwort bestätigen anzeigen/verbergen"
                  >
                    <i class="bi {showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                  </button>
                </div>
                {#if fieldErrors.confirmPassword}
                  <div class="invalid-feedback">{fieldErrors.confirmPassword}</div>
                {/if}
              </div>

              <!-- Terms -->
              <div class="mb-4">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    class:is-invalid={fieldErrors.acceptTerms}
                    type="checkbox"
                    id="acceptTerms"
                    bind:checked={acceptTerms}
                    required
                  />
                  <label class="form-check-label small" for="acceptTerms">
                    Ich akzeptiere die 
                    <a href="/terms" target="_blank" class="text-decoration-none fw-semibold">Nutzungsbedingungen</a> 
                    und die 
                    <a href="/privacy" target="_blank" class="text-decoration-none fw-semibold">Datenschutzerklärung</a>
                  </label>
                  {#if fieldErrors.acceptTerms}
                    <div class="invalid-feedback d-block">{fieldErrors.acceptTerms}</div>
                  {/if}
                </div>
              </div>

              <!-- Terms -->
              <div class="mb-4">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    class:is-invalid={fieldErrors.acceptTerms}
                    type="checkbox"
                    id="acceptTerms"
                    bind:checked={acceptTerms}
                    required
                  />
                  <label class="form-check-label small" for="acceptTerms">
                    Ich akzeptiere die 
                    <a href="/terms" target="_blank" class="text-decoration-none fw-semibold">Nutzungsbedingungen</a> 
                    und die 
                    <a href="/privacy" target="_blank" class="text-decoration-none fw-semibold">Datenschutzerklärung</a>
                  </label>
                  {#if fieldErrors.acceptTerms}
                    <div class="invalid-feedback d-block">{fieldErrors.acceptTerms}</div>
                  {/if}
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-lg w-100 mb-4"
                disabled={isSubmitting}
                on:click={async () => {
                  // Einfache Validierung
                  if (!firstName || !lastName || !email || !password) {
                    authError = "Bitte alle Felder ausfüllen.";
                    return;
                  }
                  
                  if (password !== confirmPassword) {
                    authError = "Passwörter stimmen nicht überein.";
                    return;
                  }
                  
                  isSubmitting = true;
                  authError = "";
                  
                  try {
                    const { data, error } = await authClient.signUp.email({
                      email: email.trim(),
                      password: password,
                      name: `${firstName.trim()} ${lastName.trim()}`
                    });
                    
                    if (error) {
                      authError = error.message || "Registrierung fehlgeschlagen";
                    } else {
                      goto("/dashboard");
                    }
                  } catch (err) {
                    authError = "Ein unerwarteter Fehler ist aufgetreten.";
                  } finally {
                    isSubmitting = false;
                  }
                }}
              >
                {#if isSubmitting}
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Konto wird erstellt...
                {:else}
                  <i class="bi bi-person-plus me-2"></i>
                  Kostenloses Konto erstellen
                {/if}
              </button>
            </form>

            <div class="text-center">
              <p class="text-muted mb-0">
                Bereits ein Konto?
                <a href="/auth/login" class="text-decoration-none fw-semibold">
                  Jetzt anmelden
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
  .register-container {
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

  .benefit-card {
    text-align: center;
    padding: 1.5rem 1rem;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease, background 0.3s ease;
    height: 100%;
  }

  .benefit-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
  }

  .benefit-icon {
    opacity: 0.9;
  }

  .register-form-container {
    width: 100%;
    max-width: 550px;
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

  .form-check-input:checked {
    background-color: #667eea;
    border-color: #667eea;
  }

  .form-check-input:focus {
    border-color: #667eea;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  }

  .alert-danger {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid rgba(220, 53, 69, 0.2);
    color: #dc3545;
    backdrop-filter: blur(10px);
  }

  .invalid-feedback {
    display: block;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  @media (max-width: 991.98px) {
    .bg-gradient-primary {
      min-height: 40vh;
    }
    .branding-content {
      padding: 2rem 0;
    }
    .benefit-card {
      margin-bottom: 1rem;
    }
  }

  @media (max-width: 575.98px) {
    .register-form {
      padding: 1rem !important;
    }
    .brand-section h1 {
      font-size: 2.5rem !important;
    }
  }
</style>