import React, { useMemo } from "react";
import {
  BudgetPeriod,
  CellColor,
  calculateActiveExpenses,
} from "../../../types/budget";
import BudgetCard from "../../budget/BudgetCard/BudgetCard";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { NoteModel } from "../../../types/note";

interface BudgetGridProps {
  budget: BudgetPeriod;
  isEditMode: boolean;
  onItemUpdate?: (
    item: ChecklistItemModel,
    category: "required" | "desired",
  ) => void;
  onItemDelete?: (id: string, category: "required" | "desired") => void;
  onItemToggle?: (id: string, category: "required" | "desired") => void;
  onNoteUpdate?: (note: NoteModel) => void;
  onNoteDelete?: (id: string) => void;
  onAddItem?: (category: "required" | "desired") => void;
  onAddNote?: () => void;
  onColorChange?: (
    category: "required" | "desired" | "notes",
    color: string,
  ) => void;
  onTitleChange?: (
    category: "required" | "desired" | "notes",
    newTitle: string,
  ) => void;
  // Drag & Drop обработчики
  onReorderItems?: (
    category: "required" | "desired" | "notes",
    oldIndex: number,
    newIndex: number,
  ) => void;
  onMoveItem?: (
    itemId: string,
    fromCategory: "required" | "desired",
    toCategory: "required" | "desired",
  ) => void;
}

export const BudgetGrid: React.FC<BudgetGridProps> = ({
  budget,
  isEditMode,
  onItemUpdate = () => {},
  onItemDelete = () => {},
  onItemToggle = () => {},
  onNoteUpdate = () => {},
  onNoteDelete = () => {},
  onAddItem = () => {},
  onAddNote = () => {},
  onColorChange = () => {},
  onTitleChange = () => {},
  onReorderItems = () => {},
  onMoveItem = () => {},
}) => {
  // ФУНКЦИЯ ФИЛЬТРАЦИИ И СОРТИРОВКИ
  const getFilteredItems = (items: ChecklistItemModel[]) => {
    if (!items || items.length === 0) return [];

    // Разделяем на активные и выполненные
    const activeItems = items.filter((item) => !item.completed);
    const completedItems = items.filter((item) => item.completed);

    // Сортируем активные по порядку: приоритетные → старые → новые
    const sortedActive = [...activeItems].sort((a, b) => {
      // 1. Приоритетные всегда сверху
      if (a.priority === "priority" && b.priority !== "priority") return -1;
      if (a.priority !== "priority" && b.priority === "priority") return 1;

      // 2. Старые выше новых (по дате создания - чем старше, тем выше)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Сортируем выполненные: самые свежие сверху
    const sortedCompleted = [...completedItems].sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime(),
    );

    // Объединяем: активные + выполненные
    return [...sortedActive, ...sortedCompleted];
  };

  // Используем useMemo для оптимизации
  const filteredRequiredItems = useMemo(
    () => getFilteredItems(budget.requiredItems),
    [budget.requiredItems],
  );

  const filteredDesiredItems = useMemo(
    () => getFilteredItems(budget.desiredItems),
    [budget.desiredItems],
  );

  // Рассчитываем суммы активных расходов (только невыполненных)
  const requiredActiveAmount = useMemo(
    () =>
      calculateActiveExpenses(
        filteredRequiredItems.filter((item) => !item.completed),
      ),
    [filteredRequiredItems],
  );

  const desiredActiveAmount = useMemo(
    () =>
      calculateActiveExpenses(
        filteredDesiredItems.filter((item) => !item.completed),
      ),
    [filteredDesiredItems],
  );

  // Рассчитываем высоты ячеек на основе контента
  const calculateCellHeight = (items: ChecklistItemModel[]): number => {
    // Минимальная высота ячейки
    const MIN_HEIGHT = 350;

    // Высота фиксированных элементов
    const HEADER_HEIGHT = 80;
    const ITEM_HEIGHT = 85; 
    const ADD_BUTTON_HEIGHT = isEditMode ? 80 : 0;

    // Активные пункты
    const activeItems = items.filter((item) => !item.completed);

    // В режиме редактирования показываем максимум 2 выполненных
    const visibleCompletedCount = isEditMode
      ? Math.min(2, items.filter((item) => item.completed).length)
      : 0;

    // Высота видимой части
    const visibleHeight =
      HEADER_HEIGHT +
      activeItems.length * ITEM_HEIGHT +
      ADD_BUTTON_HEIGHT +
      visibleCompletedCount * ITEM_HEIGHT +
      40; // дополнительные отступы

    return Math.max(visibleHeight, MIN_HEIGHT);
  };

  const requiredHeight = useMemo(
    () => calculateCellHeight(filteredRequiredItems),
    [filteredRequiredItems, isEditMode],
  );

  const desiredHeight = useMemo(
    () => calculateCellHeight(filteredDesiredItems),
    [filteredDesiredItems, isEditMode],
  );

  // Высота для второй колонки = сумма высот двух ячеек первой колонки
  const notesColumnHeight = requiredHeight + desiredHeight + 20; // + gap между ячейками

  // Обработчики Drag & Drop
  const handleItemDragEnd = (
    itemId: string,
    category: "required" | "desired",
    newIndex: number,
  ) => {
    const items =
      category === "required" ? filteredRequiredItems : filteredDesiredItems;
    const oldIndex = items.findIndex((item) => item.id === itemId);

    if (oldIndex !== -1 && oldIndex !== newIndex) {
      onReorderItems?.(category, oldIndex, newIndex);
    }
  };

  const handleNoteDragEnd = (noteId: string, newIndex: number) => {
    const oldIndex = budget.notes.findIndex((note) => note.id === noteId);
    if (oldIndex !== -1 && oldIndex !== newIndex) {
      onReorderItems?.("notes", oldIndex, newIndex);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "20px",
        minHeight: "700px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: `${requiredHeight}px ${desiredHeight}px`,
          gap: "20px",
          height: "100%",
          minHeight: "700px",
        }}
      >
        {/* Обязательные расходы */}
        <div
          style={{
            gridColumn: "1 / 2",
            gridRow: "1 / 2",
            height: `${requiredHeight}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <BudgetCard
            cellTitle={budget.cellTitles.required}
            amount={requiredActiveAmount}
            items={filteredRequiredItems}
            backgroundColor={budget.colors.required}
            category="required"
            isEditMode={isEditMode}
            onItemUpdate={(item: ChecklistItemModel) =>
              onItemUpdate(item, "required")
            }
            onItemDelete={(id: string) => onItemDelete(id, "required")}
            onItemToggle={(id: string) => onItemToggle(id, "required")}
            onAddItem={() => onAddItem("required")}
            onColorChange={(color: string) => onColorChange("required", color)}
            onTitleChange={(newTitle: string) =>
              onTitleChange("required", newTitle)
            }
            onItemDragEnd={(itemId: string, newIndex: number) =>
              handleItemDragEnd(itemId, "required", newIndex)
            }
          />
        </div>

        {/* Желаемые расходы */}
        <div
          style={{
            gridColumn: "1 / 2",
            gridRow: "2 / 3",
            height: `${desiredHeight}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <BudgetCard
            cellTitle={budget.cellTitles.desired}
            amount={desiredActiveAmount}
            items={filteredDesiredItems}
            backgroundColor={budget.colors.desired}
            category="desired"
            isEditMode={isEditMode}
            onItemUpdate={(item: ChecklistItemModel) =>
              onItemUpdate(item, "desired")
            }
            onItemDelete={(id: string) => onItemDelete(id, "desired")}
            onItemToggle={(id: string) => onItemToggle(id, "desired")}
            onAddItem={() => onAddItem("desired")}
            onColorChange={(color: string) => onColorChange("desired", color)}
            onTitleChange={(newTitle: string) =>
              onTitleChange("desired", newTitle)
            }
            onItemDragEnd={(itemId: string, newIndex: number) =>
              handleItemDragEnd(itemId, "desired", newIndex)
            }
          />
        </div>

        {/* Заметки - фиксированная высота = сумма высот двух ячеек */}
        <div
          style={{
            gridColumn: "2 / 3",
            gridRow: "1 / 3",
            height: `${notesColumnHeight}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <BudgetCard
            cellTitle={budget.cellTitles.notes}
            items={budget.notes}
            backgroundColor={budget.colors.notes}
            category="notes"
            isEditMode={isEditMode}
            isNotesColumn={true}
            onNoteUpdate={onNoteUpdate}
            onNoteDelete={onNoteDelete}
            onAddNote={onAddNote}
            onColorChange={(color: string) => onColorChange("notes", color)}
            onTitleChange={(newTitle: string) =>
              onTitleChange("notes", newTitle)
            }
            onNoteDragEnd={handleNoteDragEnd}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgetGrid;
