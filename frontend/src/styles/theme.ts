import { createTheme } from "@mui/material/styles";
import type { TypographyVariantsOptions } from "@mui/material/styles";

// Основные цвета из твоего дизайна
const colors = {
  backgrounds: {
    blue: "#69B5D3",
    green: "#507B5D",
    red: "#D87B7B",
    yellow: "#FCD688",
    lightPink: "#FFDFDF",
    lightBlue: "#CAEEFC",
    lightYellow: "#FFE8B9",
    lightGreen: "#ABD0B7",
    lightWhite: "#FDF7F7",
    gray: "#D9D9D9",
    darkGray: "#5B5B5B",
  },
  text: {
    dark: "#0D0D0D",
    medium: "#5B5B5B",
    light: "#FFFFFF",
    lightAccent: "#FFDFDF",
  },
  accents: {
    red: "#D87B7B",
    blue: "#69B5D3",
    green: "#507B5D",
  },
  neutral: {
    white: "#FFFFFF",
    gray100: "#FDF7F7",
    gray200: "#FFDFDF",
    gray300: "#D9D9D9",
    gray400: "#5B5B5B",
    gray500: "#0D0D0D",
  },
  status: {
    success: "#507B5D",
    warning: "#FCD688",
    error: "#D87B7B",
    info: "#69B5D3",
  },
};

// Типографика
const typography: TypographyVariantsOptions = {
  fontFamily:
    "'Roboto Condensed', -apple-system, BlinkMacSystemFont, sans-serif",
  // большой заголок
  h1: {
    fontSize: "1.5rem",
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: "0.01em",
    textTransform: "uppercase" as const,
  },
  h2: {
    // Основной шрифт заголовков
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "0.01em",
  },
  h3: {
    // подписи
    fontSize: "1.125rem",
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: "0",
    textTransform: "lowercase" as const,
  },

  // ТЕЛО ТЕКСТА
  body1: {
    // Основной текст в инпутах, параграфы
    fontSize: "1.25rem",
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: "0.01em",
  },
  body2: {
    // Второстепенный текст, подписи
    fontSize: "0.875rem",
    lineHeight: 1.5,
    fontWeight: 300,
    letterSpacing: "0.02em",
    color: colors.text.medium, // автоматически серый
  },

  // СПЕЦИАЛЬНЫЕ ВАРИАНТЫ
  subtitle1: {
    // Пункты чек-листа (body1 но жирнее)
    fontSize: "1rem",
    lineHeight: 1.5,
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
  subtitle2: {
    // Суммы в чек-листе
    fontSize: "1rem",
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: "0",
  },
  caption: {
    // Самый мелкий текст, метки
    fontSize: "0.75rem",
    lineHeight: 1.4,
    fontWeight: 300,
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
  },

  // КНОПКИ
  button: {
    fontSize: "1rem",
    fontWeight: 500,
    textTransform: "none" as const,
    letterSpacing: "0.02em",
  },
};

// Тени
const shadows = {
  small: "0px 2px 2px rgba(0, 0, 0, 0.25)",
  medium: "0px 4px 8px rgba(0, 0, 0, 0.3)",
  large: "0px 8px 16px rgba(0, 0, 0, 0.35)",
  inner: "inset -2px 1px 1.1px rgba(0, 0, 0, 0.25)",
};

// Скругления
const borderRadius = {
  sm: "5px", // Для чекбоксов
  md: "10px", // Для блоков и пунктов
  lg: "10px",
};

// Создаем тему MUI
export const theme = createTheme({
  palette: {
    primary: {
      main: colors.backgrounds.blue,
      light: colors.backgrounds.lightBlue,
      dark: "#4A95B8",
      contrastText: colors.text.light,
    },
    secondary: {
      main: colors.backgrounds.green,
      light: colors.backgrounds.lightGreen,
      dark: "#456A52",
      contrastText: colors.text.light,
    },
    error: {
      main: colors.backgrounds.red,
      light: colors.backgrounds.lightPink,
      dark: "#C26B6B",
      contrastText: colors.text.light,
    },
    warning: {
      main: colors.backgrounds.yellow,
      light: colors.backgrounds.lightYellow,
      dark: "#E3C07A",
      contrastText: colors.text.dark,
    },
    background: {
      default: colors.neutral.gray100,
      paper: colors.neutral.white,
    },
    text: {
      primary: colors.text.dark,
      secondary: colors.text.medium,
      disabled: colors.neutral.gray300,
    },
    divider: colors.neutral.gray300,
  },
  typography,
  shape: {
    borderRadius: borderRadius.md,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral.white,
          border: `1px solid ${colors.neutral.gray300}`,
          boxShadow: shadows.small,
          borderRadius: borderRadius.md,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: borderRadius.md,
          boxShadow: "none",
          "&:hover": {
            boxShadow: shadows.small,
          },
        },
        contained: {
          backgroundColor: colors.neutral.white,
          color: colors.text.dark,
          border: `1px solid ${colors.accents.blue}`,
          "&:hover": {
            boxShadow: shadows.small,
          },
        },
        outlined: {
          borderWidth: "1px",
          "&:hover": {
            borderWidth: "1px",
          },
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            borderColor: colors.accents.blue,
          },
        },
        {
          props: { variant: "contained", color: "secondary" },
          style: {
            borderColor: colors.accents.green,
          },
        },
        {
          props: { variant: "contained", color: "error" },
          style: {
            borderColor: colors.accents.red,
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.small,
          border: `1px solid ${colors.neutral.gray300}`,
          backgroundColor: colors.neutral.white,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: "h1",
          h2: "h2",
          h3: "h3",
          subtitle1: "p", // 👈 Пункты чек-листа
          subtitle2: "span", // 👈 Суммы
          body1: "p",
          body2: "p",
          caption: "span",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: colors.neutral.white,
            "& fieldset": {
              borderColor: colors.neutral.gray300,
              borderWidth: "2px",
            },
            "&:hover fieldset": {
              borderColor: colors.neutral.gray400,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.backgrounds.blue,
              borderWidth: "2px",
            },
            // 👇 Стили для textarea (заметки)
            "& textarea": {
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: "1.25rem",
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: "0.01em",
              resize: "vertical",
              minHeight: "60px",
              padding: "5px 5px",
            },
          },
          // 👇 Placeholder стили
          "& .MuiInputLabel-root": {
            fontFamily: "'Roboto Condensed', sans-serif",
            fontWeight: 300,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: "4px",
          color: colors.neutral.gray300,
          "& .MuiSvgIcon-root": {
            width: 24,
            height: 24,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.neutral.white,
            border: `1px solid ${colors.neutral.gray300}`,
            // boxShadow: shadows.inner,
          },
          "&.Mui-checked": {
            color: "transparent",
            "& .MuiSvgIcon-root": {
              backgroundColor: colors.backgrounds.blue,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "12px",
                height: "12px",
                backgroundColor: colors.neutral.white,
                borderRadius: "100px",
                // border: `1px solid ${colors.neutral.gray300}`,
                // boxShadow: shadows.inner,
              },
            },
          },
          "&.MuiCheckbox-colorSecondary.Mui-checked": {
            "& .MuiSvgIcon-root": {
              backgroundColor: colors.backgrounds.green,
            },
          },
        },
      },
    },
  },
});

// Экспортируем токены для использования в компонентах
export const designTokens = {
  colors,
  typography: typography as any, // временное решение
  shadows,
  borderRadius,
};
