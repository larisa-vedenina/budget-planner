import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '3px solid #D87B7B',
        borderRadius: '10px',
        boxShadow: '-2px 2px 1px rgba(0, 0, 0, 0.25)',
        padding: '20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;