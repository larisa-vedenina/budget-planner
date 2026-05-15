export type NoteType = "ai" | "user";

export class NoteModel {
  constructor(
    public id: string,
    public content: string,
    public type: NoteType,
    public createdAt: Date = new Date(),
  ) {}

  static createUserNote(): NoteModel {
    return new NoteModel(
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "Новая заметка...",
      "user",
      new Date(),
    );
  }

  static createAINote(content: string): NoteModel {
    return new NoteModel(
      `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      "ai",
      new Date(),
    );
  }

  updateContent(newContent: string): NoteModel {
    return new NoteModel(this.id, newContent, this.type, this.createdAt);
  }

  getSignature(): string {
    return this.type === "ai" ? "ии-заметка" : "моя заметка";
  }
}
