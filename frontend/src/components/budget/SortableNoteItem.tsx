import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteModel } from "../../types/note";
import NoteItem from "./NoteItem/NoteItem";
import { Box } from "@mui/material";

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
    setActivatorNodeRef,
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
      <NoteItem
        note={note}
        isEditing={isEditing}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={
          isEditing
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
