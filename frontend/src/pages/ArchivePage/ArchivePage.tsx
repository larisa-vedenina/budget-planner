import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { BudgetPeriod } from "../../types/budget";
import { useBudget } from "../../contexts/BudgetContext";
import { useAuth } from "../../contexts/AuthContext";
import InfoHint from "../../components/ui/InfoHint";
import {
  deleteStoredBudget,
  getBudgetSnapshot,
  loadBudgetHistory,
  upsertBudgetHistory,
} from "../../utils/budgetStorage";
import { saveRemoteBudgetSnapshot } from "../../services/budgetSyncService";
import styles from "./ArchivePage.module.scss";

// Получаем дату в формате "1 ноября" с правильным падежом месяца.
const formatDayAndMonth = (date: Date): string =>
  date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

const formatArchiveRange = (budget: BudgetPeriod): string => {
  const isSameMonth =
    budget.startDate.getMonth() === budget.endDate.getMonth() &&
    budget.startDate.getFullYear() === budget.endDate.getFullYear();

  if (isSameMonth) {
    const endDayAndMonth = formatDayAndMonth(budget.endDate);
    const monthLabel = endDayAndMonth.replace(/^\d+\s+/u, "");

    return `${budget.startDate.getDate()}-${budget.endDate.getDate()} ${monthLabel}`;
  }

  return `${formatDayAndMonth(budget.startDate)} - ${formatDayAndMonth(budget.endDate)}`;
};

interface DeletedBudgetEntry {
  budget: BudgetPeriod;
  wasActive: boolean;
}

const ARCHIVE_CARD_STYLES = [
  {
    borderColor: "var(--color-accent-blue)",
    shadow: "var(--shadow-accent-blue)",
  },
  {
    borderColor: "var(--color-accent-green)",
    shadow: "var(--shadow-accent-green)",
  },
  {
    borderColor: "var(--color-accent-yellow)",
    shadow: "var(--shadow-accent-yellow)",
  },
] as const;

export const ArchivePage = () => {
  const navigate = useNavigate();
  const { currentBudget, loadBudget } = useBudget();
  const { isAuthenticated } = useAuth();
  const [budgets, setBudgets] = useState<BudgetPeriod[]>([]);
  const [deletedBudgets, setDeletedBudgets] = useState<DeletedBudgetEntry[]>([]);
  const [isUndoInfoAutoVisible, setIsUndoInfoAutoVisible] = useState(false);
  const [hasShownUndoInfo, setHasShownUndoInfo] = useState(false);

  const refreshArchive = useCallback(() => {
    setBudgets(loadBudgetHistory());
  }, []);

  useEffect(() => {
    refreshArchive();

    window.addEventListener("focus", refreshArchive);
    window.addEventListener("storage", refreshArchive);

    return () => {
      window.removeEventListener("focus", refreshArchive);
      window.removeEventListener("storage", refreshArchive);
    };
  }, [refreshArchive]);

  const handleOpenBudget = useCallback(
    (budget: BudgetPeriod) => {
      loadBudget(budget);
      navigate("/main");
    },
    [loadBudget, navigate],
  );

  const handleDeleteBudget = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, budget: BudgetPeriod) => {
      event.stopPropagation();

      const wasActive = currentBudget?.id === budget.id;
      setDeletedBudgets((previous) => [...previous, { budget, wasActive }]);

      if (!hasShownUndoInfo) {
        setHasShownUndoInfo(true);
        setIsUndoInfoAutoVisible(true);
      }

      const nextBudgets = deleteStoredBudget(budget.id);
      setBudgets(nextBudgets);

      if (isAuthenticated) {
        void saveRemoteBudgetSnapshot(getBudgetSnapshot()).catch((error) => {
          console.error("Не удалось синхронизировать архив с сервером:", error);
        });
      }

      if (wasActive && nextBudgets.length > 0) {
        loadBudget(nextBudgets[0]);
      }
    },
    [currentBudget?.id, hasShownUndoInfo, isAuthenticated, loadBudget],
  );

  const handleUndoDelete = useCallback(() => {
    const lastDeletedBudget = deletedBudgets[deletedBudgets.length - 1];

    if (!lastDeletedBudget) {
      return;
    }

    upsertBudgetHistory(lastDeletedBudget.budget);
    const restoredBudgets = loadBudgetHistory();
    setBudgets(restoredBudgets);
    setDeletedBudgets((previous) => previous.slice(0, -1));

    if (isAuthenticated) {
      void saveRemoteBudgetSnapshot(getBudgetSnapshot()).catch((error) => {
        console.error("Не удалось восстановить архив на сервере:", error);
      });
    }

    if (lastDeletedBudget.wasActive) {
      loadBudget(lastDeletedBudget.budget);
    }
  }, [deletedBudgets, isAuthenticated, loadBudget]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") {
        return;
      }

      if (event.shiftKey || deletedBudgets.length === 0) {
        return;
      }

      event.preventDefault();
      handleUndoDelete();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deletedBudgets.length, handleUndoDelete]);

  useEffect(() => {
    if (!isUndoInfoAutoVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsUndoInfoAutoVisible(false);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [isUndoInfoAutoVisible]);

  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        {budgets.map((budget, index) => {
          const cardStyle = ARCHIVE_CARD_STYLES[index % ARCHIVE_CARD_STYLES.length];

          return (
            <div
              key={budget.id}
              className={styles.budgetCard}
              style={
                {
                  "--card-border": cardStyle.borderColor,
                  "--button-shadow": cardStyle.shadow,
                } as React.CSSProperties
              }
            >
              <button
                type="button"
                className={styles.budgetButton}
                onClick={() => handleOpenBudget(budget)}
              >
                <span className={styles.budgetRange}>
                  {formatArchiveRange(budget)}
                </span>
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={(event) => handleDeleteBudget(event, budget)}
                aria-label={`Удалить бюджет ${formatArchiveRange(budget)}`}
                title="Удалить бюджет"
              >
                <DeleteOutlineIcon className={styles.deleteIcon} />
              </button>
            </div>
          );
        })}

        <div className={styles.createWrap}>
          <button
            type="button"
            className={styles.createButton}
            onClick={() => navigate("/form")}
          >
            Создать новый
          </button>
        </div>
      </div>

      <div className={styles.pageFooter}>
        <div className={styles.bottomNav}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/start")}
          >
            Вернуться
          </button>
        </div>

        <InfoHint
          ariaLabel="Информация об отмене удаления"
          messages={["Отменить удаление можно сочетанием Ctrl+Z."]}
          autoVisible={isUndoInfoAutoVisible}
          floating={false}
        />
      </div>
    </main>
  );
};
