/**
 * заметки
 */
export class NoteModel {
  constructor(
    public id: string,
    public content: string,
    public type: "ai" | "user",
    public createdAt: Date = new Date()
  ) {}

  /**
   * Создает новую заметку пользователя
   */
  static createUserNote(): NoteModel {
    return new NoteModel(
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      "Новая заметка...",
      "user"
    );
  }

  /**
   * Создает AI заметку
   */
  static createAINote(content: string): NoteModel {
    return new NoteModel(
      `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      "ai"
    );
  }

  /**
   * Обновляет содержимое заметки
   */
  updateContent(newContent: string): NoteModel {
    return new NoteModel(this.id, newContent, this.type, this.createdAt);
  }

  /**
   * Проверяет, является ли заметка AI-советом
   */
  isAIAdvice(): boolean {
    return this.type === "ai";
  }
}
