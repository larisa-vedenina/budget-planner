import { useNavigate } from "react-router-dom";
import styles from "./StartPage.module.scss";

export const StartPage = () => {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        {/* <div className={styles.logo}>/</div> */}

        <button
          type="button"
          className={`${styles.actionButton} ${styles.primaryButton}`}
          onClick={() => navigate("/form")}
        >
          Создать новый бюджет
        </button>

        <button
          type="button"
          className={`${styles.actionButton} ${styles.secondaryButton}`}
          onClick={() => navigate("/login")}
        >
          Войти в личный кабинет
        </button>
      </div>
    </main>
  );
};
