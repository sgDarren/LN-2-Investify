import { browser } from '$app/environment';

class AuthStore {
    user = $state(null);
    isAuthenticated = $derived(!!this.user);
    isLoading = $state(false);

    setUser(user) {
        this.user = user;
        this.isLoading = false;
    }

    setLoading(loading) {
        this.isLoading = loading;
    }

    logout() {
        this.user = null;
        this.isLoading = false;
        if (browser) {
            localStorage.removeItem('user');
        }
    }

    init(user) {
        if (user) {
            this.user = user;
        }
    }
}

export const authStore = new AuthStore();