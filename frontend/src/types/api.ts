
import { FormInputItem } from "./form";
import { User } from "./user";


export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}


export interface ApiError {
  code: string;
  message: string;
  details?: any;
}


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
  commentForAI?: string;
}


export interface UpdateColorsRequest {
  budgetId: string;
  colors: {
    required: string;
    desired: string;
    notes: string;
  };
}


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
  phone: string;
  name: string;
  expiresAt: string;
}
