import React from 'react';
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  borderColor?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  borderColor,
  fullWidth = false,
  style,
  ...props
}) => {
  const className = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      style={
        {
          ...style,
          ...(borderColor ? { "--button-border": borderColor } : {}),
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
