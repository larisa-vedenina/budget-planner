const OTP_REQUEST_STORAGE_KEY = "BUDGET_PLANNER_PENDING_OTP";
const DEFAULT_OTP_TTL_MS = 10 * 60 * 1000;

export interface PendingOtpRequest {
  name: string;
  normalizedPhone: string;
  requestedAt: Date;
  expiresAt: Date;
}

interface StoredPendingOtpRequest {
  name: string;
  normalizedPhone: string;
  requestedAt: string;
  expiresAt: string;
}

const getDigits = (value: string): string => value.replace(/\D/g, "");

const toRussianPhoneDigits = (digits: string): string => {
  if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    return `7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `7${digits}`;
  }

  return digits.slice(0, 11);
};

const toPendingOtpRequest = (
  rawValue: string | null,
): PendingOtpRequest | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredPendingOtpRequest;
    const pendingRequest: PendingOtpRequest = {
      name: parsedValue.name,
      normalizedPhone: parsedValue.normalizedPhone,
      requestedAt: new Date(parsedValue.requestedAt),
      expiresAt: new Date(parsedValue.expiresAt),
    };

    if (pendingRequest.expiresAt.getTime() <= Date.now()) {
      window.localStorage.removeItem(OTP_REQUEST_STORAGE_KEY);
      return null;
    }

    return pendingRequest;
  } catch (error) {
    console.error("Не удалось восстановить запрос одноразового кода", error);
    window.localStorage.removeItem(OTP_REQUEST_STORAGE_KEY);
    return null;
  }
};

export const formatPhoneInput = (value: string): string => {
  const digits = getDigits(value);
  const nationalDigits =
    digits.startsWith("7") || digits.startsWith("8")
      ? digits.slice(1, 11)
      : digits.slice(0, 10);

  const area = nationalDigits.slice(0, 3);
  const prefix = nationalDigits.slice(3, 6);
  const linePartOne = nationalDigits.slice(6, 8);
  const linePartTwo = nationalDigits.slice(8, 10);

  let formatted = "+7";

  if (area) {
    formatted += ` (${area}`;
  }

  if (area.length === 3) {
    formatted += ")";
  }

  if (prefix) {
    formatted += ` ${prefix}`;
  }

  if (linePartOne) {
    formatted += `-${linePartOne}`;
  }

  if (linePartTwo) {
    formatted += `-${linePartTwo}`;
  }

  return formatted;
};

export const normalizePhone = (value: string): string =>
  toRussianPhoneDigits(getDigits(value));

export const formatPhoneDisplay = (value: string): string => {
  const normalizedPhone = normalizePhone(value);

  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith("7")) {
    return value;
  }

  const nationalDigits = normalizedPhone.slice(1);

  return `+7 (${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(
    3,
    6,
  )}-${nationalDigits.slice(6, 8)}-${nationalDigits.slice(8, 10)}`;
};

export const isValidName = (value: string): boolean => value.trim().length >= 2;

export const isValidPhone = (value: string): boolean => {
  const normalizedPhone = normalizePhone(value);
  return normalizedPhone.length === 11 && normalizedPhone.startsWith("7");
};

export const isValidOtpCode = (value: string): boolean => /^\d{6}$/.test(value);

export const loadPendingOtpRequest = (): PendingOtpRequest | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return toPendingOtpRequest(
    window.localStorage.getItem(OTP_REQUEST_STORAGE_KEY),
  );
};

export const savePendingOtpRequest = (
  name: string,
  phone: string,
  expiresAt?: Date,
): PendingOtpRequest => {
  const normalizedPhone = normalizePhone(phone);
  const requestedAt = new Date();
  const safeExpiresAt =
    expiresAt ?? new Date(requestedAt.getTime() + DEFAULT_OTP_TTL_MS);

  const pendingRequest: PendingOtpRequest = {
    name: name.trim(),
    normalizedPhone,
    requestedAt,
    expiresAt: safeExpiresAt,
  };

  if (typeof window !== "undefined") {
    const payload: StoredPendingOtpRequest = {
      name: pendingRequest.name,
      normalizedPhone: pendingRequest.normalizedPhone,
      requestedAt: pendingRequest.requestedAt.toISOString(),
      expiresAt: pendingRequest.expiresAt.toISOString(),
    };

    window.localStorage.setItem(
      OTP_REQUEST_STORAGE_KEY,
      JSON.stringify(payload),
    );
  }

  return pendingRequest;
};

export const clearPendingOtpRequest = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(OTP_REQUEST_STORAGE_KEY);
};
