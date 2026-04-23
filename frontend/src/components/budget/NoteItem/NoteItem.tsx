import React, { useCallback, useEffect, useRef, useState } from "react";
import { NoteModel } from "../../../types/note";
import { Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import styles from "./NoteItem.module.scss";

interface NoteItemProps {
  note: NoteModel;
  isEditing: boolean;
  onUpdate: (note: NoteModel) => void;
  onDelete: (id: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete,
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSave = useCallback(() => {
    if (tempContent.trim() && tempContent !== note.content) {
      onUpdate(note.updateContent(tempContent.trim()));
    }
    setIsEditingContent(false);
  }, [note, onUpdate, tempContent]);
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setTempContent(note.content);
      setIsEditingContent(false);
    }
  };
  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingContent]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        handleSave();
      }
    };

    if (isEditingContent) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleSave, isEditingContent]);

  return (
    <Box
      className={`note-item ${styles.noteItem} ${
        isEditing ? styles.noteItemEditable : ""
      }`}
    >
      {isEditing && isEditingContent ? (
        <textarea
          ref={textareaRef}
          value={tempContent}
          onChange={(e) => setTempContent(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className={styles.textarea}
          placeholder="Напиши заметку..."
        />
      ) : (
        <Box
          onClick={() => isEditing && setIsEditingContent(true)}
          className={`${styles.content} ${
            isEditing ? styles.contentEditable : ""
          }`}
        >
          <div className={styles.text}>{note.content}</div>
        </Box>
      )}


      <Box className={styles.signature}>
        <div className={styles.signatureText}>{note.getSignature()}</div>
      </Box>


      {isEditing && (
        <Box className={styles.deleteWrap}>
          <Box
            onClick={() => onDelete(note.id)}
            className={styles.deleteButton}
            title="Удалить заметку"
          >
            <DeleteIcon className={styles.deleteIcon} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NoteItem;
