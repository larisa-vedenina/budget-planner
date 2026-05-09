const OTP_REQUEST_STORAGE_KEY = "BUDGET_PLANNER_PENDING_OTP";
const DEFAULT_OTP_TTL_MS = 10 * 60 * 1000;

export interface PendingOtpRequest {
  name: string;
  email: string;
  requestedAt: Date;
  expiresAt: Date;
}

interface StoredPendingOtpRequest {
  name: string;
  email: string;
  requestedAt: string;
  expiresAt: string;
}

export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();

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
      email: normalizeEmail(parsedValue.email || ""),
      requestedAt: new Date(parsedValue.requestedAt),
      expiresAt: new Date(parsedValue.expiresAt),
    };

    if (
      !isValidEmail(pendingRequest.email) ||
      pendingRequest.expiresAt.getTime() <= Date.now()
    ) {
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

export const isValidName = (value: string): boolean => value.trim().length >= 2;

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

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
  email: string,
  expiresAt?: Date,
): PendingOtpRequest => {
  const normalizedEmail = normalizeEmail(email);
  const requestedAt = new Date();
  const safeExpiresAt =
    expiresAt ?? new Date(requestedAt.getTime() + DEFAULT_OTP_TTL_MS);

  const pendingRequest: PendingOtpRequest = {
    name: name.trim(),
    email: normalizedEmail,
    requestedAt,
    expiresAt: safeExpiresAt,
  };

  if (typeof window !== "undefined") {
    const payload: StoredPendingOtpRequest = {
      name: pendingRequest.name,
      email: pendingRequest.email,
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
