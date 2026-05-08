import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { NoteModel } from "../../../types/note";
import { CellColor, getContrastTextColor } from "../../../types/budget";
import { getSurfaceShadowVariable } from "../../../styles/theme";
import ColorPickerButton from "./ColorPickerButton";
import ChecklistItem from "../ChecklistItem/ChecklistItem";
import { SortableChecklistItem } from "../SortableChecklistItem";
import { SortableNoteItem } from "../SortableNoteItem";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import styles from "./BudgetCard.module.scss";

const COMPLETED_ITEM_HIDE_DELAY_MS = 2000;

const formatCardTitle = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "";
  }

  const lowerCasedValue = normalizedValue.toLocaleLowerCase("ru-RU");
  return (
    lowerCasedValue.charAt(0).toLocaleUpperCase("ru-RU") +
    lowerCasedValue.slice(1)
  );
};

const moveInArray = <T,>(items: T[], oldIndex: number, newIndex: number) => {
  const updatedItems = [...items];
  const [movedItem] = updatedItems.splice(oldIndex, 1);

  if (!movedItem) {
    return items;
  }

  updatedItems.splice(newIndex, 0, movedItem);
  return updatedItems;
};

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
  onDelayedCompletedCountChange?: (count: number) => void;
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
  onDelayedCompletedCountChange = () => {},
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(() => formatCardTitle(cellTitle));
  const [localItems, setLocalItems] = useState<
    ChecklistItemModel[] | NoteModel[]
  >(items);
  const [localAmount, setLocalAmount] = useState(amount || 0);
  const [delayedCompletedIds, setDelayedCompletedIds] = useState<string[]>([]);

  const textColor = getContrastTextColor(backgroundColor);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const delayedHideTimeoutsRef = React.useRef<Record<string, number>>({});
  const previousCompletedIdsRef = React.useRef<Set<string>>(new Set());
  const isFirstCompletedSyncRef = React.useRef(true);

  const clearDelayedCompletionTimeouts = useCallback(() => {
    Object.values(delayedHideTimeoutsRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    delayedHideTimeoutsRef.current = {};
  }, []);

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
    if (isNotesColumn) {
      setLocalItems(items);
      return;
    }

    setLocalItems((previousItems) => {
      if (delayedCompletedIds.length === 0) {
        return items;
      }

      const incomingItems = items as ChecklistItemModel[];
      const previousChecklistItems = previousItems as ChecklistItemModel[];
      const incomingById = new Map(
        incomingItems.map((item) => [item.id, item] as const),
      );

      const preservedOrderItems = previousChecklistItems
        .map((item) => incomingById.get(item.id))
        .filter(
          (item): item is ChecklistItemModel => item !== undefined,
        );

      const remainingItems = incomingItems.filter(
        (item) => !previousChecklistItems.some((prevItem) => prevItem.id === item.id),
      );

      return [...preservedOrderItems, ...remainingItems];
    });
  }, [delayedCompletedIds.length, isNotesColumn, items]);

  useEffect(() => {
    setTempTitle(formatCardTitle(cellTitle));
  }, [cellTitle]);

  useEffect(() => {
    if (amount !== undefined) {
      setLocalAmount(amount);
    }
  }, [amount]);

  // После отметки чекбокса оставляем пункт на месте еще на пару секунд.
  useEffect(() => {
    if (isNotesColumn) {
      clearDelayedCompletionTimeouts();
      setDelayedCompletedIds([]);
      previousCompletedIdsRef.current = new Set();
      isFirstCompletedSyncRef.current = true;
      return;
    }

    const checklistItems = items as ChecklistItemModel[];
    const completedIds = new Set(
      checklistItems
        .filter((item) => item.completed)
        .map((item) => item.id),
    );

    if (isEditMode) {
      clearDelayedCompletionTimeouts();
      setDelayedCompletedIds([]);
      previousCompletedIdsRef.current = completedIds;
      isFirstCompletedSyncRef.current = false;
      return;
    }

    if (isFirstCompletedSyncRef.current) {
      previousCompletedIdsRef.current = completedIds;
      isFirstCompletedSyncRef.current = false;
      return;
    }

    const newlyCompletedIds = Array.from(completedIds).filter(
      (id) => !previousCompletedIdsRef.current.has(id),
    );

    if (newlyCompletedIds.length > 0) {
      setDelayedCompletedIds((currentIds) =>
        Array.from(new Set([...currentIds, ...newlyCompletedIds])),
      );
    }

    newlyCompletedIds.forEach((id) => {
      if (delayedHideTimeoutsRef.current[id]) {
        window.clearTimeout(delayedHideTimeoutsRef.current[id]);
      }

      delayedHideTimeoutsRef.current[id] = window.setTimeout(() => {
        setDelayedCompletedIds((currentIds) =>
          currentIds.filter((currentId) => currentId !== id),
        );
        delete delayedHideTimeoutsRef.current[id];
      }, COMPLETED_ITEM_HIDE_DELAY_MS);
    });

    Object.keys(delayedHideTimeoutsRef.current).forEach((id) => {
      if (!completedIds.has(id)) {
        window.clearTimeout(delayedHideTimeoutsRef.current[id]);
        delete delayedHideTimeoutsRef.current[id];
      }
    });

    setDelayedCompletedIds((currentIds) =>
      currentIds.filter((id) => completedIds.has(id)),
    );

    previousCompletedIdsRef.current = completedIds;
  }, [clearDelayedCompletionTimeouts, isEditMode, items, isNotesColumn]);

  useEffect(
    () => () => {
      clearDelayedCompletionTimeouts();
    },
    [clearDelayedCompletionTimeouts],
  );

  useEffect(() => {
    if (isNotesColumn || isEditMode) {
      onDelayedCompletedCountChange(0);
      return;
    }

    onDelayedCompletedCountChange(delayedCompletedIds.length);
  }, [
    delayedCompletedIds.length,
    isEditMode,
    isNotesColumn,
    onDelayedCompletedCountChange,
  ]);

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
    const active = checklistItems.filter(
      (item) => !item.completed || delayedCompletedIds.includes(item.id),
    );

    // Выполненные пункты
    const completed = checklistItems.filter(
      (item) => item.completed && !delayedCompletedIds.includes(item.id),
    );

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
  }, [delayedCompletedIds, isNotesColumn, localItems]);

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

  // Завершение перетаскивания
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeItemIds.findIndex((id) => id === active.id);
      const newIndex = activeItemIds.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        if (isNotesColumn) {
          setLocalItems((previousItems) =>
            moveInArray(previousItems as NoteModel[], oldIndex, newIndex),
          );
          onNoteDragEnd(active.id as string, newIndex);
        } else {
          setLocalItems((previousItems) => {
            const checklistItems = previousItems as ChecklistItemModel[];
            const activeChecklistItems = checklistItems.filter(
              (item) => !item.completed,
            );
            const completedChecklistItems = checklistItems.filter(
              (item) => item.completed,
            );

            return [
              ...moveInArray(activeChecklistItems, oldIndex, newIndex),
              ...completedChecklistItems,
            ];
          });
          onItemDragEnd(active.id as string, newIndex);
        }
      }
    }
  };

  // Обработчики
  const handleItemUpdate = (updatedItem: ChecklistItemModel) => {
    onItemUpdate(updatedItem);
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
  };

  const handleItemToggle = useCallback(
    (id: string) => {
      if (isNotesColumn || isEditMode) {
        onItemToggle(id);
        return;
      }

      const checklistItems = localItems as ChecklistItemModel[];
      const targetItem =
        checklistItems.find((item) => item.id === id) ??
        (items as ChecklistItemModel[]).find((item) => item.id === id);

      if (targetItem && !targetItem.completed && !delayedCompletedIds.includes(id)) {
        const nextDelayedIds = [...delayedCompletedIds, id];
        setDelayedCompletedIds(nextDelayedIds);
        onDelayedCompletedCountChange(nextDelayedIds.length);
      }

      if (targetItem?.completed && delayedCompletedIds.includes(id)) {
        const nextDelayedIds = delayedCompletedIds.filter(
          (delayedId) => delayedId !== id,
        );
        setDelayedCompletedIds(nextDelayedIds);
        onDelayedCompletedCountChange(nextDelayedIds.length);
      }

      onItemToggle(id);
    },
    [
      delayedCompletedIds,
      isEditMode,
      isNotesColumn,
      items,
      localItems,
      onDelayedCompletedCountChange,
      onItemToggle,
    ],
  );

  const handleTitleSave = useCallback(() => {
    const normalizedTitle = formatCardTitle(tempTitle);

    if (
      normalizedTitle &&
      normalizedTitle !== formatCardTitle(cellTitle)
    ) {
      onTitleChange(normalizedTitle);
    }
    setIsEditingTitle(false);
  }, [cellTitle, onTitleChange, tempTitle]);

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") {
      setTempTitle(formatCardTitle(cellTitle));
      setIsEditingTitle(false);
    }
  };

  // Фокус на инпут при начале редактирования
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
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
  }, [cellTitle, handleTitleSave, isEditingTitle, tempTitle]);

  return (
    <Box
      className={`${styles.card} ${isNotesColumn ? styles.notesCard : ""}`}
      style={
        {
          "--budget-card-bg": backgroundColor,
          "--budget-card-text": textColor,
          "--budget-card-shadow": getSurfaceShadowVariable(backgroundColor),
          "--budget-card-scrollbar": backgroundColor,
        } as React.CSSProperties
      }
    >
      {/* Заголовок и сумма */}
      <Box className={styles.header}>
        {/* Редактируемый заголовок */}
        <Box className={styles.titleWrap}>
          {isEditMode && isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={handleTitleKeyPress}
              onBlur={handleTitleSave}
              className={styles.titleInput}
            />
          ) : (
            <Typography
              onClick={() => isEditMode && setIsEditingTitle(true)}
              className={`${styles.title} ${
                isEditMode ? styles.titleEditable : ""
              }`}
            >
              {formatCardTitle(cellTitle)}
            </Typography>
          )}
        </Box>

        {/* Сумма активных расходов */}
        {!isNotesColumn && localAmount !== undefined && (
          <Box className={styles.amountWrap}>
            <Typography className={styles.amount}>
              {localAmount.toLocaleString("ru-RU")}₽
            </Typography>
          </Box>
        )}
      </Box>

      {/* ОСНОВНОЙ КОНТЕНТ - БЕЗ СКРОЛЛА ДЛЯ АКТИВНЫХ ПУНКТОВ */}
      <Box
        className={`${styles.content} ${
          isNotesColumn ? styles.notesContent : ""
        }`}
      >
        {isNotesColumn ? (
          // ЗАМЕТКИ
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <Box className={styles.notesScroller}>
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
                  <button
                    type="button"
                    onClick={onAddNote}
                    className={styles.addButton}
                  >
                    <Box className={styles.addButtonCenter}>
                      <span className={styles.addButtonIcon}>+</span>
                    </Box>
                  </button>
                )}

                {/* Сообщение если нет заметок */}
                {(activeItems as NoteModel[]).length === 0 && !isEditMode && (
                  <Box className={styles.emptyMessage}>
                    <div className={styles.emptyMessageText}>Пока тут нет заметок</div>
                  </Box>
                )}
              </SortableContext>
            </Box>

          </DndContext>
        ) : (
          // ПУНКТЫ РАСХОДОВ
          <>
            <Box className={styles.activeItemsWrap}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
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
                      onToggle={handleItemToggle}
                      backgroundColor={backgroundColor}
                    />
                  ))}

                  {/* КНОПКА ДОБАВЛЕНИЯ В РЕЖИМЕ РЕДАКТИРОВАНИЯ */}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={onAddItem}
                      className={styles.addButton}
                    >
                      <Box className={styles.addButtonCenter}>
                        <span className={styles.addButtonIcon}>+</span>
                      </Box>
                    </button>
                  )}
                </SortableContext>

              </DndContext>
            </Box>

            {/* ВЫПОЛНЕННЫЕ ПУНКТЫ (только в режиме редактирования) */}
            {isEditMode && (
              <Box
                className={`${styles.completedSection} ${
                  completedItems.length > 0 ? styles.completedSectionWithItems : ""
                }`}
                style={{
                  height: completedItems.length > 0 ? "auto" : "0",
                  overflowX: "hidden",
                }}
              >
                <Box
                  className={`${styles.completedScroller} ${
                    completedItems.length > 2 ? styles.completedScrollerScrollable : ""
                  }`}
                >
                  {/* ВСЕ ВЫПОЛНЕННЫЕ ПУНКТЫ */}
                  {completedItems.map((item) => (
                    <ChecklistItem
                      key={`completed-${item.id}`}
                      item={item}
                      isEditing={isEditMode}
                      onUpdate={handleItemUpdate}
                      onDelete={(id) => onItemDelete(id)}
                      onToggle={handleItemToggle}
                      backgroundColor={backgroundColor}
                    />
                  ))}

                  {/* Сообщение если нет выполненных пунктов */}
                  {completedItems.length === 0 && (
                    <Box className={styles.completedEmptyMessage}>
                      <Typography>Нет выполненных пунктов</Typography>
                    </Box>
                  )}
                </Box>
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
