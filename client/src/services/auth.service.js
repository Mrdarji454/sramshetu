import apiClient from '../lib/apiClient';

/**
 * Authentication Service: Centralizes all API calls to /auth
 */
export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { name, phone, email, password, role }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data || response;
  },

  /**
   * Login user with identifier and password
   * @param {Object} credentials - { identifier, password }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data || response;
  },

  /**
   * Logout user from server session
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Even if network fails, client logout proceeds
    }
  },

  /**
   * Fetch currently authenticated user profile
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data?.user || response.user || response.data || response;
  },
};

export const register = authService.register.bind(authService);
export const login = authService.login.bind(authService);
export const logout = authService.logout.bind(authService);
export const getCurrentUser = authService.getCurrentUser.bind(authService);

export default authService;
