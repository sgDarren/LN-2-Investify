import { browser } from '$app/environment';

// Auth state mit Runes
let authState = $state({
    user: null,
    isLoading: false,
    isAuthenticated: false
});

export function createAuthStore() {
    return {
        // Getters
        get user() { return authState.user; },
        get isLoading() { return authState.isLoading; },
        get isAuthenticated() { return authState.isAuthenticated; },
        
        // Actions
        setUser(user) {
            authState.user = user;
            authState.isAuthenticated = !!user;
        },
        
        setLoading(loading) {
            authState.isLoading = loading;
        },
        
        async login(email, password) {
            authState.isLoading = true;
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', email, password })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message);
                }
                
                const { user } = await response.json();
                this.setUser(user);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            } finally {
                authState.isLoading = false;
            }
        },
        
        async register(userData) {
            authState.isLoading = true;
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'register', ...userData })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message);
                }
                
                const { user } = await response.json();
                this.setUser(user);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            } finally {
                authState.isLoading = false;
            }
        },
        
        async logout() {
            try {
                await fetch('/auth/logout', { method: 'POST' });
                this.setUser(null);
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
    };
}

// Singleton export
export const authStore = createAuthStore();