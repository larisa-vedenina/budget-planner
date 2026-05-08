import axios from "axios";
import { ApiResponse, AuthUserResponse, RequestOtpResponse } from "../types/api";
import { User } from "../types/user";
import { apiClient } from "./apiClient";

interface RawUser {
  id: string;
  login?: string;
  email: string;
  avatarUrl?: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
}

const normalizeUser = (user: RawUser): User => ({
  id: user.id,
  name: user.name || user.login || "",
  email: user.email,
  avatarUrl: user.avatarUrl,
  createdAt: new Date(user.createdAt),
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
});

export const requestOtpCode = async (
  name: string,
  email: string,
): Promise<{ email: string; expiresAt: Date }> => {
  try {
    const response = await apiClient.post<ApiResponse<RequestOtpResponse>>(
      "/api/auth/request-code",
      {
        name,
        email,
      },
    );

    return {
      email: response.data.data.email,
      expiresAt: new Date(response.data.data.expiresAt),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось отправить одноразовый код.",
      );
    }

    throw error;
  }
};

export const verifyOtpCode = async (
  name: string,
  email: string,
  code: string,
): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthUserResponse>>(
      "/api/auth/verify-code",
      {
        name,
        email,
        code,
      },
    );

    return normalizeUser(response.data.data.user as unknown as RawUser);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось подтвердить одноразовый код.",
      );
    }

    throw error;
  }
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get<ApiResponse<AuthUserResponse>>(
      "/api/auth/me",
    );

    return normalizeUser(response.data.data.user as unknown as RawUser);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось получить данные пользователя.",
      );
    }

    throw error;
  }
};

export const logoutCurrentUser = async (): Promise<void> => {
  try {
    await apiClient.post("/api/auth/logout");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return;
    }

    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось завершить сессию.",
      );
    }

    throw error;
  }
};

export const updateUserAvatar = async (avatarUrl: string): Promise<User> => {
  try {
    const response = await apiClient.patch<ApiResponse<AuthUserResponse>>(
      "/api/auth/avatar",
      {
        avatarUrl,
      },
    );

    return normalizeUser(response.data.data.user as unknown as RawUser);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Не удалось обновить аватар.",
      );
    }

    throw error;
  }
};
