import { aiService } from '../services/aiService.js';

/**
 * AI Controller
 * Manages workload forecasting requests and AI service health checks.
 */
export class AiController {
  /**
   * Validates incoming workload prediction payload.
   * Step 4: Validate required fields:
   *   - district (string)
   *   - serviceType (string)
   *   - applicationsLast7Days (integer >= 0)
   *   - applicationsLast30Days (integer >= 0)
   *   - pendingApplications (integer >= 0)
   *   - availableWorkers (integer >= 0)
   *   - averageCompletionTime (numeric > 0)
   *
   * @param {Object} body
   * @returns {{ valid: boolean, message?: string }}
   */
  static validateWorkloadRequest(body) {
    if (!body || typeof body !== 'object') {
      return { valid: false, message: 'Request body must be a JSON object' };
    }

    const {
      district,
      serviceType,
      applicationsLast7Days,
      applicationsLast30Days,
      pendingApplications,
      availableWorkers,
      averageCompletionTime,
    } = body;

    // Check district
    if (!district || typeof district !== 'string' || district.trim().length === 0) {
      return { valid: false, message: 'Field "district" is required and must be a non-empty string' };
    }

    // Check serviceType
    if (!serviceType || typeof serviceType !== 'string' || serviceType.trim().length === 0) {
      return { valid: false, message: 'Field "serviceType" is required and must be a non-empty string' };
    }

    // Check numeric non-negative integers
    const integerFields = [
      { name: 'applicationsLast7Days', value: applicationsLast7Days },
      { name: 'applicationsLast30Days', value: applicationsLast30Days },
      { name: 'pendingApplications', value: pendingApplications },
      { name: 'availableWorkers', value: availableWorkers },
    ];

    for (const field of integerFields) {
      if (
        field.value === undefined ||
        field.value === null ||
        typeof field.value !== 'number' ||
        isNaN(field.value) ||
        field.value < 0 ||
        !Number.isInteger(field.value)
      ) {
        return {
          valid: false,
          message: `Field "${field.name}" is required and must be a non-negative integer`,
        };
      }
    }

    // Check averageCompletionTime (numeric > 0)
    if (
      averageCompletionTime === undefined ||
      averageCompletionTime === null ||
      typeof averageCompletionTime !== 'number' ||
      isNaN(averageCompletionTime) ||
      averageCompletionTime <= 0
    ) {
      return {
        valid: false,
        message: 'Field "averageCompletionTime" is required and must be a positive number in hours',
      };
    }

    return { valid: true };
  }

  /**
   * POST /api/ai/workload
   * Step 2 & 4: Validates fields, requests prediction from aiService, returns clean response
   */
  static async getWorkloadPrediction(req, res) {
    // 1. Step 4: Strict Request Validation
    const validation = AiController.validateWorkloadRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // 2. Call AI Service with error handling
    try {
      const result = await aiService.predictWorkload(req.body);

      // 3. Return consistent JSON response (Step 2 & Step 10)
      return res.status(200).json({
        success: true,
        prediction: {
          predictedDemand: result.predictedDemand,
          predictedInspections: result.predictedInspections,
          workloadLevel: result.workloadLevel,
          priorityScore: result.priorityScore,
        },
        recommendation: result.recommendation,

        // Top-level aliases for backwards compatibility
        predictedDemand: result.predictedDemand,
        predictedInspections: result.predictedInspections,
        workloadLevel: result.workloadLevel,
        priorityScore: result.priorityScore,
      });
    } catch (error) {
      console.error(`[AiController] Error in getWorkloadPrediction: ${error.message}`);

      // Handle AI service failure gracefully (Step 2: { "success": false, "message": "AI service unavailable" })
      return res.status(503).json({
        success: false,
        message: 'AI service unavailable',
      });
    }
  }

  /**
   * GET /api/ai/health
   * Step 7: Proxies health check to FastAPI
   */
  static async getHealth(req, res) {
    try {
      const health = await aiService.getAIHealth();
      const statusCode = health.success ? 200 : 503;
      return res.status(statusCode).json(health);
    } catch (error) {
      return res.status(503).json({
        success: false,
        aiService: 'offline',
        message: error.message,
      });
    }
  }
}

export default AiController;

