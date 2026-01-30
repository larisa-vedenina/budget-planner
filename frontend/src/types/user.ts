// Типы для пользователя и аутентификации

/**
 * Пользователь системы
 */
export interface User {
  id: string;           // Уникальный ID пользователя
  email: string;        // Email для входа
  name: string;         // Имя пользователя
  createdAt: Date;      // Дата регистрации
  lastLogin?: Date;     // Дата последнего входа
}

/**
 * Учетные данные для авторизации
 */
export interface AuthCredentials {
  email: string;    // Email пользователя
  password: string; // Пароль
}

/**
 * Ответ при успешной авторизации
 */
export interface AuthResponse {
  user: User;       // Данные пользователя
  token: string;    // JWT токен
  expiresIn: number; // Время жизни токена (в секундах)
}

/**
 * Данные для регистрации нового пользователя
 */
export interface RegistrationData extends AuthCredentials {
  name: string; // Имя пользователя
  confirmPassword: string; // Подтверждение пароля
}