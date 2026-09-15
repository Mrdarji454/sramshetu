import apiClient from './apiClient';

/**
 * Matching Service (Client)
 * Connects frontend customer location discovery to backend geospatial matching engine
 */
export const matchingService = {
  /**
   * Search and rank nearby workers and cooperatives
   * @param {object} params
   * @param {number} params.latitude
   * @param {number} params.longitude
   * @param {string} [params.skill]
   * @param {string} [params.trade]
   * @param {boolean} [params.availableOnly=true]
   * @param {number} [params.maxRadiusKm=25]
   * @param {string} [params.sortBy='distance']
   */
  async searchNearbyWorkers(params) {
    const query = new URLSearchParams();
    if (params.latitude !== undefined) query.append('lat', params.latitude);
    if (params.longitude !== undefined) query.append('lng', params.longitude);
    if (params.skill) query.append('skill', params.skill);
    if (params.trade) query.append('trade', params.trade);
    if (params.availableOnly !== undefined) query.append('available', params.availableOnly);
    if (params.maxRadiusKm !== undefined) query.append('radius', params.maxRadiusKm);
    if (params.sortBy) query.append('sort', params.sortBy);

    const response = await apiClient.get(`/matching/nearby?${query.toString()}`);
    return response.data;
  },

  /**
   * Search nearby cooperatives within radius
   */
  async getNearbyCooperatives({ latitude, longitude, radiusKm = 25 }) {
    const query = new URLSearchParams();
    if (latitude !== undefined) query.append('lat', latitude);
    if (longitude !== undefined) query.append('lng', longitude);
    if (radiusKm !== undefined) query.append('radius', radiusKm);

    const response = await apiClient.get(`/matching/cooperatives?${query.toString()}`);
    return response.data;
  },
};

export default matchingService;

