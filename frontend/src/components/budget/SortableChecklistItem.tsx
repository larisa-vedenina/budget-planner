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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditing && !item.completed ? "grab" : "default",
    marginBottom: "10px",
  };

  const itemWithDragState = isDragging
    ? item.updateDragState("dragging")
    : item.updateDragState("idle");

  return (
    <Box // Используем Box вместо div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        '&:hover': {
          '& .checklist-item': {
            boxShadow: isEditing && !item.completed && !isDragging 
              ? "-1px 1px 0.5px rgba(0, 0, 0, 0.25)" 
              : "none",
          }
        }
      }}
    >
      <ChecklistItem
        item={itemWithDragState}
        isEditing={isEditing}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggle={onToggle}
        backgroundColor={backgroundColor}
      />
    </Box>
  );
};