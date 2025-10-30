import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  IconButton
} from '@mui/material';
import { Lock, LockOpen, Add } from '@mui/icons-material';

// Модели
import { ChecklistItemModel } from '../models/ChecklistItemModel';
import { NoteModel } from '../models/NoteModel';

// Компоненты
import ChecklistItem from '../components/ChecklistItem/ChecklistItem';
import DraggableList from '../components/DraggableList/DraggableList';

/**
 * Главная страница с чек-листом и заметками
 */
const ChecklistPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [budget] = useState(50000);
  const [period] = useState('Ноябрь 2024');
  
  // Состояния для чек-листа
  const [mandatoryExpenses, setMandatoryExpenses] = useState<ChecklistItemModel[]>([
    new ChecklistItemModel('1', 'Аренда квартиры', 15000, false, 'mandatory', 'red'),
    new ChecklistItemModel('2', 'Коммунальные услуги', 5000, false, 'mandatory', 'red'),
  ]);
  
  const [optionalExpenses, setOptionalExpenses] = useState<ChecklistItemModel[]>([
    new ChecklistItemModel('3', 'Одежда', 8000, false, 'optional', 'yellow'),
    new ChecklistItemModel('4', 'Развлечения', 5000, false, 'optional', 'green'),
  ]);

  // Состояния для заметок
  const [notes] = useState<NoteModel[]>([
    NoteModel.createAINote('Экономьте на коммунальных услугах: установите счетчики'),
    NoteModel.createAINote('Откладывайте 10% от каждого дохода'),
  ]);

  /**
   * Переупорядочивает пункты чек-листа
   */
  const reorderExpenses = (
    newItems: ChecklistItemModel[], 
    category: 'mandatory' | 'optional'
  ) => {
    const setter = category === 'mandatory' ? setMandatoryExpenses : setOptionalExpenses;
    setter(newItems);
  };

  /**
   * Переупорядочивает заметки
   */
  const reorderNotes = (newNotes: NoteModel[]) => {
    // setNotes(newNotes); // Раскомментировать когда будем делать заметки с Drag & Drop
  };
  
  /**
   * Вычисляет оставшийся бюджет
   */
  const calculateRemainingBudget = (): number => {
    const allExpenses = [...mandatoryExpenses, ...optionalExpenses];
    const spent = allExpenses
      .filter(expense => expense.completed)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return budget - spent;
  };

  /**
   * Вычисляет оставшийся бюджет по категории
   */
  const calculateCategoryRemaining = (expenses: ChecklistItemModel[]): number => {
    return expenses
      .filter(expense => !expense.completed)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  /**
   * Добавляет новый пункт в обязательные расходы
   */
  const addMandatoryExpense = () => {
    const newItem = ChecklistItemModel.createDefault('mandatory');
    setMandatoryExpenses(prev => [...prev, newItem]);
  };

  /**
   * Добавляет новый пункт в желаемые расходы
   */
  const addOptionalExpense = () => {
    const newItem = ChecklistItemModel.createDefault('optional');
    setOptionalExpenses(prev => [...prev, newItem]);
  };

  /**
   * Обновляет пункт чек-листа
   */
  const updateExpense = (updatedItem: ChecklistItemModel, category: 'mandatory' | 'optional') => {
    const setter = category === 'mandatory' ? setMandatoryExpenses : setOptionalExpenses;
    setter(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  /**
   * Удаляет пункт чек-листа
   */
  const deleteExpense = (id: string, category: 'mandatory' | 'optional') => {
    const setter = category === 'mandatory' ? setMandatoryExpenses : setOptionalExpenses;
    setter(prev => prev.filter(item => item.id !== id));
  };

  /**
   * Переключает состояние выполнения пункта
   */
  const toggleExpense = (id: string, category: 'mandatory' | 'optional') => {
    const setter = category === 'mandatory' ? setMandatoryExpenses : setOptionalExpenses;
    setter(prev => prev.map(item => 
      item.id === id ? item.toggleCompleted() : item
    ));
  };

  const remainingBudget = calculateRemainingBudget();
  const mandatoryRemaining = calculateCategoryRemaining(mandatoryExpenses);
  const optionalRemaining = calculateCategoryRemaining(optionalExpenses);

  const saveToLocalStorage = () => {
    const data = {
      mandatoryExpenses,
      optionalExpenses, 
      notes,
      budget,
      period
    };
    localStorage.setItem('budgetData', JSON.stringify(data));
  };
  
  // загрузка при старте
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('budgetData');
    if (saved) {
      const data = JSON.parse(saved);
      // Восстановить данные
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, height: '100vh' }}>
      {/* Шапка */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              Бюджет: {budget.toLocaleString()} ₽ • Период: {period}
            </Typography>
            <Typography variant="h5" color="primary">
              Осталось: {remainingBudget.toLocaleString()} ₽
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setIsEditing(!isEditing)}
            color={isEditing ? "primary" : "default"}
          >
            {isEditing ? <LockOpen /> : <Lock />}
          </IconButton>
        </Box>
      </Paper>

      {/* Основной контент */}
      <Grid container spacing={3} sx={{ height: '70vh' }}>
        {/* Левая колонка - Чек-лист */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            
            {/* Обязательные расходы */}
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">ОБЯЗАТЕЛЬНЫЕ</Typography>
                <Typography variant="h6" color="primary">
                  Осталось: {mandatoryRemaining.toLocaleString()} ₽
                </Typography>
              </Box>
              
              <DraggableList
                items={mandatoryExpenses}
                isEditing={isEditing}
                onReorder={(newItems) => reorderExpenses(newItems, 'mandatory')}
                renderItem={(item, index, dragHandleProps) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                    onUpdate={(updatedItem) => updateExpense(updatedItem, 'mandatory')}
                    onDelete={(id) => deleteExpense(id, 'mandatory')}
                    onToggle={(id) => toggleExpense(id, 'mandatory')}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              />

              {isEditing && (
                <Button 
                  startIcon={<Add />} 
                  onClick={addMandatoryExpense}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Добавить обязательный расход
                </Button>
              )}
            </Box>

            {/* Желаемые расходы */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">ЖЕЛАЕМЫЕ</Typography>
                <Typography variant="h6" color="primary">
                  Осталось: {optionalRemaining.toLocaleString()} ₽
                </Typography>
              </Box>
              
              <DraggableList
                items={optionalExpenses}
                isEditing={isEditing}
                onReorder={(newItems) => reorderExpenses(newItems, 'optional')}
                renderItem={(item, index, dragHandleProps) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                    onUpdate={(updatedItem) => updateExpense(updatedItem, 'optional')}
                    onDelete={(id) => deleteExpense(id, 'optional')}
                    onToggle={(id) => toggleExpense(id, 'optional')}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              />

              {isEditing && (
                <Button 
                  startIcon={<Add />} 
                  onClick={addOptionalExpense}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Добавить желаемый расход
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Правая колонка - Заметки */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom color="primary">
              ЗАМЕТКИ И СОВЕТЫ
            </Typography>
            
            {/* Временный простой список заметок */}
            {notes.map((note) => (
              <Paper key={note.id} sx={{ p: 2, mb: 2, bgcolor: note.isAIAdvice() ? 'background.default' : 'primary.light' }}>
                <Typography variant="body2" color={note.isAIAdvice() ? 'text.primary' : 'white'}>
                  {note.content}
                </Typography>
                <Typography variant="caption" color={note.isAIAdvice() ? 'text.secondary' : 'white'}>
                  {note.isAIAdvice() ? 'AI совет' : 'Моя заметка'}
                </Typography>
              </Paper>
            ))}
            
            {isEditing && (
              <Button 
                fullWidth 
                startIcon={<Add />} 
                onClick={() => {/* временно пусто */}}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Добавить заметку
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChecklistPage;