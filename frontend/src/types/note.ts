

export type NoteType = 'ai' | 'user';

export class NoteModel {
  constructor(
    public id: string,
    public content: string,
    public type: NoteType,
    public createdAt: Date = new Date()
  ) {}


  static createUserNote(): NoteModel {
    return new NoteModel(
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      'Новая заметка...',
      'user',
      new Date()
    );
  }


  static createAINote(content: string): NoteModel {
    return new NoteModel(
      `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      'ai',
      new Date()
    );
  }


  updateContent(newContent: string): NoteModel {
    return new NoteModel(
      this.id,
      newContent,
      this.type,
      this.createdAt
    );
  }


  isAIAdvice(): boolean {
    return this.type === 'ai';
  }


  getSignature(): string {
    return this.type === 'ai' ? '[AI совет]' : '[Моя заметка]';
  }


  getNoteStyles(isDragging: boolean, isEditMode: boolean): React.CSSProperties {
    const baseStyles: React.CSSProperties = {
      backgroundColor: '#FFFFFF',
      color: '#0D0D0D',
      border: '2px solid #D9D9D9',
      borderRadius: '10px',
      padding: '15px',
      position: 'relative' as const,
    };
    if (isEditMode && isDragging) {
      return {
        ...baseStyles,
        boxShadow: '-2px 2px 1px rgba(0, 0, 0, 0.25)',
        transform: 'translate(-1px, 1px)',
        cursor: 'grabbing',
      };
    }
    if (isEditMode) {
      return {
        ...baseStyles,
        cursor: 'grab',
      };
    }
    return {
      ...baseStyles,
      cursor: 'default',
    };
  }
}