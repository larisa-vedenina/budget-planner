import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./ProfileMenu.module.scss";

const getAvatarFallback = (name: string): string =>
  name.trim().charAt(0).toUpperCase() || "U";

export const ProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateAvatar, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarFallback = useMemo(
    () => getAvatarFallback(user?.name ?? ""),
    [user?.name],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void updateAvatar(reader.result).catch((error) => {
          console.error("Не удалось обновить аватар:", error);
        });
      }
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = "";
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/start");
  };

  const navigateAndClose = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  if (!isAuthenticated || !user) {
    return (
      <button
        type="button"
        className={styles.loginButton}
        onClick={() => navigate("/login")}
      >
        Войти
      </button>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handleAvatarChange}
      />

      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Открыть меню профиля"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Аватар ${user.name}`}
            className={styles.avatarImage}
          />
        ) : (
          <span className={styles.avatarFallback}>{avatarFallback}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.profileInfo}>
            <div className={styles.profileLogin}>{user.name}</div>
            <div className={styles.profilePhone}>{user.phone}</div>
          </div>

          <div className={styles.menuActions}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Поменять аватар
            </button>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => navigateAndClose("/archive")}
            >
              Архив
            </button>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => navigateAndClose("/form")}
            >
              Создать новый бюджет
            </button>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => {
                void handleLogout().catch((error) => {
                  console.error("Не удалось завершить сессию:", error);
                });
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
