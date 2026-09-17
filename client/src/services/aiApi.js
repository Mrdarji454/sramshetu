import apiClient from '../lib/apiClient';

/**
 * ShramSetu AI Service API Client (Phase 13)
 * Provides reusable functions for React components to interact with AI workload forecasting.
 * Uses existing authentication tokens and centralized Axios interceptors.
 * Does not call FastAPI directly.
 */

/**
 * Check AI Microservice Health via Express proxy
 * @returns {Promise<{ success: boolean, aiService: 'online' | 'offline' }>}
 */
export const getAIHealth = async () => {
  const response = await apiClient.get('/ai/health');
  return response.data || response;
};

/**
 * Predict Workload and Capacity Strain
 * @param {Object} data - Prediction parameters
 * @param {string} data.district - Target administrative district (e.g., "Ahmedabad")
 * @param {string} data.serviceType - Service trade (e.g., "Plumbing", "Electrical")
 * @param {number} data.applicationsLast7Days - Velocity indicator
 * @param {number} data.applicationsLast30Days - Baseline momentum
 * @param {number} data.pendingApplications - Current queue volume
 * @param {number} data.availableWorkers - Active artisan headcount
 * @param {number} data.averageCompletionTime - Job turnaround duration in hours
 * @returns {Promise<{ success: boolean, prediction: { predictedDemand: number, predictedInspections: number, workloadLevel: string, priorityScore: number }, recommendation: string }>}
 */
export const predictWorkload = async (data) => {
  const response = await apiClient.post('/ai/workload', data);
  return response.data || response;
};

export default {
  getAIHealth,
  predictWorkload,
};

