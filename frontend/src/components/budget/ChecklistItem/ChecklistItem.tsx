import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { Box } from "@mui/material";
import { pxToRem } from "../../../styles/units";
import { publicImageSrc } from "../../../utils/publicImageSrc";
import styles from "./ChecklistItem.module.scss";

interface DragHandleProps {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  ref?: (element: HTMLButtonElement | null) => void;
}

const trashIconSrc = publicImageSrc("trash.png");
const trashOpenIconSrc = publicImageSrc("trash_open.png");
const starIconSrc = publicImageSrc("star.png");
const dragIconSrc = publicImageSrc("drag.png");

interface ChecklistItemProps {
  item: ChecklistItemModel;
  isEditing: boolean;
  onUpdate: (item: ChecklistItemModel) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  backgroundColor?: string;
  dragHandleProps?: DragHandleProps;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  isEditing,
  onUpdate,
  onDelete,
  onToggle,
  backgroundColor = "#FFFFFF",
  dragHandleProps,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [tempTitle, setTempTitle] = useState(item.title);
  const [tempAmount, setTempAmount] = useState(item.amount.toString());

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const getPriorityBorderColor = (): string => {
    const darkCellColors = ["#D87B7B", "#507B5D", "#69B5D3"];
    return darkCellColors.includes(backgroundColor) ? "#FFDFDF" : "#D87B7B";
  };
  const shouldShowPriorityStar = () => {
    return isEditing && !item.completed;
  };
  const handleTitleSave = useCallback(() => {
    const nextTitle = tempTitle.trim();

    if (nextTitle && nextTitle !== item.title) {
      setTempTitle(nextTitle);
      onUpdate(item.updateTitle(nextTitle));
    }
    setIsEditingTitle(false);
  }, [item, onUpdate, tempTitle]);
  const handleAmountSave = useCallback(() => {
    const amount = parseFloat(tempAmount);
    if (!isNaN(amount) && amount >= 0 && amount !== item.amount) {
      setTempAmount(amount.toString());
      onUpdate(item.updateAmount(amount));
    }
    setIsEditingAmount(false);
  }, [item, onUpdate, tempAmount]);
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") {
      setTempTitle(item.title);
      setIsEditingTitle(false);
    }
  };

  const handleAmountKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAmountSave();
    if (e.key === "Escape") {
      setTempAmount(item.amount.toString());
      setIsEditingAmount(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleInputRef.current &&
        !titleInputRef.current.contains(event.target as Node)
      ) {
        handleTitleSave();
      }
      if (
        amountInputRef.current &&
        !amountInputRef.current.contains(event.target as Node)
      ) {
        handleAmountSave();
      }
    };

    if (isEditingTitle || isEditingAmount) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleAmountSave, handleTitleSave, isEditingAmount, isEditingTitle]);
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [isEditingTitle, isEditingAmount]);
  useEffect(() => {
    if (!isEditingTitle) {
      setTempTitle(item.title);
    }
  }, [isEditingTitle, item.title]);

  useEffect(() => {
    if (!isEditingAmount) {
      setTempAmount(item.amount.toString());
    }
  }, [isEditingAmount, item.amount]);

  const togglePriority = () => {
    onUpdate(item.togglePriority());
  };

  const containerStyle = {
    "--priority-border-color": getPriorityBorderColor(),
    "--checkbox-color": backgroundColor,
    "--completed-strike-color": backgroundColor,
    "--completed-strike-left": isEditing ? pxToRem(95) : pxToRem(54),
    "--completed-strike-right": isEditing ? pxToRem(60) : pxToRem(15),
  } as React.CSSProperties;
  const parsedAmount = Number.parseFloat(tempAmount);
  const displayAmount = Number.isFinite(parsedAmount)
    ? parsedAmount.toLocaleString("ru-RU")
    : item.amount.toLocaleString("ru-RU");

  return (
    <Box
      data-item-id={item.id}
      style={containerStyle}
      className={`checklist-item ${styles.item} ${
        isEditing ? styles.itemEditable : ""
      } ${!isEditing ? styles.itemReadonly : ""} ${
        item.completed ? styles.itemReadonlyCompleted : ""
      } ${item.priority === "priority" ? styles.itemPriority : ""} ${
        item.completed ? styles.itemCompleted : ""
      }`}
    >

      <Box
        className={`${styles.left} ${
          isEditing ? styles.leftEditing : styles.leftReadonly
        }`}
      >
        {isEditing && !item.completed && dragHandleProps && (
          <button
            ref={dragHandleProps.ref}
            type="button"
            className={styles.dragHandle}
            title="Перетащить пункт"
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

        {shouldShowPriorityStar() ? (
          <div
            onClick={togglePriority}
            className={styles.iconButton}
            title={
              item.priority === "priority"
                ? "Убрать приоритет"
                : "Сделать приоритетным"
            }
          >
            <img
              src={starIconSrc}
              alt=""
              aria-hidden="true"
              className={`${styles.starIcon} ${
                item.priority === "priority"
                  ? styles.starActive
                  : styles.starInactive
              }`}
            />
          </div>
        ) : (
          <div
            onClick={() => onToggle(item.id)}
            className={`${styles.checkbox} ${
              item.completed ? styles.checkboxCompleted : ""
            }`}
          >
            {item.completed && <div className={styles.checkboxInner} />}
          </div>
        )}
      </Box>


      <Box className={styles.content}>
        {isEditing && isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={handleTitleKeyPress}
            onBlur={handleTitleSave}
            className={styles.textInput}
            placeholder="Напиши пункт"
          />
        ) : (
          <div
            onClick={() => isEditing && setIsEditingTitle(true)}
            className={`${styles.textDisplay} ${
              isEditing ? styles.textDisplayEditable : ""
            } ${item.completed ? styles.textCompleted : ""}`}
          >
            {tempTitle}
          </div>
        )}
      </Box>


      <Box
        className={`${styles.amountWrap} ${
          isEditing ? styles.amountWrapEditing : ""
        }`}
      >
        {isEditing && isEditingAmount ? (
          <div className={styles.amountEditor}>
            <input
              ref={amountInputRef}
              type="number"
              value={tempAmount}
              onChange={(e) => setTempAmount(e.target.value)}
              onKeyDown={handleAmountKeyPress}
              className={styles.amountInput}
              min="0"
              step="100"
            />
            <span className={styles.currency}>₽</span>
          </div>
        ) : (
          <div
            onClick={() => isEditing && setIsEditingAmount(true)}
            className={`${styles.amountText} ${
              isEditing ? styles.amountTextEditable : ""
            } ${item.completed ? styles.textCompleted : ""}`}
          >
            {displayAmount}₽
          </div>
        )}
      </Box>


      {isEditing && (
        <Box className={styles.deleteWrap}>
          <div
            onClick={() => onDelete(item.id)}
            className={styles.deleteButton}
            title="Удалить пункт"
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
          </div>
        </Box>
      )}
    </Box>
  );
};

export default ChecklistItem;
