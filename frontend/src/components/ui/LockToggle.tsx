// components/ui/LockToggle/LockToggle.tsx
import React from 'react';
import { publicImageSrc } from "../../utils/publicImageSrc";
import styles from "./LockToggle.module.scss";

interface LockToggleProps {
  isLocked: boolean; // true = режим просмотра, false = режим редактирования
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const LockToggle: React.FC<LockToggleProps> = ({
  isLocked,
  onToggle,
  size = 'medium',
}) => {
  // Размеры в зависимости от пропса size
  const sizeMap = {
    small: { icon: 24, button: 40 },
    medium: { icon: 32, button: 43 },
    large: { icon: 40, button: 64 },
  };

  const { icon: iconSize, button: buttonSize } = sizeMap[size];
  const iconSrc = isLocked
    ? publicImageSrc("lock.png")
    : publicImageSrc("lock_open.png");

  return (
    <button
      onClick={onToggle}
      type="button"
      className={`${styles.button} ${!isLocked ? styles.buttonUnlocked : ""}`}
      style={
        {
          "--lock-size": `${buttonSize / 25}rem`,
          "--lock-icon-size": `${iconSize / 10}rem`,
        } as React.CSSProperties
      }
      aria-label={isLocked ? 'Разблокировать редактирование' : 'Заблокировать редактирование'}
      title={isLocked ? 'Нажмите для редактирования' : 'Нажмите для завершения редактирования'}
    >
      <div className={styles.iconWrap}>
        <img src={iconSrc} alt="" aria-hidden="true" className={styles.icon} />
      </div>
    </button>
  );
};

export default LockToggle;
