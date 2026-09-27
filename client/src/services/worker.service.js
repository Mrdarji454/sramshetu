import apiClient from '../lib/apiClient';

export const workerService = {
  /**
   * Get authenticated worker profile
   */
  async getProfile() {
    const response = await apiClient.get('/workers/profile');
    return response.data || response;
  },

  async getPublicProfile(id) {
    const response = await apiClient.get(`/workers/public/${id}`);
    return response.data || response;
  },

  /**
   * Get registration status & step progress
   */
  async getRegistrationStatus() {
    const response = await apiClient.get('/workers/registration-status');
    return response.data || response;
  },

  /**
   * Save and validate specific registration step
   */
  async saveStep(stepNumber, stepData) {
    const response = await apiClient.post(`/workers/step/${stepNumber}`, stepData);
    return response.data || response;
  },

  /**
   * Submit registration for admin review (locks registration)
   */
  async submitRegistration() {
    const response = await apiClient.post('/workers/submit-registration');
    return response.data || response;
  },

  /**
   * Save / update onboarding steps (backward compatibility)
   */
  async saveOnboarding(data) {
    const response = await apiClient.post('/workers/onboarding', data);
    return response.data || response;
  },

  /**
   * Update availability status or radius
   */
  async updateAvailability({ status, workingRadiusKm, workingDays, hours }) {
    const response = await apiClient.patch('/workers/availability', { status, workingRadiusKm, workingDays, hours });
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

  /**
   * Update worker profile (bio, phone, working radius, etc.)
   */
  async updateProfile(profileData) {
    const response = await apiClient.patch('/workers/profile', profileData);
    return response.data || response;
  },

  /**
   * Get pending shift offers for the current worker
   */
  async getZoneShiftOffers() {
    const response = await apiClient.get('/workers/zone-shift-offers');
    return response.data || response;
  },

  /**
   * Accept or decline a zone shift offer
   */
  async respondToZoneShift(decision) {
    const response = await apiClient.post('/workers/zone-shift/decision', { decision });
    return response.data || response;
  },
};

export default workerService;
