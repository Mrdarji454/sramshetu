import apiClient from '../lib/apiClient';

export const workerService = {
  /**
   * Get authenticated worker profile
   */
  async getProfile() {
    const response = await apiClient.get('/workers/profile');
    return response.data || response;
  },

  /**
   * Save / update onboarding steps
   */
  async saveOnboarding(data) {
    const response = await apiClient.post('/workers/onboarding', data);
    return response.data || response;
  },

  /**
   * Update availability status or radius
   */
  async updateAvailability({ status, workingRadiusKm }) {
    const response = await apiClient.patch('/workers/availability', { status, workingRadiusKm });
    return response.data || response;
  },

  /**
   * Upload document / image
   */
  async uploadDocument({ docType, url, name }) {
    const response = await apiClient.post('/workers/documents', { docType, url, name });
    return response.data || response;
  },

  /**
   * Get real-time verification status & checklist
   */
  async getVerificationStatus() {
    const response = await apiClient.get('/workers/verification-status');
    return response.data || response;
  },

  /**
   * Get assigned jobs
   */
  async getAssignedJobs() {
    const response = await apiClient.get('/workers/assigned-jobs');
    return response.data || response;
  },
};

export default workerService;

