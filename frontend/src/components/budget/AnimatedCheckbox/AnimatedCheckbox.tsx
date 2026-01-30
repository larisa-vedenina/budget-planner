// Анимированный чекбокс
import React from "react";

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: () => void;
  backgroundColor?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  backgroundColor = "inherit", // Значение по умолчанию
}) => {
  return (
    <div
      onClick={onChange}
      style={{
        width: "24px",
        height: "24px",
        border: checked ? "none" : "1px solid #D9D9D9",
        borderRadius: "5px",
        boxShadow: checked ? "none" : "-1px 1px 0.5px rgba(0, 0, 0, 0.25)",
        transform: checked ? "translate(-1px, 1px)" : "none",
        backgroundColor: checked ? backgroundColor : "#FFFFFF", // Используем здесь
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}
    >
      {checked && (
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: backgroundColor, // Цвет фона ячейки
          }}
        />
      )}
    </div>
  );
};

export default AnimatedCheckbox;
