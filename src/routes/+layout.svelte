<script>
  import "./styles.css";
  let { children } = $props();

  export function load({ locals }) {
    return {
        user: locals.user || null
    };
}
</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
  <div class="container-fluid">
    <!-- Brand -->
    <a class="navbar-brand fw-bold" href="/">
      <i class="bi bi-graph-up-arrow me-2"></i>
      Investify
    </a>

    <!-- Mobile Toggle Button -->
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarMain"
      aria-controls="navbarMain"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Navigation Items -->
    <div class="collapse navbar-collapse" id="navbarMain">
      <!-- Left Navigation -->
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link" href="/dashboard">
            <i class="bi bi-speedometer2 me-1"></i>
            Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/portfolio">
            <i class="bi bi-briefcase me-1"></i>
            Portfolio
          </a>
        </li>
        <li class="nav-item dropdown">
          <a 
            class="nav-link dropdown-toggle" 
            href="#" 
            role="button" 
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-search me-1"></i>
            Assets
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/assets/stocks">
              <i class="bi bi-graph-up me-2"></i>Aktien
            </a></li>
            <li><a class="dropdown-item" href="/assets/etfs">
              <i class="bi bi-collection me-2"></i>ETFs
            </a></li>
            <li><a class="dropdown-item" href="/assets/crypto">
              <i class="bi bi-currency-bitcoin me-2"></i>Kryptowährungen
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="/assets/watchlist">
              <i class="bi bi-star me-2"></i>Watchlist
            </a></li>
          </ul>
        </li>
      </ul>

      <!-- Right Navigation -->
      <ul class="navbar-nav">

        <!-- User Menu -->
        <li class="nav-item dropdown">
          <a 
            class="nav-link dropdown-toggle d-flex align-items-center" 
            href="#" 
            role="button" 
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                 style="width: 32px; height: 32px;">
              <i class="bi bi-person-fill text-white"></i>
            </div>
            <span class="d-none d-md-inline">Mein Account</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><h6 class="dropdown-header">Max Mustermann</h6></li>
            <li><a class="dropdown-item" href="/profile">
              <i class="bi bi-person me-2"></i>Profil
            </a></li>
            <li><a class="dropdown-item" href="/settings">
              <i class="bi bi-gear me-2"></i>Einstellungen
            </a></li>
            <li><a class="dropdown-item" href="/transactions">
              <i class="bi bi-clock-history me-2"></i>Transaktionen
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="/logout">
              <i class="bi bi-box-arrow-right me-2"></i>Abmelden
            </a></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>

<!-- Optional: Breadcrumb für bessere Navigation -->
<nav aria-label="breadcrumb" class="bg-light py-2">
  <div class="container-fluid">
    <ol class="breadcrumb mb-0">
      <li class="breadcrumb-item"><a href="/">Home</a></li>
      <li class="breadcrumb-item"><a href="/portfolio">Portfolio</a></li>
      <li class="breadcrumb-item active" aria-current="page">Dashboard</li>
    </ol>
  </div>
</nav>

<div class="container mt-3">
  {@render children()}
</div>
