import { createTheme } from "@mui/material/styles";
import type { TypographyVariantsOptions } from "@mui/material/styles";
import { pxToRem } from "./units";

const accentColors = {
  blue: {
    strong: "#69B5D3",
    soft: "#CAEEFC",
    shadowBase: "#185C77",
    contrastText: "#FFFFFF",
  },
  green: {
    strong: "#507B5D",
    soft: "#ABD0B7",
    shadowBase: "#12341C",
    contrastText: "#FFFFFF",
  },
  yellow: {
    strong: "#FCD688",
    soft: "#FFE8B9",
    shadowBase: "#C29231",
    contrastText: "#FFFFFF",
  },
  red: {
    strong: "#D87B7B",
    soft: "#FFDFDF",
    shadowBase: "#AB1D1D",
    contrastText: "#FFFFFF",
  },
} as const;

const surfaceColors = {
  white: "#FFFFFF",
  blueStrong: accentColors.blue.strong,
  blueSoft: accentColors.blue.soft,
  greenStrong: accentColors.green.strong,
  greenSoft: accentColors.green.soft,
  yellowStrong: accentColors.yellow.strong,
  yellowSoft: accentColors.yellow.soft,
  redStrong: accentColors.red.strong,
  redSoft: accentColors.red.soft,
} as const;

const pageBackgrounds = {
  default: surfaceColors.white,
  start: accentColors.blue.soft,
  main: surfaceColors.white,
  login: accentColors.yellow.soft,
  form: accentColors.red.soft,
  archive: accentColors.blue.soft,
} as const;

const textColors = {
  primary: "#0D0D0D",
  secondary: "#5B5B5B",
  inverse: "#FFFFFF",
  warning: "#D87B7B",
} as const;

const borderColors = {
  neutral: "#D9D9D9",
} as const;

const borderWidths = {
  button: 3,
  item: 2,
  input: 2,
  checkbox: 1,
} as const;

const radii = {
  sm: 5,
  md: 10,
  pill: 999,
} as const;

const fontSizes = {
  detail: 16,
  base: 24,
  display: 32,
} as const;

const motion = {
  fast: "0.2s ease",
} as const;

const normalizeHex = (value: string): string => value.trim().toUpperCase();

const hexToRgbChannels = (hex: string): string => {
  const normalized = normalizeHex(hex).replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((symbol) => `${symbol}${symbol}`)
          .join("")
      : normalized;

  const red = Number.parseInt(fullHex.slice(0, 2), 16);
  const green = Number.parseInt(fullHex.slice(2, 4), 16);
  const blue = Number.parseInt(fullHex.slice(4, 6), 16);

  return `${red}, ${green}, ${blue}`;
};

const withAlpha = (hex: string, opacity: number): string =>
  `rgba(${hexToRgbChannels(hex)}, ${opacity})`;

const createShadow = (
  x: number,
  y: number,
  blur: number,
  color: string,
  opacity: number,
): string =>
  `${pxToRem(x)} ${pxToRem(y)} ${pxToRem(blur)} ${withAlpha(color, opacity)}`;

const shadowTokens = {
  accentBlue: createShadow(3, 2, 0.5, accentColors.blue.shadowBase, 0.7),
  accentGreen: createShadow(3, 2, 0.5, accentColors.green.shadowBase, 0.7),
  accentYellow: createShadow(3, 2, 0.5, accentColors.yellow.shadowBase, 0.7),
  accentRed: createShadow(3, 2, 0.5, accentColors.red.shadowBase, 0.7),
  surfaceBlueSoft: createShadow(3, 2, 0.5, accentColors.blue.strong, 0.7),
  surfaceGreenSoft: createShadow(3, 2, 0.5, accentColors.green.strong, 0.7),
  surfaceYellowSoft: createShadow(3, 2, 0.5, accentColors.yellow.strong, 0.7),
  surfaceRedSoft: createShadow(3, 2, 0.5, accentColors.red.strong, 0.7),
  neutralRead: createShadow(-2, 2, 0.5, textColors.secondary, 0.4),
  neutralEdit: createShadow(3, 2, 0.5, textColors.secondary, 0.4),
  none: "none",
} as const;

const radiusTokens = {
  sm: pxToRem(radii.sm),
  md: pxToRem(radii.md),
  pill: pxToRem(radii.pill),
} as const;

const accentShadowVariables = {
  blue: "var(--shadow-accent-blue)",
  green: "var(--shadow-accent-green)",
  yellow: "var(--shadow-accent-yellow)",
  red: "var(--shadow-accent-red)",
} as const;

const surfaceShadowVariables = {
  blueStrong: "var(--shadow-accent-blue)",
  blueSoft: "var(--shadow-surface-blue-soft)",
  greenStrong: "var(--shadow-accent-green)",
  greenSoft: "var(--shadow-surface-green-soft)",
  yellowStrong: "var(--shadow-accent-yellow)",
  yellowSoft: "var(--shadow-surface-yellow-soft)",
  redStrong: "var(--shadow-accent-red)",
  redSoft: "var(--shadow-surface-red-soft)",
} as const;

const accentFamilyByHex: Record<string, keyof typeof accentShadowVariables> = {
  "#69B5D3": "blue",
  "#CAEEFC": "blue",
  "#507B5D": "green",
  "#ABD0B7": "green",
  "#FCD688": "yellow",
  "#FFE8B9": "yellow",
  "#D87B7B": "red",
  "#FFDFDF": "red",
};

export const getAccentShadowVariable = (color: string): string => {
  const family = accentFamilyByHex[normalizeHex(color)] ?? "blue";
  return accentShadowVariables[family];
};

const surfaceShadowByHex: Record<string, string> = {
  "#69B5D3": surfaceShadowVariables.blueStrong,
  "#CAEEFC": surfaceShadowVariables.blueSoft,
  "#507B5D": surfaceShadowVariables.greenStrong,
  "#ABD0B7": surfaceShadowVariables.greenSoft,
  "#FCD688": surfaceShadowVariables.yellowStrong,
  "#FFE8B9": surfaceShadowVariables.yellowSoft,
  "#D87B7B": surfaceShadowVariables.redStrong,
  "#FFDFDF": surfaceShadowVariables.redSoft,
};

export const getSurfaceShadowVariable = (color: string): string =>
  surfaceShadowByHex[normalizeHex(color)] ?? "var(--shadow-neutral-edit)";

const typography: TypographyVariantsOptions = {
  fontFamily:
    "'Roboto Condensed', -apple-system, BlinkMacSystemFont, sans-serif",
  h1: {
    fontSize: pxToRem(fontSizes.display),
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: "0",
  },
  h2: {
    fontSize: pxToRem(fontSizes.base),
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: "0",
  },
  h3: {
    fontSize: pxToRem(fontSizes.base),
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: "0",
  },
  body1: {
    fontSize: pxToRem(fontSizes.base),
    fontWeight: 400,
    lineHeight: 1.35,
    letterSpacing: "0",
  },
  body2: {
    fontSize: pxToRem(fontSizes.detail),
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0",
    color: textColors.secondary,
  },
  subtitle1: {
    fontSize: pxToRem(fontSizes.base),
    fontWeight: 400,
    lineHeight: 1.35,
    letterSpacing: "0",
  },
  subtitle2: {
    fontSize: pxToRem(fontSizes.base),
    fontWeight: 400,
    lineHeight: 1.35,
    letterSpacing: "0",
  },
  caption: {
    fontSize: pxToRem(fontSizes.detail),
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "0",
    color: textColors.secondary,
  },
  button: {
    fontSize: pxToRem(fontSizes.base),
    fontWeight: 400,
    lineHeight: 1.15,
    textTransform: "none" as const,
    letterSpacing: "0",
  },
};

export const cssVariables: Record<string, string> = {
  "--surface-white": surfaceColors.white,
  "--surface-blue": surfaceColors.blueStrong,
  "--surface-blue-soft": surfaceColors.blueSoft,
  "--surface-green": surfaceColors.greenStrong,
  "--surface-green-soft": surfaceColors.greenSoft,
  "--surface-yellow": surfaceColors.yellowStrong,
  "--surface-yellow-soft": surfaceColors.yellowSoft,
  "--surface-red": surfaceColors.redStrong,
  "--surface-red-soft": surfaceColors.redSoft,

  "--page-background-default": pageBackgrounds.default,
  "--page-background-start": pageBackgrounds.start,
  "--page-background-main": pageBackgrounds.main,
  "--page-background-login": pageBackgrounds.login,
  "--page-background-form": pageBackgrounds.form,
  "--page-background-archive": pageBackgrounds.archive,

  "--accent-blue": accentColors.blue.strong,
  "--accent-blue-soft": accentColors.blue.soft,
  "--accent-green": accentColors.green.strong,
  "--accent-green-soft": accentColors.green.soft,
  "--accent-yellow": accentColors.yellow.strong,
  "--accent-yellow-soft": accentColors.yellow.soft,
  "--accent-red": accentColors.red.strong,
  "--accent-red-soft": accentColors.red.soft,

  "--text-primary": textColors.primary,
  "--text-secondary": textColors.secondary,
  "--text-inverse": textColors.inverse,
  "--text-warning": textColors.warning,

  "--border-neutral": borderColors.neutral,
  "--border-width-button": pxToRem(borderWidths.button),
  "--border-width-item": pxToRem(borderWidths.item),
  "--border-width-input": pxToRem(borderWidths.input),
  "--border-width-checkbox": pxToRem(borderWidths.checkbox),

  "--shadow-accent-blue": shadowTokens.accentBlue,
  "--shadow-accent-green": shadowTokens.accentGreen,
  "--shadow-accent-yellow": shadowTokens.accentYellow,
  "--shadow-accent-red": shadowTokens.accentRed,
  "--shadow-surface-blue-soft": shadowTokens.surfaceBlueSoft,
  "--shadow-surface-green-soft": shadowTokens.surfaceGreenSoft,
  "--shadow-surface-yellow-soft": shadowTokens.surfaceYellowSoft,
  "--shadow-surface-red-soft": shadowTokens.surfaceRedSoft,
  "--shadow-neutral-read": shadowTokens.neutralRead,
  "--shadow-neutral-edit": shadowTokens.neutralEdit,

  "--radius-sm": radiusTokens.sm,
  "--radius-md": radiusTokens.md,
  "--radius-pill": radiusTokens.pill,
  "--transition-fast": motion.fast,
  "--color-white": surfaceColors.white,
  "--color-surface-muted": surfaceColors.white,
  "--color-surface-soft-blue": accentColors.blue.soft,
  "--color-surface-soft-green": accentColors.green.soft,
  "--color-surface-soft-yellow": accentColors.yellow.soft,
  "--color-surface-soft-pink": accentColors.red.soft,
  "--color-accent-blue": accentColors.blue.strong,
  "--color-accent-green": accentColors.green.strong,
  "--color-accent-yellow": accentColors.yellow.strong,
  "--color-accent-red": accentColors.red.strong,
  "--color-text-primary": textColors.primary,
  "--color-text-secondary": textColors.secondary,
  "--color-text-warning": textColors.warning,
  "--color-border": borderColors.neutral,
  "--shadow-card": shadowTokens.neutralEdit,
  "--shadow-card-hover": shadowTokens.neutralEdit,
  "--shadow-inset": shadowTokens.none,
};

export const theme = createTheme({
  palette: {
    primary: {
      main: accentColors.blue.strong,
      light: accentColors.blue.soft,
      contrastText: accentColors.blue.contrastText,
    },
    secondary: {
      main: accentColors.green.strong,
      light: accentColors.green.soft,
      contrastText: accentColors.green.contrastText,
    },
    warning: {
      main: accentColors.yellow.strong,
      light: accentColors.yellow.soft,
      contrastText: accentColors.yellow.contrastText,
    },
    error: {
      main: accentColors.red.strong,
      light: accentColors.red.soft,
      contrastText: accentColors.red.contrastText,
    },
    background: {
      default: pageBackgrounds.default,
      paper: surfaceColors.white,
    },
    text: {
      primary: textColors.primary,
      secondary: textColors.secondary,
      disabled: borderColors.neutral,
    },
    divider: borderColors.neutral,
  },
  typography,
  shape: {
    borderRadius: radii.md,
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: "h1",
          h2: "h2",
          h3: "h3",
          subtitle1: "p",
          subtitle2: "span",
          body1: "p",
          body2: "p",
          caption: "span",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          boxShadow: "none",
          fontWeight: 400,
          textTransform: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: radiusTokens.sm,
            backgroundColor: surfaceColors.white,
            boxShadow: "none",
            "& fieldset": {
              borderColor: borderColors.neutral,
              borderWidth: pxToRem(borderWidths.input),
            },
            "&:hover fieldset": {
              borderColor: borderColors.neutral,
            },
            "&.Mui-focused fieldset": {
              borderColor: accentColors.blue.strong,
              borderWidth: pxToRem(borderWidths.input),
            },
            "& input, & textarea": {
              color: textColors.secondary,
              fontFamily:
                "'Roboto Condensed', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: pxToRem(fontSizes.detail),
              fontWeight: 400,
              lineHeight: 1.5,
            },
            "& textarea": {
              resize: "vertical",
            },
          },
          "& .MuiInputBase-input::placeholder, & textarea::placeholder": {
            color: textColors.secondary,
            opacity: 0.6,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: pxToRem(4),
          color: borderColors.neutral,
          "& .MuiSvgIcon-root": {
            width: pxToRem(24),
            height: pxToRem(24),
            borderRadius: radiusTokens.sm,
            backgroundColor: surfaceColors.white,
            border: `${pxToRem(borderWidths.checkbox)} solid ${borderColors.neutral}`,
            boxShadow: shadowTokens.neutralRead,
          },
          "&.Mui-checked": {
            color: accentColors.blue.strong,
            "& .MuiSvgIcon-root": {
              backgroundColor: accentColors.blue.strong,
              borderColor: accentColors.blue.strong,
            },
          },
          "&.MuiCheckbox-colorSecondary.Mui-checked .MuiSvgIcon-root": {
            backgroundColor: accentColors.green.strong,
            borderColor: accentColors.green.strong,
          },
        },
      },
    },
  },
});

export const designTokens = {
  accentColors,
  surfaceColors,
  pageBackgrounds,
  textColors,
  borderColors,
  borderWidths,
  shadowTokens,
  fontSizes,
  radii,
  motion,
  typography,
  cssVariables,
  getAccentShadowVariable,
  getSurfaceShadowVariable,
};
