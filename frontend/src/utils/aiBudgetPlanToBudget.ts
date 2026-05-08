import { AIBudgetPlanItem, AIBudgetPlanResponse } from "../types/api";
import { BudgetPeriod, createDefaultBudgetPeriod } from "../types/budget";
import { ChecklistItemModel } from "../types/checklist-item";
import { NoteModel } from "../types/note";
import { FormData } from "../types/form";
import {
  buildAdditionalInfoNotes,
  createBudgetTitle,
  parseDateInput,
} from "./formToBudget";

const normalizeAmount = (value: number): number =>
  Math.max(0, Math.round(Number(value) || 0));

const MAX_AI_NOTE_ITEMS = 8;

const stripControlCharacters = (value: string): string =>
  Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join("");

const normalizeAIText = (value: string): string =>
  stripControlCharacters(String(value || "").normalize("NFC"))
    .replace(/\uFFFD+/g, "")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

const createChecklistItemsFromAI = (
  items: AIBudgetPlanItem[],
  category: "required" | "desired",
): ChecklistItemModel[] =>
  items.map(
    (item, index) =>
      new ChecklistItemModel(
        `ai_${category}_${Date.now()}_${index}`,
        normalizeAIText(item.title) || "Без названия",
        normalizeAmount(item.amount),
        false,
        category,
        item.priority ? "priority" : "default",
      ),
  );

const buildAINotes = (aiPlan: AIBudgetPlanResponse): NoteModel[] => {
  const rawNotes = [
    aiPlan.summary,
    ...aiPlan.notes,
    ...aiPlan.warnings,
  ]
    .map(normalizeAIText)
    .filter(Boolean)
    .slice(0, MAX_AI_NOTE_ITEMS);

  return rawNotes.map((note, index) =>
    new NoteModel(
      `ai_plan_${Date.now()}_${index}`,
      note,
      "ai",
    ),
  );
};

export const aiBudgetPlanToBudget = (
  formData: FormData,
  aiPlan: AIBudgetPlanResponse,
): BudgetPeriod => {
  const draftBudget = createDefaultBudgetPeriod();
  const startDate = parseDateInput(formData.period.startDate) ?? draftBudget.startDate;
  const endDate = parseDateInput(formData.period.endDate) ?? draftBudget.endDate;

  const incomeItems = formData.sections.income?.inputs.items ?? [];
  const totalIncome = incomeItems.reduce(
    (sum, item) => sum + normalizeAmount(item.amount),
    0,
  );

  const requiredItems = createChecklistItemsFromAI(
    aiPlan.requiredItems,
    "required",
  );
  const desiredItems = createChecklistItemsFromAI(aiPlan.desiredItems, "desired");
  const totalExpenses = [...requiredItems, ...desiredItems].reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    ...draftBudget,
    title: createBudgetTitle(startDate, endDate),
    startDate,
    endDate,
    totalIncome,
    totalExpenses,
    remaining: totalIncome,
    requiredItems,
    desiredItems,
    notes: [...buildAINotes(aiPlan), ...buildAdditionalInfoNotes(formData)],
    updatedAt: new Date(),
  };
};
