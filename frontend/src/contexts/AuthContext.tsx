import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { User } from "../types/user";
import { clearPendingOtpRequest } from "../utils/otpAuth";
import {
  fetchCurrentUser,
  logoutCurrentUser,
  requestLoginCode,
  updateUserAvatar,
  verifyLoginCode,
} from "../services/authService";

interface AuthContextType {
  user: User | null;
  requestOtp: (login: string, phone: string) => Promise<{ phone: string; expiresAt: Date }>;
  verifyOtp: (login: string, phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

const AUTH_STORAGE_KEY = "BUDGET_PLANNER_AUTH_USER";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const restoreStoredUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser) as Omit<
      User,
      "createdAt" | "lastLogin"
    > & {
      createdAt: string;
      lastLogin?: string;
    };

    return {
      ...parsedUser,
      createdAt: new Date(parsedUser.createdAt),
      lastLogin: parsedUser.lastLogin
        ? new Date(parsedUser.lastLogin)
        : undefined,
    };
  } catch (error) {
    console.error("Не удалось восстановить пользователя из localStorage", error);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const initialUser = useMemo(() => restoreStoredUser(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const restoreSession = async () => {
      try {
        const restoredUser = await fetchCurrentUser();

        if (!isCancelled) {
          setUser(restoredUser);
        }
      } catch (error) {
        console.error("Не удалось восстановить сессию пользователя", error);
        if (!isCancelled) {
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const requestOtp = async (loginValue: string, phone: string) =>
    requestLoginCode(loginValue, phone);

  const verifyOtp = async (
    loginValue: string,
    phone: string,
    code: string,
  ) => {
    const nextUser = await verifyLoginCode(loginValue, phone, code);
    clearPendingOtpRequest();
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await logoutCurrentUser();
    } finally {
      clearPendingOtpRequest();
      setUser(null);
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    const nextUser = await updateUserAvatar(avatarUrl);
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        requestOtp,
        verifyOtp,
        logout,
        updateAvatar,
        isAuthenticated: !!user,
        isAuthLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
