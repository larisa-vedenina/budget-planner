// components/layout/Header/Header.tsx
import React, { useState, useRef, useEffect } from "react";
import { BudgetPeriod } from "../../../types/budget";
import LockToggle from "../../ui/LockToggle";
import TimerReminder from "./TimerReminder";
import { Box, Typography } from "@mui/material";
import { useBudget } from "../../../contexts/BudgetContext";
import { calculateCompletedExpenses } from "../../../types/budget";

interface HeaderProps {
  budget: BudgetPeriod;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  budget,
  isEditMode,
  onToggleEditMode,
}) => {
  const { updateBudgetIncome, updatePeriod } = useBudget();
  
  // Состояния для редактирования бюджета
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.totalIncome.toString());
  const budgetInputRef = useRef<HTMLInputElement>(null);
  
  // Состояния для редактирования периода
  const [isEditingPeriod, setIsEditingPeriod] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    new Date(budget.startDate).toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState(
    new Date(budget.endDate).toISOString().split('T')[0]
  );
  const periodInputRef = useRef<HTMLDivElement>(null);

  // Рассчитываем выполненные расходы (используем функцию из types/budget)
  const completedExpenses = calculateCompletedExpenses(budget);
  
  // Рассчитываем оставшийся бюджет (доход минус выполненные расходы)
  const remaining = budget.totalIncome - completedExpenses;
  
  // Проверяем, есть ли выполненные пункты
  const hasCompletedItems = completedExpenses > 0;

  // Фокус на инпут бюджета при начале редактирования
  useEffect(() => {
    if (isEditingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
      // Используем безопасный вызов select()
      try {
        if (typeof budgetInputRef.current.select === 'function') {
          budgetInputRef.current.select();
        }
      } catch (error) {
        console.log('Не удалось выделить текст:', error);
      }
    }
  }, [isEditingBudget]);

  // Обработчик сохранения бюджета
  const handleBudgetSave = () => {
    const newBudget = parseFloat(tempBudget);
    if (!isNaN(newBudget) && newBudget >= 0 && newBudget !== budget.totalIncome) {
      console.log('Header: Сохранение бюджета', newBudget);
      updateBudgetIncome(newBudget);
    }
    setIsEditingBudget(false);
  };

  // Обработчик нажатия клавиш для бюджета
  const handleBudgetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBudgetSave();
    }
    if (e.key === 'Escape') {
      setTempBudget(budget.totalIncome.toString());
      setIsEditingBudget(false);
    }
  };

  // Обработчик потери фокуса для бюджета
  const handleBudgetBlur = () => {
    handleBudgetSave();
  };

  // Обработчик сохранения периода
  const handlePeriodSave = () => {
    const startDate = new Date(tempStartDate);
    const endDate = new Date(tempEndDate);
    
    if (startDate && endDate && startDate <= endDate) {
      console.log('Header: Сохранение периода', { startDate, endDate });
      updatePeriod(startDate, endDate);
    }
    setIsEditingPeriod(false);
  };

  // Обработчик нажатия клавиш для периода
  const handlePeriodKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePeriodSave();
    }
    if (e.key === 'Escape') {
      setTempStartDate(new Date(budget.startDate).toISOString().split('T')[0]);
      setTempEndDate(new Date(budget.endDate).toISOString().split('T')[0]);
      setIsEditingPeriod(false);
    }
  };

  // Обработчик потери фокуса для периода
  const handlePeriodBlur = () => {
    handlePeriodSave();
  };

  // Клик вне поля ввода бюджета
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Проверяем клик вне поля бюджета
      if (budgetInputRef.current && !budgetInputRef.current.contains(event.target as Node)) {
        handleBudgetSave();
      }
      
      // Проверяем клик вне поля периода
      if (periodInputRef.current && !periodInputRef.current.contains(event.target as Node)) {
        // Проверяем что клик был не на самих инпутах даты
        const target = event.target as HTMLElement;
        const isDateInput = target.tagName === 'INPUT' && target.getAttribute('type') === 'date';
        if (!isDateInput) {
          handlePeriodSave();
        }
      }
    };

    if (isEditingBudget || isEditingPeriod) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingBudget, isEditingPeriod, tempBudget, tempStartDate, tempEndDate]);

  // Обработчик клика на заголовок бюджета
  const handleBudgetClick = () => {
    if (isEditMode && !isEditingBudget) {
      setIsEditingBudget(true);
      setTempBudget(budget.totalIncome.toString());
    }
  };

  // Обработчик клика на период
  const handlePeriodClick = () => {
    if (isEditMode && !isEditingPeriod) {
      setIsEditingPeriod(true);
    }
  };

  return (
    <header style={styles.header}>
      {/* Левый блок: Бюджет */}
      <Box style={styles.budgetBlock}>
        {isEditMode && isEditingBudget ? (
          // Режим редактирования бюджета
          <div ref={budgetInputRef} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              ref={budgetInputRef}
              type="number"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              onKeyDown={handleBudgetKeyPress}
              onBlur={handleBudgetBlur}
              style={{
                fontSize: hasCompletedItems ? '20px' : '32px',
                fontWeight: 'normal',
                color: '#0D0D0D',
                border: '1px solid #D9D9D9',
                borderRadius: '5px',
                padding: '8px 12px',
                width: '180px',
                fontFamily: '"Roboto Condensed", sans-serif',
                backgroundColor: '#FFFFFF',
              }}
              min="0"
              step="1000"
            />
            <span style={{ 
              fontSize: hasCompletedItems ? '20px' : '32px',
              fontWeight: 'normal',
              color: '#0D0D0D',
              fontFamily: '"Roboto Condensed", sans-serif',
            }}>
              ₽
            </span>
          </div>
        ) : (
          // Режим просмотра бюджета
          <>
            <Typography
              variant="h1"
              style={{
                ...styles.budgetText,
                fontSize: hasCompletedItems ? '20px' : '32px',
                cursor: isEditMode ? 'pointer' : 'default',
              }}
              onClick={handleBudgetClick}
              title={isEditMode ? "Кликните для редактирования бюджета" : ""}
            >
              Бюджет: {budget.totalIncome.toLocaleString('ru-RU')}₽
            </Typography>

            {hasCompletedItems && (
              <Typography variant="h1" style={styles.remainingText}>
                Осталось: {remaining.toLocaleString('ru-RU')}₽
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Центральный блок: Период */}
      <Box style={styles.centerBlock}>
        {isEditMode && isEditingPeriod ? (
          // Режим редактирования периода
          <div ref={periodInputRef} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px' 
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                onKeyDown={handlePeriodKeyPress}
                onBlur={handlePeriodBlur}
                style={{
                  fontSize: '16px',
                  border: '1px solid #D9D9D9',
                  borderRadius: '5px',
                  padding: '8px',
                  fontFamily: '"Roboto Condensed", sans-serif',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <span style={{ 
                fontSize: '24px', 
                display: 'flex', 
                alignItems: 'center',
                color: '#0D0D0D',
                fontFamily: '"Roboto Condensed", sans-serif',
              }}>
                –
              </span>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                onKeyDown={handlePeriodKeyPress}
                onBlur={handlePeriodBlur}
                style={{
                  fontSize: '16px',
                  border: '1px solid #D9D9D9',
                  borderRadius: '5px',
                  padding: '8px',
                  fontFamily: '"Roboto Condensed", sans-serif',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#5B5B5B',
              fontFamily: '"Roboto Condensed", sans-serif',
            }}>
              Нажмите Enter для сохранения, Esc для отмены
            </div>
          </div>
        ) : (
          // Режим просмотра периода
          <div 
            onClick={handlePeriodClick}
            style={{ 
              cursor: isEditMode ? 'pointer' : 'default',
              textAlign: 'center',
            }}
            title={isEditMode ? "Кликните для редактирования периода" : ""}
          >
            <TimerReminder 
              startDate={budget.startDate}
              endDate={budget.endDate}
            />
            {/* {isEditMode && (
              <div style={{ 
                fontSize: '12px', 
                color: '#5B5B5B',
                fontFamily: '"Roboto Condensed", sans-serif',
                marginTop: '4px',
              }}>
                Кликните для изменения дат
              </div>
            )} */}
          </div>
        )}
      </Box>

      {/* Правый блок: Переключатель режима */}
      <Box style={styles.lockBlock}>
        <LockToggle isLocked={!isEditMode} onToggle={onToggleEditMode} />
      </Box>
    </header>
  );
};

const styles = {
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    background: "transparent",
    backdropFilter: "blur(10px)",
    padding: "50px 40px",
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap" as const,
    gap: "16px",
  },
  budgetBlock: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    minWidth: "200px",
  },
  budgetText: {
    fontWeight: "normal",
    color: "#0D0D0D",
    transition: "font-size 0.3s ease",
    fontFamily: '"Roboto Condensed", sans-serif',
    margin: 0,
    lineHeight: 1.2,
  },
  remainingText: {
    fontSize: "24px",
    fontWeight: "normal",
    color: "#0D0D0D",
    fontFamily: '"Roboto Condensed", sans-serif',
    margin: 0,
    lineHeight: 1.2,
  },
  centerBlock: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    maxWidth: "400px",
  },
  lockBlock: {
    display: "flex",
    justifyContent: "flex-end",
    minWidth: "100px",
  },
};

export default Header;