import { AIBudgetPlanItem, AIBudgetPlanResponse } from "../types/api";
import { BudgetPeriod, createDefaultBudgetPeriod } from "../types/budget";
import { ChecklistItemModel } from "../types/checklist-item";
import { NoteModel } from "../types/note";
import { FormData } from "../types/form";
import {
  createAIRefreshSignature,
  createBudgetAIContext,
} from "./budgetAI";
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

const isAutoCalculationLikeNote = (value: string): boolean => {
  const normalizedValue = value.toLowerCase();
  const hasCalculationKeyword =
    /(свободн|дефицит|остает|остат|резерв)/i.test(normalizedValue);
  const hasLimitKeyword = /(день|недел|после|лимит)/i.test(normalizedValue);
  const hasEverydayExpenseKeyword =
    /(еда|продукт|транспорт|быт|бытов|проезд|метро|такси)/i.test(
      normalizedValue,
    );

  return (
    (hasCalculationKeyword && hasLimitKeyword) ||
    (hasEverydayExpenseKeyword && hasLimitKeyword)
  );
};

const getNoteDedupeKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^0-9a-zа-яё\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const createChecklistItemsFromAI = (
  items: AIBudgetPlanItem[],
  category: "required" | "desired",
): ChecklistItemModel[] =>
  items
    .filter((item) => normalizeAmount(item.amount) > 0)
    .map(
      (item, index) =>
        new ChecklistItemModel(
          `ai_${category}_${Date.now()}_${index}`,
          normalizeAIText(item.title) || "Без названия",
          normalizeAmount(item.amount),
          false,
          category,
          item.priority ? "priority" : "default",
          undefined,
          "idle",
          new Date(),
          item.badge,
        ),
    );

export const buildAINotesFromPlan = (
  aiPlan: AIBudgetPlanResponse,
): NoteModel[] => {
  const rawNotes = [
    ...aiPlan.notes,
    ...aiPlan.warnings,
  ]
    .map(normalizeAIText)
    .filter(Boolean)
    .filter((note) => !isAutoCalculationLikeNote(note))
    .filter((note, index, notes) => {
      const noteKey = getNoteDedupeKey(note);
      return (
        notes.findIndex((item) => getNoteDedupeKey(item) === noteKey) === index
      );
    })
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

  const nextBudget: BudgetPeriod = {
    ...draftBudget,
    title: createBudgetTitle(startDate, endDate),
    startDate,
    endDate,
    totalIncome,
    totalExpenses,
    remaining: totalIncome,
    requiredItems,
    desiredItems,
    notes: [
      ...buildAINotesFromPlan(aiPlan),
      ...buildAdditionalInfoNotes(formData),
    ],
    aiContext: createBudgetAIContext(formData),
    updatedAt: new Date(),
  };

  return {
    ...nextBudget,
    aiPlanSignature: createAIRefreshSignature(nextBudget),
  };
};
