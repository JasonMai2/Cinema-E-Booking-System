import React from "react";
import styles from "./EditProfile.module.css";

export default function PromotionsToggle({ id, checked, onToggle, label }) {
  return (
    <div className={styles.promoWrapper}>
      <button
        id={id}
        type="button"
        aria-pressed={!!checked}
        aria-label={
          checked ? `Unregister from ${label}` : `Register for ${label}`
        }
        onClick={onToggle}
        className={`${styles.checkBtn} ${checked ? styles.checkOn : ""}`}
      >
        <span className={styles.checkIcon} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            focusable="false"
            aria-hidden="true"
          >
            <path
              d="M20.3 6.3l-11 11a1 1 0 0 1-1.4 0l-5-5 1.4-1.4 4.3 4.3 9.3-9.3L20.3 6.3z"
              fill="currentColor"
            />
          </svg>
        </span>
      </button>
      <label className={styles.switchLabel} htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
