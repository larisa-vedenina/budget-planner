import React, { useState, useRef, useEffect } from "react";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

interface ChecklistItemProps {
  item: ChecklistItemModel;
  isEditing: boolean;
  onUpdate: (item: ChecklistItemModel) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  backgroundColor?: string;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  isEditing,
  onUpdate,
  onDelete,
  onToggle,
  backgroundColor = "#FFFFFF",
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

  // Стили пункта в зависимости от состояния
  const getItemStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: item.priority === "priority" ? "#FDF7F7" : "#FFFFFF",
      color: "#101010",
      border:
        item.priority === "priority"
          ? `2px solid ${getPriorityBorderColor()}`
          : "2px solid #FFFFFF",
      borderRadius: "10px",
      padding: "15px",
      marginBottom: "10px",
      fontSize: "24px",
      transition: "all 0.2s ease",
      fontFamily: "Roboto Condensed, sans-serif",
      position: "relative",
      boxShadow: "none",
      minHeight: "80px",
    };

    return baseStyles;
  };

  // Если пункт выполнен, НЕ показываем звездочку в режиме редактирования
  const shouldShowPriorityStar = () => {
    return isEditing && !item.completed;
  };

  // Обработчик сохранения названия
  const handleTitleSave = () => {
    if (tempTitle.trim() && tempTitle !== item.title) {
      onUpdate(item.updateTitle(tempTitle.trim()));
    }
    setIsEditingTitle(false);
  };

  // Обработчик сохранения суммы
  const handleAmountSave = () => {
    const amount = parseFloat(tempAmount);
    if (!isNaN(amount) && amount >= 0 && amount !== item.amount) {
      onUpdate(item.updateAmount(amount));
    }
    setIsEditingAmount(false);
  };

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
  }, [isEditingTitle, isEditingAmount, tempTitle, tempAmount]);

  // Фокус на инпут при начале редактирования
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [isEditingTitle, isEditingAmount]);

  const togglePriority = () => {
    onUpdate(item.togglePriority());
  };

  // Стили для контейнера
  const containerStyle: React.CSSProperties = {
    ...getItemStyles(),
    boxShadow: "none",
  };

  return (
    <Box
      data-item-id={item.id}
      style={containerStyle}
      className="checklist-item"
      sx={{
        "&:hover": {
          boxShadow: isEditing ? "-1px 1px 0.5px rgba(0, 0, 0, 0.25)" : "none",
          "& .checkbox-hover-effect": {
            boxShadow: item.completed
              ? "none"
              : "-2px 2px 1px rgba(0, 0, 0, 0.25)",
            transform: item.completed ? "translate(-1px, 1px)" : "none",
          },
        },
      }}
    >
      {/* ЛЕВАЯ ЧАСТЬ: звездочка приоритета или чекбокс */}
      <Box
        sx={{
          marginRight: "12px",
          display: "flex",
          alignItems: "center",
          minWidth: "32px", // Фиксированная ширина для выравнивания
        }}
      >
        {shouldShowPriorityStar() ? (
          // В режиме редактирования для невыполненных - звездочка приоритета
          <div
            onClick={togglePriority}
            style={{
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={
              item.priority === "priority"
                ? "Убрать приоритет"
                : "Сделать приоритетным"
            }
          >
            {item.priority === "priority" ? (
              <StarIcon
                style={{
                  color: getPriorityBorderColor(),
                  fontSize: "28px",
                }}
              />
            ) : (
              <StarBorderIcon
                style={{
                  color: "#D9D9D9",
                  fontSize: "28px",
                }}
              />
            )}
          </div>
        ) : (
          // Для выполненных или в режиме просмотра - чекбокс
          <div
            onClick={() => onToggle(item.id)}
            className="checkbox-hover-effect"
            style={{
              width: "24px",
              height: "24px",
              border: item.completed ? "none" : "1px solid #D9D9D9",
              borderRadius: "5px",
              boxShadow: item.completed
                ? "none"
                : "-1px 1px 0.5px rgba(0, 0, 0, 0.25)",
              transform: item.completed ? "translate(-1px, 1px)" : "none",
              backgroundColor: item.completed ? backgroundColor : "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            {item.completed && (
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: backgroundColor,
                }}
              />
            )}
          </div>
        )}
      </Box>

      {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: название пункта - только для редактирования текста */}
      <Box
        sx={{
          flex: "1 1 auto",
          marginRight: "16px",
          minHeight: "36px",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          maxWidth: "calc(100% - 280px)",
        }}
      >
        {isEditing && isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={handleTitleKeyPress}
            onBlur={handleTitleSave}
            style={{
              border: "none",
              borderRadius: "5px",
              padding: "8px 12px",
              fontSize: "24px",
              width: "100%",
              fontFamily: "Roboto Condensed, sans-serif",
              color: "#101010",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="Название пункта"
          />
        ) : (
          <div
            onClick={() => isEditing && setIsEditingTitle(true)}
            style={{
              fontSize: "24px",
              fontWeight: item.priority === "priority" ? "normal" : "normal",
              color: "#101010",
              textDecoration: item.completed ? "line-through" : "none",
              cursor: isEditing ? "text" : "default",
              fontFamily: "Roboto Condensed, sans-serif",
              padding: "4px 0",
              width: "100%",
              // Уменьшаем область клика для редактирования
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {item.title}
          </div>
        )}
      </Box>

      {/* ПРАВАЯ ЧАСТЬ: сумма - только для редактирования */}
      <Box
        sx={{
          minWidth: "120px",
          textAlign: "right",
          marginRight: isEditing ? "12px" : "0",
        }}
      >
        {isEditing && isEditingAmount ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <input
              ref={amountInputRef}
              type="number"
              value={tempAmount}
              onChange={(e) => setTempAmount(e.target.value)}
              onKeyDown={handleAmountKeyPress}
              style={{
                border: "0px solid #ffffff",
                borderRadius: "5px",
                padding: "8px 12px",
                fontSize: "24px",
                width: "100px",
                textAlign: "right",
                fontFamily: "Roboto Condensed, sans-serif",
                color: "#101010",
                backgroundColor: "#FFFFFF",
              }}
              min="0"
              step="100"
            />
            <span style={{ fontSize: "24px", color: "#101010" }}>₽</span>
          </div>
        ) : (
          <div
            onClick={() => isEditing && setIsEditingAmount(true)}
            style={{
              fontSize: "24px",
              fontWeight: "normal",
              color: "#101010",
              textDecoration: item.completed ? "line-through" : "none",
              cursor: isEditing ? "text" : "default",
              fontFamily: "Roboto Condensed, sans-serif",
              // Уменьшаем область клика
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {item.amount.toLocaleString("ru-RU")}₽
          </div>
        )}
      </Box>

      {/* Кнопка удаления (только в режиме редактирования) */}
      {isEditing && (
        <Box
          sx={{
            marginLeft: "8px",
            minWidth: "32px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => onDelete(item.id)}
            style={{
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Удалить пункт"
          >
            <DeleteIcon
              style={{
                color: "#D87B7B",
                fontSize: "28px",
                transition: "all 0.2s ease",
              }}
            />
          </div>
        </Box>
      )}
    </Box>
  );
};

export default ChecklistItem;
