import apiClient from '../lib/apiClient';

export const adminService = {
  /**
   * Get administrative platform statistics
   */
  async getSystemStats() {
    const response = await apiClient.get('/admin/stats');
    return response.data || response;
  },

  /**
   * Get all verification requests with optional filters
   */
  async getVerifications(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.type && params.type !== 'all') query.set('type', params.type);

    const endpoint = `/admin/verifications${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(endpoint);
    return response.data || response;
  },

  /**
   * Review applicant verification (Approve / Reject)
   */
  async reviewVerification({ applicantType, applicantId, status, remarks }) {
    const response = await apiClient.post('/admin/verifications/review', {
      applicantType,
      applicantId,
      status,
      remarks,
    });
    return response.data || response;
  },

  /**
   * Get grievance complaints
   */
  async getComplaints() {
    const response = await apiClient.get('/admin/complaints');
    return response.data || response;
  },
};

export default adminService;

