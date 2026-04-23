import { ChecklistItemModel } from './checklist-item';
import { NoteModel } from './note';


export type CellColor =
  | '#D87B7B'
  | '#507B5D'
  | '#69B5D3'
  | '#FCD688'
  | '#FFDFDF'
  | '#CAEEFC'
  | '#FFE8B9'
  | '#ABD0B7'
  | '#FDF7F7'
  | '#D9D9D9'
  | '#5B5B5B';


export type TextColor = '#424242' | '#F9F9F9';


export interface CellColors {
  required: CellColor;
  desired: CellColor;
  notes: CellColor;
}


export interface CellTitles {
  required: string;
  desired: string;
  notes: string;
}


export type ColorCategory = 'light' | 'dark';


export interface BudgetPeriod {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  remaining: number;
  requiredItems: ChecklistItemModel[];
  desiredItems: ChecklistItemModel[];
  notes: NoteModel[];
  colors: CellColors;
  cellTitles: CellTitles;
  createdAt: Date;
  updatedAt: Date;
}


export function getColorCategory(color: CellColor): ColorCategory {
  const lightColors: CellColor[] = [
    '#FCD688',
    '#FFDFDF',
    '#CAEEFC',
    '#FFE8B9',
    '#ABD0B7',
    '#FDF7F7',
    '#D9D9D9',
  ];

  return lightColors.includes(color) ? 'light' : 'dark';
}


export function getContrastTextColor(backgroundColor: CellColor): TextColor {
  if (backgroundColor === '#FCD688') {
    return '#F9F9F9';
  }

  const category = getColorCategory(backgroundColor);
  return category === 'light' ? '#424242' : '#F9F9F9';
}


export function getItemTextColor(): '#0D0D0D' {
  return '#0D0D0D';
}


export function calculateCompletedExpenses(budget: BudgetPeriod): number {
  const completedRequired = budget.requiredItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.amount, 0);

  const completedDesired = budget.desiredItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.amount, 0);

  return completedRequired + completedDesired;
}


export function calculateActiveExpenses(items: ChecklistItemModel[]): number {
  return items
    .filter(item => !item.completed)
    .reduce((sum, item) => sum + item.amount, 0);
}


export function calculateTotalExpenses(budget: BudgetPeriod): number {
  const totalRequired = budget.requiredItems
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDesired = budget.desiredItems
    .reduce((sum, item) => sum + item.amount, 0);

  return totalRequired + totalDesired;
}


export function createDefaultBudgetPeriod(): BudgetPeriod {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 30);

  return {
    id: `budget_${Date.now()}`,
    title: 'Новый бюджет',
    startDate: now,
    endDate: endDate,
    totalIncome: 0,
    totalExpenses: 0,
    remaining: 0,
    requiredItems: [],
    desiredItems: [],
    notes: [],
    colors: {
      required: '#D87B7B',
      desired: '#507B5D',
      notes: '#69B5D3',
    },
    cellTitles: {
      required: 'Обязательные',
      desired: 'Необязательные',
      notes: 'Заметки'
    },
    createdAt: now,
    updatedAt: now,
  };
}


export function isLightColor(color: CellColor): boolean {
  return getColorCategory(color) === 'light';
}


export function isDarkColor(color: CellColor): boolean {
  return getColorCategory(color) === 'dark';
}
