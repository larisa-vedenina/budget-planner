import React, { useMemo, useState } from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PickerDay, PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import {
  format,
  isAfter,
  isSameDay,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";
import { publicImageSrc } from "../../utils/publicImageSrc";
import styles from "./DateRangePicker.module.scss";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  accentColor?: string;
}

interface RangePickerDayProps extends PickerDayProps {
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  previewStart?: Date | null;
  previewEnd?: Date | null;
}

const calendarIconSrc = publicImageSrc("calendar.png");
const RANGE_SEPARATOR = " – ";

// Пропускаем только валидные даты, чтобы диапазон не ломался на пустых значениях.
const isValidDate = (value: Date | null | undefined): value is Date =>
  Boolean(value && !Number.isNaN(value.getTime()));

const formatStorageDate = (value: Date): string => format(value, "yyyy-MM-dd");

const formatDisplayDate = (value: Date, includeYear = true): string =>
  format(value, includeYear ? "d MMMM yyyy" : "d MMMM", { locale: ru });

// Всегда храним диапазон в прямом порядке: от ранней даты к поздней.
const normalizeRange = (start: Date, end: Date) =>
  isAfter(start, end)
    ? { start: end, end: start }
    : {
        start,
        end,
      };

// Кастомный день нужен, чтобы подсвечивать весь выбранный диапазон.
const RangePickerDay: React.FC<RangePickerDayProps> = ({
  day,
  outsideCurrentMonth,
  rangeStart,
  rangeEnd,
  previewStart,
  previewEnd,
  ...other
}) => {
  const effectiveStart = isValidDate(rangeStart) ? rangeStart : previewStart;
  const effectiveEnd = isValidDate(rangeEnd) ? rangeEnd : previewEnd;

  const normalizedRange =
    isValidDate(effectiveStart) && isValidDate(effectiveEnd)
      ? normalizeRange(effectiveStart, effectiveEnd)
      : null;

  const isInRange =
    normalizedRange &&
    isWithinInterval(day, {
      start: normalizedRange.start,
      end: normalizedRange.end,
    });

  const isRangeStart = Boolean(
    normalizedRange && isSameDay(day, normalizedRange.start),
  );

  const isRangeEnd = Boolean(normalizedRange && isSameDay(day, normalizedRange.end));

  const isSingleDayRange = isRangeStart && isRangeEnd;

  return (
    <Box
      sx={{
        borderRadius: 0,
        backgroundColor: isInRange
          ? "rgba(216, 123, 123, 0.22)"
          : "transparent",
        ...(isRangeStart && {
          borderTopLeftRadius: "999px",
          borderBottomLeftRadius: "999px",
        }),
        ...(isRangeEnd && {
          borderTopRightRadius: "999px",
          borderBottomRightRadius: "999px",
        }),
        ...(isSingleDayRange && {
          borderRadius: "999px",
        }),
      }}
    >
      <PickerDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        selected={false}
        sx={{
          color:
            isRangeStart || isRangeEnd
              ? "var(--color-white)"
              : "var(--color-text-primary)",
          backgroundColor:
            isRangeStart || isRangeEnd ? "var(--picker-accent)" : "transparent",
          fontWeight: 400,
          "&:hover": {
            backgroundColor:
              isRangeStart || isRangeEnd
                ? "var(--picker-accent)"
                : "transparent",
          },
          "&:focus": {
            backgroundColor:
              isRangeStart || isRangeEnd
                ? "var(--picker-accent)"
                : "transparent",
          },
        }}
      />
    </Box>
  );
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  accentColor = "#D87B7B",
}) => {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const selectedStartDate = useMemo(() => {
    const parsedDate = startDate ? parseISO(startDate) : null;
    return isValidDate(parsedDate) ? parsedDate : null;
  }, [startDate]);

  const selectedEndDate = useMemo(() => {
    const parsedDate = endDate ? parseISO(endDate) : null;
    return isValidDate(parsedDate) ? parsedDate : null;
  }, [endDate]);

  const isOpen = Boolean(anchorEl);
  const isSelectingEnd = isValidDate(selectedStartDate) && !isValidDate(selectedEndDate);

  const previewRange =
    isSelectingEnd && isValidDate(hoveredDay)
      ? normalizeRange(selectedStartDate, hoveredDay)
      : null;

  const selectedRange =
    isValidDate(selectedStartDate) && isValidDate(selectedEndDate)
      ? normalizeRange(selectedStartDate, selectedEndDate)
      : isValidDate(selectedStartDate)
        ? {
            start: selectedStartDate,
            end: selectedStartDate,
          }
        : null;

  // Сохраняем якорь, чтобы поповер открывался точно от иконки календаря.
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // При закрытии сбрасываем только hover-предпросмотр диапазона.
  const handleClose = () => {
    setAnchorEl(null);
    setHoveredDay(null);
  };

  // Первый клик задает старт периода, второй завершает диапазон.
  const handleChange = (newValue: Date | null) => {
    if (!isValidDate(newValue)) {
      return;
    }

    if (!isValidDate(selectedStartDate) || isValidDate(selectedEndDate)) {
      onChange(formatStorageDate(newValue), "");
      return;
    }

    const normalizedRange = normalizeRange(selectedStartDate, newValue);
    onChange(
      formatStorageDate(normalizedRange.start),
      formatStorageDate(normalizedRange.end),
    );
    handleClose();
  };

  const handleDayHover = (day: Date) => {
    if (isSelectingEnd) {
      setHoveredDay(day);
    }
  };

  // Если год один и тот же, не дублируем его в обеих датах.
  const selectedLabel =
    isValidDate(selectedStartDate) && isValidDate(selectedEndDate)
      ? selectedStartDate.getFullYear() === selectedEndDate.getFullYear()
        ? `${formatDisplayDate(selectedStartDate, false)}${RANGE_SEPARATOR}${formatDisplayDate(selectedEndDate, false)}`
        : `${formatDisplayDate(selectedStartDate)}${RANGE_SEPARATOR}${formatDisplayDate(selectedEndDate)}`
      : isValidDate(selectedStartDate)
        ? `${formatDisplayDate(selectedStartDate, false)}${RANGE_SEPARATOR}...`
        : "Выбери период планирования";

  const calendarValue = selectedEndDate ?? selectedStartDate ?? new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box
        className={styles.pickerWrap}
        style={
          {
            "--picker-accent": accentColor,
          } as React.CSSProperties
        }
      >
        <Box className={styles.trigger}>
          <Typography className={styles.summary}>{selectedLabel}</Typography>

          <IconButton
            type="button"
            onClick={handleOpen}
            className={styles.triggerButton}
            disableRipple
            aria-label="Открыть календарь"
          >
            <img
              src={calendarIconSrc}
              alt=""
              aria-hidden="true"
              className={styles.calendarIcon}
            />
          </IconButton>
        </Box>

        <Popover
          open={isOpen}
          anchorEl={anchorEl}
          onClose={handleClose}
          disableScrollLock
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            className: styles.popoverPaper,
          }}
        >
          <Box className={styles.calendarCard}>
            <DateCalendar
              className={styles.calendar}
              value={calendarValue}
              onChange={handleChange}
              showDaysOutsideCurrentMonth
              fixedWeekNumber={6}
              slots={{ day: RangePickerDay }}
              slotProps={{
                day: ({ day }) =>
                  ({
                    rangeStart: selectedRange?.start ?? null,
                    rangeEnd: selectedRange?.end ?? null,
                    previewStart: previewRange?.start ?? null,
                    previewEnd: previewRange?.end ?? null,
                    onPointerEnter: () => handleDayHover(day),
                    onPointerLeave: () => setHoveredDay(null),
                  }) as any,
              }}
            />
          </Box>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;
