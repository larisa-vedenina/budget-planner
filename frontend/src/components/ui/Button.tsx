import React from 'react';

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
  // Цвета бордера в зависимости от варианта
  const getBorderColor = () => {
    if (borderColor) return borderColor;
    
    switch (variant) {
      case 'primary': return '#D87B7B'; // Красный
      case 'secondary': return '#69B5D3'; // Голубой
      case 'danger': return '#D87B7B'; // Красный
      case 'success': return '#507B5D'; // Зеленый
      default: return '#D87B7B';
    }
  };

  return (
    <button
      style={{
        background: '#FFFFFF',
        border: `4px solid ${getBorderColor()}`,
        borderRadius: '10px',
        padding: '15px 50px',
        boxShadow: '-2px 2px 1px rgba(0, 0, 0, 0.25)',
        width: fullWidth ? '100%' : 'auto',
        cursor: 'pointer',
        fontSize: '24px',
        color: '#0D0D0D',
        fontFamily: 'Roboto Condensed, sans-serif',
        fontWeight: 400,
        transition: 'all 0.2s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-1px, 1px)';
        e.currentTarget.style.boxShadow = '-1px 1px 0.5px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0, 0)';
        e.currentTarget.style.boxShadow = '-2px 2px 1px rgba(0, 0, 0, 0.25)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;