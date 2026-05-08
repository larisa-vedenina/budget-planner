// Типы для API-запросов

import { FormInputItem } from "./form";
import { User } from "./user";

/**
 * Базовый интерфейс для API-ответов
 */
export interface ApiResponse<T> {
  data: T; // Полезные данные
  success: boolean; // Успешность операции
  message?: string; // Сообщение (опционально)
  timestamp: string; // Время ответа
}

/**
 * Интерфейс для ошибок API
 */
export interface ApiError {
  code: string; // Код ошибки
  message: string;   // Сообщение об ошибке
  details?: any;     // Детали ошибки (опционально)
}

/**
 * Запрос на создание бюджета
 */
export interface CreateBudgetRequest {
  period: {
    startDate: Date;
    endDate: Date;
  };
  incomes: Array<{
    source: string;
    amount: number;
    expectedDate?: Date;
  }>;
  requiredExpenses: Array<{
    title: string;
    amount: number;
    paymentDate?: string;
  }>;
  desiredExpenses: Array<{
    title: string;
    amount: number;
    paymentDate?: string;
  }>;
  commentForAI?: string; // Комментарий для генерации AI-советов
}

/**
 * Запрос на обновление цветов ячеек
 */
export interface UpdateColorsRequest {
  budgetId: string;
  colors: {
    required: string;
    desired: string;
    notes: string;
  };
}

/**
 * Запрос на перемещение пункта между категориями
 */
export interface MoveItemRequest {
  itemId: string;
  fromCategory: 'required' | 'desired';
  toCategory: 'required' | 'desired';
  newPosition: number;
}

export interface AIBudgetPlanRequest {
  period: {
    startDate: string;
    endDate: string;
  };
  aiComment: string;
  sections: {
    income: FormInputItem[];
    required: FormInputItem[];
    desired: FormInputItem[];
    assets: FormInputItem[];
    debts: FormInputItem[];
    goals: FormInputItem[];
  };
}

export interface AIBudgetPlanItem {
  title: string;
  amount: number;
  priority: boolean;
}

export interface AIBudgetPlanResponse {
  summary: string;
  totals: {
    incomeTotal: number;
    requiredTotal: number;
    desiredTotal: number;
    reserveAmount: number;
  };
  requiredItems: AIBudgetPlanItem[];
  desiredItems: AIBudgetPlanItem[];
  notes: string[];
  warnings: string[];
}

export interface AuthUserResponse {
  user: User;
}

export interface RequestOtpResponse {
  email: string;
  name: string;
  expiresAt: string;
}
