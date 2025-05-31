<script>
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let isSubmitting = $state(false);

  let form = $derived($page.form);

  // Pre-fill email from URL params - Svelte 5 way
  let emailFromUrl = $state('');
  
  $effect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      emailFromUrl = urlParams.get('email') || '';
    }
  });

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function toggleConfirmPasswordVisibility() {
    showConfirmPassword = !showConfirmPassword;
  }
</script>

<svelte:head>
  <title>Registrieren - Investify</title>
</svelte:head>

<div class="register-container">
  <div class="container-fluid vh-100">
    <!-- Same layout structure as login -->
    <div class="row h-100 g-0">
      <!-- Left side branding (same as before) -->
      <div class="col-lg-7 bg-gradient-primary">
        <!-- Branding content -->
      </div>

      <!-- Right Side - Registration Form -->
      <div class="col-lg-5 d-flex align-items-center justify-content-center bg-light">
        <div class="register-form-container">
          <div class="register-form px-4 px-lg-5">
            <div class="text-center mb-4">
              <h2 class="fw-bold text-dark mb-2">Konto erstellen</h2>
              <p class="text-muted">Erstellen Sie Ihr kostenloses Investify-Konto</p>
            </div>

            {#if form?.error}
              <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{form.error}
              </div>
            {/if}

            <form 
              method="POST" 
              action="?/register"
              use:enhance={({ formElement, formData, action, cancel, submitter }) => {
                isSubmitting = true;
                
                return async ({ result, update }) => {
                  isSubmitting = false;
                  await update();
                };
              }}
            >
              <!-- Name Fields -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="firstName" class="form-label fw-semibold">Vorname</label>
                  <input
                    type="text"
                    class="form-control form-control-lg"
                    class:is-invalid={form?.fieldErrors?.firstName}
                    id="firstName"
                    name="firstName"
                    value={form?.data?.firstName || ""}
                    placeholder="Max"
                    required
                  />
                  {#if form?.fieldErrors?.firstName}
                    <div class="invalid-feedback">{form.fieldErrors.firstName[0]}</div>
                  {/if}
                </div>
                <div class="col-md-6">
                  <label for="lastName" class="form-label fw-semibold">Nachname</label>
                  <input
                    type="text"
                    class="form-control form-control-lg"
                    class:is-invalid={form?.fieldErrors?.lastName}
                    id="lastName"
                    name="lastName"
                    value={form?.data?.lastName || ""}
                    placeholder="Mustermann"
                    required
                  />
                  {#if form?.fieldErrors?.lastName}
                    <div class="invalid-feedback">{form.fieldErrors.lastName[0]}</div>
                  {/if}
                </div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label for="email" class="form-label fw-semibold">E-Mail-Adresse</label>
                <input
                  type="email"
                  class="form-control form-control-lg"
                  class:is-invalid={form?.fieldErrors?.email}
                  id="email"
                  name="email"
                  value={form?.data?.email || emailFromUrl}
                  placeholder="ihre@email.com"
                  required
                />
                {#if form?.fieldErrors?.email}
                  <div class="invalid-feedback">{form.fieldErrors.email[0]}</div>
                {/if}
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label for="password" class="form-label fw-semibold">Passwort</label>
                <div class="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    class="form-control form-control-lg"
                    class:is-invalid={form?.fieldErrors?.password}
                    id="password"
                    name="password"
                    placeholder="Mindestens 6 Zeichen"
                    required
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    on:click={togglePasswordVisibility}
                  >
                    <i class="bi {showPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                  </button>
                </div>
                {#if form?.fieldErrors?.password}
                  <div class="invalid-feedback">{form.fieldErrors.password[0]}</div>
                {/if}
              </div>

              <!-- Confirm Password -->
              <div class="mb-4">
                <label for="confirmPassword" class="form-label fw-semibold">Passwort bestätigen</label>
                <div class="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    class="form-control form-control-lg"
                    class:is-invalid={form?.fieldErrors?.confirmPassword}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Passwort wiederholen"
                    required
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    on:click={toggleConfirmPasswordVisibility}
                  >
                    <i class="bi {showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                  </button>
                </div>
                {#if form?.fieldErrors?.confirmPassword}
                  <div class="invalid-feedback">{form.fieldErrors.confirmPassword[0]}</div>
                {/if}
              </div>

              <!-- Terms -->
              <div class="mb-4">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    class:is-invalid={form?.fieldErrors?.acceptTerms}
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    value="true"
                    required
                  />
                  <label class="form-check-label small" for="acceptTerms">
                    Ich akzeptiere die 
                    <a href="/terms" class="text-decoration-none fw-semibold">Nutzungsbedingungen</a> 
                    und die 
                    <a href="/privacy" class="text-decoration-none fw-semibold">Datenschutzerklärung</a>
                  </label>
                  {#if form?.fieldErrors?.acceptTerms}
                    <div class="invalid-feedback">{form.fieldErrors.acceptTerms[0]}</div>
                  {/if}
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-lg w-100 mb-4"
                disabled={isSubmitting}
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

  .alert-success {
    background: rgba(25, 135, 84, 0.1);
    border: 1px solid rgba(25, 135, 84, 0.2);
    color: #198754;
    backdrop-filter: blur(10px);
  }

  .form-text small {
    display: flex;
    align-items: center;
    margin-top: 0.25rem;
  }
</style>