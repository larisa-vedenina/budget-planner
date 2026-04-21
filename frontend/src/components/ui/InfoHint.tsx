import React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import styles from "./InfoHint.module.scss";

interface InfoHintProps {
  messages: string[];
  ariaLabel: string;
  variant?: "blue" | "red" | "gray";
  autoVisible?: boolean;
}

// Общая информационная подсказка для страниц с короткими инструкциями.
const InfoHint: React.FC<InfoHintProps> = ({
  messages,
  ariaLabel,
  variant = "blue",
  autoVisible = false,
}) => {
  return (
    <div className={`${styles.wrap} ${styles[`variant${variant[0].toUpperCase()}${variant.slice(1)}`]}`}>
      <button type="button" className={styles.button} aria-label={ariaLabel}>
        <InfoOutlinedIcon className={styles.icon} />
      </button>

      <div
        className={`${styles.tooltip} ${autoVisible ? styles.tooltipVisible : ""}`}
      >
        {messages.map((message) => (
          <div key={message} className={styles.line}>
            {message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoHint;
