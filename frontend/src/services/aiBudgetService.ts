import axios from "axios";
import {
  AIBudgetPlanRequest,
  AIBudgetPlanResponse,
  ApiResponse,
} from "../types/api";
import { apiClient } from "./apiClient";

export const generateAIBudgetPlan = async (
  payload: AIBudgetPlanRequest,
): Promise<AIBudgetPlanResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AIBudgetPlanResponse>>(
      "/api/ai/budget-plan",
      payload,
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "AI budget generation failed.");
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to connect to AI budget service.",
      );
    }

    throw error;
  }
};
