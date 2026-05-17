export type ChecklistCategory = "required" | "desired";
export type PriorityColor = "default" | "priority";
export type DragState = "idle" | "dragging" | "hover";
export type ChecklistItemBadge = "debt" | "goal";

export interface IChecklistItem {
  id: string;
  title: string;
  amount: number;
  category: ChecklistCategory;
  completed: boolean;
  priority: PriorityColor;
  completedAt?: Date;
  dragState?: DragState;
  createdAt: Date;
  badge?: ChecklistItemBadge;
}

export class ChecklistItemModel implements IChecklistItem {
  constructor(
    public id: string,
    public title: string,
    public amount: number,
    public completed: boolean,
    public category: ChecklistCategory,
    public priority: PriorityColor = "default",
    public completedAt?: Date,
    public dragState: DragState = "idle",
    public createdAt: Date = new Date(),
    public badge?: ChecklistItemBadge,
  ) {}

  static createDefault(category: ChecklistCategory): ChecklistItemModel {
    return new ChecklistItemModel(
      `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "На что потратишь?",
      0,
      false,
      category,
      "default",
      undefined,
      "idle",
      new Date(),
    );
  }

  updateTitle(newTitle: string): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      newTitle,
      this.amount,
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      this.dragState,
      this.createdAt,
      this.badge,
    );
  }

  updateAmount(newAmount: number): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      Math.max(0, newAmount),
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      this.dragState,
      this.createdAt,
      this.badge,
    );
  }

  toggleCompleted(): ChecklistItemModel {
    const nextCompleted = !this.completed;

    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      nextCompleted,
      this.category,
      this.priority,
      nextCompleted ? new Date() : undefined,
      this.dragState,
      this.createdAt,
      this.badge,
    );
  }

  togglePriority(): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      this.completed,
      this.category,
      this.priority === "priority" ? "default" : "priority",
      this.completedAt,
      this.dragState,
      this.createdAt,
      this.badge,
    );
  }
}
