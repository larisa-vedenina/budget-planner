import React, { useMemo } from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChecklistItemModel } from '../../types/checklist-item';
import { NoteModel } from '../../types/note';
import { CellColor, calculateCompletedExpenses } from '../../types/budget';
import Header from '../../components/layout/Header/Header';
import BudgetGrid from '../../components/layout/BudgetGrid/BudgetGrid'; // <-- ИСПРАВЛЕННЫЙ ИМПОРТ
import { Box } from '@mui/material';

export const MainPage: React.FC = () => {
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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBudget();
  
  const { user } = useAuth();
  
  // Вспомогательные обработчики (если нужны)
  const handleItemUpdate = (item: ChecklistItemModel, category: "required" | "desired") => {
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
  
  const handleColorChange = (category: "required" | "desired" | "notes", color: string) => {
    updateColor(category, color as CellColor);
  };
  
  const handleTitleChange = (category: "required" | "desired" | "notes", newTitle: string) => {
    updateTitle(category, newTitle);
  };
  
  const handleReorderItems = (
    category: "required" | "desired" | "notes", 
    oldIndex: number, 
    newIndex: number
  ) => {
    reorderItems(category, oldIndex, newIndex);
  };
  
  const handleMoveItem = (
    itemId: string, 
    fromCategory: "required" | "desired", 
    toCategory: "required" | "desired"
  ) => {
    moveItemBetweenCategories(itemId, fromCategory, toCategory);
  };
  
  // Функция для сброса данных
  const handleResetData = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные? Это удалит все сохраненные изменения.')) {
      clearStorage();
    }
  };
  
  if (!currentBudget) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#CAEEFC',
      }}>
        <h2 style={{ 
          fontFamily: '"Roboto Condensed", sans-serif',
          color: '#0D0D0D',
          marginBottom: '30px'
        }}>
          Бюджет не загружен
        </h2>
        <button 
          onClick={() => window.location.href = '/form'}
          style={{
            padding: "15px 30px",
            backgroundColor: "#FFFFFF",
            border: "4px solid #D87B7B",
            borderRadius: "10px",
            fontSize: "18px",
            cursor: "pointer",
            fontFamily: '"Roboto Condensed", sans-serif',
            color: '#0D0D0D',
            boxShadow: '-2px 2px 1px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.2s ease',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-1px, 1px)';
            e.currentTarget.style.boxShadow = '-1px 1px 0.5px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0, 0)';
            e.currentTarget.style.boxShadow = '-2px 2px 1px rgba(0, 0, 0, 0.25)';
          }}
        >
          Создать новый бюджет
        </button>
        
        <button 
          onClick={handleResetData}
          style={{
            padding: "10px 20px",
            backgroundColor: "#FFDFDF",
            border: "2px solid #D87B7B",
            borderRadius: "5px",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: '"Roboto Condensed", sans-serif',
            color: '#0D0D0D',
          }}
        >
          Сбросить все данные (отладка)
        </button>
      </Box>
    );
  }
  
  // Статистика
  const totalItems = currentBudget.requiredItems.length + currentBudget.desiredItems.length;
  const completedItems = currentBudget.requiredItems.filter((item: ChecklistItemModel) => item.completed).length + 
                        currentBudget.desiredItems.filter((item: ChecklistItemModel) => item.completed).length;
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: '"Roboto Condensed", sans-serif',
    }}>
      <Header 
        budget={currentBudget}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
      />
      
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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
      
      {user && (
        <Box sx={{ 
          p: 2,
          textAlign: 'right',
          fontSize: '14px',
          color: '#666',
          fontFamily: '"Roboto Condensed", sans-serif',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #eee',
        }}>
          Вы вошли как: <strong>{user.name}</strong>
        </Box>
      )}
      
      <Box sx={{ 
        p: 2,
        fontSize: '12px',
        color: '#999',
        fontFamily: 'monospace',
        backgroundColor: '#f0f0f0',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div>
          <div>Режим: {isEditMode ? 'РЕДАКТИРОВАНИЕ' : 'ПРОСМОТР'}</div>
          <div>Пунктов: {totalItems} ({completedItems} выполнено)</div>
          <div>Заметок: {currentBudget.notes.length}</div>
        </div>
        <div>
          <div>Всего расходов: {currentBudget.totalExpenses.toLocaleString('ru-RU')}₽</div>
          <div>Выполнено: {calculateCompletedExpenses(currentBudget).toLocaleString('ru-RU')}₽</div>
          <div>Осталось: {currentBudget.remaining.toLocaleString('ru-RU')}₽</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={undo}
            disabled={!canUndo}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: canUndo ? '#FFFFFF' : '#EEEEEE',
              border: '1px solid #D87B7B',
              borderRadius: '3px',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.5,
            }}
            title="Отменить (Ctrl+Z)"
          >
            Undo
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: canRedo ? '#FFFFFF' : '#EEEEEE',
              border: '1px solid #69B5D3',
              borderRadius: '3px',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.5,
            }}
            title="Повторить (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <button 
            onClick={handleResetData}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: '#FFDFDF',
              border: '1px solid #D87B7B',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Сброс данных
          </button>
        </div>
      </Box>
    </Box>
  );
};

export default MainPage;