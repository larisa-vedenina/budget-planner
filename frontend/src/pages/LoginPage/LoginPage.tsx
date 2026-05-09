import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { createReturnState, getReturnPath } from "../../utils/navigationState";
import {
  clearPendingOtpRequest,
  normalizeEmail,
  isValidEmail,
  isValidName,
  isValidOtpCode,
  loadPendingOtpRequest,
  savePendingOtpRequest,
} from "../../utils/otpAuth";
import styles from "./LoginPage.module.scss";

interface LoginFormErrors {
  name?: string;
  email?: string;
  code?: string;
  general?: string;
}

const buildBaseFieldErrors = (
  name: string,
  email: string,
): Omit<LoginFormErrors, "code" | "general"> => {
  const nextErrors: Omit<LoginFormErrors, "code" | "general"> = {};

  if (!isValidName(name)) {
    nextErrors.name = "Укажите имя длиной не меньше 2 символов.";
  }

  if (!isValidEmail(email)) {
    nextErrors.email = "Введите корректную почту.";
  }

  return nextErrors;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestOtp, verifyOtp, isAuthenticated, isAuthLoading } = useAuth();
  const returnPath = getReturnPath(location.state, "/start");
  const pendingOtpRequest = useMemo(() => loadPendingOtpRequest(), []);
  const [name, setName] = useState(pendingOtpRequest?.name ?? "");
  const [email, setEmail] = useState(pendingOtpRequest?.email ?? "");
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
      navigate("/archive", {
        replace: true,
        state: createReturnState(returnPath),
      });
    }
  }, [isAuthLoading, isAuthenticated, navigate, returnPath]);

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
      email: currentErrors.email,
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

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    resetOtpStep();
    setErrors((currentErrors) => ({
      ...currentErrors,
      email: undefined,
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
    const baseFieldErrors = buildBaseFieldErrors(name, email);

    if (Object.keys(baseFieldErrors).length > 0) {
      setErrors(baseFieldErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const normalizedEmail = normalizeEmail(email);
      const result = await requestOtp(name, normalizedEmail);
      savePendingOtpRequest(name, normalizedEmail, result.expiresAt);
      setEmail(normalizedEmail);
      setIsCodeRequested(true);
      setStatusMessage(`Код отправлен на ${result.email}.`);
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
    const baseFieldErrors = buildBaseFieldErrors(name, email);
    const nextErrors: LoginFormErrors = { ...baseFieldErrors };

    if (!isValidOtpCode(code)) {
      nextErrors.code = "Введите 6-значный код из письма.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await verifyOtp(name, normalizeEmail(email), code);
      navigate("/archive", { state: createReturnState(returnPath) });
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
        <form
          onSubmit={handleSubmit}
          className={styles.form}
          autoComplete="off"
          noValidate
        >
          <label className={styles.field}>
            <input
              type="text"
              name="budgetPlannerName"
              autoComplete="off"
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
              type="text"
              name="budgetPlannerEmail"
              autoComplete="off"
              inputMode="email"
              placeholder="Почта"
              value={email}
              onChange={handleEmailChange}
              className={`${styles.input} ${styles.emailInput} ${
                errors.email ? styles.inputError : ""
              }`}
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </label>

          {isCodeRequested && (
            <label className={styles.field}>
              <input
                type="text"
                name="budgetPlannerCode"
                autoComplete="off"
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

      <div className={styles.pageFooter}>
        <div className={styles.bottomNav}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(returnPath)}
          >
            Вернуться
          </button>
        </div>
      </div>
    </main>
  );
};
