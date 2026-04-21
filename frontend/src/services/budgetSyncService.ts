import axios from "axios";
import { ApiResponse } from "../types/api";
import { BudgetSnapshot } from "../utils/budgetStorage";
import { apiClient } from "./apiClient";

export const loadRemoteBudgetSnapshot = async (): Promise<BudgetSnapshot | null> => {
  try {
    const response = await apiClient.get<ApiResponse<BudgetSnapshot>>(
      "/api/budget-snapshot",
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось загрузить бюджет пользователя.",
      );
    }

    throw error;
  }
};

export const saveRemoteBudgetSnapshot = async (
  snapshot: BudgetSnapshot,
): Promise<BudgetSnapshot | null> => {
  try {
    const response = await apiClient.put<ApiResponse<BudgetSnapshot>>(
      "/api/budget-snapshot",
      snapshot,
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось сохранить бюджет пользователя.",
      );
    }

    throw error;
  }
};
