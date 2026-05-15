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
      
      if (now < start) {
        setShowReminder(false);
        setReminderText('');
        return;
      }

      if (now > end) {
        setShowReminder(true);
        setReminderText('Период завершен');
        return;
      }

      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 7) {
        setShowReminder(true);
        
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
        setShowReminder(false);
        setReminderText('');
      }
    };

    calculateReminder();

    const intervalId = setInterval(calculateReminder, 60000);

    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  };

  const getPeriodDays = (): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return 0;
    }

    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDays = (days: number): string => {
    const normalizedDays = Math.max(1, days);
    const lastTwoDigits = normalizedDays % 100;
    const lastDigit = normalizedDays % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${normalizedDays} дней`;
    }

    if (lastDigit === 1) {
      return `${normalizedDays} день`;
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return `${normalizedDays} дня`;
    }

    return `${normalizedDays} дней`;
  };

  const getReminderColor = (): string => {
    if (reminderText.includes('Период завершен')) {
      return '#5B5B5B';
    }
    if (reminderText.includes('последний день')) {
      return '#D87B7B';
    }
    return '#D87B7B';
  };

  return (
    <div className={styles.root}>
      <div className={styles.periodText}>
        {formatDate(new Date(startDate))} – {formatDate(new Date(endDate))}
      </div>
      <div className={styles.periodDaysText}>{formatDays(getPeriodDays())}</div>

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
