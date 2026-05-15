import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBudget } from "../../contexts/BudgetContext";
import { ChecklistItemModel } from "../../types/checklist-item";
import { NoteModel } from "../../types/note";
import { CellColor } from "../../types/budget";
import { createReturnState, getReturnPath } from "../../utils/navigationState";
import Header from "../../components/layout/Header/Header";
import BudgetGrid from "../../components/layout/BudgetGrid/BudgetGrid";
import InfoHint from "../../components/ui/InfoHint";
import { Box } from "@mui/material";
import styles from "./MainPage.module.scss";

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getReturnPath(location.state, "/archive");
  const {
    currentBudget,
    isEditMode,
    toggleEditMode,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    addNote,
    updateNote,
    deleteNote,
    updateColor,
    updateTitle,
    clearStorage,
    reorderItems,
    moveItemBetweenCategories,
  } = useBudget();
  const handleItemUpdate = (
    item: ChecklistItemModel,
    category: "required" | "desired",
  ) => {
    updateItem(item);
  };

  const handleItemDelete = (id: string, category: "required" | "desired") => {
    deleteItem(id, category);
  };

  const handleItemToggle = (id: string, category: "required" | "desired") => {
    toggleItem(id, category);
  };

  const handleAddItem = (category: "required" | "desired") => {
    addItem(ChecklistItemModel.createDefault(category), category);
  };

  const handleAddNote = () => {
    addNote(NoteModel.createUserNote());
  };

  const handleColorChange = (
    category: "required" | "desired" | "notes",
    color: string,
  ) => {
    updateColor(category, color as CellColor);
  };

  const handleTitleChange = (
    category: "required" | "desired" | "notes",
    newTitle: string,
  ) => {
    updateTitle(category, newTitle);
  };

  const handleReorderItems = (
    category: "required" | "desired" | "notes",
    oldIndex: number,
    newIndex: number,
  ) => {
    reorderItems(category, oldIndex, newIndex);
  };

  const handleMoveItem = (
    itemId: string,
    fromCategory: "required" | "desired",
    toCategory: "required" | "desired",
  ) => {
    moveItemBetweenCategories(itemId, fromCategory, toCategory);
  };

  const handleBack = () => {
    navigate(returnPath === "/main" ? "/archive" : returnPath);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Вы уверены, что хотите сбросить все данные? Это удалит все сохраненные изменения.",
      )
    ) {
      clearStorage();
    }
  };

  if (!currentBudget) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Бюджет не загружен</h2>

        <div className={styles.emptyActions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() =>
              navigate("/form", { state: createReturnState("/main") })
            }
          >
            Создать новый бюджет
          </button>

          <button
            type="button"
            className={styles.secondaryAction}
            onClick={handleResetData}
          >
            Сбросить все данные (отладка)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Box className={styles.content}>
        <Header
          budget={currentBudget}
          isEditMode={isEditMode}
          onToggleEditMode={toggleEditMode}
        />

        <BudgetGrid
          budget={currentBudget}
          isEditMode={isEditMode}
          onItemUpdate={handleItemUpdate}
          onItemDelete={handleItemDelete}
          onItemToggle={handleItemToggle}
          onNoteUpdate={updateNote}
          onNoteDelete={deleteNote}
          onAddItem={handleAddItem}
          onAddNote={handleAddNote}
          onColorChange={handleColorChange}
          onTitleChange={handleTitleChange}
          onReorderItems={handleReorderItems}
          onMoveItem={handleMoveItem}
        />
      </Box>

      <InfoHint
        className={styles.pageHint}
        ariaLabel="Подсказка по редактированию бюджета"
        variant="gray"
        iconFileName="tooltip_main.png"
        messages={[
          "㋡ Последнее действие можно отменить через Ctrl+Z.",
          "㋡ Связанные суммы и лимиты пересчитываются автоматически.",
          "㋡ Обновляй план с ИИ, когда меняется логика бюджета: доход, обязательные траты или длительность периода.",
          "㋡ ИИ обновляет рекомендации, а твои ручные заметки остаются на месте.",
        ]}
      />

      <div className={styles.pageFooter}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
        >
          Вернуться
        </button>
      </div>
    </div>
  );
};

export default MainPage;
