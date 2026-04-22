import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { pxToRem } from "../../../styles/units";
import styles from "./ChecklistItem.module.scss";

interface DragHandleProps {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  ref?: (element: HTMLButtonElement | null) => void;
}

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

  // Определяем цвет обводки для приоритетного пункта
  const getPriorityBorderColor = (): string => {
    const darkCellColors = ["#D87B7B", "#507B5D", "#69B5D3"];
    return darkCellColors.includes(backgroundColor) ? "#FFDFDF" : "#D87B7B";
  };

  // Если пункт выполнен, НЕ показываем звездочку в режиме редактирования
  const shouldShowPriorityStar = () => {
    return isEditing && !item.completed;
  };

  // Обработчик сохранения названия
  const handleTitleSave = useCallback(() => {
    const nextTitle = tempTitle.trim();

    if (nextTitle && nextTitle !== item.title) {
      setTempTitle(nextTitle);
      onUpdate(item.updateTitle(nextTitle));
    }
    setIsEditingTitle(false);
  }, [item, onUpdate, tempTitle]);

  // Обработчик сохранения суммы
  const handleAmountSave = useCallback(() => {
    const amount = parseFloat(tempAmount);
    if (!isNaN(amount) && amount >= 0 && amount !== item.amount) {
      setTempAmount(amount.toString());
      onUpdate(item.updateAmount(amount));
    }
    setIsEditingAmount(false);
  }, [item, onUpdate, tempAmount]);

  // Обработчик нажатия клавиш
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

  // Обработчик клика вне поля ввода
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

  // Фокус на инпут при начале редактирования
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [isEditingTitle, isEditingAmount]);

  // Синхронизируем локальное отображение после внешних обновлений, но не мешаем живому редактированию.
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
      {/* Левая часть: ручка для drag и управление пунктом */}
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
            <DragIndicatorIcon className={styles.dragHandleIcon} />
          </button>
        )}

        {shouldShowPriorityStar() ? (
          // В режиме редактирования для невыполненных - звездочка приоритета
          <div
            onClick={togglePriority}
            className={styles.iconButton}
            title={
              item.priority === "priority"
                ? "Убрать приоритет"
                : "Сделать приоритетным"
            }
          >
            {item.priority === "priority" ? (
              <StarIcon className={styles.starActive} />
            ) : (
              <StarBorderIcon className={styles.starInactive} />
            )}
          </div>
        ) : (
          // Для выполненных или в режиме просмотра - чекбокс
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

      {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: название пункта - только для редактирования текста */}
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

      {/* ПРАВАЯ ЧАСТЬ: сумма - только для редактирования */}
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

      {/* Кнопка удаления (только в режиме редактирования) */}
      {isEditing && (
        <Box className={styles.deleteWrap}>
          <div
            onClick={() => onDelete(item.id)}
            className={styles.deleteButton}
            title="Удалить пункт"
          >
            <DeleteIcon className={styles.deleteIcon} />
          </div>
        </Box>
      )}
    </Box>
  );
};

export default ChecklistItem;
