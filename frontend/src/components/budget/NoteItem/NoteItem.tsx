import React, { useCallback, useEffect, useRef, useState } from "react";
import { NoteModel } from "../../../types/note";
import { Box } from "@mui/material";
import { publicImageSrc } from "../../../utils/publicImageSrc";
import styles from "./NoteItem.module.scss";

interface DragHandleProps {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  ref?: (element: HTMLButtonElement | null) => void;
}

const trashIconSrc = publicImageSrc("trash.png");
const trashOpenIconSrc = publicImageSrc("trash_open.png");
const dragIconSrc = publicImageSrc("drag.png");

interface NoteItemProps {
  note: NoteModel;
  isEditing: boolean;
  onUpdate: (note: NoteModel) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: DragHandleProps;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete,
  dragHandleProps,
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
      {isEditing && dragHandleProps && (
        <button
          ref={dragHandleProps.ref}
          type="button"
          className={styles.dragHandle}
          title="Перетащить заметку"
          {...(dragHandleProps.attributes ?? {})}
          {...(dragHandleProps.listeners ?? {})}
        >
          <img
            src={dragIconSrc}
            alt=""
            aria-hidden="true"
            className={styles.dragHandleIcon}
          />
        </button>
      )}

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
            <img
              src={trashIconSrc}
              alt=""
              aria-hidden="true"
              className={`${styles.deleteIcon} ${styles.deleteIconClosed}`}
            />
            <img
              src={trashOpenIconSrc}
              alt=""
              aria-hidden="true"
              className={`${styles.deleteIcon} ${styles.deleteIconOpen}`}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NoteItem;
