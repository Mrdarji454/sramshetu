import apiClient from '../lib/apiClient';

export const cooperativeService = {
  /**
   * Get authenticated cooperative profile
   */
  async getProfile() {
    const response = await apiClient.get('/cooperatives/profile');
    return response.data || response;
  },

  /**
   * Save / update cooperative onboarding
   */
  async saveOnboarding(data) {
    const response = await apiClient.post('/cooperatives/onboarding', data);
    return response.data || response;
  },

  /**
   * Get verification status & checklist
   */
  async getVerificationStatus() {
    const response = await apiClient.get('/cooperatives/verification-status');
    return response.data || response;
  },

  /**
   * Get list of public / verified cooperatives (for worker signup)
   */
  async getCooperativesList() {
    const response = await apiClient.get('/cooperatives/list');
    return response.data || response;
  },

  /**
   * Get enrolled members roster
   */
  async getMembers() {
    const response = await apiClient.get('/cooperatives/members');
    return response.data || response;
  },

  /**
   * Add member artisan to cooperative roster
   */
  async addMember(memberData) {
    const response = await apiClient.post('/cooperatives/members', memberData);
    return response.data || response;
  },

  /**
   * Remove member from roster
   */
  async removeMember(memberId) {
    const response = await apiClient.delete(`/cooperatives/members/${memberId}`);
    return response.data || response;
  },

  /**
   * Get incoming requests
   */
  async getIncomingRequests() {
    const response = await apiClient.get('/cooperatives/requests');
    return response.data || response;
  },

  /**
   * Assign worker to booking
   */
  async assignWorker(bookingId, workerId) {
    const response = await apiClient.post('/cooperatives/assign-worker', { bookingId, workerId });
    return response.data || response;
  },
};

export default cooperativeService;

