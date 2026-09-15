import apiClient from '../lib/apiClient';

export const catalogService = {
  /**
   * Fetch services list with optional category & search filter
   */
  async getServices({ category, search } = {}) {
    const params = {};
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;
    const response = await apiClient.get('/services', { params });
    return response.data || response;
  },

  /**
   * Fetch single service details
   */
  async getServiceById(id) {
    const response = await apiClient.get(`/services/${id}`);
    return response.data || response;
  },
};

export default catalogService;

