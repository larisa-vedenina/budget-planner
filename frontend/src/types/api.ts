import { FormInputItem } from "./form";
import { User } from "./user";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface AIBudgetPlanRequest {
  period: {
    startDate: string;
    endDate: string;
  };
  city: string;
  dailySpending: string;
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
  badge?: "debt" | "goal";
  date?: string;
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
