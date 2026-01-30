import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { NoteModel } from "../../../types/note";
import {
  CellColor,
  getContrastTextColor,
  calculateActiveExpenses,
} from "../../../types/budget";
import ColorPickerButton from "./ColorPickerButton";
import ChecklistItem from "../ChecklistItem/ChecklistItem";
import NoteItem from "../NoteItem/NoteItem";
import { SortableChecklistItem } from "../SortableChecklistItem";
import { SortableNoteItem } from "../SortableNoteItem";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface BudgetCardProps {
  amount?: number;
  items: ChecklistItemModel[] | NoteModel[];
  backgroundColor: CellColor;
  category: "required" | "desired" | "notes";
  isEditMode: boolean;
  isNotesColumn?: boolean;
  cellTitle: string;
  onItemUpdate?: (item: ChecklistItemModel) => void;
  onItemDelete?: (id: string) => void;
  onItemToggle?: (id: string) => void;
  onNoteUpdate?: (note: NoteModel) => void;
  onNoteDelete?: (id: string) => void;
  onAddItem?: () => void;
  onAddNote?: () => void;
  onColorChange?: (color: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onItemDragEnd?: (itemId: string, newIndex: number) => void;
  onNoteDragEnd?: (noteId: string, newIndex: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  amount,
  items,
  backgroundColor,
  category,
  isEditMode,
  isNotesColumn = false,
  cellTitle,
  onItemUpdate = () => {},
  onItemDelete = () => {},
  onItemToggle = () => {},
  onNoteUpdate = () => {},
  onNoteDelete = () => {},
  onAddItem = () => {},
  onAddNote = () => {},
  onColorChange = () => {},
  onTitleChange = () => {},
  onItemDragEnd = () => {},
  onNoteDragEnd = () => {},
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(cellTitle);
  const [localItems, setLocalItems] = useState<
    ChecklistItemModel[] | NoteModel[]
  >(items);
  const [localAmount, setLocalAmount] = useState(amount || 0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const textColor = getContrastTextColor(backgroundColor);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  // Настройка сенсоров для DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Синхронизация с пропсами
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    setTempTitle(cellTitle);
  }, [cellTitle]);

  useEffect(() => {
    if (amount !== undefined) {
      setLocalAmount(amount);
    }
  }, [amount]);

  // РАЗДЕЛЯЕМ ПУНКТЫ НА АКТИВНЫЕ И ВЫПОЛНЕННЫЕ
  const { activeItems, completedItems } = useMemo(() => {
    if (isNotesColumn) {
      return {
        activeItems: localItems as NoteModel[],
        completedItems: [],
      };
    }

    const checklistItems = localItems as ChecklistItemModel[];

    // Активные (не выполненные) пункты
    const active = checklistItems.filter((item) => !item.completed);

    // Выполненные пункты
    const completed = checklistItems.filter((item) => item.completed);

    // Сортируем выполненные: самые свежие сверху
    const sortedCompleted = [...completed].sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime(),
    );

    return {
      activeItems: active,
      completedItems: sortedCompleted,
    };
  }, [localItems, isNotesColumn]);

  // ВИДИМЫЕ ВЫПОЛНЕННЫЕ ПУНКТЫ (первые 2)
  const visibleCompletedItems = useMemo(() => {
    if (isNotesColumn || !isEditMode) return [];
    return (completedItems as ChecklistItemModel[]).slice(0, 2);
  }, [completedItems, isNotesColumn, isEditMode]);

  // СКРЫТЫЕ ВЫПОЛНЕННЫЕ ПУНКТЫ (остальные для скролла)
  const hiddenCompletedItems = useMemo(() => {
    if (isNotesColumn || !isEditMode) return [];
    return (completedItems as ChecklistItemModel[]).slice(2);
  }, [completedItems, isNotesColumn, isEditMode]);

  // Рассчет суммы активных расходов
  useEffect(() => {
    if (!isNotesColumn) {
      const activeAmount = (activeItems as ChecklistItemModel[]).reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      setLocalAmount(activeAmount);
    }
  }, [activeItems, isNotesColumn]);

  // Получаем ID элементов для SortableContext (только активные)
  const activeItemIds = useMemo(() => {
    if (isNotesColumn) {
      return (activeItems as NoteModel[]).map((note) => note.id);
    }
    return (activeItems as ChecklistItemModel[]).map((item) => item.id);
  }, [activeItems, isNotesColumn]);

  // Начало перетаскивания
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  // Завершение перетаскивания
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeItemIds.findIndex((id) => id === active.id);
      const newIndex = activeItemIds.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        if (isNotesColumn) {
          onNoteDragEnd(active.id as string, newIndex);
        } else {
          onItemDragEnd(active.id as string, newIndex);
        }
      }
    }

    setActiveId(null);
  };

  // Получаем активный элемент для DragOverlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;

    if (isNotesColumn) {
      return (
        (activeItems as NoteModel[]).find((note) => note.id === activeId) ||
        null
      );
    } else {
      return (
        (activeItems as ChecklistItemModel[]).find(
          (item) => item.id === activeId,
        ) || null
      );
    }
  }, [activeId, activeItems, isNotesColumn]);

  // Обработчики
  const handleItemUpdate = (updatedItem: ChecklistItemModel) => {
    onItemUpdate(updatedItem);
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim() && tempTitle !== cellTitle) {
      onTitleChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") {
      setTempTitle(cellTitle);
      setIsEditingTitle(false);
    }
  };

  // Фокус на инпут при начале редактирования
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Клик вне поля ввода
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleInputRef.current &&
        !titleInputRef.current.contains(event.target as Node)
      ) {
        handleTitleSave();
      }
    };

    if (isEditingTitle) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingTitle, tempTitle, cellTitle]);

  return (
    <Box
      sx={{
        backgroundColor,
        borderRadius: "10px",
        padding: "20px",
        minHeight: "350px",
        height: "100%",
        boxShadow: "-2px 2px 1px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Заголовок и сумма */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexShrink: 0,
        }}
      >
        {/* Редактируемый заголовок */}
        <Box sx={{ flex: 1 }}>
          {isEditMode && isEditingTitle ? (
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
                fontFamily: '"Roboto Condensed", sans-serif',
                color: textColor,
                backgroundColor: "transparent",
                fontWeight: "normal",
              }}
            />
          ) : (
            <Typography
              onClick={() => isEditMode && setIsEditingTitle(true)}
              sx={{
                fontSize: "24px",
                fontWeight: "normal",
                color: textColor,
                cursor: isEditMode ? "text" : "default",
                fontFamily: '"Roboto Condensed", sans-serif',
              }}
            >
              {cellTitle.toUpperCase()}
            </Typography>
          )}
        </Box>

        {/* Сумма активных расходов */}
        {!isNotesColumn && localAmount !== undefined && (
          <Box sx={{ minWidth: "120px", textAlign: "right" }}>
            <Typography
              sx={{
                fontSize: "24px",
                fontWeight: "normal",
                color: textColor,
                fontFamily: '"Roboto Condensed", sans-serif',
              }}
            >
              {localAmount.toLocaleString("ru-RU")}₽
            </Typography>
          </Box>
        )}
      </Box>

      {/* ОСНОВНОЙ КОНТЕНТ - БЕЗ СКРОЛЛА ДЛЯ АКТИВНЫХ ПУНКТОВ */}
      <Box
        sx={{
          flex: 1,
          overflowY: "hidden",
          paddingRight: "5px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isNotesColumn ? (
          // ЗАМЕТКИ
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeItemIds}
              strategy={verticalListSortingStrategy}
            >
              {/* Активные заметки */}
              {(activeItems as NoteModel[]).map((note) => (
                <SortableNoteItem
                  key={note.id}
                  note={note}
                  isEditing={isEditMode}
                  onUpdate={onNoteUpdate}
                  onDelete={onNoteDelete}
                />
              ))}

              {/* КНОПКА ДОБАВЛЕНИЯ ЗАМЕТКИ В РЕЖИМЕ РЕДАКТИРОВАНИЯ */}
              {isEditMode && (
                <Box
                  onClick={onAddNote}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#FFFFFF",
                    color: "#101010",
                    border: "1px solid #D9D9D9",
                    borderRadius: "10px",
                    padding: "15px",
                    marginBottom: "10px",
                    fontSize: "24px",
                    cursor: "pointer",
                    fontFamily: '"Roboto Condensed", sans-serif',
                    position: "relative",
                    boxShadow: "1px 1px 0.5px rgba(0, 0, 0, 0.25)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "2px 2px 2px rgba(0, 0, 0, 0.3)",
                    },
                  }}
                >
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <span style={{ fontSize: "24px" }}>＋</span>
                  </Box>
                </Box>
              )}

              {/* Сообщение если нет заметок */}
              {(activeItems as NoteModel[]).length === 0 && !isEditMode && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100px",
                    color: textColor,
                    opacity: 0.7,
                    fontFamily: '"Roboto Condensed", sans-serif',
                  }}
                >
                  <Typography>Пока нет заметок</Typography>
                </Box>
              )}
            </SortableContext>

            <DragOverlay>
              {activeItem && isNotesColumn && (
                <div
                  style={{
                    opacity: 0.8,
                    transform: "rotate(5deg)",
                    backgroundColor: "#FFFFFF",
                    border: "2px solid #69B5D3",
                    borderRadius: "10px",
                    padding: "15px",
                    boxShadow: "-4px 4px 8px rgba(0, 0, 0, 0.3)",
                    maxWidth: "300px",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    {(activeItem as NoteModel).content.substring(0, 50)}...
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "5px",
                    }}
                  >
                    {(activeItem as NoteModel).getSignature()}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          // ПУНКТЫ РАСХОДОВ
          <>
            <Box sx={{ flex: "0 0 auto", overflowY: "visible" }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeItemIds}
                  strategy={verticalListSortingStrategy}
                >
                  {/* АКТИВНЫЕ ПУНКТЫ (не выполненные) */}
                  {(activeItems as ChecklistItemModel[]).map((item) => (
                    <SortableChecklistItem
                      key={item.id}
                      item={item}
                      area={category as "required" | "desired"}
                      index={activeItemIds.indexOf(item.id)}
                      isEditing={isEditMode}
                      onUpdate={handleItemUpdate}
                      onDelete={(id) => onItemDelete(id)}
                      onToggle={(id) => onItemToggle(id)}
                      backgroundColor={backgroundColor}
                    />
                  ))}

                  {/* КНОПКА ДОБАВЛЕНИЯ В РЕЖИМЕ РЕДАКТИРОВАНИЯ */}
                  {isEditMode && (
                    <Box
                      onClick={onAddItem}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#FFFFFF",
                        color: "#101010",
                        border: "1px solid #D9D9D9",
                        borderRadius: "10px",
                        padding: "15px",
                        marginBottom: "10px",
                        fontSize: "24px",
                        cursor: "pointer",
                        fontFamily: '"Roboto Condensed", sans-serif',
                        position: "relative",
                        boxShadow: "1px 1px 0.5px rgba(0, 0, 0, 0.25)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          boxShadow: "2px 2px 2px rgba(0, 0, 0, 0.3)",
                        },
                      }}
                    >
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <span style={{ fontSize: "24px" }}>＋</span>
                      </Box>
                    </Box>
                  )}
                </SortableContext>

                <DragOverlay>
                  {activeItem && !isNotesColumn && (
                    <div
                      style={{
                        opacity: 0.8,
                        transform: "rotate(5deg)",
                        backgroundColor: "#FFFFFF",
                        border: "2px solid #69B5D3",
                        borderRadius: "10px",
                        padding: "15px",
                        boxShadow: "-4px 4px 8px rgba(0, 0, 0, 0.3)",
                        maxWidth: "300px",
                        pointerEvents: "none",
                      }}
                    >
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {(activeItem as ChecklistItemModel).title}
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          color: "#666",
                          marginTop: "5px",
                        }}
                      >
                        {(
                          activeItem as ChecklistItemModel
                        ).amount.toLocaleString("ru-RU")}
                        ₽
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </Box>

            {/* ВЫПОЛНЕННЫЕ ПУНКТЫ (только в режиме редактирования) */}
            {isEditMode && (
              <Box
                sx={{
                  flex: "0 0 auto",
                  minHeight: "0",
                  borderTop:
                    completedItems.length > 0
                      ? "1px solid rgba(255, 255, 255, 0.3)"
                      : "none",
                  marginTop: completedItems.length > 0 ? "10px" : "0",
                  paddingTop: completedItems.length > 0 ? "10px" : "0",
                  position: "relative",
                  // Динамическая высота: показываем максимум 2 выполненных пункта
                  height: completedItems.length > 0 ? "auto" : "0",
                  maxHeight:
                    completedItems.length > 2 ? "calc(2 * 85px)" : "none",
                  overflowY: completedItems.length > 2 ? "scroll" : "hidden",
                }}
              >
                {/* ВСЕ ВЫПОЛНЕННЫЕ ПУНКТЫ */}
                {completedItems.map((item) => (
                  <ChecklistItem
                    key={`completed-${item.id}`}
                    item={item}
                    isEditing={isEditMode}
                    onUpdate={handleItemUpdate}
                    onDelete={(id) => onItemDelete(id)}
                    onToggle={(id) => onItemToggle(id)}
                    backgroundColor={backgroundColor}
                  />
                ))}

                {/* Сообщение если нет выполненных пунктов */}
                {completedItems.length === 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "60px",
                      color: textColor,
                      opacity: 0.5,
                      fontFamily: '"Roboto Condensed", sans-serif',
                      fontSize: "16px",
                    }}
                  >
                    <Typography>Нет выполненных пунктов</Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Кнопка выбора цвета */}
      {isEditMode && (
        <ColorPickerButton
          currentColor={backgroundColor}
          onColorChange={handleColorChange}
        />
      )}
    </Box>
  );
};

export default BudgetCard;
