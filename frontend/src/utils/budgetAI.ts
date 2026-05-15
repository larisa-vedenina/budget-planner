import { AIBudgetPlanRequest } from "../types/api";
import { BudgetAIContext, BudgetPeriod } from "../types/budget";
import { ChecklistItemModel } from "../types/checklist-item";
import { FormData, FormInputItem, SectionType } from "../types/form";
import { NoteModel } from "../types/note";

export const CALCULATED_BUDGET_NOTE_ID = "ai_calculated_free_money";

const getSectionItems = (
  formData: FormData,
  sectionType: SectionType,
): FormInputItem[] => formData.sections[sectionType]?.inputs.items ?? [];

const normalizeText = (value: string | undefined): string =>
  String(value ?? "").trim();

const formatDateInput = (date: Date): string =>
  new Date(date).toISOString().split("T")[0];

const getPeriodDays = (budget: BudgetPeriod): number => {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return 0;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
};

const formatAmount = (amount: number): string =>
  Math.abs(Math.round(amount)).toLocaleString("ru-RU").replace(/\s/g, " ");

const formatRubles = (amount: number): string => `${formatAmount(amount)} ₽`;

export const createBudgetAIContext = (formData: FormData): BudgetAIContext => ({
  city: normalizeText(formData.city),
  dailySpending: normalizeText(formData.dailySpending),
  aiComment: normalizeText(formData.aiComment),
  assets: getSectionItems(formData, "assets"),
  debts: getSectionItems(formData, "debts"),
  goals: getSectionItems(formData, "goals"),
});

const checklistItemToFormItem = (item: ChecklistItemModel): FormInputItem => ({
  id: item.id,
  text: item.title,
  amount: item.amount,
  comment: item.completed ? "Уже выполнено" : undefined,
});

export const createAIRefreshSignature = (budget: BudgetPeriod): string =>
  JSON.stringify({
    totalIncome: Math.round(Number(budget.totalIncome) || 0),
    startDate: formatDateInput(budget.startDate),
    endDate: formatDateInput(budget.endDate),
    requiredItems: budget.requiredItems.map((item) => ({
      id: item.id,
      title: normalizeText(item.title),
      amount: Math.round(Number(item.amount) || 0),
    })),
  });

interface AIRefreshSignatureData {
  totalIncome: number;
  startDate: string;
  endDate: string;
  requiredItems: Array<{
    id: string;
    title: string;
    amount: number;
  }>;
}

const parseAIRefreshSignature = (
  signature: string | undefined,
): AIRefreshSignatureData | null => {
  if (!signature) {
    return null;
  }

  try {
    const parsedSignature = JSON.parse(signature) as AIRefreshSignatureData;

    if (
      typeof parsedSignature.totalIncome !== "number" ||
      typeof parsedSignature.startDate !== "string" ||
      typeof parsedSignature.endDate !== "string" ||
      !Array.isArray(parsedSignature.requiredItems)
    ) {
      return null;
    }

    return parsedSignature;
  } catch {
    return null;
  }
};

const getDateDiffInDays = (firstDate: string, secondDate: string): number => {
  const firstTime = new Date(firstDate).getTime();
  const secondTime = new Date(secondDate).getTime();

  if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
    return 0;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.abs(Math.round((firstTime - secondTime) / dayMs));
};

const getPeriodDaysFromSignature = (
  signature: Pick<AIRefreshSignatureData, "startDate" | "endDate">,
): number =>
  getPeriodDays({
    startDate: new Date(signature.startDate),
    endDate: new Date(signature.endDate),
  } as BudgetPeriod);

const hasSignificantAmountChange = (
  previousAmount: number,
  nextAmount: number,
  totalIncome: number,
): boolean => {
  const amountDiff = Math.abs(nextAmount - previousAmount);
  const previousBase = Math.max(1, Math.abs(previousAmount));
  const incomeBase = Math.max(1, Math.abs(totalIncome));

  return (
    amountDiff >= 3000 &&
    (amountDiff / previousBase >= 0.1 || amountDiff / incomeBase >= 0.05)
  );
};

const isMeaningfulRequiredAmount = (
  amount: number,
  totalIncome: number,
): boolean => {
  const incomeBase = Math.max(1, Math.abs(totalIncome));

  return amount >= 3000 || amount / incomeBase >= 0.05;
};

const hasSignificantPeriodChange = (
  previousSignature: AIRefreshSignatureData,
  currentSignature: AIRefreshSignatureData,
): boolean => {
  const previousPeriodDays = getPeriodDaysFromSignature(previousSignature);
  const currentPeriodDays = getPeriodDaysFromSignature(currentSignature);
  const periodLengthDiff = Math.abs(currentPeriodDays - previousPeriodDays);
  const periodBase = Math.max(1, previousPeriodDays);
  const periodLengthChanged =
    periodLengthDiff >= 7 ||
    (periodLengthDiff >= 3 && periodLengthDiff / periodBase >= 0.25);
  const periodShiftDiff = Math.max(
    getDateDiffInDays(currentSignature.startDate, previousSignature.startDate),
    getDateDiffInDays(currentSignature.endDate, previousSignature.endDate),
  );
  const periodShifted = periodShiftDiff >= 14;

  return periodLengthChanged || periodShifted;
};

export const canBuildAIRefreshRequest = (budget: BudgetPeriod): boolean =>
  budget.totalIncome > 0 &&
  budget.requiredItems.some((item) => item.title.trim() && item.amount > 0);

export const hasSignificantAIPlanChanges = (budget: BudgetPeriod): boolean => {
  const previousSignature = parseAIRefreshSignature(budget.aiPlanSignature);

  if (!previousSignature) {
    return false;
  }

  const currentSignature = parseAIRefreshSignature(
    createAIRefreshSignature(budget),
  );

  if (!currentSignature) {
    return false;
  }

  const incomeChanged = hasSignificantAmountChange(
    previousSignature.totalIncome,
    currentSignature.totalIncome,
    previousSignature.totalIncome,
  );

  const periodChanged = hasSignificantPeriodChange(
    previousSignature,
    currentSignature,
  );

  const previousItemsById = new Map(
    previousSignature.requiredItems.map((item) => [item.id, item]),
  );
  const currentItemsById = new Map(
    currentSignature.requiredItems.map((item) => [item.id, item]),
  );
  const addedItems = currentSignature.requiredItems.filter(
    (item) => !previousItemsById.has(item.id),
  );
  const deletedItems = previousSignature.requiredItems.filter(
    (item) => !currentItemsById.has(item.id),
  );
  const itemStructureChanged = addedItems
    .concat(deletedItems)
    .some((item) =>
      isMeaningfulRequiredAmount(item.amount, currentSignature.totalIncome),
    );
  const itemAmountChanged = currentSignature.requiredItems.some((item) => {
    const previousItem = previousItemsById.get(item.id);

    if (!previousItem) {
      return false;
    }

    return hasSignificantAmountChange(
      previousItem.amount,
      item.amount,
      currentSignature.totalIncome,
    );
  });
  const itemTitleChanged = currentSignature.requiredItems.some((item) => {
    const previousItem = previousItemsById.get(item.id);

    if (!previousItem || previousItem.title === item.title) {
      return false;
    }

    return isMeaningfulRequiredAmount(
      item.amount,
      currentSignature.totalIncome,
    );
  });

  const previousRequiredTotal = previousSignature.requiredItems.reduce(
    (sum, item) => sum + Math.max(0, item.amount),
    0,
  );
  const currentRequiredTotal = currentSignature.requiredItems.reduce(
    (sum, item) => sum + Math.max(0, item.amount),
    0,
  );
  const hadRequiredReserve =
    previousSignature.totalIncome - previousRequiredTotal >= 0;
  const hasRequiredReserve =
    currentSignature.totalIncome - currentRequiredTotal >= 0;
  const reserveSignChanged = hadRequiredReserve !== hasRequiredReserve;

  return (
    incomeChanged ||
    periodChanged ||
    itemStructureChanged ||
    itemAmountChanged ||
    itemTitleChanged ||
    reserveSignChanged
  );
};

export const createAIBudgetPlanRequestFromBudget = (
  budget: BudgetPeriod,
): AIBudgetPlanRequest => {
  const aiContext = budget.aiContext;

  return {
    period: {
      startDate: formatDateInput(budget.startDate),
      endDate: formatDateInput(budget.endDate),
    },
    city: aiContext?.city ?? "",
    dailySpending: aiContext?.dailySpending ?? "",
    aiComment: aiContext?.aiComment ?? "",
    sections: {
      income: [
        {
          id: `${budget.id}_income`,
          text: "Общий бюджет",
          amount: budget.totalIncome,
          comment: budget.title,
        },
      ],
      required: budget.requiredItems.map(checklistItemToFormItem),
      desired: budget.desiredItems.map(checklistItemToFormItem),
      assets: aiContext?.assets ?? [],
      debts: aiContext?.debts ?? [],
      goals: aiContext?.goals ?? [],
    },
  };
};

export const buildCalculatedBudgetNoteContent = (
  budget: BudgetPeriod,
): string => {
  const plannedExpenses = budget.requiredItems
    .concat(budget.desiredItems)
    .reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  const freeMoney = budget.totalIncome - plannedExpenses;
  const periodDays = getPeriodDays(budget);
  const dailyAmount =
    periodDays > 0 ? Math.round(Math.abs(freeMoney) / periodDays) : 0;
  const weeklyAmount =
    periodDays > 0
      ? Math.round((Math.abs(freeMoney) / periodDays) * Math.min(7, periodDays))
      : 0;

  if (freeMoney < 0) {
    return `Дефицит бюджета: ${formatRubles(
      freeMoney,
    )}\nНужно сократить расходы примерно на ${formatRubles(
      dailyAmount,
    )} в день.\nНужно сократить расходы примерно на ${formatRubles(
      weeklyAmount,
    )} в неделю.`;
  }

  return `Свободные деньги: ${formatRubles(
    freeMoney,
  )}\nМожно тратить около ${formatRubles(
    dailyAmount,
  )} в день\nМожно тратить около ${formatRubles(weeklyAmount)} в неделю`;
};

export const withCalculatedBudgetNote = (
  budget: BudgetPeriod,
): BudgetPeriod => {
  const hasMeaningfulBudget =
    budget.totalIncome > 0 ||
    budget.requiredItems.length > 0 ||
    budget.desiredItems.length > 0;

  const notesWithoutCalculated = budget.notes.filter(
    (note) => note.id !== CALCULATED_BUDGET_NOTE_ID,
  );

  if (!hasMeaningfulBudget || budget.isCalculatedBudgetNoteHidden) {
    return {
      ...budget,
      notes: notesWithoutCalculated,
    };
  }

  const existingCalculatedNote = budget.notes.find(
    (note) => note.id === CALCULATED_BUDGET_NOTE_ID,
  );
  const calculatedNote = new NoteModel(
    CALCULATED_BUDGET_NOTE_ID,
    buildCalculatedBudgetNoteContent(budget),
    "ai",
    existingCalculatedNote?.createdAt ?? new Date(),
  );
  const existingCalculatedNoteIndex = budget.notes.findIndex(
    (note) => note.id === CALCULATED_BUDGET_NOTE_ID,
  );

  if (existingCalculatedNoteIndex !== -1) {
    const nextNotes = budget.notes.map((note) =>
      note.id === CALCULATED_BUDGET_NOTE_ID ? calculatedNote : note,
    );

    return {
      ...budget,
      notes: nextNotes,
    };
  }

  return {
    ...budget,
    notes: [calculatedNote, ...notesWithoutCalculated],
  };
};

export const isGeneratedAINote = (note: NoteModel): boolean =>
  note.type === "ai" && note.id !== CALCULATED_BUDGET_NOTE_ID;
