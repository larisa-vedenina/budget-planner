const normalizePublicUrl = (value: string): string => value.replace(/\/$/, "");

export const publicImageSrc = (fileName: string): string =>
  `${normalizePublicUrl(process.env.PUBLIC_URL || "")}/images/${fileName}`;
