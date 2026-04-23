

export type ChecklistCategory = "required" | "desired";
export type PriorityColor = "default" | "priority";
export type DragState = "idle" | "dragging" | "hover";

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
    public createdAt: Date = new Date()
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
      new Date()
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
      this.createdAt
    );
  }


  updateAmount(newAmount: number): ChecklistItemModel {
    const validatedAmount = Math.max(0, newAmount);
    return new ChecklistItemModel(
      this.id,
      this.title,
      validatedAmount,
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      this.dragState,
      this.createdAt
    );
  }


  toggleCompleted(): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      !this.completed,
      this.category,
      this.priority,
      !this.completed ? new Date() : undefined,
      this.dragState,
      this.createdAt
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
      this.createdAt
    );
  }


  updateDragState(newState: DragState): ChecklistItemModel {
    return new ChecklistItemModel(
      this.id,
      this.title,
      this.amount,
      this.completed,
      this.category,
      this.priority,
      this.completedAt,
      newState,
      this.createdAt
    );
  }


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
    if (this.priority === "priority") {
      styles.border = "2px solid #D87B7B";
    } else {
      styles.border = "2px solid #FFFFFF";
    }
    if (this.dragState === "hover" || this.dragState === "dragging") {
      styles.boxShadow = "-2px 2px 1px rgba(0, 0, 0, 0.25)";
      styles.transform = "translate(-1px, 1px)";
    }
    if (this.dragState === "dragging") {
      styles.cursor = "grabbing";
    } else if (this.dragState === "hover") {
      styles.cursor = "grab";
    }

    return styles;
  }


  getSortOrder(): number {
    return this.priority === "priority"
      ? 1
      : 0 + 1 / (this.createdAt.getTime() || 1);
  }
}
