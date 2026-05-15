import { BudgetPeriod } from "../types/budget";
import {
  ChecklistItemBadge,
  ChecklistItemModel,
} from "../types/checklist-item";
import { NoteModel } from "../types/note";

interface SerializedChecklistItem {
  id: string;
  title: string;
  amount: number;
  category: "required" | "desired";
  completed: boolean;
  priority: "default" | "priority";
  completedAt?: string;
  dragState?: "idle" | "dragging" | "hover";
  createdAt: string;
  badge?: ChecklistItemBadge;
}

interface SerializedNote {
  id: string;
  content: string;
  type: "ai" | "user";
  createdAt: string;
}

export interface SerializedBudgetPeriod
  extends Omit<
    BudgetPeriod,
    | "startDate"
    | "endDate"
    | "createdAt"
    | "updatedAt"
    | "requiredItems"
    | "desiredItems"
    | "notes"
  > {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  requiredItems: SerializedChecklistItem[];
  desiredItems: SerializedChecklistItem[];
  notes: SerializedNote[];
}

export interface BudgetSnapshot {
  currentBudget: SerializedBudgetPeriod | null;
  budgetsHistory: SerializedBudgetPeriod[];
  editMode: boolean;
}

export const BUDGET_STORAGE_KEYS = {
  CURRENT_BUDGET: "budget_app_current_budget",
  EDIT_MODE: "budget_app_edit_mode",
  BUDGETS_HISTORY: "budget_app_budgets_history",
} as const;

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Ошибка чтения budget storage:", error);
    return fallback;
  }
};

export const serializeBudget = (
  budget: BudgetPeriod,
): SerializedBudgetPeriod => ({
  ...budget,
  startDate: budget.startDate.toISOString(),
  endDate: budget.endDate.toISOString(),
  createdAt: budget.createdAt.toISOString(),
  updatedAt: budget.updatedAt.toISOString(),
  requiredItems: budget.requiredItems.map((item) => ({
    id: item.id,
    title: item.title,
    amount: item.amount,
    category: item.category,
    completed: item.completed,
    priority: item.priority,
    completedAt: item.completedAt?.toISOString(),
    dragState: item.dragState,
    createdAt: item.createdAt.toISOString(),
    badge: item.badge,
  })),
  desiredItems: budget.desiredItems.map((item) => ({
    id: item.id,
    title: item.title,
    amount: item.amount,
    category: item.category,
    completed: item.completed,
    priority: item.priority,
    completedAt: item.completedAt?.toISOString(),
    dragState: item.dragState,
    createdAt: item.createdAt.toISOString(),
    badge: item.badge,
  })),
  notes: budget.notes.map((note) => ({
    id: note.id,
    content: note.content,
    type: note.type,
    createdAt: note.createdAt.toISOString(),
  })),
});

export const deserializeBudget = (
  data: SerializedBudgetPeriod,
): BudgetPeriod => ({
  ...data,
  startDate: new Date(data.startDate),
  endDate: new Date(data.endDate),
  createdAt: new Date(data.createdAt),
  updatedAt: new Date(data.updatedAt),
  requiredItems: Array.isArray(data.requiredItems)
    ? data.requiredItems.map(
        (item) =>
          new ChecklistItemModel(
            item.id,
            item.title,
            item.amount,
            item.completed,
            item.category,
            item.priority,
            item.completedAt ? new Date(item.completedAt) : undefined,
            item.dragState || "idle",
            new Date(item.createdAt),
            item.badge,
          ),
      )
    : [],
  desiredItems: Array.isArray(data.desiredItems)
    ? data.desiredItems.map(
        (item) =>
          new ChecklistItemModel(
            item.id,
            item.title,
            item.amount,
            item.completed,
            item.category,
            item.priority,
            item.completedAt ? new Date(item.completedAt) : undefined,
            item.dragState || "idle",
            new Date(item.createdAt),
            item.badge,
          ),
      )
    : [],
  notes: Array.isArray(data.notes)
    ? data.notes.map(
        (note) =>
          new NoteModel(
            note.id,
            note.content,
            note.type,
            new Date(note.createdAt),
          ),
      )
    : [],
});

export const loadStoredEditMode = (): boolean =>
  parseJson<boolean>(localStorage.getItem(BUDGET_STORAGE_KEYS.EDIT_MODE), false);

export const saveStoredEditMode = (isEditMode: boolean): void => {
  localStorage.setItem(
    BUDGET_STORAGE_KEYS.EDIT_MODE,
    JSON.stringify(isEditMode),
  );
};

export const loadCurrentBudget = (): BudgetPeriod | null => {
  const rawBudget = parseJson<SerializedBudgetPeriod | null>(
    localStorage.getItem(BUDGET_STORAGE_KEYS.CURRENT_BUDGET),
    null,
  );

  return rawBudget ? deserializeBudget(rawBudget) : null;
};

export const saveCurrentBudget = (budget: BudgetPeriod): void => {
  localStorage.setItem(
    BUDGET_STORAGE_KEYS.CURRENT_BUDGET,
    JSON.stringify(serializeBudget(budget)),
  );
};

export const getBudgetSnapshot = (): BudgetSnapshot => ({
  currentBudget: parseJson<SerializedBudgetPeriod | null>(
    localStorage.getItem(BUDGET_STORAGE_KEYS.CURRENT_BUDGET),
    null,
  ),
  budgetsHistory: parseJson<SerializedBudgetPeriod[]>(
    localStorage.getItem(BUDGET_STORAGE_KEYS.BUDGETS_HISTORY),
    [],
  ),
  editMode: loadStoredEditMode(),
});

export const applyBudgetSnapshot = (snapshot: BudgetSnapshot): void => {
  if (snapshot.currentBudget) {
    localStorage.setItem(
      BUDGET_STORAGE_KEYS.CURRENT_BUDGET,
      JSON.stringify(snapshot.currentBudget),
    );
  } else {
    localStorage.removeItem(BUDGET_STORAGE_KEYS.CURRENT_BUDGET);
  }

  localStorage.setItem(
    BUDGET_STORAGE_KEYS.BUDGETS_HISTORY,
    JSON.stringify(snapshot.budgetsHistory || []),
  );

  saveStoredEditMode(Boolean(snapshot.editMode));
};

export const hasStoredBudgetData = (): boolean =>
  Boolean(
    localStorage.getItem(BUDGET_STORAGE_KEYS.CURRENT_BUDGET) ||
      localStorage.getItem(BUDGET_STORAGE_KEYS.BUDGETS_HISTORY),
  );

const sortBudgetsByUpdateDate = (budgets: BudgetPeriod[]): BudgetPeriod[] =>
  [...budgets].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

export const loadBudgetHistory = (): BudgetPeriod[] => {
  const serializedHistory = parseJson<SerializedBudgetPeriod[]>(
    localStorage.getItem(BUDGET_STORAGE_KEYS.BUDGETS_HISTORY),
    [],
  );

  const history = serializedHistory.map(deserializeBudget);
  const currentBudget = loadCurrentBudget();
  const uniqueBudgets = new Map<string, BudgetPeriod>();

  [...history, ...(currentBudget ? [currentBudget] : [])].forEach((budget) => {
    const existingBudget = uniqueBudgets.get(budget.id);

    if (!existingBudget || budget.updatedAt > existingBudget.updatedAt) {
      uniqueBudgets.set(budget.id, budget);
    }
  });

  return sortBudgetsByUpdateDate(Array.from(uniqueBudgets.values()));
};

export const upsertBudgetHistory = (budget: BudgetPeriod): void => {
  const history = loadBudgetHistory().filter(
    (storedBudget) => storedBudget.id !== budget.id,
  );
  const nextHistory = sortBudgetsByUpdateDate([budget, ...history]).map(
    serializeBudget,
  );

  localStorage.setItem(
    BUDGET_STORAGE_KEYS.BUDGETS_HISTORY,
    JSON.stringify(nextHistory),
  );
};

export const saveBudgetSnapshot = (
  budget: BudgetPeriod,
  isEditMode: boolean,
): void => {
  saveStoredEditMode(isEditMode);
  saveCurrentBudget(budget);
  upsertBudgetHistory(budget);
};

export const deleteStoredBudget = (budgetId: string): BudgetPeriod[] => {
  const nextBudgets = loadBudgetHistory().filter(
    (storedBudget) => storedBudget.id !== budgetId,
  );

  localStorage.setItem(
    BUDGET_STORAGE_KEYS.BUDGETS_HISTORY,
    JSON.stringify(nextBudgets.map(serializeBudget)),
  );

  const currentBudget = loadCurrentBudget();

  if (currentBudget?.id === budgetId) {
    if (nextBudgets.length > 0) {
      saveCurrentBudget(nextBudgets[0]);
    } else {
      localStorage.removeItem(BUDGET_STORAGE_KEYS.CURRENT_BUDGET);
      localStorage.removeItem(BUDGET_STORAGE_KEYS.EDIT_MODE);
    }
  }

  return nextBudgets;
};

export const clearBudgetStorage = (includeHistory = true): void => {
  localStorage.removeItem(BUDGET_STORAGE_KEYS.CURRENT_BUDGET);
  localStorage.removeItem(BUDGET_STORAGE_KEYS.EDIT_MODE);

  if (includeHistory) {
    localStorage.removeItem(BUDGET_STORAGE_KEYS.BUDGETS_HISTORY);
  }
};
