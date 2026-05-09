import React from "react";
import { publicImageSrc } from "../../utils/publicImageSrc";
import styles from "./InfoHint.module.scss";

interface InfoHintProps {
  messages: string[];
  ariaLabel: string;
  variant?: "blue" | "green" | "red" | "gray";
  iconFileName?: string;
  autoVisible?: boolean;
  floating?: boolean;
  className?: string;
}

// Общая информационная подсказка для страниц с короткими инструкциями.
const InfoHint: React.FC<InfoHintProps> = ({
  messages,
  ariaLabel,
  variant = "blue",
  iconFileName = "tooltip_main.png",
  autoVisible = false,
  floating = true,
  className = "",
}) => {
  const iconSrc = publicImageSrc(iconFileName);

  return (
    <div
      className={`${styles.wrap} ${styles[`variant${variant[0].toUpperCase()}${variant.slice(1)}`]} ${
        !floating ? styles.inline : ""
      } ${className}`}
    >
      <button type="button" className={styles.button} aria-label={ariaLabel}>
        <img src={iconSrc} alt="" aria-hidden="true" className={styles.icon} />
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
