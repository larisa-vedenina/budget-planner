// Анимированный чекбокс
import React from "react";
import styles from "./AnimatedCheckbox.module.scss";

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
      className={`${styles.checkbox} ${checked ? styles.checked : ""}`}
      style={
        {
          "--checkbox-color": backgroundColor,
        } as React.CSSProperties
      }
    >
      {checked && <div className={styles.dot} />}
    </div>
  );
};

export default AnimatedCheckbox;
