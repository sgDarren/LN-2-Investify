<script>
  import { page } from "$app/stores";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  // Better Auth – Session‐Store
  const session = authClient.useSession();

  // Ableitung, ob der Nutzer eingeloggt ist
  const isAuthenticated = $derived(!!$session.data);

  // Eingeloggte Nutzer‐Daten
  const user = $derived($session.data?.user);

  // Aktueller Pfad
  const currentPath = $derived($page.url.pathname);

  // Helper: Ist dieser Pfad aktiv?
  function isActive(path) {
    return currentPath === path || currentPath.startsWith(path + "/");
  }

  // Abmelden über Better Auth
  async function handleLogout() {
    await authClient.signOut();
    goto("/auth/login");
  }
</script>

<nav class="modern-navbar">
  <div class="navbar-container">
    <!-- Brand -->
    <a class="navbar-brand" href="/">
      <div class="brand-content">
        <i class="bi bi-graph-up-arrow brand-icon"></i>
        <span class="brand-text">Investify</span>
      </div>
    </a>

    <!-- Mobile Toggle -->
    <button
      class="mobile-toggle"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarContent"
      aria-label="Navigation umschalten"
    >
      <span class="toggle-line"></span>
      <span class="toggle-line"></span>
      <span class="toggle-line"></span>
    </button>

    <!-- Navigation Content -->
    <div class="navbar-content collapse navbar-collapse" id="navbarContent">
      <!-- Main Navigation - IMMER ANZEIGEN -->
      <ul class="nav-links">
        <li class="nav-item">
          <a
            class="nav-link"
            class:active={isActive("/dashboard")}
            href="/dashboard"
          >
            <i class="bi bi-speedometer2 nav-icon"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            class:active={isActive("/assets")}
            href="/assets"
          >
            <i class="bi bi-gem nav-icon"></i>
            <span>Assets</span>
          </a>
        </li>
      </ul>

      {#if isAuthenticated}
        <!-- User Menu -->
        <div class="user-menu">
          <div class="dropdown">
            <button
              class="user-button"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="user-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <div class="user-info">
                <div class="user-name">
                  {user?.name || user?.email}
                </div>
              </div>
              <i class="bi bi-chevron-down dropdown-arrow"></i>
            </button>

            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="/profile">
                  <i class="bi bi-person dropdown-icon"></i>
                  Profil
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button
                  class="dropdown-item logout-item"
                  on:click={handleLogout}
                >
                  <i class="bi bi-box-arrow-right dropdown-icon"></i>
                  Abmelden
                </button>
              </li>
            </ul>
          </div>
        </div>
      {:else}
        <!-- Guest Navigation -->
        <ul class="auth-links">
          <li class="nav-item">
            <a class="auth-link login-link" href="/auth/login">
              <i class="bi bi-box-arrow-in-right"></i>
              Anmelden
            </a>
          </li>
          <li class="nav-item">
            <a class="auth-link register-link" href="/auth/register">
              <i class="bi bi-person-plus"></i>
              Registrieren
            </a>
          </li>
        </ul>
      {/if}
    </div>
  </div>
</nav>

<slot />

<style>
  .modern-navbar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1030;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  }

  .navbar-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 70px;
  }

  /* Brand Styling */
  .navbar-brand {
    text-decoration: none;
    color: white;
    font-weight: 700;
    font-size: 1.5rem;
    transition: all 0.3s ease;
  }

  .navbar-brand:hover {
    color: rgba(255, 255, 255, 0.9);
    transform: scale(1.05);
  }

  .brand-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brand-icon {
    font-size: 1.75rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .brand-text {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  /* Mobile Toggle */
  .mobile-toggle {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 8px;
    transition: all 0.3s ease;
  }

  .mobile-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .toggle-line {
    width: 20px;
    height: 2px;
    background: white;
    border-radius: 1px;
    transition: all 0.3s ease;
  }

  /* Navigation Content */
  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    margin-left: 2rem;
  }

  /* Main Navigation Links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-item {
    position: relative;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .nav-link::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  .nav-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .nav-link:hover::before {
    left: 100%;
  }

  .nav-link.active {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    color: white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .nav-icon {
    font-size: 1.1rem;
    opacity: 0.9;
  }

  /* User Menu */
  .user-menu {
    margin-left: auto;
  }

  .user-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .user-button:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .user-avatar {
    font-size: 1.5rem;
    opacity: 0.9;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.125rem;
  }

  .user-name {
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .user-portfolio {
    font-size: 0.75rem;
    opacity: 0.8;
    line-height: 1.2;
  }

  .dropdown-arrow {
    font-size: 0.8rem;
    opacity: 0.7;
    transition: transform 0.3s ease;
  }

  .user-button[aria-expanded="true"] .dropdown-arrow {
    transform: rotate(180deg);
  }

  /* Dropdown Menu */
  .dropdown-menu {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    padding: 0.5rem;
    margin-top: 0.5rem;
    min-width: 200px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: #374151;
    text-decoration: none;
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
  }

  .dropdown-item:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    transform: translateX(4px);
  }

  .logout-item:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .dropdown-icon {
    font-size: 1rem;
    opacity: 0.7;
  }

  .dropdown-divider {
    margin: 0.5rem 0;
    border-color: rgba(0, 0, 0, 0.1);
  }

  /* Auth Links (für nicht eingeloggte Benutzer) */
  .auth-links {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    list-style: none;
    margin: 0;
    padding: 0;
    margin-left: auto;
  }

  .auth-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .login-link {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .login-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .register-link {
    color: #667eea;
    background: white;
    border: 1px solid white;
  }

  .register-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  /* Responsive Design */
  @media (max-width: 991.98px) {
    .mobile-toggle {
      display: flex;
    }

    .navbar-content {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      flex-direction: column;
      align-items: stretch;
      margin-left: 0;
      padding: 1rem;
      gap: 1rem;
    }

    .nav-links {
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .nav-link {
      justify-content: flex-start;
      width: 100%;
    }

    .user-menu {
      margin-left: 0;
      width: 100%;
    }

    .user-button {
      width: 100%;
      justify-content: space-between;
      border-radius: 12px;
    }

    .auth-links {
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      margin-left: 0;
    }

    .auth-link {
      justify-content: center;
      width: 100%;
      border-radius: 12px;
    }
  }

  @media (max-width: 575.98px) {
    .navbar-container {
      padding: 0.5rem 1rem;
    }

    .brand-text {
      display: none;
    }

    .user-info {
      display: none;
    }

    .nav-link span {
      display: none;
    }

    .nav-link {
      padding: 0.75rem;
      justify-content: center;
    }
  }
</style>