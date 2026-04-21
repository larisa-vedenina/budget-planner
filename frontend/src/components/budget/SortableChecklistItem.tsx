import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChecklistItemModel } from "../../types/checklist-item";
import ChecklistItem from "./ChecklistItem/ChecklistItem";
import { Box } from "@mui/material"; // Импортируем Box из MUI

interface SortableChecklistItemProps {
  item: ChecklistItemModel;
  area: "required" | "desired";
  index: number;
  isEditing: boolean;
  onUpdate: (item: ChecklistItemModel) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  backgroundColor?: string;
}

export const SortableChecklistItem: React.FC<SortableChecklistItemProps> = ({
  item,
  area,
  index,
  isEditing,
  onUpdate,
  onDelete,
  onToggle,
  backgroundColor = "#FFFFFF",
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "checklist-item",
      item,
      area,
      index,
    },
    disabled: !isEditing || item.completed,
  });

  const style = {
    width: "100%",
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition:
      transition ??
      "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    cursor: "default",
    zIndex: transform ? 1 : "auto",
    willChange: transform ? "transform" : "auto",
    boxShadow: isDragging ? "none" : undefined,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <ChecklistItem
        item={item}
        isEditing={isEditing}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggle={onToggle}
        backgroundColor={backgroundColor}
        dragHandleProps={
          isEditing && !item.completed
            ? {
                ref: setActivatorNodeRef,
                attributes,
                listeners,
              }
            : undefined
        }
      />
    </Box>
  );
};
