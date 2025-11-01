/**
 * Модель пункта чек-листа
 */
export class ChecklistItemModel {
  constructor(
    public id: string,
    public title: string,
    public amount: number,
    public completed: boolean,
    public category: "mandatory" | "optional",
    public color: "red" | "yellow" | "green" = "green" // Цвет = Приоритет
  ) {}

  /**
   * Создает новый пункт чек-листа с дефолтными значениями
   */
  static createDefault(category: "mandatory" | "optional"): ChecklistItemModel {
    return new ChecklistItemModel(
      Date.now().toString(),
      "Новый пункт",
      0,
      false,
      category,
      "green"
    );
  }

  /**
   * Обновляет заголовок пункта
   */
  updateTitle(newTitle: string): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      newTitle,
      this.amount,
      this.completed,
      this.category,
      this.color
    );
  }

  /**
   * Обновляет сумму пункта
   */
  updateAmount(newAmount: number): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      newAmount,
      this.completed,
      this.category,
      this.color
    );
  }

  /**
   * Переключает состояние выполнения
   */
  toggleCompleted(): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      !this.completed,
      this.category,
      this.color
    );
  }

  /**
   * Обновляет цвет/приоритет
   */
  updateColor(newColor: "red" | "yellow" | "green"): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      this.completed,
      this.category,
      newColor
    );
  }

  /**
   * Возвращает числовой приоритет для сортировки
   */
  getSortPriority(): number {
    switch (this.color) {
      case "red":
        return 3; // Высокий
      case "yellow":
        return 2; // Средний
      case "green":
        return 1; // Низкий
      default:
        return 1;
    }
  }
}
