import React, { InputHTMLAttributes } from 'react';
import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, style, ...props }) => {
  return (
    <input
      className={`${styles.input} ${error ? styles.error : ""}`}
      style={style}
      {...props}
    />
  );
};

export default Input;
