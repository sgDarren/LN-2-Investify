import { browser } from '$app/environment';
import { goto } from '$app/navigation';

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

    async logout() {
        this.isLoading = true;
        
        if (browser) {
            try {
                // Server-seitigen Logout aufrufen
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    this.user = null;
                    goto('/auth/login');
                } else {
                    console.error('Logout failed');
                }
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                this.isLoading = false;
            }
        }
    }

    init(user) {
        if (user) {
            this.user = user;
        }
        this.isLoading = false;
    }

    // Hilfsmethode für Login Success
    handleLoginSuccess(user) {
        this.setUser(user);
    }
}

export const authStore = new AuthStore();