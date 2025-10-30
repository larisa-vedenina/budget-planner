/**
 * Сервис для управления drag & drop операциями
 */
export class DragDropService<T extends { id: string }> {
  private draggedItem: T | null = null;
  private dragStartIndex: number = -1;

  /**
   * Начинает перетаскивание элемента
   */
  startDrag(item: T, index: number): void {
    this.draggedItem = item;
    this.dragStartIndex = index;
  }

  /**
   * Завершает перетаскивание и возвращает новые данные
   */
  endDrag(
    items: T[], 
    dropIndex: number
  ): { newItems: T[]; oldIndex: number; newIndex: number } | null {
    if (!this.draggedItem || this.dragStartIndex === -1) {
      return null;
    }

    const newItems = [...items];
    
    // Удаляем элемент из старой позиции
    newItems.splice(this.dragStartIndex, 1);
    
    // Вставляем элемент в новую позицию
    newItems.splice(dropIndex, 0, this.draggedItem);

    const result = {
      newItems,
      oldIndex: this.dragStartIndex,
      newIndex: dropIndex
    };

    this.resetDrag();
    return result;
  }

  /**
   * Сбрасывает состояние перетаскивания
   */
  resetDrag(): void {
    this.draggedItem = null;
    this.dragStartIndex = -1;
  }

  /**
   * Получает текущий перетаскиваемый элемент
   */
  getDraggedItem(): T | null {
    return this.draggedItem;
  }
}