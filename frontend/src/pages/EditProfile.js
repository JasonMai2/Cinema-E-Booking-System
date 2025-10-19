import React, { useState, useEffect } from "react";
import styles from "../components/EditProfile.module.css";
import api from "../services/api";

export default function EditProfile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    paymentCard: {
      brand: "",
      last4: "",
      expMonth: "",
      expYear: "",
      processorToken: "",
    },
    promotions: true,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Assume userId is 1 for demo, in real app get from auth context
  const userId = 1;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/profile?userId=${userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("billingAddress.")) {
      const field = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, [field]: value },
      }));
    } else if (name.startsWith("paymentCard.")) {
      const field = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        paymentCard: { ...prev.paymentCard, [field]: value },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/users/profile?userId=${userId}`, profile);
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.put(`/users/change-password?userId=${userId}`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setMessage("Password changed successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage("Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <main className={styles.profilePage}>
      <h2 className={styles.profileTitle}>Edit Profile</h2>

      <section className={styles.profileCard}>
        <form className={styles.profileForm}>
          <div>
            <label className={styles.profileLabel}>First Name</label>
            <input
              type="text"
              name="firstName"
              value={profile.firstName || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={profile.lastName || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email || ""}
              className={styles.profileInput}
              disabled
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <hr />

          <h3>Billing Address</h3>
          <div>
            <label className={styles.profileLabel}>Street</label>
            <input
              type="text"
              name="billingAddress.street"
              value={profile.billingAddress?.street || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>City</label>
            <input
              type="text"
              name="billingAddress.city"
              value={profile.billingAddress?.city || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>State</label>
            <input
              type="text"
              name="billingAddress.state"
              value={profile.billingAddress?.state || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Postal Code</label>
            <input
              type="text"
              name="billingAddress.postalCode"
              value={profile.billingAddress?.postalCode || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <hr />

          <h3>Payment Card</h3>
          <div>
            <label className={styles.profileLabel}>Brand</label>
            <input
              type="text"
              name="paymentCard.brand"
              value={profile.paymentCard?.brand || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Last 4 Digits</label>
            <input
              type="text"
              name="paymentCard.last4"
              value={profile.paymentCard?.last4 || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Expiration Month</label>
            <input
              type="number"
              name="paymentCard.expMonth"
              value={profile.paymentCard?.expMonth || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Expiration Year</label>
            <input
              type="number"
              name="paymentCard.expYear"
              value={profile.paymentCard?.expYear || ""}
              onChange={handleProfileChange}
              className={styles.profileInput}
            />
          </div>

          <hr />

          <div>
            <label>
              <input
                type="checkbox"
                name="promotions"
                checked={profile.promotions}
                onChange={handleProfileChange}
              />
              Register for promotions
            </label>
          </div>

          <div className={styles.profileActions}>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className={styles.btnSave}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>

        <hr />

        <h3>Change Password</h3>
        <form className={styles.profileForm}>
          <div>
            <label className={styles.profileLabel}>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className={styles.profileInput}
            />
          </div>

          <div className={styles.profileActions}>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={saving}
              className={styles.btnSave}
            >
              {saving ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>

        {message && <p>{message}</p>}
      </section>
    </main>
  );
}
