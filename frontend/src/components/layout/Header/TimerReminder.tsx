// components/layout/Header/TimerReminder.tsx
import React, { useState, useEffect } from 'react';
import styles from "./TimerReminder.module.scss";

interface TimerReminderProps {
  startDate: Date;
  endDate: Date;
}

export const TimerReminder: React.FC<TimerReminderProps> = ({
  startDate,
  endDate,
}) => {
  const [reminderText, setReminderText] = useState<string>('');
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const calculateReminder = () => {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Проверяем, начался ли период
      if (now < start) {
        setShowReminder(false);
        setReminderText('');
        return;
      }

      // Проверяем, закончился ли период
      if (now > end) {
        setShowReminder(true);
        setReminderText('Период завершен');
        return;
      }

      // Рассчитываем оставшееся время
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Показываем напоминание только когда осталось 7 дней или меньше
      if (daysLeft <= 7) {
        setShowReminder(true);
        
        // Определяем текст напоминания
        let message = '';
        if (daysLeft === 7) {
          message = 'Осталась неделя';
        } else if (daysLeft > 1) {
          message = `Осталось ${daysLeft} дня`;
        } else if (daysLeft === 1) {
          message = 'Завтра последний день';
        } else if (daysLeft === 0) {
          const hoursLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60));
          if (hoursLeft > 0) {
            message = 'Сегодня последний день';
          } else {
            message = 'Период завершен';
          }
        }
        
        setReminderText(message);
      } else {
        // Не показываем напоминание если больше 7 дней
        setShowReminder(false);
        setReminderText('');
      }
    };

    // Первый расчет
    calculateReminder();

    // Обновляем каждую минуту
    const intervalId = setInterval(calculateReminder, 60000);

    // Очистка интервала при размонтировании
    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  // Форматируем даты для отображения периода (только числа и месяца)
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  };

  // Получаем правильный цвет для текста напоминания
  const getReminderColor = (): string => {
    if (reminderText.includes('Период завершен')) {
      return '#5B5B5B'; // Красный для завершенного периода
    }
    if (reminderText.includes('последний день')) {
      return '#D87B7B'; // Красный для последнего дня
    }
    return '#D87B7B'; // Красный для всех напоминаний 
  };

  return (
    <div className={styles.root}>
      {/* Основной период - всегда отображается */}
      <div className={styles.periodText}>
        {formatDate(new Date(startDate))} – {formatDate(new Date(endDate))}
      </div>

      {/* Напоминание - появляется только когда осталось ≤ 7 дней */}
      {showReminder && (
        <div
          className={styles.reminderText}
          style={{ "--reminder-color": getReminderColor() } as React.CSSProperties}
        >
          {reminderText}
        </div>
      )}
    </div>
  );
};

export default TimerReminder;
