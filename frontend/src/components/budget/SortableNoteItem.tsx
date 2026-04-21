import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteModel } from "../../types/note";
import NoteItem from "./NoteItem/NoteItem";
import { Box } from "@mui/material"; // Импортируем Box из MUI

interface SortableNoteItemProps {
  note: NoteModel;
  isEditing: boolean;
  onUpdate: (note: NoteModel) => void;
  onDelete: (id: string) => void;
}

export const SortableNoteItem: React.FC<SortableNoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: {
      type: "note",
      note,
      area: "notes",
    },
    disabled: !isEditing,
  });

  const style = {
    width: "100%",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditing ? "grab" : "default",
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <NoteItem
        note={note}
        isEditing={isEditing}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </Box>
  );
};
