/**
 * Типы для формы ввода бюджета
 */

export type SectionType =
  | "period"
  | "income"
  | "required"
  | "desired"
  | "assets"
  | "debts"
  | "goals";

export interface FormInputItem {
  id: string;
  text: string; // Название (откуда деньги/на что тратить)
  amount: number; // Сумма
  comment?: string; // Комментарий/дата (по желанию)
}

export interface FormSection {
  id: SectionType;
  title: string;
  inputs: {
    placeholders: string[];
    items: FormInputItem[];
  };
  color: string;
  canAddItems: boolean;
}

export interface FormData {
  period: {
    startDate: string;
    endDate: string;
  };
  sections: Partial<Record<SectionType, FormSection>>;
  aiComment: string;
}

export const MAIN_FORM_SECTIONS: SectionType[] = [
  "period",
  "income",
  "required",
  "desired",
];

export const ADDITIONAL_FORM_SECTIONS: SectionType[] = [
  "assets",
  "goals",
  "debts",
];

export const DEFAULT_FORM_SECTIONS: Record<
  SectionType,
  Omit<FormSection, "items">
> = {
  period: {
    id: "period",
    title: "Период",
    inputs: {
      placeholders: ["С какого числа?", "До какого числа?"],
      items: [],
    },
    color: "#D87B7B",
    canAddItems: false,
  },
  income: {
    id: "income",
    title: "Доходы",
    inputs: {
      placeholders: [
        "Откуда деньги?",
        "Сколько?",
        "Когда появятся? (по желанию)",
      ],
      items: [],
    },
    color: "#69B5D3",
    canAddItems: true,
  },
  required: {
    id: "required",
    title: "Обязательные расходы",
    inputs: {
      placeholders: [
        "На что будешь тратить?",
        "Сколько?",
        "Когда платить? (по желанию)",
      ],
      items: [],
    },
    color: "#507B5D",
    canAddItems: true,
  },
  desired: {
    id: "desired",
    title: "Необязательные расходы",
    inputs: {
      placeholders: [
        "На что будешь тратить?",
        "Сколько?",
        "Когда платить? (по желанию)",
      ],
      items: [],
    },
    color: "#FCD688",
    canAddItems: true,
  },
  assets: {
    id: "assets",
    title: "Активы",
    inputs: {
      placeholders: [
        "Что у вас есть?",
        "Сколько стоит?",
        "Комментарий (опционально)",
      ],
      items: [],
    },
    color: "#CAEEFC",
    canAddItems: true,
  },
  debts: {
    id: "debts",
    title: "Долги",
    inputs: {
      placeholders: ["Кому должны?", "Сколько?", "Когда вернуть?"],
      items: [],
    },
    color: "#FFE8B9",
    canAddItems: true,
  },
  goals: {
    id: "goals",
    title: "Цели",
    inputs: {
      placeholders: ["На что копим?", "Сколько нужно?", "К какому сроку?"],
      items: [],
    },
    color: "#ABD0B7",
    canAddItems: true,
  },
};
