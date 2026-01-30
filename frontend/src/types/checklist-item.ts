/**
 * Пункт чек-листа бюджета
 * Категории ChecklistCategory: "required" (обязательные) / "desired" (желаемые) - соответствуют колонкам
 * Приоритет PriorityColor = 'default' | 'priority': border окрашивается в #D87B7B, поднимается вверх списка
 * Таймер: выполненные пункты исчезают через 10 минут (кроме режима редактирования)
 * Состояние перетаскивания пункта DragState = 'idle' | 'dragging' | 'hover'
 * - 'idle': обычное состояние
 * - 'dragging': в процессе перетаскивания
 * - 'hover': наведение в режиме редактирования
 */

export type ChecklistCategory = "required" | "desired";
export type PriorityColor = "default" | "priority";
export type DragState = "idle" | "dragging" | "hover";

export interface IChecklistItem {
  id: string; // Уникальный идентификатор
  title: string; // Название пункта (аренда, коммуналка)
  amount: number; // Сумма в рублях
  category: ChecklistCategory; // Категория: обязательные/желаемые
  completed: boolean; // Выполнен ли пункт
  priority: PriorityColor; // Приоритет: default/priority
  completedAt?: Date; // Время выполнения (для таймеров)
  dragState?: DragState; // Состояние для Drag & Drop
  createdAt: Date; // Дата создания
}

/**
 * Класс модели пункта чек-листа с бизнес-логикой
 * Инкапсулирует правила изменения состояния пункта
 */
export class ChecklistItemModel implements IChecklistItem {
  constructor(
    public id: string, // Генерируется при создании
    public title: string, // Пользовательский ввод
    public amount: number, // Сумма >= 0
    public completed: boolean, // По умолчанию false
    public category: ChecklistCategory, // Определяет колонку
    public priority: PriorityColor = "default", // Приоритет по умолчанию
    public completedAt?: Date, // Заполняется при выполнении
    public dragState: DragState = "idle", // Для UI состояния
    public createdAt: Date = new Date() // Автоматически
  ) {}

  /**
   * Создает новый пункт с дефолтными значениями
   * Используется при добавлении через кнопку "+"
   */
  static createDefault(category: ChecklistCategory): ChecklistItemModel {
    return new ChecklistItemModel(
      `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "На что будем тратить?", // Заголовок по умолчанию
      0, // Сумма по умолчанию
      false, // Не выполнен
      category, // Переданная категория
      "default", // Обычный приоритет
      undefined, // Время выполнения
      "idle", // Обычное состояние
      new Date() // Текущее время
    );
  }

  /**
   * Обновляет заголовок пункта
   * Создает новый объект (иммутабельно)
   */
  updateTitle(newTitle: string): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      newTitle, // Новый заголовок
      this.amount,
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      this.dragState,
      this.createdAt
    );
  }

  /**
   * Обновляет сумму пункта
   * Проверяет, что сумма не отрицательная
   */
  updateAmount(newAmount: number): ChecklistItemModel {
    const validatedAmount = Math.max(0, newAmount); // Нельзя отрицательную сумму
    return new ChecklistItemModel(
      this.id,
      this.title,
      validatedAmount, // Проверенная сумма
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      this.dragState,
      this.createdAt
    );
  }

  /**
   * Переключает состояние выполнения
   * Если отмечаем как выполненный - сохраняем время
   * Если снимаем отметку - очищаем время
   */
  toggleCompleted(): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      !this.completed, // Инвертируем состояние
      this.category,
      this.priority,
      !this.completed ? new Date() : undefined, // Время выполнения или undefined
      this.dragState,
      this.createdAt
    );
  }

  /**
   * Переключает приоритет пункта
   * priority: красный border, поднимается вверх
   * default: белый border, обычное положение
   */
  togglePriority(): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      this.completed,
      this.category,
      this.priority === "priority" ? "default" : "priority", // Переключаем
      this.completedAt,
      this.dragState,
      this.createdAt
    );
  }

  /**
   * Обновляет состояние перетаскивания
   * Используется в режиме редактирования
   */
  updateDragState(newState: DragState): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      newState, // Новое состояние DnD
      this.createdAt
    );
  }

  /**
   * Возвращает CSS-стили для пункта в зависимости от состояния
   */
  getStyles(): {
    border: string;
    boxShadow: string;
    transform: string;
    cursor: string;
  } {
    const styles = {
      border: "",
      boxShadow: "none",
      transform: "translate(0px, 0px)",
      cursor: "pointer",
    };

    // Приоритетный пункт - красный border
    if (this.priority === "priority") {
      styles.border = "2px solid #D87B7B";
    } else {
      styles.border = "2px solid #FFFFFF";
    }

    // В режиме редактирования при наведении/перетаскивании
    if (this.dragState === "hover" || this.dragState === "dragging") {
      styles.boxShadow = "-2px 2px 1px rgba(0, 0, 0, 0.25)";
      styles.transform = "translate(-1px, 1px)"; // Смещение x-1, y+1
    }

    // Для перетаскивания меняем курсор
    if (this.dragState === "dragging") {
      styles.cursor = "grabbing"; // Курсор "захвачено"
    } else if (this.dragState === "hover") {
      styles.cursor = "grab"; // Курсор "можно захватить"
    }

    return styles;
  }

  /**
   * Возвращает числовой приоритет для сортировки
   * Priority идет первыми, затем по дате создания
   */
  getSortOrder(): number {
    // Приоритетные идут первыми (большее число)
    // Неприоритетные идут после (меньшее число)
    return this.priority === "priority"
      ? 1
      : 0 + 1 / (this.createdAt.getTime() || 1);
    // return this.priority === 'priority' ? 1 : 0;
    // сортировка по времени создания:
    // return this.priority === 'priority' ? 1 : 0 + (1 / (this.createdAt.getTime() || 1));
  }
}
