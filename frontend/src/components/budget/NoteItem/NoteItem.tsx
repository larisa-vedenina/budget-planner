import React, { useCallback, useEffect, useRef, useState } from "react";
import { NoteModel } from "../../../types/note";
import { Box } from "@mui/material";
import { publicImageSrc } from "../../../utils/publicImageSrc";
import { CALCULATED_BUDGET_NOTE_ID } from "../../../utils/budgetAI";
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
  backgroundColor?: string;
  dragHandleProps?: DragHandleProps;
}

const amountLimitPattern = /(\d[\d\s]* ₽)(?=\s+в\s+(?:день|неделю))/u;

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete,
  backgroundColor = "#FFFFFF",
  dragHandleProps,
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditingContentRef = useRef(isEditingContent);
  const isCalculatedBudgetNote = note.id === CALCULATED_BUDGET_NOTE_ID;
  const canEditText = isEditing && !isCalculatedBudgetNote;

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const renderNoteContent = () => {
    const displayContent = isCalculatedBudgetNote ? note.content : tempContent;

    if (!isCalculatedBudgetNote) {
      return <div className={styles.text}>{displayContent}</div>;
    }

    return (
      <div className={`${styles.text} ${styles.calculatedText}`}>
        {displayContent.split("\n").map((line, index) => {
          const separatorIndex = line.indexOf(":");
          const renderLineContent = (lineContent: string) => {
            const match = lineContent.match(amountLimitPattern);

            if (!match || match.index === undefined) {
              return lineContent;
            }

            const amount = match[0];
            const prefix = lineContent.slice(0, match.index);
            const suffix = lineContent.slice(match.index + amount.length);

            return (
              <>
                {prefix}
                <span className={styles.calculatedAmount}>{amount}</span>
                {suffix}
              </>
            );
          };

          if (separatorIndex === -1) {
            return <div key={`${line}_${index}`}>{renderLineContent(line)}</div>;
          }

          const label = line.slice(0, separatorIndex + 1);
          const value = line.slice(separatorIndex + 1);

          return (
            <div key={`${line}_${index}`} className={styles.calculatedLine}>
              <span className={styles.calculatedLabel}>{label}</span>
              <span>{renderLineContent(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSave = useCallback(() => {
    const nextContent = tempContent.trim();

    if (!nextContent) {
      setTempContent(note.content);
      setIsEditingContent(false);
      return;
    }

    setTempContent(nextContent);

    if (nextContent !== note.content) {
      onUpdate(note.updateContent(nextContent));
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
    isEditingContentRef.current = isEditingContent;
  }, [isEditingContent]);

  useEffect(() => {
    if (!isEditingContentRef.current) {
      setTempContent(note.content);
    }
  }, [note.content]);

  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      syncTextareaHeight();
    }
  }, [isEditingContent, syncTextareaHeight]);

  useEffect(() => {
    if (isEditingContent) {
      syncTextareaHeight();
    }
  }, [isEditingContent, syncTextareaHeight, tempContent]);

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
      style={
        {
          "--note-signature-color": backgroundColor,
        } as React.CSSProperties
      }
      className={`note-item ${styles.noteItem} ${
        isEditing ? styles.noteItemEditable : ""
      } ${isCalculatedBudgetNote ? styles.noteItemLocked : ""}`}
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
              draggable={false}
            />
        </button>
      )}

      {canEditText && isEditingContent ? (
        <textarea
          ref={textareaRef}
          value={tempContent}
          onChange={(e) => setTempContent(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className={styles.textarea}
          rows={1}
          placeholder="Напиши заметку..."
        />
      ) : (
        <Box
          onClick={() => canEditText && setIsEditingContent(true)}
          className={`${styles.content} ${
            canEditText ? styles.contentEditable : ""
          }`}
        >
          {renderNoteContent()}
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
