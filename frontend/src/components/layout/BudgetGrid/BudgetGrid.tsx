import React, { useCallback, useMemo, useState } from "react";
import { BudgetPeriod, calculateActiveExpenses } from "../../../types/budget";
import BudgetCard from "../../budget/BudgetCard/BudgetCard";
import { ChecklistItemModel } from "../../../types/checklist-item";
import { NoteModel } from "../../../types/note";
import styles from "./BudgetGrid.module.scss";

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
  const [delayedCompletedCounts, setDelayedCompletedCounts] = useState({
    required: 0,
    desired: 0,
  });

  const handleRequiredDelayedCompletedChange = useCallback((count: number) => {
    setDelayedCompletedCounts((currentCounts) =>
      currentCounts.required === count
        ? currentCounts
        : {
            ...currentCounts,
            required: count,
          },
    );
  }, []);

  const handleDesiredDelayedCompletedChange = useCallback((count: number) => {
    setDelayedCompletedCounts((currentCounts) =>
      currentCounts.desired === count
        ? currentCounts
        : {
            ...currentCounts,
            desired: count,
          },
    );
  }, []);

  const desiredTitle =
    budget.cellTitles.desired.trim().toUpperCase() === "ЖЕЛАЕМЫЕ"
      ? "НЕОБЯЗАТЕЛЬНЫЕ"
      : budget.cellTitles.desired;

  const getFilteredItems = useCallback(
    (items: ChecklistItemModel[]) => {
      if (!items || items.length === 0) return [];

      const activeItems = items.filter((item) => !item.completed);
      const completedItems = items.filter((item) => item.completed);

      const sortedActive = isEditMode
        ? activeItems
        : [...activeItems].sort((a, b) => {
            if (a.priority === "priority" && b.priority !== "priority") return -1;
            if (a.priority !== "priority" && b.priority === "priority") return 1;

            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });

      const sortedCompleted = [...completedItems].sort(
        (a, b) =>
          new Date(b.completedAt || 0).getTime() -
          new Date(a.completedAt || 0).getTime(),
      );

      return [...sortedActive, ...sortedCompleted];
    },
    [isEditMode],
  );

  const filteredRequiredItems = useMemo(
    () => getFilteredItems(budget.requiredItems),
    [budget.requiredItems, getFilteredItems],
  );

  const filteredDesiredItems = useMemo(
    () => getFilteredItems(budget.desiredItems),
    [budget.desiredItems, getFilteredItems],
  );

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

  const calculateCellHeight = useCallback(
    (items: ChecklistItemModel[], delayedCompletedCount = 0): number => {
      const MIN_HEIGHT = 350;

      const HEADER_HEIGHT = 80;
      const ITEM_HEIGHT = 80;
      const ADD_BUTTON_HEIGHT = isEditMode ? 80 : 0;

      const activeItems = items.filter((item) => !item.completed);
      const completedCount = items.filter((item) => item.completed).length;
      const visibleCompletedCount = isEditMode
        ? Math.min(Math.max(completedCount - delayedCompletedCount, 0), 2)
        : 0;

      const delayedCompletedBuffer = delayedCompletedCount;

      const visibleHeight =
        HEADER_HEIGHT +
        activeItems.length * ITEM_HEIGHT +
        ADD_BUTTON_HEIGHT +
        visibleCompletedCount * ITEM_HEIGHT +
        delayedCompletedBuffer * ITEM_HEIGHT +
        40;

      return Math.max(visibleHeight, MIN_HEIGHT);
    },
    [isEditMode],
  );

  const requiredHeight = useMemo(
    () =>
      calculateCellHeight(
        filteredRequiredItems,
        delayedCompletedCounts.required,
      ),
    [calculateCellHeight, delayedCompletedCounts.required, filteredRequiredItems],
  );

  const desiredHeight = useMemo(
    () =>
      calculateCellHeight(filteredDesiredItems, delayedCompletedCounts.desired),
    [calculateCellHeight, delayedCompletedCounts.desired, filteredDesiredItems],
  );

  const notesColumnHeight = requiredHeight + desiredHeight + 20;

  const handleItemDragEnd = (
    itemId: string,
    category: "required" | "desired",
    newIndex: number,
  ) => {
    const items =
      category === "required" ? filteredRequiredItems : filteredDesiredItems;
    const activeItems = items.filter((item) => !item.completed);
    const oldIndex = activeItems.findIndex((item) => item.id === itemId);

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
    <div className={styles.wrapper}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gridTemplateRows: `${requiredHeight}px ${desiredHeight}px`,
        }}
      >
        <div
          className={styles.cell}
          style={{
            gridColumn: "1 / 2",
            gridRow: "1 / 2",
            height: `${requiredHeight}px`,
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
            onDelayedCompletedCountChange={handleRequiredDelayedCompletedChange}
          />
        </div>

        <div
          className={styles.cell}
          style={{
            gridColumn: "1 / 2",
            gridRow: "2 / 3",
            height: `${desiredHeight}px`,
          }}
        >
          <BudgetCard
            cellTitle={desiredTitle}
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
            onDelayedCompletedCountChange={handleDesiredDelayedCompletedChange}
          />
        </div>

        <div
          className={styles.cell}
          style={{
            gridColumn: "2 / 3",
            gridRow: "1 / 3",
            height: `${notesColumnHeight}px`,
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
