const DEFAULT_ROOT_FONT_SIZE = 16;

export const pxToRem = (
  value: number,
  baseFontSize = DEFAULT_ROOT_FONT_SIZE,
): string => `${value / baseFontSize}rem`;

export const remSpace = (
  ...values: number[]
): string => values.map((value) => pxToRem(value)).join(" ");

