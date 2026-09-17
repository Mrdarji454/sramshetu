import { config } from '../../config/env.js';

/**
 * AI Service Integration Client
 * Handles communication between Node.js backend and FastAPI AI microservice.
 */
export class AiClient {
  constructor(baseUrl = config.aiServiceUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = 8000;
  }

  /**
   * Check connection health with FastAPI microservice
   * @returns {Promise<{ ok: boolean, data?: object, error?: string }>}
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timer);

      if (!response.ok) {
        return { ok: false, error: `AI service returned HTTP ${response.status}` };
      }

      const data = await response.json();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Calls FastAPI POST /predict/workload
   *
   * @param {Object} features
   * @param {number} features.pending_bookings
   * @param {number} features.available_workers
   * @param {number} features.avg_completion_time
   * @param {string} features.day_of_week
   * @returns {Promise<{ predictedDemand: number, status: string, disclaimer: string }>}
   */
  async predictWorkload(features) {
    const payload = {
      pending_bookings: Math.max(0, parseInt(features.pending_bookings ?? features.pendingBookings ?? 0, 10)),
      available_workers: Math.max(0, parseInt(features.available_workers ?? features.availableWorkers ?? 0, 10)),
      avg_completion_time: Math.max(0.1, parseFloat(features.avg_completion_time ?? features.avgCompletionTime ?? 3.5)),
      day_of_week: String(features.day_of_week ?? features.dayOfWeek ?? 'Monday').trim(),
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/predict/workload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FastAPI responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return {
        predictedDemand: typeof result.predictedDemand === 'number' ? result.predictedDemand : parseFloat(result.predictedDemand || 0),
        status: result.status || 'success',
        disclaimer: result.disclaimer || 'Synthetic demonstration data - not official government records',
        rawResponse: result,
      };
    } catch (err) {
      console.warn(`[AIClient] Error calling FastAPI service (${this.baseUrl}): ${err.message}. Using resilient fallback calculation.`);

      // Resilient algorithmic fallback matching the calibrated formula
      const dayFactors = {
        Monday: 1.00,
        Tuesday: 0.98,
        Wednesday: 0.95,
        Thursday: 1.02,
        Friday: 1.08,
        Saturday: 1.15,
        Sunday: 1.12,
      };
      const factor = dayFactors[payload.day_of_week] || 1.00;
      const base = (0.80 * payload.pending_bookings) + (2.50 * payload.avg_completion_time) - (0.30 * payload.available_workers) + 2.71;
      const fallbackDemand = Math.max(5.0, Math.round(base * factor * 100) / 100);

      return {
        predictedDemand: fallbackDemand,
        status: 'fallback_heuristic',
        disclaimer: 'Synthetic demonstration data - computed via resilient heuristic fallback',
        fallback: true,
      };
    }
  }
}

export const aiClient = new AiClient();
export default aiClient;

