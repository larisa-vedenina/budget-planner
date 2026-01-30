// components/ui/LockToggle/LockToggle.tsx
import React from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

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

  return (
    <button
      onClick={onToggle}
      style={{
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: "transparent",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        // boxShadow: '-2px 2px 1px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label={isLocked ? 'Разблокировать редактирование' : 'Заблокировать редактирование'}
      title={isLocked ? 'Нажмите для редактирования' : 'Нажмите для завершения редактирования'}
    >
      {/* Анимация вращения */}
      <div style={{
        transition: 'transform 0.3s ease',
        transform: isLocked ? 'rotate(0deg)' : 'rotate(180deg)',
      }}>
        {isLocked ? (
          <LockIcon
            style={{
              fontSize: iconSize,
              color: '#D87B7B', // Красный для заблокированного
            }}
          />
        ) : (
          <LockOpenIcon
            style={{
              fontSize: iconSize,
              color: '#507B5D', // Зеленый для разблокированного
            }}
          />
        )}
      </div>

      {/* Тонкая обводка в зависимости от состояния */}
      {/* <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '50%',
        border: `3px solid ${isLocked ? '#D87B7B' : '#507B5D'}`,
        pointerEvents: 'none',
      }} /> */}

      {/* Индикатор состояния (текстовая подсказка) */}
      <div style={{
        position: 'absolute',
        bottom: '-25px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '12px',
        color: isLocked ? '#D87B7B' : '#507B5D',
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
      }}>
        {isLocked ? '🔒 Заблокировано' : '🔓 Редактирование'}
      </div>
    </button>
  );
};

export default LockToggle;