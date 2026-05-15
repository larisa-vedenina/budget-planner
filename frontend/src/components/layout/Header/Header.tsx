import React, { useCallback, useEffect, useRef, useState } from "react";
import { BudgetPeriod } from "../../../types/budget";
import LockToggle from "../../ui/LockToggle";
import TimerReminder from "./TimerReminder";
import ProfileMenu from "./ProfileMenu";
import { Box, useMediaQuery } from "@mui/material";
import { useBudget } from "../../../contexts/BudgetContext";
import { calculateCompletedExpenses } from "../../../types/budget";
import DateRangePicker from "../../forms/DateRangePicker";
import styles from "./Header.module.scss";

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
  const {
    updateBudgetIncome,
    updatePeriod,
    refreshAIPlan,
    canRefreshAIPlan,
    isRefreshingAIPlan,
  } = useBudget();
  const isMobile = useMediaQuery("(max-width:768px)");

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.totalIncome.toString());
  const budgetEditRef = useRef<HTMLDivElement>(null);
  const budgetInputRef = useRef<HTMLInputElement>(null);

  const [tempStartDate, setTempStartDate] = useState(
    new Date(budget.startDate).toISOString().split("T")[0],
  );
  const [tempEndDate, setTempEndDate] = useState(
    new Date(budget.endDate).toISOString().split("T")[0],
  );

  const completedExpenses = calculateCompletedExpenses(budget);
  const remaining = budget.totalIncome - completedExpenses;
  const hasCompletedItems = completedExpenses > 0;
  const budgetTextColor = hasCompletedItems ? "#5B5B5B" : "#0D0D0D";
  const budgetFontSize = isMobile
    ? hasCompletedItems
      ? "18px"
      : "24px"
    : hasCompletedItems
      ? "24px"
      : "32px";
  const formattedBudget = budget.totalIncome.toLocaleString("ru-RU");
  const remainingText = hasCompletedItems
    ? `Осталось: ${remaining.toLocaleString("ru-RU")}₽`
    : "\u00A0";

  useEffect(() => {
    if (isEditingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
    }
  }, [isEditingBudget]);

  useEffect(() => {
    if (!isEditingBudget) {
      setTempBudget(budget.totalIncome.toString());
    }
  }, [budget.totalIncome, isEditingBudget]);

  useEffect(() => {
    setTempStartDate(new Date(budget.startDate).toISOString().split("T")[0]);
    setTempEndDate(new Date(budget.endDate).toISOString().split("T")[0]);
  }, [budget.endDate, budget.startDate]);

  const handleBudgetSave = useCallback(() => {
    const normalizedBudget = tempBudget.trim();

    if (!normalizedBudget) {
      setTempBudget(budget.totalIncome.toString());
      setIsEditingBudget(false);
      return;
    }

    const newBudget = Number.parseInt(normalizedBudget, 10);
    if (!Number.isNaN(newBudget) && newBudget >= 0 && newBudget !== budget.totalIncome) {
      updateBudgetIncome(newBudget);
    }
    setIsEditingBudget(false);
  }, [budget.totalIncome, tempBudget, updateBudgetIncome]);

  const handleBudgetKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBudgetSave();
    }
    if (e.key === "Escape") {
      setTempBudget(budget.totalIncome.toString());
      setIsEditingBudget(false);
    }
  };

  const handleBudgetBlur = () => {
    handleBudgetSave();
  };

  const handlePeriodChange = useCallback(
    (start: string, end: string) => {
      setTempStartDate(start);
      setTempEndDate(end);

      if (!start || !end) {
        return;
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        startDate <= endDate
      ) {
        updatePeriod(startDate, endDate);
      }
    },
    [updatePeriod],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (budgetEditRef.current && !budgetEditRef.current.contains(event.target as Node)) {
        handleBudgetSave();
      }
    };

    if (isEditingBudget) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleBudgetSave, isEditingBudget]);

  const handleBudgetClick = () => {
    if (isEditMode && !isEditingBudget) {
      setIsEditingBudget(true);
      setTempBudget(budget.totalIncome.toString());
    }
  };

  return (
    <header className={styles.header}>
      <Box className={styles.budgetBlock}>
        {isEditMode && isEditingBudget ? (
          <div
            ref={budgetEditRef}
            className={styles.budgetLine}
            style={{ fontSize: budgetFontSize, fontWeight: 400, color: budgetTextColor }}
          >
            <span
              className={styles.budgetLabel}
            >
              {"Бюджет:\u00A0"}
            </span>
            <span className={styles.budgetValueWrap}>
              <span
                className={styles.budgetSizer}
              >
                {tempBudget || "0"}
              </span>
              <input
                ref={budgetInputRef}
                type="text"
                inputMode="numeric"
                value={tempBudget}
                onChange={(e) =>
                  setTempBudget(e.target.value.replace(/[^\d]/g, ""))
                }
                onKeyDown={handleBudgetKeyPress}
                onBlur={handleBudgetBlur}
                className={styles.budgetInput}
                aria-label="Сумма бюджета"
              />
            </span>
            <span className={styles.currency}>₽</span>
          </div>
        ) : (
          <>
            <div
              className={`${styles.budgetLine} ${styles.budgetText} ${
                isEditMode ? styles.editableText : ""
              }`}
              style={{
                fontSize: budgetFontSize,
                fontWeight: 400,
                color: budgetTextColor,
              }}
              onClick={handleBudgetClick}
              title={isEditMode ? "Нажми, чтобы изменить бюджет" : ""}
            >
              <span className={styles.budgetLabel}>{"Бюджет:\u00A0"}</span>
              <span className={styles.budgetValueStatic}>{formattedBudget}</span>
              <span className={styles.currency}>₽</span>
            </div>

            <p
              className={`${styles.remainingText} ${
                !hasCompletedItems ? styles.remainingTextHidden : ""
              }`}
              style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 400 }}
              aria-hidden={!hasCompletedItems}
            >
              {remainingText}
            </p>
          </>
        )}
      </Box>

      <Box className={styles.centerBlock}>
        {isEditMode ? (
          <div className={styles.periodPickerWrap}>
            <DateRangePicker
              startDate={tempStartDate}
              endDate={tempEndDate}
              onChange={handlePeriodChange}
            />
          </div>
        ) : (
          <div className={styles.periodDisplay}>
            <div className={styles.periodDisplayContent}>
              <TimerReminder
                startDate={budget.startDate}
                endDate={budget.endDate}
              />
            </div>
            <div className={styles.periodDisplaySpacer} aria-hidden="true" />
          </div>
        )}
      </Box>

      <Box className={styles.actionsBlock}>
        <div className={styles.lockAction}>
          <LockToggle
            isLocked={!isEditMode}
            onToggle={onToggleEditMode}
            size="medium"
          />
        </div>
        {isEditMode && (
          <button
            type="button"
            className={styles.aiRefreshButton}
            onClick={refreshAIPlan}
            disabled={!canRefreshAIPlan}
            title="Обновить план с ИИ"
          >
            <span className={styles.aiRefreshText}>
              {isRefreshingAIPlan ? "План обновляется" : "Обновить с ИИ"}
            </span>
            <span className={styles.aiRefreshTextMobile}>
              {isRefreshingAIPlan ? "..." : "ИИ"}
            </span>
          </button>
        )}
        <ProfileMenu />
      </Box>
    </header>
  );
};

export default Header;
