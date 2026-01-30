import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import {
  BudgetPeriod,
  CellColor,
  createDefaultBudgetPeriod,
  calculateCompletedExpenses,
  calculateActiveExpenses,
  calculateTotalExpenses,
} from "../types/budget";
import { ChecklistItemModel } from "../types/checklist-item";
import { NoteModel } from "../types/note";

interface BudgetContextType {
  currentBudget: BudgetPeriod | null;
  isEditMode: boolean;
  toggleEditMode: () => void;

  // Работа с пунктами
  addItem: (item: ChecklistItemModel, category: "required" | "desired") => void;
  updateItem: (item: ChecklistItemModel) => void;
  deleteItem: (id: string, category: "required" | "desired") => void;
  toggleItem: (id: string, category: "required" | "desired") => void;
  moveItem: (
    itemId: string,
    fromCategory: "required" | "desired",
    toCategory: "required" | "desired",
  ) => void;

  // Работа с заметками
  addNote: (note: NoteModel) => void;
  updateNote: (note: NoteModel) => void;
  deleteNote: (id: string) => void;

  // Цвета
  updateColor: (
    cellType: "required" | "desired" | "notes",
    color: CellColor,
  ) => void;

  // Работа с бюджетом и периодом
  updateBudgetIncome: (newIncome: number) => void;
  updatePeriod: (startDate: Date, endDate: Date) => void;

  // Работа с заголовками
  updateTitle: (
    category: "required" | "desired" | "notes",
    newTitle: string,
  ) => void;

  // Загрузка/сохранение
  loadBudget: (budget: BudgetPeriod) => void;
  createNewBudget: () => void;
  saveBudget: () => void;
  clearStorage: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Drag & Drop
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
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// Ключи для localStorage
const STORAGE_KEYS = {
  CURRENT_BUDGET: "budget_app_current_budget",
  EDIT_MODE: "budget_app_edit_mode",
  BUDGETS_HISTORY: "budget_app_budgets_history",
};

// Вспомогательная функция для сериализации бюджета
const serializeBudget = (budget: BudgetPeriod): any => {
  return {
    ...budget,
    startDate: budget.startDate.toISOString(),
    endDate: budget.endDate.toISOString(),
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
    requiredItems: budget.requiredItems.map((item) => ({
      id: item.id,
      title: item.title,
      amount: item.amount,
      category: item.category,
      completed: item.completed,
      priority: item.priority,
      completedAt: item.completedAt?.toISOString(),
      dragState: item.dragState,
      createdAt: item.createdAt.toISOString(),
    })),
    desiredItems: budget.desiredItems.map((item) => ({
      id: item.id,
      title: item.title,
      amount: item.amount,
      category: item.category,
      completed: item.completed,
      priority: item.priority,
      completedAt: item.completedAt?.toISOString(),
      dragState: item.dragState,
      createdAt: item.createdAt.toISOString(),
    })),
    notes: budget.notes.map((note) => ({
      id: note.id,
      content: note.content,
      type: note.type,
      createdAt: note.createdAt.toISOString(),
    })),
  };
};

// Вспомогательная функция для десериализации бюджета
const deserializeBudget = (data: any): BudgetPeriod => {
  return {
    ...data,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    requiredItems: data.requiredItems.map((item: any) => {
      return new ChecklistItemModel(
        item.id,
        item.title,
        item.amount,
        item.completed,
        item.category,
        item.priority,
        item.completedAt ? new Date(item.completedAt) : undefined,
        item.dragState || "idle",
        new Date(item.createdAt),
      );
    }),
    desiredItems: data.desiredItems.map((item: any) => {
      return new ChecklistItemModel(
        item.id,
        item.title,
        item.amount,
        item.completed,
        item.category,
        item.priority,
        item.completedAt ? new Date(item.completedAt) : undefined,
        item.dragState || "idle",
        new Date(item.createdAt),
      );
    }),
    notes: data.notes.map((note: any) => {
      return new NoteModel(
        note.id,
        note.content,
        note.type,
        new Date(note.createdAt),
      );
    }),
  };
};

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Интерфейс для истории действий
  interface BudgetHistoryItem {
    budget: BudgetPeriod;
    timestamp: Date;
    action: string;
  }

  const [currentBudget, setCurrentBudget] = useState<BudgetPeriod | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [history, setHistory] = useState<BudgetHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Mock данные для тестирования
  const mockBudget: BudgetPeriod = {
    id: "mock_1",
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
      desired: "#507B5D" as CellColor,
      notes: "#69B5D3" as CellColor,
    },
    cellTitles: {
      required: "ОБЯЗАТЕЛЬНЫЕ",
      desired: "ЖЕЛАЕМЫЕ",
      notes: "ЗАМЕТКИ",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 1. ЗАГРУЗКА ДАННЫХ ПРИ МОНТИРОВАНИИ
  useEffect(() => {
    console.log("BudgetProvider: Загрузка данных из localStorage...");

    try {
      // Загружаем режим редактирования
      const savedEditMode = localStorage.getItem(STORAGE_KEYS.EDIT_MODE);
      if (savedEditMode) {
        setIsEditMode(JSON.parse(savedEditMode));
      }

      // Загружаем текущий бюджет
      const savedBudget = localStorage.getItem(STORAGE_KEYS.CURRENT_BUDGET);
      if (savedBudget) {
        const parsedData = JSON.parse(savedBudget);
        const budget = deserializeBudget(parsedData);

        console.log("BudgetProvider: Бюджет загружен из localStorage");
        setCurrentBudget(budget);
      } else {
        // Если нет сохраненного бюджета, используем мок данные
        console.log("BudgetProvider: Используем mock данные");
        setCurrentBudget(mockBudget);
      }
    } catch (error) {
      console.error("BudgetProvider: Ошибка загрузки данных:", error);
      setCurrentBudget(mockBudget);
    }
  }, []);

  // 2. ФУНКЦИЯ ДЛЯ СОХРАНЕНИЯ ДАННЫХ
  const saveToStorage = useCallback(() => {
    if (!currentBudget) return;

    console.log("BudgetProvider: Сохранение данных в localStorage...");

    try {
      // Сохраняем режим редактирования
      localStorage.setItem(STORAGE_KEYS.EDIT_MODE, JSON.stringify(isEditMode));

      // Сохраняем текущий бюджет
      const serializedBudget = serializeBudget(currentBudget);
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_BUDGET,
        JSON.stringify(serializedBudget),
      );

      // Добавляем в историю для архива
      const historyStr = localStorage.getItem(STORAGE_KEYS.BUDGETS_HISTORY);
      let history: any[] = [];

      if (historyStr) {
        try {
          history = JSON.parse(historyStr);
        } catch (e) {
          console.error("Ошибка парсинга истории:", e);
        }
      }

      // Ищем, есть ли уже этот бюджет в истории
      const existingIndex = history.findIndex((b) => b.id === currentBudget.id);

      if (existingIndex !== -1) {
        // Обновляем существующий
        history[existingIndex] = serializedBudget;
      } else {
        // Добавляем новый
        history.push(serializedBudget);
      }

      // Сохраняем историю
      localStorage.setItem(
        STORAGE_KEYS.BUDGETS_HISTORY,
        JSON.stringify(history),
      );

      console.log("BudgetProvider: Данные успешно сохранены");
    } catch (error) {
      console.error("BudgetProvider: Ошибка сохранения данных:", error);
    }
  }, [currentBudget, isEditMode]);

  // 3. АВТОСОХРАНЕНИЕ ПРИ ИЗМЕНЕНИЯХ
  useEffect(() => {
    if (currentBudget) {
      const timeoutId = setTimeout(() => {
        saveToStorage();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [currentBudget, isEditMode, saveToStorage]);

  // Вспомогательная функция для обновления бюджета с пересчетом всех сумм
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

    return updatedBudget;
  };

  // Функция для добавления в историю
  const addToHistory = useCallback(
    (action: string, budget: BudgetPeriod) => {
      const newHistoryItem: BudgetHistoryItem = {
        budget: JSON.parse(JSON.stringify(budget)), // глубокое копирование
        timestamp: new Date(),
        action,
      };

      // Обрезаем историю после текущего индекса
      const newHistory = [
        ...history.slice(0, historyIndex + 1),
        newHistoryItem,
      ];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      console.log("История добавлена:", {
        action,
        historyLength: newHistory.length,
      });
    },
    [history, historyIndex],
  );

  // Функции undo/redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousBudget = history[newIndex].budget;

      // Восстанавливаем бюджет
      const restoredBudget = deserializeBudget(previousBudget);
      setCurrentBudget(restoredBudget);

      console.log("Undo выполнен:", {
        index: newIndex,
        action: history[newIndex].action,
      });
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextBudget = history[newIndex].budget;

      const restoredBudget = deserializeBudget(nextBudget);
      setCurrentBudget(restoredBudget);

      console.log("Redo выполнен:", {
        index: newIndex,
        action: history[newIndex].action,
      });
    }
  }, [history, historyIndex]);

  // Добавляем обработчик клавиш Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo(); // Ctrl+Shift+Z для redo
        } else {
          undo(); // Ctrl+Z для undo
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  // Добавление пункта
  const addItem = (
    item: ChecklistItemModel,
    category: "required" | "desired",
  ) => {
    const budget = currentBudget || mockBudget;

    // Добавляем новый пункт
    const items =
      category === "required" ? budget.requiredItems : budget.desiredItems;
    const updatedItems = [...items, item];

    // Сортируем: приоритетные → старые → новые
    const sortedItems = [...updatedItems].sort((a, b) => {
      // Только для активных пунктов
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      if (!a.completed && !b.completed) {
        // Приоритетные сверху
        if (a.priority === "priority" && b.priority !== "priority") return -1;
        if (a.priority !== "priority" && b.priority === "priority") return 1;

        // Старые выше новых
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      // Выполненные остаются в конце
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const updatedRequiredItems =
      category === "required" ? sortedItems : budget.requiredItems;

    const updatedDesiredItems =
      category === "desired" ? sortedItems : budget.desiredItems;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      requiredItems: updatedRequiredItems,
      desiredItems: updatedDesiredItems,
    });

    console.log("addItem:", { category, newItem: item, updatedBudget });
    addToHistory("Добавление пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Обновление пункта
  const updateItem = (updatedItem: ChecklistItemModel) => {
    const budget = currentBudget || mockBudget;

    let itemFound = false;
    const updatedRequiredItems = budget.requiredItems.map((item) => {
      if (item.id === updatedItem.id) {
        itemFound = true;
        return updatedItem;
      }
      return item;
    });

    let updatedDesiredItems = budget.desiredItems;
    if (!itemFound) {
      updatedDesiredItems = budget.desiredItems.map((item) => {
        if (item.id === updatedItem.id) {
          return updatedItem;
        }
        return item;
      });
    }

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      requiredItems: updatedRequiredItems,
      desiredItems: updatedDesiredItems,
    });

    console.log("updateItem:", { updatedItem, updatedBudget });
    addToHistory("Обновление пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Удаление пункта
  const deleteItem = (id: string, category: "required" | "desired") => {
    const budget = currentBudget || mockBudget;

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

    console.log("deleteItem:", { id, category, updatedBudget });
    addToHistory("Удаление пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Переключение состояния выполнения пункта
  const toggleItem = (id: string, category: "required" | "desired") => {
    const budget = currentBudget || mockBudget;

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

    console.log("toggleItem:", {
      id,
      category,
      item: [...updatedRequiredItems, ...updatedDesiredItems].find(
        (i) => i.id === id,
      ),
      completedExpenses: calculateCompletedExpenses(updatedBudget),
      remaining: updatedBudget.remaining,
    });
    addToHistory("Переключение пункта", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Переупорядочивание внутри категории
  const reorderItems = useCallback(
    (
      category: "required" | "desired" | "notes",
      oldIndex: number,
      newIndex: number,
    ) => {
      const budget = currentBudget || mockBudget;

      if (category === "notes") {
        const updatedNotes = [...budget.notes];
        const [movedNote] = updatedNotes.splice(oldIndex, 1);
        updatedNotes.splice(newIndex, 0, movedNote);

        const updatedBudget = updateBudgetWithRecalculation(budget, {
          notes: updatedNotes,
        });

        console.log("reorderItems: заметки", { oldIndex, newIndex });
        addToHistory("Переупорядочивание заметок", updatedBudget);
        setCurrentBudget(updatedBudget);
      } else {
        const items =
          category === "required" ? budget.requiredItems : budget.desiredItems;
        const updatedItems = [...items];
        const [movedItem] = updatedItems.splice(oldIndex, 1);
        updatedItems.splice(newIndex, 0, movedItem);

        const updatedBudget = updateBudgetWithRecalculation(budget, {
          [category === "required" ? "requiredItems" : "desiredItems"]:
            updatedItems,
        });

        console.log("reorderItems:", { category, oldIndex, newIndex });
        addToHistory("Переупорядочивание пунктов", updatedBudget);
        setCurrentBudget(updatedBudget);
      }
    },
    [currentBudget, addToHistory],
  );

  // Перемещение между категориями (только required <-> desired)
  const moveItemBetweenCategories = useCallback(
    (
      itemId: string,
      fromCategory: "required" | "desired",
      toCategory: "required" | "desired",
    ) => {
      const budget = currentBudget || mockBudget;

      // Находим перемещаемый пункт
      const sourceItems =
        fromCategory === "required"
          ? budget.requiredItems
          : budget.desiredItems;
      const itemToMove = sourceItems.find((item) => item.id === itemId);

      if (!itemToMove) {
        console.error("moveItemBetweenCategories: пункт не найден", {
          itemId,
          fromCategory,
        });
        return;
      }

      // Создаем новый объект с измененной категорией
      const movedItem = new ChecklistItemModel(
        itemToMove.id,
        itemToMove.title,
        itemToMove.amount,
        itemToMove.completed,
        toCategory, // Новая категория
        itemToMove.priority,
        itemToMove.completedAt,
        itemToMove.dragState,
        itemToMove.createdAt,
      );

      // Удаляем из исходной категории
      const updatedSourceItems = sourceItems.filter(
        (item) => item.id !== itemId,
      );

      // Добавляем в целевую категорию (в начало)
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

      console.log("moveItemBetweenCategories:", {
        itemId,
        fromCategory,
        toCategory,
        itemTitle: itemToMove.title,
      });

      addToHistory("Перемещение пункта между категориями", updatedBudget);
      setCurrentBudget(updatedBudget);
    },
    [currentBudget, addToHistory],
  );

  // Добавление заметки
  const addNote = (note: NoteModel) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      notes: [...budget.notes, note],
    });

    console.log("addNote:", { note, updatedBudget });
    addToHistory("Добавление заметки", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Обновление заметки
  const updateNote = (updatedNote: NoteModel) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      notes: budget.notes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note,
      ),
    });

    console.log("updateNote:", { updatedNote, updatedBudget });
    addToHistory("Обновление заметки", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Удаление заметки
  const deleteNote = (id: string) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      notes: budget.notes.filter((note) => note.id !== id),
    });

    console.log("deleteNote:", { id, updatedBudget });
    addToHistory("Удаление заметки", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Обновление цвета ячейки
  const updateColor = (
    cellType: "required" | "desired" | "notes",
    color: CellColor,
  ) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      colors: {
        ...budget.colors,
        [cellType]: color,
      },
    });

    console.log("updateColor:", { cellType, color, updatedBudget });
    addToHistory("Изменение цвета", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Обновление дохода бюджета
  const updateBudgetIncome = (newIncome: number) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      totalIncome: newIncome,
    });

    console.log("updateBudgetIncome:", {
      newIncome,
      oldIncome: budget.totalIncome,
      remaining: updatedBudget.remaining,
      updatedBudget,
    });
    addToHistory("Изменение бюджета", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Обновление периода
  const updatePeriod = (startDate: Date, endDate: Date) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      startDate,
      endDate,
      title: `${startDate.toLocaleDateString("ru-RU", { month: "long" })} ${startDate.getFullYear()}`,
    });

    console.log("updatePeriod:", { startDate, endDate, updatedBudget });
    addToHistory("Изменение периода", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Обновление заголовков ячеек
  const updateTitle = (
    category: "required" | "desired" | "notes",
    newTitle: string,
  ) => {
    const budget = currentBudget || mockBudget;

    const updatedBudget = updateBudgetWithRecalculation(budget, {
      cellTitles: {
        ...budget.cellTitles,
        [category]: newTitle,
      },
    });

    console.log("updateTitle:", { category, newTitle, updatedBudget });
    addToHistory("Изменение заголовка", updatedBudget);
    setCurrentBudget(updatedBudget);
  };

  // Загрузка бюджета
  const loadBudget = (budget: BudgetPeriod) => {
    console.log("loadBudget:", budget);
    setCurrentBudget(budget);
  };

  // Создание нового бюджета
  const createNewBudget = () => {
    console.log("createNewBudget");
    const newBudget = createDefaultBudgetPeriod();
    setCurrentBudget(newBudget);
  };

  // Сохранение бюджета
  const saveBudget = () => {
    saveToStorage();
  };

  // Очистка хранилища
  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_BUDGET);
    localStorage.removeItem(STORAGE_KEYS.EDIT_MODE);
    console.log("Хранилище очищено");
    window.location.reload();
  };

  const value: BudgetContextType = {
    currentBudget: currentBudget || mockBudget,
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
    // Undo/Redo
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    // Drag & Drop
    reorderItems,
    moveItemBetweenCategories,
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
