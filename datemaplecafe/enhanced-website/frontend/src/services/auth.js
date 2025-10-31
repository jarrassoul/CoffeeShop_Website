import { authAPI } from './api';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.user = JSON.parse(localStorage.getItem('adminUser') || 'null');
    }

    async login(username, password) {
        try {
            const response = await authAPI.login(username, password);

            if (response.success) {
                this.token = response.token;
                this.user = response.user;

                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminUser', JSON.stringify(response.user));

                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            throw new Error(message);
        }
    }

    async logout() {
        try {
            if (this.token) {
                await authAPI.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            this.user = null;
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        }
    }

    async getCurrentUser() {
        if (!this.token) {
            return null;
        }

        try {
            const response = await authAPI.getCurrentUser();
            if (response.success) {
                this.user = response.user;
                localStorage.setItem('adminUser', JSON.stringify(response.user));
                return response.user;
            }
        } catch (error) {
            console.error('Get current user error:', error);
            this.logout();
        }
        return null;
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    // Check if token is expired (basic check)
    isTokenExpired() {
        if (!this.token) return true;

        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }
}

const authService = new AuthService();
export default authService;