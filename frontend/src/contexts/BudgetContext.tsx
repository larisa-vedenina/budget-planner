import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  BudgetPeriod,
  CellColor,
  createDefaultBudgetPeriod,
  calculateCompletedExpenses,
  calculateTotalExpenses,
} from "../types/budget";
import { ChecklistItemModel } from "../types/checklist-item";
import { NoteModel } from "../types/note";
import {
  applyBudgetSnapshot,
  clearBudgetStorage,
  deserializeBudget,
  getBudgetSnapshot,
  hasStoredBudgetData,
  loadCurrentBudget,
  loadStoredEditMode,
  saveBudgetSnapshot,
  saveStoredEditMode,
  serializeBudget,
  SerializedBudgetPeriod,
} from "../utils/budgetStorage";
import { useAuth } from "./AuthContext";
import {
  loadRemoteBudgetSnapshot,
  saveRemoteBudgetSnapshot,
} from "../services/budgetSyncService";
import { generateAIBudgetPlan } from "../services/aiBudgetService";
import { applyAIPlanToBudget } from "../utils/aiBudgetPlanToBudget";
import {
  canBuildAIRefreshRequest,
  createAIBudgetPlanRequestFromBudget,
  createAIRefreshSignature,
  hasSignificantAIPlanChanges,
  isCalculatedBudgetNoteId,
  isGeneratedAINote,
  withCalculatedBudgetNote,
} from "../utils/budgetAI";

interface BudgetContextType {
  currentBudget: BudgetPeriod | null;
  isEditMode: boolean;
  toggleEditMode: () => void;

  // Пункты
  addItem: (item: ChecklistItemModel, category: "required" | "desired") => void;
  updateItem: (item: ChecklistItemModel) => void;
  deleteItem: (id: string, category: "required" | "desired") => void;
  toggleItem: (id: string, category: "required" | "desired") => void;
  moveItem: (
    itemId: string,
    fromCategory: "required" | "desired",
    toCategory: "required" | "desired",
  ) => void;

  // Заметки
  addNote: (note: NoteModel) => void;
  updateNote: (note: NoteModel) => void;
  deleteNote: (id: string) => void;

  // Цвета
  updateColor: (
    cellType: "required" | "desired" | "notes",
    color: CellColor,
  ) => void;

  // Бюджет и период
  updateBudgetIncome: (newIncome: number) => void;
  updatePeriod: (startDate: Date, endDate: Date) => void;

  // Заголовки
  updateTitle: (
    category: "required" | "desired" | "notes",
    newTitle: string,
  ) => void;

  // Сохранение
  loadBudget: (budget: BudgetPeriod) => void;
  createNewBudget: () => void;
  saveBudget: () => void;
  clearStorage: () => void;

  // История
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Перетаскивание
  reorderItems: (
    category: "required" | "desired" | "notes",
    oldIndex: number,
    newIndex: number,
  ) => void;
  moveItemBetweenCategories: (
    itemId: string,
    fromCategory: "required" | "desired",
    toCategory: "required" | "desired",
  ) => void;

  // ИИ
  refreshAIPlan: () => Promise<void>;
  canRefreshAIPlan: boolean;
  isRefreshingAIPlan: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const authenticatedUserId = user?.id ?? null;

  interface BudgetHistoryItem {
    budget: SerializedBudgetPeriod;
    timestamp: Date;
    action: string;
  }

  const [currentBudget, setCurrentBudget] = useState<BudgetPeriod | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshingAIPlan, setIsRefreshingAIPlan] = useState(false);
  const [history, setHistory] = useState<BudgetHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastAuthenticatedUserIdRef = useRef<string | null>(null);

  const resetHistoryState = useCallback((budget: BudgetPeriod, action: string) => {
    setHistory([
      {
        budget: serializeBudget(budget),
        timestamp: new Date(),
        action,
      },
    ]);
    setHistoryIndex(0);
  }, []);

  const fallbackBudget = useMemo<BudgetPeriod>(
    () => ({
      id: "default_1",
      title: "Ноябрь 2024",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-11-30"),
      totalIncome: 100000,
      totalExpenses: 75000,
      remaining: 25000,
      requiredItems: [
        ChecklistItemModel.createDefault("required")
          .updateTitle("Аренда")
          .updateAmount(15000),
        ChecklistItemModel.createDefault("required")
          .updateTitle("Коммуналка")
          .updateAmount(5000),
      ],
      desiredItems: [
        ChecklistItemModel.createDefault("desired")
          .updateTitle("Одежда")
          .updateAmount(8000),
        ChecklistItemModel.createDefault("desired")
          .updateTitle("Фитнес")
          .updateAmount(7000),
      ],
      notes: [
        NoteModel.createAINote("Экономьте на коммунальных услугах"),
        NoteModel.createUserNote(),
      ],
      colors: {
        required: "#D87B7B" as CellColor,
        desired: "#69B5D3" as CellColor,
        notes: "#ABD0B7" as CellColor,
      },
      cellTitles: {
        required: "Обязательные",
        desired: "Необязательные",
        notes: "Заметки",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [],
  );

  const normalizeBudgetForState = useCallback((budget: BudgetPeriod) => {
    const normalizedBudget = withCalculatedBudgetNote(budget);

    if (
      normalizedBudget.aiPlanSignature ||
      !canBuildAIRefreshRequest(normalizedBudget)
    ) {
      return normalizedBudget;
    }

    return {
      ...normalizedBudget,
      aiPlanSignature: createAIRefreshSignature(normalizedBudget),
    };
  }, []);

  const restoreLocalBudgetState = useCallback(
    (fallbackAction: string) => {
      setIsEditMode(loadStoredEditMode());

      const storedBudget = loadCurrentBudget();
      if (storedBudget) {
        const normalizedBudget = normalizeBudgetForState(storedBudget);
        setCurrentBudget(normalizedBudget);
        resetHistoryState(normalizedBudget, "Загрузка бюджета");
        return;
      }

      const normalizedFallbackBudget = normalizeBudgetForState(fallbackBudget);
      setCurrentBudget(normalizedFallbackBudget);
      resetHistoryState(normalizedFallbackBudget, fallbackAction);
    },
    [fallbackBudget, normalizeBudgetForState, resetHistoryState],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let isCancelled = false;

    const initializeBudgetState = async () => {
      try {
        if (isAuthenticated && authenticatedUserId) {
          const remoteSnapshot = await loadRemoteBudgetSnapshot();

          if (isCancelled) {
            return;
          }

          if (
            remoteSnapshot &&
            (remoteSnapshot.currentBudget || remoteSnapshot.budgetsHistory.length > 0)
          ) {
            applyBudgetSnapshot(remoteSnapshot);
          } else if (hasStoredBudgetData()) {
            await saveRemoteBudgetSnapshot(getBudgetSnapshot());
          }

          lastAuthenticatedUserIdRef.current = authenticatedUserId;
          restoreLocalBudgetState("Инициализация бюджета");
          return;
        }

        if (lastAuthenticatedUserIdRef.current) {
          clearBudgetStorage();
          lastAuthenticatedUserIdRef.current = null;
        }

        restoreLocalBudgetState("Инициализация бюджета");
      } catch (error) {
        console.error("Ошибка загрузки бюджета:", error);

        if (!isCancelled) {
          const normalizedFallbackBudget = normalizeBudgetForState(fallbackBudget);
          setCurrentBudget(normalizedFallbackBudget);
          resetHistoryState(normalizedFallbackBudget, "Восстановление бюджета");
        }
      }
    };

    void initializeBudgetState();

    return () => {
      isCancelled = true;
    };
  }, [
    fallbackBudget,
    authenticatedUserId,
    isAuthenticated,
    isAuthLoading,
    normalizeBudgetForState,
    resetHistoryState,
    restoreLocalBudgetState,
  ]);

  const saveToStorage = useCallback(() => {
    if (!currentBudget) return;

    try {
      saveBudgetSnapshot(currentBudget, isEditMode);

      if (isAuthenticated) {
        void saveRemoteBudgetSnapshot(getBudgetSnapshot()).catch((error) => {
          console.error("Не удалось сохранить бюджет на сервере:", error);
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения бюджета:", error);
    }
  }, [currentBudget, isAuthenticated, isEditMode]);

  useEffect(() => {
    if (currentBudget) {
      const timeoutId = setTimeout(() => {
        saveToStorage();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [currentBudget, isEditMode, saveToStorage]);

  const updateBudgetWithRecalculation = (
    budget: BudgetPeriod,
    updates: Partial<BudgetPeriod>,
  ): BudgetPeriod => {
    const updatedBudget = {
      ...budget,
      ...updates,
      updatedAt: new Date(),
    };

    updatedBudget.totalExpenses = calculateTotalExpenses(updatedBudget);
    const completedExpenses = calculateCompletedExpenses(updatedBudget);
    updatedBudget.remaining = updatedBudget.totalIncome - completedExpenses;

    return withCalculatedBudgetNote(updatedBudget);
  };

  const addToHistory = useCallback(
    (action: string, budget: BudgetPeriod) => {
      const newHistoryItem: BudgetHistoryItem = {
        budget: serializeBudget(budget),
        timestamp: new Date(),
        action,
      };

      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        newHistoryItem,
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousBudget = history[newIndex].budget;

      const restoredBudget = deserializeBudget(previousBudget);
      setCurrentBudget(restoredBudget);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextBudget = history[newIndex].budget;

      const restoredBudget = deserializeBudget(nextBudget);
      setCurrentBudget(restoredBudget);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!window.location.pathname.endsWith("/main")) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  const switchToViewMode = useCallback(() => {
    setIsEditMode(false);
    saveStoredEditMode(false);
  }, []);

  const sortActiveItemsByPriority = (
    items: ChecklistItemModel[],
  ): ChecklistItemModel[] => {
    const activeItems = items.filter((item) => !item.completed);
    const completedItems = items.filter((item) => item.completed);

    return [
      ...activeItems.filter((item) => item.priority === "priority"),
      ...activeItems.filter((item) => item.priority !== "priority"),
      ...completedItems,
    ];
  };

  const addItem = (
    item: ChecklistItemModel,
    category: "required" | "desired",
  ) => {
    const budget = currentBudget || fallbackBudget;

    const items =
      category === "required" ? budget.requiredItems : budget.desiredItems;
    const updatedItems = [...items, item];
    const sortedItems = sortActiveItemsByPriority(updatedItems);

    const updatedRequiredItems =
      category === "required" ? sortedItems : budget.requiredItems;

    const updatedDesiredItems =
      category === "desired" ? sortedItems : budget.desiredItems;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      requiredItems: updatedRequiredItems,
      desiredItems: updatedDesiredItems,
    });

    addToHistory("Добавление пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const updateItem = (updatedItem: ChecklistItemModel) => {
    const budget = currentBudget || fallbackBudget;

    const previousRequiredItem = budget.requiredItems.find(
      (item) => item.id === updatedItem.id,
    );
    const previousDesiredItem = budget.desiredItems.find(
      (item) => item.id === updatedItem.id,
    );
    const shouldSortByPriority =
      (previousRequiredItem?.priority ?? previousDesiredItem?.priority) !==
      updatedItem.priority;

    const nextRequiredItems = previousRequiredItem
      ? budget.requiredItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item,
        )
      : budget.requiredItems;
    const nextDesiredItems = previousDesiredItem
      ? budget.desiredItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item,
        )
      : budget.desiredItems;

    const updatedRequiredItems =
      shouldSortByPriority && previousRequiredItem
        ? sortActiveItemsByPriority(nextRequiredItems)
        : nextRequiredItems;
    const updatedDesiredItems =
      shouldSortByPriority && previousDesiredItem
        ? sortActiveItemsByPriority(nextDesiredItems)
        : nextDesiredItems;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      requiredItems: updatedRequiredItems,
      desiredItems: updatedDesiredItems,
    });

    addToHistory("Обновление пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const deleteItem = (id: string, category: "required" | "desired") => {
    const budget = currentBudget || fallbackBudget;

    const updatedRequiredItems =
      category === "required"
        ? budget.requiredItems.filter((item) => item.id !== id)
        : budget.requiredItems;

    const updatedDesiredItems =
      category === "desired"
        ? budget.desiredItems.filter((item) => item.id !== id)
        : budget.desiredItems;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      requiredItems: updatedRequiredItems,
      desiredItems: updatedDesiredItems,
    });

    addToHistory("Удаление пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const toggleItem = (id: string, category: "required" | "desired") => {
    const budget = currentBudget || fallbackBudget;

    const updatedRequiredItems =
      category === "required"
        ? budget.requiredItems.map((item) =>
            item.id === id ? item.toggleCompleted() : item,
          )
        : budget.requiredItems;

    const updatedDesiredItems =
      category === "desired"
        ? budget.desiredItems.map((item) =>
            item.id === id ? item.toggleCompleted() : item,
          )
        : budget.desiredItems;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      requiredItems: updatedRequiredItems,
      desiredItems: updatedDesiredItems,
    });

    addToHistory("Переключение пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const reorderItems = useCallback(
    (
      category: "required" | "desired" | "notes",
      oldIndex: number,
      newIndex: number,
    ) => {
      const budget = currentBudget || fallbackBudget;

      if (category === "notes") {
        const updatedNotes = [...budget.notes];
        const [movedNote] = updatedNotes.splice(oldIndex, 1);
        updatedNotes.splice(newIndex, 0, movedNote);

        const updatedBudget = updateBudgetWithRecalculation(budget, {
          notes: updatedNotes,
        });

        addToHistory("Переупорядочивание заметок", updatedBudget);
        setCurrentBudget(updatedBudget);
      } else {
        const items =
          category === "required" ? budget.requiredItems : budget.desiredItems;
        const activeItems = items.filter((item) => !item.completed);
        const completedItems = items.filter((item) => item.completed);
        const updatedActiveItems = [...activeItems];
        const [movedItem] = updatedActiveItems.splice(oldIndex, 1);

        if (!movedItem) {
          return;
        }

        updatedActiveItems.splice(newIndex, 0, movedItem);
        const updatedItems = [...updatedActiveItems, ...completedItems];

        const updatedBudget = updateBudgetWithRecalculation(budget, {
          [category === "required" ? "requiredItems" : "desiredItems"]:
            updatedItems,
        });

        addToHistory("Переупорядочивание пунктов", updatedBudget);
        setCurrentBudget(updatedBudget);
      }
    },
    [currentBudget, fallbackBudget, addToHistory],
  );

  const moveItemBetweenCategories = useCallback(
    (
      itemId: string,
      fromCategory: "required" | "desired",
      toCategory: "required" | "desired",
    ) => {
      const budget = currentBudget || fallbackBudget;

      const sourceItems =
        fromCategory === "required"
          ? budget.requiredItems
          : budget.desiredItems;
      const itemToMove = sourceItems.find((item) => item.id === itemId);

      if (!itemToMove) {
        return;
      }

      const movedItem = new ChecklistItemModel(
        itemToMove.id,
        itemToMove.title,
        itemToMove.amount,
        itemToMove.completed,
        toCategory,
        itemToMove.priority,
        itemToMove.completedAt,
        itemToMove.dragState,
        itemToMove.createdAt,
        itemToMove.badge,
        itemToMove.dateLabel,
      );

      const updatedSourceItems = sourceItems.filter(
        (item) => item.id !== itemId,
      );

      const targetItems =
        toCategory === "required" ? budget.requiredItems : budget.desiredItems;
      const updatedTargetItems = [movedItem, ...targetItems];

      const updatedBudget = updateBudgetWithRecalculation(budget, {
        requiredItems:
          fromCategory === "required"
            ? updatedSourceItems
            : toCategory === "required"
              ? updatedTargetItems
              : budget.requiredItems,
        desiredItems:
          fromCategory === "desired"
            ? updatedSourceItems
            : toCategory === "desired"
              ? updatedTargetItems
              : budget.desiredItems,
      });

      addToHistory("Перемещение пункта между категориями", updatedBudget);
      setCurrentBudget(updatedBudget);
    },
    [currentBudget, fallbackBudget, addToHistory],
  );

  const addNote = (note: NoteModel) => {
    const budget = currentBudget || fallbackBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      notes: [...budget.notes, note],
    });

    addToHistory("Добавление заметки", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const updateNote = (updatedNote: NoteModel) => {
    const budget = currentBudget || fallbackBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      notes: budget.notes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    });

    addToHistory("Обновление заметки", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const deleteNote = (id: string) => {
    const budget = currentBudget || fallbackBudget;
    const isDeletingCalculatedBudgetNote = isCalculatedBudgetNoteId(id);

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      notes: budget.notes.filter((note) => note.id !== id),
      isCalculatedBudgetNoteHidden:
        isDeletingCalculatedBudgetNote ||
        budget.isCalculatedBudgetNoteHidden,
    });

    addToHistory("Удаление заметки", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const updateColor = (
    cellType: "required" | "desired" | "notes",
    color: CellColor,
  ) => {
    const budget = currentBudget || fallbackBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      colors: {
        ...budget.colors,
        [cellType]: color,
      },
    });

    addToHistory("Изменение цвета", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const updateBudgetIncome = (newIncome: number) => {
    const budget = currentBudget || fallbackBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      totalIncome: newIncome,
    });

    addToHistory("Изменение бюджета", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const updatePeriod = (startDate: Date, endDate: Date) => {
    const budget = currentBudget || fallbackBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      startDate,
      endDate,
      title: `${startDate.toLocaleDateString("ru-RU", { month: "long" })} ${startDate.getFullYear()}`,
    });

    addToHistory("Изменение периода", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const updateTitle = (
    category: "required" | "desired" | "notes",
    newTitle: string,
  ) => {
    const budget = currentBudget || fallbackBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      cellTitles: {
        ...budget.cellTitles,
        [category]: newTitle,
      },
    });

    addToHistory("Изменение заголовка", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  const loadBudget = (budget: BudgetPeriod) => {
    const normalizedBudget = normalizeBudgetForState(budget);
    switchToViewMode();
    setCurrentBudget(normalizedBudget);
    resetHistoryState(normalizedBudget, "Загрузка бюджета");
  };

  const createNewBudget = () => {
    const newBudget = normalizeBudgetForState(createDefaultBudgetPeriod());
    switchToViewMode();
    setCurrentBudget(newBudget);
    resetHistoryState(newBudget, "Создание нового бюджета");
  };

  const saveBudget = () => {
    saveToStorage();
  };

  const clearStorage = () => {
    clearBudgetStorage();

    if (isAuthenticated) {
      void saveRemoteBudgetSnapshot(getBudgetSnapshot()).catch((error) => {
        console.error("Не удалось очистить бюджет на сервере:", error);
      });
    }

    window.location.reload();
  };

  const budgetForAIRefresh = currentBudget || fallbackBudget;
  const canRefreshAIPlan = useMemo(() => {
    if (!canBuildAIRefreshRequest(budgetForAIRefresh) || isRefreshingAIPlan) {
      return false;
    }

    return hasSignificantAIPlanChanges(budgetForAIRefresh);
  }, [budgetForAIRefresh, isRefreshingAIPlan]);

  const refreshAIPlan = useCallback(async () => {
    const budget = currentBudget || fallbackBudget;

    if (!canBuildAIRefreshRequest(budget)) {
      return;
    }

    setIsRefreshingAIPlan(true);

    try {
      const requestPayload = createAIBudgetPlanRequestFromBudget(budget);
      const aiPlan = await generateAIBudgetPlan(requestPayload);
      const preservedNotes = budget.notes.filter(
        (note) => !isGeneratedAINote(note),
      );
      const budgetWithAIPlan = applyAIPlanToBudget(budget, aiPlan, preservedNotes);
      const recalculatedBudget = updateBudgetWithRecalculation(budgetWithAIPlan, {});
      const updatedBudget = updateBudgetWithRecalculation(recalculatedBudget, {
        aiPlanSignature: createAIRefreshSignature(recalculatedBudget),
      });

      addToHistory("Обновление ИИ-плана", updatedBudget);
      setCurrentBudget(updatedBudget);
      switchToViewMode();
    } catch (error) {
      console.error("Не удалось обновить ИИ-план:", error);
      window.alert("Не получилось обновить ИИ-план. Попробуй еще раз позже.");
    } finally {
      setIsRefreshingAIPlan(false);
    }
  }, [addToHistory, currentBudget, fallbackBudget, switchToViewMode]);

  const value: BudgetContextType = {
    currentBudget: currentBudget || fallbackBudget,
    isEditMode,
    toggleEditMode,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    moveItem: moveItemBetweenCategories,
    addNote,
    updateNote,
    deleteNote,
    updateColor,
    updateBudgetIncome,
    updatePeriod,
    updateTitle,
    loadBudget,
    createNewBudget,
    saveBudget,
    clearStorage,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    reorderItems,
    moveItemBetweenCategories,
    refreshAIPlan,
    canRefreshAIPlan,
    isRefreshingAIPlan,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within BudgetProvider");
  }
  return context;
};
