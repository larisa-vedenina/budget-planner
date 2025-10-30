/**
 * Модель заметки
 */
export class NoteModel {
  constructor(
    public id: string,
    public content: string,
    public type: 'ai' | 'user',
    public createdAt: Date = new Date()
  ) {}

  /**
   * Создает новую заметку пользователя
   */
  static createUserNote(): NoteModel {
    return new NoteModel(
      Date.now().toString(),
      'Новая заметка...',
      'user'
    );
  }

  /**
   * Создает AI заметку
   */
  static createAINote(content: string): NoteModel {
    return new NoteModel(
      Date.now().toString(),
      content,
      'ai'
    );
  }

  /**
   * Обновляет содержимое заметки
   */
  updateContent(newContent: string): NoteModel {
    return new NoteModel(
      this.id,
      newContent,
      this.type,
      this.createdAt
    );
  }

  /**
   * Проверяет, является ли заметка AI-советом
   */
  isAIAdvice(): boolean {
    return this.type === 'ai';
  }
}