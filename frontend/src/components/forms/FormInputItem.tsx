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

const parseAmountValue = (value: string): number => {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

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

  const handleSaveText = () => {
    if (editText.trim() !== item.text) {
      onUpdate({ text: editText.trim() });
    }
    setIsEditingText(false);
  };

  const handleSaveAmount = () => {
    const amountValue = parseAmountValue(editAmount);
    if (amountValue !== item.amount) {
      onUpdate({ amount: amountValue });
    }
    setIsEditingAmount(false);
  };

  const handleSaveComment = () => {
    if (editComment.trim() !== (item.comment || "")) {
      onUpdate({ comment: editComment.trim() || undefined });
    }
    setIsEditingComment(false);
  };

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
          <Box className={`${styles.segment} ${styles.textSegment}`}>
            {isEditingText ? (
              <TextField
              inputRef={textInputRef}
              autoComplete="off"
              variant="standard"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              onBlur={handleSaveText}
              onKeyDown={(event) => handleKeyDown(event, "text")}
              fullWidth
              name={`form-item-text-${item.id}`}
              inputProps={{
                autoComplete: "off",
                autoCapitalize: "off",
                spellCheck: false,
              }}
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
                letterSpacing: "0",
              }}
            >
              {item.text}
            </Typography>
            )}
          </Box>

          <Box className={`${styles.segment} ${styles.amountSegment}`}>
            {isEditingAmount ? (
              <TextField
              inputRef={amountInputRef}
              autoComplete="off"
              variant="standard"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              onBlur={handleSaveAmount}
              onKeyDown={(event) => handleKeyDown(event, "amount")}
              fullWidth
              name={`form-item-amount-${item.id}`}
              inputProps={{
                autoComplete: "off",
                inputMode: "decimal",
              }}
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

          {(item.comment || isEditingComment) && (
            <Box className={`${styles.segment} ${styles.commentSegment}`}>
              {isEditingComment ? (
                <TextField
                  inputRef={commentInputRef}
                  autoComplete="off"
                  variant="standard"
                  value={editComment}
                  onChange={(event) => setEditComment(event.target.value)}
                  onBlur={handleSaveComment}
                  onKeyDown={(event) => handleKeyDown(event, "comment")}
                  fullWidth
                  name={`form-item-comment-${item.id}`}
                  inputProps={{
                    autoComplete: "off",
                    autoCapitalize: "off",
                    spellCheck: false,
                  }}
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
