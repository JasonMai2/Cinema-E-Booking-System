import React from "react";
import styles from "../components/EditProfile.module.css";

export default function EditProfile() {
  return (
    <main className={styles.profilePage}>
      <h2 className={styles.profileTitle}>Edit Profile</h2>

      <section className={styles.profileCard}>
        <form className={styles.profileForm}>
          <div>
            <label className={styles.profileLabel}>Name</label>
            <input
              type="text"
              defaultValue="Demo User"
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Email</label>
            <input
              type="email"
              defaultValue="demo@example.com"
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Phone (optional)</label>
            <input
              type="tel"
              placeholder="e.g. +1 (555) 555-5555"
              className={styles.profileInput}
            />
          </div>

          <hr />

          <div>
            <p style={{ margin: 0 }}>Change password (optional)</p>
          </div>

          <div>
            <label className={styles.profileLabel}>New password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Confirm password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className={styles.profileInput}
            />
          </div>

          <div className={styles.profileActions}>
            <button type="button" className={styles.btnSave}>
              Save
            </button>
            <button type="button" className={styles.btnCancel}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
