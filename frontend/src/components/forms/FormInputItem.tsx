import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FormInputItem as FormInputItemType } from "../../types/form";
import { remSpace } from "../../styles/units";
import { getSurfaceShadowVariable } from "../../styles/theme";
import styles from "./FormInputItem.module.scss";

interface FormInputItemProps {
  item: FormInputItemType;
  onRemove: () => void;
  onUpdate: (updates: Partial<FormInputItemType>) => void;
  borderColor: string;
}

// Держим сумму в безопасном виде, даже если пользователь вводит мусор.
const parseAmountValue = (value: string): number => {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

// Все редактируемые сегменты используют одинаковую внутреннюю типографику.
const fieldSx = (fontSize: string) => ({
  height: "100%",
  "& .MuiInputBase-root": {
    height: "100%",
    alignItems: "center",
    padding: 0,
  },
  "& .MuiInputBase-input": {
    padding: remSpace(12, 16),
    fontSize,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  "& .MuiInputBase-inputMultiline": {
    padding: remSpace(12, 16),
    fontSize,
    fontWeight: 400,
    lineHeight: 1.4,
  },
});

// При входе в режим редактирования сразу фокусируем поле и выделяем текст.
const focusAndSelect = <
  T extends HTMLInputElement | HTMLTextAreaElement,
>(
  ref: React.RefObject<T | null>,
) => {
  if (ref.current) {
    ref.current.focus();
    ref.current.select();
  }
};

const FormInputItem: React.FC<FormInputItemProps> = ({
  item,
  onRemove,
  onUpdate,
  borderColor,
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);

  const [editText, setEditText] = useState(item.text);
  const [editAmount, setEditAmount] = useState(item.amount.toString());
  const [editComment, setEditComment] = useState(item.comment || "");

  const textInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Синхронизируем локальное редактируемое состояние с внешними обновлениями.
  useEffect(() => {
    setEditText(item.text);
  }, [item.text]);

  useEffect(() => {
    setEditAmount(item.amount.toString());
  }, [item.amount]);

  useEffect(() => {
    setEditComment(item.comment || "");
  }, [item.comment]);

  useEffect(() => {
    if (isEditingText) {
      focusAndSelect(textInputRef);
    }
  }, [isEditingText]);

  useEffect(() => {
    if (isEditingAmount) {
      focusAndSelect(amountInputRef);
    }
  }, [isEditingAmount]);

  useEffect(() => {
    if (isEditingComment) {
      focusAndSelect(commentInputRef);
    }
  }, [isEditingComment]);

  // Сохраняем только реально измененный текст сегмента.
  const handleSaveText = () => {
    if (editText.trim() !== item.text) {
      onUpdate({ text: editText.trim() });
    }
    setIsEditingText(false);
  };

  // Нормализуем сумму перед сохранением.
  const handleSaveAmount = () => {
    const amountValue = parseAmountValue(editAmount);
    if (amountValue !== item.amount) {
      onUpdate({ amount: amountValue });
    }
    setIsEditingAmount(false);
  };

  // Пустой комментарий не сохраняем как строку.
  const handleSaveComment = () => {
    if (editComment.trim() !== (item.comment || "")) {
      onUpdate({ comment: editComment.trim() || undefined });
    }
    setIsEditingComment(false);
  };

  // Enter подтверждает редактирование, Escape возвращает исходное значение.
  const handleKeyDown = (
    event: React.KeyboardEvent,
    type: "text" | "amount" | "comment",
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (type === "text") handleSaveText();
      if (type === "amount") handleSaveAmount();
      if (type === "comment") handleSaveComment();
    }

    if (event.key === "Escape") {
      if (type === "text") {
        setEditText(item.text);
        setIsEditingText(false);
      }
      if (type === "amount") {
        setEditAmount(item.amount.toString());
        setIsEditingAmount(false);
      }
      if (type === "comment") {
        setEditComment(item.comment || "");
        setIsEditingComment(false);
      }
    }
  };

  // Форматируем сумму так же, как пользователь видит ее в бюджете.
  const formatAmount = (amount: number) => `${amount.toLocaleString("ru-RU")}₽`;

  return (
    <Box
      className={styles.item}
      style={
        {
          "--item-border-color": borderColor,
          "--item-shadow": getSurfaceShadowVariable(borderColor),
        } as React.CSSProperties
      }
      >
        <Box className={styles.segmentRow}>
          {/* Первый сегмент хранит описание пункта. */}
          <Box className={`${styles.segment} ${styles.textSegment}`}>
            {isEditingText ? (
              <TextField
              inputRef={textInputRef}
              variant="standard"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              onBlur={handleSaveText}
              onKeyDown={(event) => handleKeyDown(event, "text")}
              fullWidth
              InputProps={{ disableUnderline: true }}
              sx={fieldSx("1rem")}
            />
          ) : (
            <Typography
              component="div"
              onClick={() => setIsEditingText(true)}
              className={styles.segmentContent}
              sx={{
                fontSize: "1rem",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "0.01em",
              }}
            >
              {item.text}
            </Typography>
            )}
          </Box>

          {/* Второй сегмент отвечает только за сумму. */}
          <Box className={`${styles.segment} ${styles.amountSegment}`}>
            {isEditingAmount ? (
              <TextField
              inputRef={amountInputRef}
              variant="standard"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              onBlur={handleSaveAmount}
              onKeyDown={(event) => handleKeyDown(event, "amount")}
              fullWidth
              inputProps={{ inputMode: "decimal" }}
              InputProps={{ disableUnderline: true }}
              sx={fieldSx("1rem")}
            />
          ) : (
            <Typography
              component="div"
              onClick={() => setIsEditingAmount(true)}
              className={`${styles.segmentContent} ${styles.amountContent}`}
              sx={{
                fontSize: "1rem",
                fontWeight: 400,
                lineHeight: 1.4,
              }}
            >
              {formatAmount(item.amount)}
            </Typography>
            )}
          </Box>

          {/* Третий сегмент рендерим только если комментарий действительно есть. */}
          {(item.comment || isEditingComment) && (
            <Box className={`${styles.segment} ${styles.commentSegment}`}>
              {isEditingComment ? (
                <TextField
                  inputRef={commentInputRef}
                  variant="standard"
                  value={editComment}
                  onChange={(event) => setEditComment(event.target.value)}
                  onBlur={handleSaveComment}
                  onKeyDown={(event) => handleKeyDown(event, "comment")}
                  fullWidth
                  InputProps={{ disableUnderline: true }}
                  sx={fieldSx("1rem")}
                />
              ) : (
                <Typography
                component="div"
                onClick={() => setIsEditingComment(true)}
                className={`${styles.segmentContent} ${styles.secondaryValue}`}
                sx={{
                  fontSize: "1rem",
                  fontWeight: 400,
                  lineHeight: 1.4,
                  letterSpacing: "0.02em",
                }}
                >
                  {item.comment}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Кнопка удаления вынесена отдельно, чтобы не ломать ширину сегментов. */}
        <IconButton
          onClick={onRemove}
          size="small"
        className={styles.removeButton}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default FormInputItem;
