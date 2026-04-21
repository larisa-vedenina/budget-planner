import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  clearPendingOtpRequest,
  formatPhoneInput,
  isValidLogin,
  isValidOtpCode,
  isValidPhone,
  loadPendingOtpRequest,
  savePendingOtpRequest,
} from "../../utils/otpAuth";
import styles from "./LoginPage.module.scss";

interface LoginFormErrors {
  name?: string;
  phone?: string;
  code?: string;
  general?: string;
}

const buildBaseFieldErrors = (
  name: string,
  phone: string,
): Omit<LoginFormErrors, "code" | "general"> => {
  const nextErrors: Omit<LoginFormErrors, "code" | "general"> = {};

  if (!isValidLogin(name)) {
    nextErrors.name = "Укажите имя длиной не меньше 2 символов.";
  }

  if (!isValidPhone(phone)) {
    nextErrors.phone = "Введите номер телефона полностью.";
  }

  return nextErrors;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, isAuthenticated, isAuthLoading } = useAuth();
  const pendingOtpRequest = useMemo(() => loadPendingOtpRequest(), []);
  const [name, setName] = useState(pendingOtpRequest?.login ?? "");
  const [phone, setPhone] = useState(
    pendingOtpRequest
      ? formatPhoneInput(pendingOtpRequest.normalizedPhone)
      : "",
  );
  const [code, setCode] = useState("");
  const [isCodeRequested, setIsCodeRequested] = useState(
    Boolean(pendingOtpRequest),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    pendingOtpRequest ? "Введите одноразовый код, чтобы завершить вход." : "",
  );
  const [errors, setErrors] = useState<LoginFormErrors>({});

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate("/archive", { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  const resetOtpStep = () => {
    if (!isCodeRequested) {
      return;
    }

    clearPendingOtpRequest();
    setIsCodeRequested(false);
    setCode("");
    setStatusMessage("");
    setErrors((currentErrors) => ({
      name: currentErrors.name,
      phone: currentErrors.phone,
    }));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    resetOtpStep();
    setErrors((currentErrors) => ({
      ...currentErrors,
      name: undefined,
      general: undefined,
    }));
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneInput(event.target.value));
    resetOtpStep();
    setErrors((currentErrors) => ({
      ...currentErrors,
      phone: undefined,
      general: undefined,
    }));
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextCode = event.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(nextCode);
    setErrors((currentErrors) => ({
      ...currentErrors,
      code: undefined,
      general: undefined,
    }));
  };

  const handleRequestOtp = async () => {
    const baseFieldErrors = buildBaseFieldErrors(name, phone);

    if (Object.keys(baseFieldErrors).length > 0) {
      setErrors(baseFieldErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await requestOtp(name, phone);
      savePendingOtpRequest(name, phone, result.expiresAt);
      setIsCodeRequested(true);
      setStatusMessage(`Код отправлен на ${result.phone}.`);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Не удалось отправить одноразовый код.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const baseFieldErrors = buildBaseFieldErrors(name, phone);
    const nextErrors: LoginFormErrors = { ...baseFieldErrors };

    if (!isValidOtpCode(code)) {
      nextErrors.code = "Введите 6-значный код из SMS.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await verifyOtp(name, phone, code);
      navigate("/archive");
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Не удалось подтвердить код.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCodeRequested) {
      await handleVerifyOtp();
      return;
    }

    await handleRequestOtp();
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.field}>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Имя"
              value={name}
              onChange={handleNameChange}
              className={`${styles.input} ${styles.nameInput} ${
                errors.name ? styles.inputError : ""
              }`}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </label>

          <label className={styles.field}>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={18}
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={handlePhoneChange}
              className={`${styles.input} ${styles.phoneInput} ${
                errors.phone ? styles.inputError : ""
              }`}
            />
            {errors.phone && (
              <span className={styles.errorText}>{errors.phone}</span>
            )}
          </label>

          {isCodeRequested && (
            <label className={styles.field}>
              <input
                type="text"
                name="otp"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="Одноразовый код"
                value={code}
                onChange={handleCodeChange}
                className={`${styles.input} ${styles.codeInput} ${
                  errors.code ? styles.inputError : ""
                }`}
              />
              {errors.code && (
                <span className={styles.errorText}>{errors.code}</span>
              )}
            </label>
          )}

          {statusMessage && !errors.general && (
            <p className={styles.statusText} aria-live="polite">
              {statusMessage}
            </p>
          )}

          {errors.general && (
            <p className={styles.errorText} aria-live="polite">
              {errors.general}
            </p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Подождите..."
              : isCodeRequested
                ? "Войти"
                : "Отправить код"}
          </button>
        </form>
      </div>
    </main>
  );
};
