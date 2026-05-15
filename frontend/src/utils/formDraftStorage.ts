import {
  ADDITIONAL_FORM_SECTIONS,
  DEFAULT_FORM_SECTIONS,
  FormData,
  FormSection,
  MAIN_FORM_SECTIONS,
  SectionType,
} from "../types/form";
import { StorageService } from "./storage";

const FORM_DRAFT_STORAGE_KEY = "budget_app_form_draft";

export interface StoredFormDraft {
  formData: FormData;
  history: FormData[];
  historyIndex: number;
}

const normalizeSection = (
  sectionType: SectionType,
  section?: Partial<FormSection>,
): FormSection => ({
  ...DEFAULT_FORM_SECTIONS[sectionType],
  ...section,
  inputs: {
    ...DEFAULT_FORM_SECTIONS[sectionType].inputs,
    ...section?.inputs,
    items: section?.inputs?.items ?? [],
  },
});

export const createEmptyFormData = (storedData?: Partial<FormData>): FormData => {
  const sections = MAIN_FORM_SECTIONS.reduce(
    (acc, sectionType) => ({
      ...acc,
      [sectionType]: normalizeSection(
        sectionType,
        storedData?.sections?.[sectionType],
      ),
    }),
    {} as FormData["sections"],
  );

  ADDITIONAL_FORM_SECTIONS.forEach((sectionType) => {
    const storedSection = storedData?.sections?.[sectionType];
    if (storedSection) {
      sections[sectionType] = normalizeSection(sectionType, storedSection);
    }
  });

  return {
    period: {
      startDate: storedData?.period?.startDate ?? "",
      endDate: storedData?.period?.endDate ?? "",
    },
    city: storedData?.city ?? "",
    dailySpending: storedData?.dailySpending ?? "",
    sections,
    aiComment: storedData?.aiComment ?? "",
  };
};

const createEmptyDraft = (): StoredFormDraft => {
  const emptyForm = createEmptyFormData();

  return {
    formData: emptyForm,
    history: [emptyForm],
    historyIndex: 0,
  };
};

export const loadFormDraft = (): StoredFormDraft => {
  const emptyDraft = createEmptyDraft();

  if (!StorageService.isSupported()) {
    return emptyDraft;
  }

  const storedDraft = StorageService.getItem<StoredFormDraft>(
    FORM_DRAFT_STORAGE_KEY,
    emptyDraft,
  );

  if (!storedDraft?.formData) {
    return emptyDraft;
  }

  const normalizedHistory = Array.isArray(storedDraft.history)
    ? storedDraft.history.map((historyItem) => createEmptyFormData(historyItem))
    : [];

  const safeHistory =
    normalizedHistory.length > 0
      ? normalizedHistory
      : [createEmptyFormData(storedDraft.formData)];
  const safeHistoryIndex = Math.min(
    Math.max(storedDraft.historyIndex ?? safeHistory.length - 1, 0),
    safeHistory.length - 1,
  );

  return {
    formData: safeHistory[safeHistoryIndex],
    history: safeHistory,
    historyIndex: safeHistoryIndex,
  };
};

export const saveFormDraft = (draft: StoredFormDraft): void => {
  if (!StorageService.isSupported()) {
    return;
  }

  StorageService.setItem(FORM_DRAFT_STORAGE_KEY, draft);
};

export const clearFormDraft = (): void => {
  StorageService.removeItem(FORM_DRAFT_STORAGE_KEY);
};
