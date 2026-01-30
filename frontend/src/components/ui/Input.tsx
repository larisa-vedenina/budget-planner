import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, style, ...props }) => {
  return (
    <input
      style={{
        border: `1px solid ${error ? '#D87B7B' : '#D9D9D9'}`,
        borderRadius: '5px',
        padding: '10px',
        fontSize: '16px',
        fontFamily: 'Roboto Condensed, sans-serif',
        width: '100%',
        ...style,
      }}
      {...props}
    />
  );
};

export default Input;