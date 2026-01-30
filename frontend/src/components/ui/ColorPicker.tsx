// components/budget/BudgetCard/ColorPickerButton.tsx
import React, { useState } from "react";
import { Box, Popover } from "@mui/material";
import { CellColor } from "../../types/budget";

interface ColorPickerButtonProps {
  currentColor: CellColor;
  onColorChange: (color: CellColor) => void;
}

export const ColorPickerButton: React.FC<ColorPickerButtonProps> = ({
  currentColor,
  onColorChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // 6 доступных цветов из ТЗ
  const availableColors: CellColor[] = [
    "#D87B7B", // Красный (темный)
    "#507B5D", // Зеленый (темный)
    "#69B5D3", // Голубой (темный)
    "#FCD688", // Желтый (светлый)
    "#FFDFDF", // Светло-красный (светлый)
    "#CAEEFC", // Светло-голубой (светлый)
    "#FFE8B9", // Светло-желтый (светлый)
    "#ABD0B7", // Светло-зеленый (светлый)
  ];

  return (
    <>
      {/* Кнопка выбора цвета */}
      <button
        onClick={handleClick}
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: currentColor,
          border: "2px solid #F9F9F9",
          cursor: "pointer",
          position: "absolute",
          bottom: "12px",
          left: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
        aria-label="Выбрать цвет фона"
        title="Изменить цвет фона"
      />

      {/* Поповер с выбором цвета */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box
          sx={{
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {availableColors.map((color) => (
            <button
              key={color}
              onClick={() => {
                console.log("Выбран цвет:", color); // Для отладки
                onColorChange(color);
                handleClose();
              }}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: color,
                border:
                  color === currentColor
                    ? "2px solid #0D0D0D"
                    : "1px solid #D9D9D9",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              aria-label={`Выбрать цвет ${color}`}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
};

export default ColorPickerButton;
