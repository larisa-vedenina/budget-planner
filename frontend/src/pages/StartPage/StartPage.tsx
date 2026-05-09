import { useNavigate } from "react-router-dom";
import { createReturnState } from "../../utils/navigationState";
import styles from "./StartPage.module.scss";

export const StartPage = () => {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <div className={styles.panel}>


        <button
          type="button"
          className={`${styles.actionButton} ${styles.primaryButton}`}
          onClick={() =>
            navigate("/form", { state: createReturnState("/start") })
          }
        >
          Создать новый бюджет
        </button>

        <button
          type="button"
          className={`${styles.actionButton} ${styles.secondaryButton}`}
          onClick={() =>
            navigate("/login", { state: createReturnState("/start") })
          }
        >
          Войти в личный кабинет
        </button>
      </div>
    </main>
  );
};
