import React, { ReactNode } from 'react';
import styles from "./Card.module.scss";

interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <div
      className={styles.card}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;
