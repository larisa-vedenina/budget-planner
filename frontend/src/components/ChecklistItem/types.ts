import { ChecklistItemModel } from "../../models/ChecklistItemModel";

export interface ChecklistItemProps {
  item: ChecklistItemModel;
  isEditing: boolean;
  onUpdate: (updatedItem: ChecklistItemModel) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}
