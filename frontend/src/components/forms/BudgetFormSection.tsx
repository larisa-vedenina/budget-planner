import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Typography, TextField } from "@mui/material";
import FormInputItem from "./FormInputItem";
import DateRangePicker from "./DateRangePicker";
import {
  FormSection,
  FormInputItem as FormInputItemType,
} from "../../types/form";
import { pxToRem } from "../../styles/units";
import { getSurfaceShadowVariable } from "../../styles/theme";
import styles from "./BudgetFormSection.module.scss";

interface BudgetFormSectionProps {
  section: FormSection;
  onChange: (items: FormInputItemType[]) => void;
  onPeriodChange?: (start: string, end: string) => void;
  periodValue?: {
    startDate: string;
    endDate: string;
  };
  isNested?: boolean;
  showHeader?: boolean;
}

const DESKTOP_TEXT_WIDTH = pxToRem(200);
const DESKTOP_AMOUNT_WIDTH = pxToRem(120);
const DESKTOP_COMMENT_WIDTH = pxToRem(180);

// Парсим сумму и не даем невалидным значениям ломать форму
const parseAmountValue = (value: string | undefined): number => {
  const parsedValue = Number.parseFloat(value ?? "");
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

// Все обычные поля секций используют один и тот же визуальный шаблон.
const getSectionInputSx = (index: number) => ({
  flexGrow: index === 2 ? 1 : 0,
  flexShrink: 1,
  flexBasis: {
    xs:
      index === 0
        ? "calc(100% - 8.125rem)"
        : index === 1
          ? DESKTOP_AMOUNT_WIDTH
          : "100%",
    sm:
      index === 0
        ? DESKTOP_TEXT_WIDTH
        : index === 1
          ? DESKTOP_AMOUNT_WIDTH
          : DESKTOP_COMMENT_WIDTH,
  },
  minWidth: 0,
  "& .MuiOutlinedInput-root": {
    minHeight: pxToRem(50),
    height: pxToRem(50),
    backgroundColor: "#FFFFFF",
    borderRadius: pxToRem(5),
    boxShadow: "none",
    "& fieldset": {
      borderColor: "#D9D9D9",
      borderWidth: pxToRem(2),
    },
    "&:hover fieldset": {
      borderColor: "#D9D9D9",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D9D9D9",
      borderWidth: pxToRem(2),
    },
    "& input": {
      color: "#5B5B5B",
      fontFamily: "'Roboto Condensed', sans-serif",
      fontSize: pxToRem(16),
      opacity: 0.6,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    "& input::placeholder": {
      fontSize: pxToRem(16),
      opacity: 1,
    },
  },
});

const BudgetFormSection: React.FC<BudgetFormSectionProps> = ({
  section,
  onChange,
  onPeriodChange,
  periodValue,
  isNested = false,
  showHeader = true,
}) => {
  const emptyInputValues = useMemo(
    () => section.inputs.placeholders.map(() => ""),
    [section.inputs.placeholders],
  );
  const [inputValues, setInputValues] = useState<string[]>(emptyInputValues);
  const [isEnterHintVisible, setIsEnterHintVisible] = useState(false);

  useEffect(() => {
    setInputValues(emptyInputValues);
  }, [emptyInputValues]);

  useEffect(() => {
    if (section.inputs.items.length > 0) {
      setIsEnterHintVisible(false);
    }
  }, [section.inputs.items.length]);

  // Меняем только одно поле, не пересобирая весь массив вручную снаружи.
  const handleInputChange = useCallback((index: number, value: string) => {
    setInputValues((prev) => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
  }, []);

  // Подсказка нужна только до первого добавленного пункта в секции.
  const handleInputFocus = useCallback(() => {
    if (section.inputs.items.length === 0) {
      setIsEnterHintVisible(true);
    }
  }, [section.inputs.items.length]);

  // После добавления возвращаем фокус в первое поле секции.
  const focusFirstInput = useCallback(() => {
    setTimeout(() => {
      const inputs = document.querySelectorAll(
        `[data-section="${section.id}"] input`,
      );
      if (inputs[0]) {
        (inputs[0] as HTMLInputElement).focus();
      }
    }, 10);
  }, [section.id]);

  // Собираем новый пункт из текущих значений строки ввода.
  const createFormItem = useCallback(
    (): FormInputItemType => ({
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      text: inputValues[0]?.trim() || "",
      amount: parseAmountValue(inputValues[1]),
      comment: inputValues[2]?.trim() || undefined,
    }),
    [inputValues],
  );

  // Добавляем пункт по Enter и очищаем строку ввода.
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && inputValues[0]?.trim()) {
        e.preventDefault();
        onChange([...section.inputs.items, createFormItem()]);
        setInputValues(section.inputs.placeholders.map(() => ""));
        setIsEnterHintVisible(false);
        focusFirstInput();
      }
    },
    [
      createFormItem,
      focusFirstInput,
      inputValues,
      section.inputs.items,
      section.inputs.placeholders,
      onChange,
    ],
  );

  // Удаляем пункт по id без изменений остальных элементов.
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const updatedItems = section.inputs.items.filter(
        (item) => item.id !== itemId,
      );
      onChange(updatedItems);
    },
    [section.inputs.items, onChange],
  );

  // Точечно обновляем редактируемый пункт.
  const handleUpdateItem = useCallback(
    (itemId: string, updates: Partial<FormInputItemType>) => {
      const updatedItems = section.inputs.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      );
      onChange(updatedItems);
    },
    [section.inputs.items, onChange],
  );

  // Период рендерится отдельно, потому что вместо строки ввода там календарь.
  if (section.id === "period") {
    return (
      <Box
        className={`${styles.section} ${isNested ? styles.nested : ""}`}
        style={
          {
            "--section-color": section.color,
            "--section-shadow": getSurfaceShadowVariable(section.color),
          } as React.CSSProperties
        }
        sx={{
          padding: isNested ? 0 : { xs: pxToRem(18), sm: pxToRem(25) },
        }}
      >
        {onPeriodChange && (
          <DateRangePicker
            startDate={periodValue?.startDate ?? ""}
            endDate={periodValue?.endDate ?? ""}
            onChange={onPeriodChange}
            accentColor={section.color}
          />
        )}
      </Box>
    );
  }

  // Остальные секции используют одинаковую структуру: заголовок, строка ввода и список пунктов.
  return (
    <Box
      className={`${styles.section} ${isNested ? styles.nested : ""}`}
      style={
        {
          "--section-color": section.color,
          "--section-shadow": getSurfaceShadowVariable(section.color),
        } as React.CSSProperties
      }
      sx={{
        padding: isNested ? 0 : { xs: pxToRem(18), sm: pxToRem(25) },
      }}
    >
      {showHeader && (
        <Box className={styles.header}>
          <Typography
            variant="h2"
            className={styles.title}
            sx={{
              fontSize: pxToRem(18),
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: "0",
            }}
          >
            {section.title}
          </Typography>
        </Box>
      )}

      <Box className={styles.inputRow} data-section={section.id}>
        {section.inputs.placeholders.map((placeholder, index) => (
          <TextField
            key={index}
            autoComplete="off"
            placeholder={placeholder}
            value={inputValues[index]}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            fullWidth
            name={`budget-${section.id}-${index}`}
            inputProps={{
              autoComplete: "off",
              autoCapitalize: "off",
              inputMode: index === 1 ? "decimal" : "text",
              spellCheck: index === 1 ? undefined : false,
            }}
            sx={getSectionInputSx(index)}
          />
        ))}
      </Box>

      {isEnterHintVisible && section.inputs.items.length === 0 && (
        <Box component="p" className={styles.enterHint}>
          Заполни поля и нажми Enter
        </Box>
      )}

      {section.inputs.items.map((item) => (
        <FormInputItem
          key={item.id}
          item={item}
          onRemove={() => handleRemoveItem(item.id)}
          onUpdate={(updates) => handleUpdateItem(item.id, updates)}
          borderColor={section.color}
        />
      ))}
    </Box>
  );
};

export default BudgetFormSection;
