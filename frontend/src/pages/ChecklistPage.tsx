import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Lock, LockOpen, Add } from "@mui/icons-material";
import { AccountBalanceWallet, CalendarToday } from "@mui/icons-material";

// Модели
import { ChecklistItemModel } from "../models/ChecklistItemModel";
import { NoteModel } from "../models/NoteModel";

// Компоненты
import ChecklistItem from "../components/ChecklistItem/ChecklistItem";
import NoteItem from "../components/NoteItem/NoteItem";
import DraggableList from "../components/DraggableList/DraggableList";

/**
 * Главная страница с чек-листом и заметками
 */
const ChecklistPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [budget, setBudget] = useState(50000);

  const [startDate, setStartDate] = useState(() => {
    // Начало текущего месяца по умолчанию
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
  });

  const [endDate, setEndDate] = useState(() => {
    // Конец текущего месяца по умолчанию
    const now = new Date();
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${lastDay}`;
  });

  // Состояния для чек-листа
  const [mandatoryExpenses, setMandatoryExpenses] = useState<
    ChecklistItemModel[]
  >([
    new ChecklistItemModel(
      "1",
      "Аренда квартиры",
      15000,
      false,
      "mandatory",
      "red"
    ),
    new ChecklistItemModel(
      "2",
      "Коммунальные услуги",
      5000,
      false,
      "mandatory",
      "red"
    ),
  ]);

  const [optionalExpenses, setOptionalExpenses] = useState<
    ChecklistItemModel[]
  >([
    new ChecklistItemModel("3", "Одежда", 8000, false, "optional", "yellow"),
    new ChecklistItemModel(
      "4",
      "Развлечения",
      5000,
      false,
      "optional",
      "green"
    ),
  ]);

  // Состояния для заметок
  const [notes, setNotes] = useState<NoteModel[]>([
    NoteModel.createAINote(
      "Экономьте на коммунальных услугах: установите счетчики"
    ),
    NoteModel.createAINote("Откладывайте 10% от каждого дохода"),
  ]);

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  useEffect(() => {
    saveToLocalStorage();
  }, [mandatoryExpenses, optionalExpenses, notes, budget, startDate, endDate]);

  /**
   * Форматирование периода из дат в читаемый вид
   */
  const formatPeriod = (start: string, end: string): string => {
    if (!start || !end) return "Период не указан";

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Проверяем, что дата валидна
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return `${start} - ${end}`;
      }

      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();

      // Функция для правильного склонения месяца
      const getMonthName = (date: Date): string => {
        const monthNames = [
          "января",
          "февраля",
          "марта",
          "апреля",
          "мая",
          "июня",
          "июля",
          "августа",
          "сентября",
          "октября",
          "ноября",
          "декабря",
        ];
        return monthNames[date.getMonth()];
      };

      /// Один месяц и один год
      if (startYear === endYear && startMonth === endMonth) {
        const monthName = getMonthName(startDate);
        const year =
          startYear !== new Date().getFullYear() ? ` ${startYear}` : "";
        return `${startDay} - ${endDay} ${monthName}${year}`;
      }

      // Разные месяцы, но один год
      if (startYear === endYear) {
        const startMonthName = getMonthName(startDate);
        const endMonthName = getMonthName(endDate);
        const year =
          startYear !== new Date().getFullYear() ? ` ${startYear}` : "";
        return `${startDay} ${startMonthName} - ${endDay} ${endMonthName}${year}`;
      }

      // Разные годы
      const startMonthName = getMonthName(startDate);
      const endMonthName = getMonthName(endDate);
      return `${startDay} ${startMonthName} ${startYear} - ${endDay} ${endMonthName} ${endYear}`;
    } catch (error) {
      return `${start} - ${end}`;
    }
  };

  /**
   * Проверяет валидность периода (startDate <= endDate)
   */
  const isDateRangeValid = (start: string, end: string): boolean => {
    if (!start || !end) return true;

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return startDate <= endDate;
    } catch (error) {
      return true;
    }
  };

  /**
   * Получает сообщение об ошибке для периода
   */
  const getDateRangeError = (start: string, end: string): string => {
    if (!start || !end) return "";

    if (!isDateRangeValid(start, end)) {
      return "Дата 'от' не может быть позже даты 'до'";
    }

    return "";
  };

  /**
   * Переупорядочивает пункты чек-листа
   */
  const reorderExpenses = (
    newItems: ChecklistItemModel[],
    category: "mandatory" | "optional"
  ) => {
    const setter =
      category === "mandatory" ? setMandatoryExpenses : setOptionalExpenses;
    setter(newItems);
  };

  /**
   * Переупорядочивает заметки
   */
  const reorderNotes = (newNotes: NoteModel[]) => {
    setNotes(newNotes);
  };

  /**
   * Добавляет новую заметку
   */
  const addNote = () => {
    const newNote = NoteModel.createUserNote();
    setNotes((prev) => [...prev, newNote]);
  };

  /**
   * Обновляет заметку
   */
  const updateNote = (updatedNote: NoteModel) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
  };

  /**
   * Удаляет заметку
   */
  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  /**
   * Вычисляет оставшийся бюджет
   */
  const calculateRemainingBudget = (): number => {
    const allExpenses = [...mandatoryExpenses, ...optionalExpenses];
    const spent = allExpenses
      .filter((expense) => expense.completed)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return budget - spent;
  };

  /**
   * Вычисляет оставшийся бюджет по категории
   */
  const calculateCategoryRemaining = (
    expenses: ChecklistItemModel[]
  ): number => {
    return expenses
      .filter((expense) => !expense.completed)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  /**
   * Добавляет новый пункт в обязательные расходы
   */
  const addMandatoryExpense = () => {
    const newItem = ChecklistItemModel.createDefault("mandatory");
    setMandatoryExpenses((prev) => [...prev, newItem]);
  };

  /**
   * Добавляет новый пункт в желаемые расходы
   */
  const addOptionalExpense = () => {
    const newItem = ChecklistItemModel.createDefault("optional");
    setOptionalExpenses((prev) => [...prev, newItem]);
  };

  /**
   * Обновляет пункт чек-листа
   */
  const updateExpense = (
    updatedItem: ChecklistItemModel,
    category: "mandatory" | "optional"
  ) => {
    const setter =
      category === "mandatory" ? setMandatoryExpenses : setOptionalExpenses;
    setter((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  /**
   * Удаляет пункт чек-листа
   */
  const deleteExpense = (id: string, category: "mandatory" | "optional") => {
    const setter =
      category === "mandatory" ? setMandatoryExpenses : setOptionalExpenses;
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Переключает состояние выполнения пункта
   */
  const toggleExpense = (id: string, category: "mandatory" | "optional") => {
    const setter =
      category === "mandatory" ? setMandatoryExpenses : setOptionalExpenses;
    setter((prev) =>
      prev.map((item) => (item.id === id ? item.toggleCompleted() : item))
    );
  };

  const saveToLocalStorage = () => {
    const data = {
      mandatoryExpenses,
      optionalExpenses,
      notes,
      budget,
      startDate,
      endDate,
    };
    localStorage.setItem("budgetData", JSON.stringify(data));
  };

  // загрузка при старте
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem("budgetData");
    if (saved) {
      const data = JSON.parse(saved);

      // Восстановить бюджет
      if (data.budget) {
        setBudget(data.budget);
      }

      // Восстановить даты (если есть в сохраненных данных)
      if (data.startDate && data.endDate) {
        setStartDate(data.startDate);
        setEndDate(data.endDate);
      }

      // Восстановить расходы (если есть)
      if (data.mandatoryExpenses) {
        setMandatoryExpenses(
          data.mandatoryExpenses.map(
            (exp: any) =>
              new ChecklistItemModel(
                exp.id,
                exp.title,
                exp.amount,
                exp.completed,
                exp.category,
                exp.color
              )
          )
        );
      }

      if (data.optionalExpenses) {
        setOptionalExpenses(
          data.optionalExpenses.map(
            (exp: any) =>
              new ChecklistItemModel(
                exp.id,
                exp.title,
                exp.amount,
                exp.completed,
                exp.category,
                exp.color
              )
          )
        );
      }

      // Восстановить заметки (если есть)
      if (data.notes) {
        setNotes(
          data.notes.map(
            (note: any) =>
              new NoteModel(
                note.id,
                note.content,
                note.type,
                new Date(note.createdAt)
              )
          )
        );
      }
    }
  };

  const remainingBudget = calculateRemainingBudget();
  const mandatoryRemaining = calculateCategoryRemaining(mandatoryExpenses);
  const optionalRemaining = calculateCategoryRemaining(optionalExpenses);

  return (
    <Container maxWidth="lg" sx={{ py: 3, height: "100vh" }}>
      <Box
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Левая часть - Бюджет */}
        <Box sx={{ flex: 1 }}>
          {isEditing ? (
            // режим редактирования
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h1" component="span">
                  Бюджет:
                </Typography>
                <TextField
                  type="number"
                  value={budget}
                  onChange={(e) => {
                    const newBudget = Math.max(0, Number(e.target.value));
                    setBudget(newBudget);
                  }}
                  variant="standard"
                  size="small"
                  sx={{ width: 120 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₽</InputAdornment>
                    ),
                  }}
                  error={budget <= 0}
                  helperText={
                    budget <= 0 ? "Бюджет должен быть положительным" : ""
                  }
                />
              </Box>
            </Box>
          ) : (
            <Typography variant="h1" component="span">
              Бюджет: {budget.toLocaleString()} ₽
            </Typography>
          )}

          <Typography variant="h2" color="text">
            Осталось: {remainingBudget.toLocaleString()} ₽
          </Typography>
        </Box>

        {/* Центральная часть - Период */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          {isEditing ? (
            // режим редактирования периода
            <Box display="flex" flexDirection="column" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  variant="standard"
                  size="small"
                  sx={{ width: 140 }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!isDateRangeValid(startDate, endDate)}
                />
                <Typography
                  variant="body2"
                  color={
                    !isDateRangeValid(startDate, endDate)
                      ? "error"
                      : "text.secondary"
                  }
                >
                  до
                </Typography>
                <TextField
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  variant="standard"
                  size="small"
                  sx={{ width: 140 }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!isDateRangeValid(startDate, endDate)}
                />
              </Box>
              {/* Сообщение об ошибке периода */}
              {!isDateRangeValid(startDate, endDate) && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {getDateRangeError(startDate, endDate)}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="h2" component="span">
              {formatPeriod(startDate, endDate)}
            </Typography>
          )}
        </Box>

        {/* Правая часть - Иконка замка */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            onClick={() => setIsEditing(!isEditing)}
            color={isEditing ? "primary" : "default"}
          >
            {isEditing ? <LockOpen /> : <Lock />}
          </IconButton>
        </Box>
      </Box>

      {/* Основной контент */}
      <Grid
        container
        spacing={3}
        sx={{ minHeight: "70vh", height: "auto", alignItems: "stretch" }}
      >
        {/* Левая колонка - Чек-лист */}
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Paper sx={{ p: 2, flex: 1, minHeight: "50%", overflow: "auto" }}>
            {/* Обязательные расходы */}
            <Box mb={4}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h2">ОБЯЗАТЕЛЬНЫЕ</Typography>
                <Typography variant="h2" color="primary">
                  Осталось: {mandatoryRemaining.toLocaleString()} ₽
                </Typography>
              </Box>

              <DraggableList
                items={mandatoryExpenses}
                isEditing={isEditing}
                onReorder={(newItems) => reorderExpenses(newItems, "mandatory")}
                renderItem={(item, index, dragHandleProps) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                    onUpdate={(updatedItem) =>
                      updateExpense(updatedItem, "mandatory")
                    }
                    onDelete={(id) => deleteExpense(id, "mandatory")}
                    onToggle={(id) => toggleExpense(id, "mandatory")}
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
          </Paper>
          <Paper sx={{ p: 2, flex: 1, minheight: "50%", overflow: "auto" }}>
            {/* Желаемые расходы */}
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h2">ЖЕЛАЕМЫЕ</Typography>
                <Typography variant="h2" color="primary">
                  Осталось: {optionalRemaining.toLocaleString()} ₽
                </Typography>
              </Box>

              <DraggableList
                items={optionalExpenses}
                isEditing={isEditing}
                onReorder={(newItems) => reorderExpenses(newItems, "optional")}
                renderItem={(item, index, dragHandleProps) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isEditing={isEditing}
                    onUpdate={(updatedItem) =>
                      updateExpense(updatedItem, "optional")
                    }
                    onDelete={(id) => deleteExpense(id, "optional")}
                    onToggle={(id) => toggleExpense(id, "optional")}
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
          <Paper sx={{ p: 2, height: "100%", overflow: "auto" }}>
            <Typography variant="h2" gutterBottom color="primary">
              ЗАМЕТКИ И СОВЕТЫ
            </Typography>

            <DraggableList
              items={notes}
              isEditing={isEditing}
              onReorder={reorderNotes}
              renderItem={(note, index, dragHandleProps) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isEditing={isEditing}
                  onUpdate={updateNote}
                  onDelete={deleteNote}
                  dragHandleProps={dragHandleProps}
                />
              )}
            />

            {isEditing && (
              <Button
                fullWidth
                startIcon={<Add />}
                onClick={addNote}
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
