import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import styles from "../components/EditProfile.module.css";
import { useAuth } from "../context/AuthContext";

export default function EditProfile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (password && password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: user?.id,
        first_name: firstName,
          last_name: lastName,
        email,
        phone,
      };
      if (password) payload.password = password;

      const res = await api.put('/auth/profile', payload);
      setLoading(false);
      if (res?.data?.ok && res?.data?.user) {
        // update context so header updates
        login(res.data.user);
        setMessage({ type: 'success', text: 'Profile updated' });
      } else {
        setMessage({ type: 'error', text: res?.data?.message || 'Update failed' });
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Update failed' });
    }
  };

  const onCancel = (e) => {
    e.preventDefault();
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setPassword("");
      setConfirm("");
      setMessage(null);
    }
  };

  const onDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.delete(`/auth/profile/${user?.id}`);
      setLoading(false);
      if (res?.data?.ok) {
        logout();
        navigate('/');
      } else {
        setMessage({ type: 'error', text: res?.data?.message || 'Delete failed' });
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setLoading(false);
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Delete failed' });
      setShowDeleteConfirm(false);
    }
  };

  return (
    <main className={styles.profilePage}>
      <h2 className={styles.profileTitle}>Edit Profile</h2>

      <section className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={onSave}>
          {message && (
            <div className={message.type === 'error' ? 'error' : 'success'} style={{ marginBottom: 12 }}>
              {message.text}
            </div>
          )}

          <div>
            <label className={styles.profileLabel}>First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className={styles.profileInput}
            />
          </div>

          <div className={styles.profileActions}>
            <button type="submit" className={styles.btnSave} disabled={loading || !user}>
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={loading || !user}>
              Cancel
            </button>
          </div>

          {/* Delete Account Section */}
          <hr style={{margin: "24px 0"}} />
          <div style={{marginBottom: "16px"}}>
            <p style={{margin: "0 0 8px 0", color: "#dc3545", fontWeight: "500"}}>Danger Zone</p>
            <p style={{margin: "0 0 12px 0", fontSize: "0.9em", color: "#666"}}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              type="button" 
              onClick={onDeleteAccount}
              disabled={loading || !user}
              style={{
                padding: "8px 16px",
                backgroundColor: showDeleteConfirm ? "#dc3545" : "#fff",
                color: showDeleteConfirm ? "#fff" : "#dc3545",
                border: "1px solid #dc3545",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9em",
                fontWeight: "500"
              }}
            >
              {showDeleteConfirm ? "Click again to confirm deletion" : "Delete Account"}
            </button>
            {showDeleteConfirm && (
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#fff",
                  color: "#666",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9em",
                  marginLeft: "8px"
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
