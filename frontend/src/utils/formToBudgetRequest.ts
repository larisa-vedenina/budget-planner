import { AIBudgetPlanRequest } from "../types/api";
import { FormData, FormInputItem, SectionType } from "../types/form";

const getSectionItems = (
  formData: FormData,
  sectionType: SectionType,
): FormInputItem[] => formData.sections[sectionType]?.inputs.items ?? [];

export const formDataToAIBudgetPlanRequest = (
  formData: FormData,
): AIBudgetPlanRequest => ({
  period: {
    startDate: formData.period.startDate,
    endDate: formData.period.endDate,
  },
  city: formData.city.trim(),
  dailySpending: formData.dailySpending.trim(),
  aiComment: formData.aiComment.trim(),
  sections: {
    income: getSectionItems(formData, "income"),
    required: getSectionItems(formData, "required"),
    desired: getSectionItems(formData, "desired"),
    assets: getSectionItems(formData, "assets"),
    debts: getSectionItems(formData, "debts"),
    goals: getSectionItems(formData, "goals"),
  },
});
