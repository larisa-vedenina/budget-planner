import { BudgetPeriod, createDefaultBudgetPeriod } from "../types/budget";
import { ChecklistItemModel } from "../types/checklist-item";
import { NoteModel } from "../types/note";
import {
  ADDITIONAL_FORM_SECTIONS,
  FormData,
  FormInputItem,
  SectionType,
} from "../types/form";

export const parseDateInput = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const buildChecklistItems = (
  items: FormInputItem[] = [],
  category: "required" | "desired",
): ChecklistItemModel[] =>
  items.map(
    (item) =>
      new ChecklistItemModel(
        item.id,
        item.text || "Без названия",
        Math.max(0, item.amount || 0),
        false,
        category,
      ),
  );

export const buildAdditionalInfoNotes = (formData: FormData): NoteModel[] => {
  const notes: NoteModel[] = [];

  if (formData.aiComment.trim()) {
    notes.push(
      new NoteModel(
        `user_${Date.now()}_comment`,
        `Комментарий к плану: ${formData.aiComment.trim()}`,
        "user",
      ),
    );
  }

  ADDITIONAL_FORM_SECTIONS.forEach((sectionType: SectionType) => {
    const section = formData.sections[sectionType];
    if (!section) {
      return;
    }

    const items = section?.inputs.items ?? [];

    if (items.length === 0) {
      return;
    }

    const content = items
      .map((item) => {
        const amount = item.amount
          ? ` - ${item.amount.toLocaleString("ru-RU")}₽`
          : "";
        const comment = item.comment ? ` (${item.comment})` : "";

        return `${item.text}${amount}${comment}`;
      })
      .join("; ");

    notes.push(
      new NoteModel(
        `user_${Date.now()}_${sectionType}`,
        `${section.title}: ${content}`,
        "user",
      ),
    );
  });

  return notes;
};

export const createBudgetTitle = (startDate: Date, endDate: Date): string => {
  if (startDate.getTime() === endDate.getTime()) {
    return startDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return `${startDate.toLocaleDateString("ru-RU")} - ${endDate.toLocaleDateString("ru-RU")}`;
};

export const formDataToBudget = (formData: FormData): BudgetPeriod => {
  const budget = createDefaultBudgetPeriod();

  const startDate = parseDateInput(formData.period.startDate) ?? budget.startDate;
  const endDate = parseDateInput(formData.period.endDate) ?? budget.endDate;

  const incomeItems = formData.sections.income?.inputs.items ?? [];
  const requiredItems = buildChecklistItems(
    formData.sections.required?.inputs.items,
    "required",
  );
  const desiredItems = buildChecklistItems(
    formData.sections.desired?.inputs.items,
    "desired",
  );

  const totalIncome = incomeItems.reduce(
    (sum, item) => sum + Math.max(0, item.amount || 0),
    0,
  );
  const totalExpenses = [...requiredItems, ...desiredItems].reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    ...budget,
    title: createBudgetTitle(startDate, endDate),
    startDate,
    endDate,
    totalIncome,
    totalExpenses,
    remaining: totalIncome,
    requiredItems,
    desiredItems,
    notes: buildAdditionalInfoNotes(formData),
    updatedAt: new Date(),
  };
};
