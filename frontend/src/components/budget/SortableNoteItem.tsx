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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditing ? "grab" : "default",
    marginBottom: "10px",
  };

  return (
    <Box // Используем Box вместо div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        "&:hover": {
          "& .note-item": {
            boxShadow:
              isEditing && !isDragging
                ? "-1px 1px 0.5px rgba(0, 0, 0, 0.25)"
                : "none",
          },
        },
      }}
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
