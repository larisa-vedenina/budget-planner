import React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import styles from "./LockToggle.module.scss";

interface LockToggleProps {
  isLocked: boolean;
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const LockToggle: React.FC<LockToggleProps> = ({
  isLocked,
  onToggle,
  size = 'medium',
}) => {
  const sizeMap = {
    small: { icon: 24, button: 40 },
    medium: { icon: 32, button: 43 },
    large: { icon: 40, button: 64 },
  };

  const { icon: iconSize, button: buttonSize } = sizeMap[size];
  const lockColor = isLocked ? "#D87B7B" : "#507B5D";

  return (
    <button
      onClick={onToggle}
      type="button"
      className={`${styles.button} ${!isLocked ? styles.buttonUnlocked : ""}`}
      style={
        {
          "--lock-size": `${buttonSize / 16}rem`,
          "--lock-color": lockColor,
        } as React.CSSProperties
      }
      aria-label={isLocked ? 'Разблокировать редактирование' : 'Заблокировать редактирование'}
      title={isLocked ? 'Нажмите для редактирования' : 'Нажмите для завершения редактирования'}
    >
      <div className={styles.iconWrap}>
        {isLocked ? (
          <LockIcon
            className={styles.icon}
            style={{ fontSize: iconSize }}
          />
        ) : (
          <LockOpenIcon
            className={styles.icon}
            style={{ fontSize: iconSize }}
          />
        )}
      </div>
    </button>
  );
};

export default LockToggle;
