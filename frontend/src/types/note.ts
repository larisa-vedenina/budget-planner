/**
 * Модель заметки (AI-совет или пользовательская заметка)
 */

export type NoteType = 'ai' | 'user'; // Тип заметки: AI-совет или пользовательская

export class NoteModel {
  constructor(
    public id: string, // Уникальный идентификатор
    public content: string, // Содержимое заметки
    public type: NoteType, // Тип заметки (AI/пользователь)
    public createdAt: Date = new Date() // Дата создания
  ) {}

  /**
   * Создает новую заметку пользователя
   */
  static createUserNote(): NoteModel {
    return new NoteModel(
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Уникальный ID с timestamp и random
      'Новая заметка...', // Дефолтный текст
      'user', // Тип: пользовательская
      new Date() // Текущая дата
    );
  }

  /**
   * Создает AI заметку
   */
  static createAINote(content: string): NoteModel {
    return new NoteModel(
      `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Уникальный ID для AI заметки
      content, // Переданное содержание
      'ai', // Тип: AI-совет
      new Date() // Текущая дата
    );
  }

  /**
   * Обновляет содержимое заметки
   */
  updateContent(newContent: string): NoteModel {
    return new NoteModel(
      this.id, // Сохраняем тот же ID
      newContent, // Новое содержание
      this.type, // Тип без изменений
      this.createdAt // Дата создания без изменений
    );
  }

  /**
   * Проверяет, является ли заметка AI-советом
   */
  isAIAdvice(): boolean {
    return this.type === 'ai'; // True только для AI заметок
  }

  /**
   * Возвращает подпись для заметки
   */
  getSignature(): string {
    return this.type === 'ai' ? '[AI совет]' : '[Моя заметка]'; // Текст в правом нижнем углу
  }

  /**
   * Возвращает стили для заметки с учетом режима редактирования
   */
  getNoteStyles(isDragging: boolean, isEditMode: boolean): React.CSSProperties {
    // Базовые стили, которые никогда не меняются
    const baseStyles: React.CSSProperties = {
      backgroundColor: '#FFFFFF', 
      color: '#0D0D0D', 
      border: '2px solid #D9D9D9', 
      borderRadius: '10px', 
      padding: '15px', 
      position: 'relative' as const,
    };

    // В режиме редактирования при перетаскивании (isDragging = true)
    if (isEditMode && isDragging) {
      return {
        ...baseStyles, // Базовые стили
        boxShadow: '-2px 2px 1px rgba(0, 0, 0, 0.25)', 
        transform: 'translate(-1px, 1px)', // Смещение на 1px вверх и влево
        cursor: 'grabbing', 
      };
    }

    // В режиме редактирования в обычном состоянии (можно захватить)
    if (isEditMode) {
      return {
        ...baseStyles, // Базовые стили
        cursor: 'grab', // Курсор "можно захватить" для перетаскивания
      };
    }

    // Вне режима редактирования (только просмотр)
    return {
      ...baseStyles, // Базовые стили
      cursor: 'default', // Обычный курсор
    };
  }
}