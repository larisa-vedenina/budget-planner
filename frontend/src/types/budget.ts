// types/budget.ts
import { ChecklistItemModel } from './checklist-item';
import { NoteModel } from './note';

/**
 * Типы цветов для ячеек
 */
export type CellColor =
  | '#D87B7B'    // Красный (темный) - обязательные траты по умолчанию
  | '#507B5D'    // Зеленый (темный) - желаемые траты по умолчанию
  | '#69B5D3'    // Голубой - заметки по умолчанию
  | '#FCD688'    // Желтый (светлый)
  | '#FFDFDF'    // Светло-красный (светлый)
  | '#CAEEFC'    // Светло-голубой (светлый)
  | '#FFE8B9'    // Светло-желтый (светлый)
  | '#ABD0B7'    // Светло-зеленый (светлый)
  | '#FDF7F7'    // Очень светлый розовый (светлый)
  | '#D9D9D9'    // Серый (нейтральный)
  | '#5B5B5B';   // Темно-серый (темный)

/**
 * Цвета текста для контраста
 */
export type TextColor = '#424242' | '#F9F9F9';

/**
 * Интерфейс для цветовой схемы ячейки
 */
export interface CellColors {
  required: CellColor;  // Цвет для обязательных расходов
  desired: CellColor;   // Цвет для желаемых расходов
  notes: CellColor;     // Цвет для заметок
}

/**
 * Интерфейс для заголовков ячеек
 */
export interface CellTitles {
  required: string;     // Заголовок для обязательных расходов
  desired: string;      // Заголовок для желаемых расходов
  notes: string;        // Заголовок для заметок
}

/**
 * Тип для определения, светлый или темный фон
 */
export type ColorCategory = 'light' | 'dark';

/**
 * Бюджетный период
 */
export interface BudgetPeriod {
  id: string;                         // Уникальный ID периода
  title: string;                      // Название периода (например, "Ноябрь 2024")
  startDate: Date;                    // Начало периода
  endDate: Date;                      // Конец периода
  totalIncome: number;                // Общий доход
  totalExpenses: number;              // Общие расходы (ВСЕ расходы, включая выполненные)
  remaining: number;                  // Остаток (доход минус ВЫПОЛНЕННЫЕ расходы)
  requiredItems: ChecklistItemModel[]; // Обязательные расходы
  desiredItems: ChecklistItemModel[];  // Желаемые расходы
  notes: NoteModel[];                 // Заметки
  colors: CellColors;                 // Цвета ячеек
  cellTitles: CellTitles;             // Заголовки ячеек (ДОБАВЛЕНО)
  createdAt: Date;                    // Дата создания
  updatedAt: Date;                    // Дата последнего обновления
}

/**
 * Определяет категорию цвета (светлый/темный)
 * @param color Hex-код цвета
 * @returns 'light' или 'dark'
 */
export function getColorCategory(color: CellColor): ColorCategory {
  // Светлые цвета из дизайн-системы
  const lightColors: CellColor[] = [
    '#FCD688',    // Желтый (светлый)
    '#FFDFDF',    // Светло-красный (светлый)
    '#CAEEFC',    // Светло-голубой (светлый)
    '#FFE8B9',    // Светло-желтый (светлый)
    '#ABD0B7',    // Светло-зеленый (светлый)
    '#FDF7F7',    // Очень светлый розовый (светлый)
    '#D9D9D9',    // Серый (нейтральный - относим к светлым)
  ];
  
  return lightColors.includes(color) ? 'light' : 'dark';
}

/**
 * Возвращает контрастный цвет текста для заголовка ячейки и суммы трат
 * @param backgroundColor Цвет фона ячейки
 * @returns Цвет текста: #424242 для светлого фона, #F9F9F9 для темного
 */
export function getContrastTextColor(backgroundColor: CellColor): TextColor {
  if (backgroundColor === '#FCD688') {
    return '#F9F9F9';
  }

  const category = getColorCategory(backgroundColor);
  return category === 'light' ? '#424242' : '#F9F9F9';
}

/**
 * Возвращает цвет текста для пунктов и заметок
 * @remarks Цвет текста внутри пунктов и заметок всегда #0D0D0D
 */
export function getItemTextColor(): '#0D0D0D' {
  return '#0D0D0D'; 
}

/**
 * Рассчитывает сумму ВЫПОЛНЕННЫХ расходов
 * @param budget Бюджетный период
 * @returns Сумма выполненных расходов
 */
export function calculateCompletedExpenses(budget: BudgetPeriod): number {
  const completedRequired = budget.requiredItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.amount, 0);
  
  const completedDesired = budget.desiredItems
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.amount, 0);
  
  return completedRequired + completedDesired;
}

/**
 * Рассчитывает сумму АКТИВНЫХ (невыполненных) расходов для ячейки
 * @param items Массив пунктов расходов
 * @returns Сумма активных расходов
 */
export function calculateActiveExpenses(items: ChecklistItemModel[]): number {
  return items
    .filter(item => !item.completed)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Рассчитывает общую сумму ВСЕХ расходов (и выполненных, и активных)
 * @param budget Бюджетный период
 * @returns Общая сумма всех расходов
 */
export function calculateTotalExpenses(budget: BudgetPeriod): number {
  const totalRequired = budget.requiredItems
    .reduce((sum, item) => sum + item.amount, 0);
  
  const totalDesired = budget.desiredItems
    .reduce((sum, item) => sum + item.amount, 0);
  
  return totalRequired + totalDesired;
}

/**
 * Создает новый бюджетный период с дефолтными значениями
 * @remarks Дефолтные цвета: D87B7B для обязательных, 507B5D для желаемых, 69B5D3 для заметок
 */
export function createDefaultBudgetPeriod(): BudgetPeriod {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 30); // 30 дней по умолчанию

  return {
    id: `budget_${Date.now()}`,
    title: 'Новый бюджет',
    startDate: now,
    endDate: endDate,
    totalIncome: 0,
    totalExpenses: 0, // Инициализируем нулем, будет рассчитано при добавлении пунктов
    remaining: 0,
    requiredItems: [],
    desiredItems: [],
    notes: [],
    colors: {
      required: '#D87B7B',  // Красный (темный) - обязательные траты по умолчанию
      desired: '#507B5D',   // Зеленый (темный) - желаемые траты по умолчанию
      notes: '#69B5D3',     // Голубой - заметки по умолчанию
    },
    cellTitles: { // ДОБАВЛЕНО: дефолтные заголовки ячеек
      required: 'ОБЯЗАТЕЛЬНЫЕ',
      desired: 'НЕОБЯЗАТЕЛЬНЫЕ',
      notes: 'ЗАМЕТКИ'
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Проверяет, является ли цвет светлым
 */
export function isLightColor(color: CellColor): boolean {
  return getColorCategory(color) === 'light';
}

/**
 * Проверяет, является ли цвет темным
 */
export function isDarkColor(color: CellColor): boolean {
  return getColorCategory(color) === 'dark';
}
