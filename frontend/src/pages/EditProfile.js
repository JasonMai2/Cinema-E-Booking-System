import React, { useState, useEffect, useId, useCallback } from "react";
import styles from "../components/EditProfile.module.css";
import api from "../services/api";
import CardManager from "../components/CardManager";
import PromotionsToggle from "../components/PromotionsToggle";

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
      cardHolderName: "",
      fullNumber: "",
      securityCode: "",
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
  const [errors, setErrors] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  const CARD_LIMIT = 3;

  // Assume userId is 1 for demo, in real app get from auth context
  const userId = 1;

  const promotionsId = useId();

  const togglePromotions = useCallback(() => {
    const newProfile = { ...profile, promotions: !profile.promotions };
    setProfile(newProfile);
    const key = "promotions";
    const validation = validateProfile(newProfile);
    if (validation.errors && validation.errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: validation.errors[key] }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        if (copy[key]) delete copy[key];
        return copy;
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/profile?userId=${userId}`);
      const data = response.data;
      const paymentCard = data.paymentCard || {};
      setProfile({ ...data, paymentCard });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    const key = name.replace(".", "_");

    let newProfile;
    if (name.startsWith("billingAddress.")) {
      const field = name.split(".")[1];
      newProfile = {
        ...profile,
        billingAddress: { ...profile.billingAddress, [field]: value },
      };
    } else if (name.startsWith("paymentCard.")) {
      const field = name.split(".")[1];
      newProfile = {
        ...profile,
        paymentCard: { ...profile.paymentCard, [field]: value },
      };
    } else {
      newProfile = {
        ...profile,
        [name]: type === "checkbox" ? checked : value,
      };
    }
    setProfile(newProfile);

    const validation = validateProfile(newProfile);
    if (validation.errors && validation.errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: validation.errors[key] }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        if (copy[key]) delete copy[key];
        return copy;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const newPasswords = { ...passwords, [name]: value };
    setPasswords(newPasswords);
    const key = name;
    const validation = validatePasswords(newPasswords);
    if (validation.errors && validation.errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: validation.errors[key] }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        if (copy[key]) delete copy[key];
        return copy;
      });
    }
  };

  const handleSaveProfile = async () => {
    setMessage("");
    const validation = validateProfile(profile);
    if (!validation.valid) {
      setErrors(validation.errors);
      setShowAllErrors(true);
      setMessage("Please fix the highlighted errors before saving.");
      return;
    }
    setSaving(true);
    try {
      // TODO: If a full card number is present, tokenize it client-side (placeholder)
      const payload = { ...profile };
      if (profile.paymentCard && profile.paymentCard.fullNumber) {
        const digits = (profile.paymentCard.fullNumber || "").replace(
          /\D/g,
          ""
        );
        const last4 = digits.slice(-4);
        // TODO: placeholder tokenization
        const processorToken = `tok_${btoa(last4 + Date.now())}`;
        payload.paymentCard = {
          brand: profile.paymentCard.brand,
          processorToken,
          last4,
          expMonth: profile.paymentCard.expMonth,
          expYear: profile.paymentCard.expYear,
        };
        setProfile((prev) => ({
          ...prev,
          paymentCard: {
            ...prev.paymentCard,
            fullNumber: "",
            securityCode: "",
            processorToken,
          },
        }));
      } else if (profile.paymentCard && profile.paymentCard.processorToken) {
        payload.paymentCard = {
          brand: profile.paymentCard.brand,
          processorToken: profile.paymentCard.processorToken,
          last4: profile.paymentCard.last4,
          expMonth: profile.paymentCard.expMonth,
          expYear: profile.paymentCard.expYear,
        };
      }

      await api.put(`/users/profile?userId=${userId}`, payload);
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      const msg = error?.response?.data?.message || "Failed to update profile.";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCard = async (cardId) => {
    setMessage("");
    try {
      await api.delete(`/users/payment-cards/${cardId}?userId=${userId}`);
      setMessage("Card removed");
      setLoading(true);
      await fetchProfile();
    } catch (err) {
      console.error("Error removing card:", err);
      const msg = err?.response?.data?.message || "Failed to remove card.";
      setMessage(msg);
    }
  };

  const handleChangePassword = async () => {
    setMessage("");
    const validation = validatePasswords(passwords);
    if (!validation.valid) {
      setErrors(validation.errors);
      setShowAllErrors(true);
      setMessage("Please fix the highlighted password errors.");
      return;
    }
    setSaving(true);
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
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.currentPassword;
        delete copy.newPassword;
        delete copy.confirmPassword;
        return copy;
      });
      setShowAllErrors(false);
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage("Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const validateProfile = (p) => {
    const errs = {};
    if (!p.firstName || p.firstName.trim().length === 0) {
      errs.firstName = "First name is required.";
    }
    if (!p.lastName || p.lastName.trim().length === 0) {
      errs.lastName = "Last name is required.";
    }
    if (p.phone && !/^\+?[0-9\s()-]{7,15}$/.test(p.phone)) {
      errs.phone = "Enter a valid phone number.";
    }
    if (p.billingAddress && p.billingAddress.postalCode) {
      if (!/^[A-Za-z0-9 \-]{3,10}$/.test(p.billingAddress.postalCode)) {
        errs.billingAddress_postalCode = "Enter a valid postal code.";
      }
    }

    const hasCardInfo =
      p.paymentCard &&
      (p.paymentCard.fullNumber ||
        p.paymentCard.last4 ||
        p.paymentCard.brand ||
        p.paymentCard.processorToken);
    if (hasCardInfo) {
      if (
        !p.paymentCard.cardHolderName ||
        p.paymentCard.cardHolderName.trim().length === 0
      ) {
        errs.paymentCard_cardHolderName =
          "Card holder name is required when adding card details.";
      }
    }
    if (p.paymentCard && p.paymentCard.fullNumber) {
      const digits = (p.paymentCard.fullNumber || "").replace(/\D/g, "");
      if (!/^\d{13,19}$/.test(digits)) {
        errs.paymentCard_fullNumber =
          "Enter a valid card number (13-19 digits).";
      }
    }
    if (
      p.paymentCard &&
      p.paymentCard.securityCode &&
      p.paymentCard.fullNumber
    ) {
      if (!/^\d{3,4}$/.test(p.paymentCard.securityCode)) {
        errs.paymentCard_securityCode = "Security code must be 3 or 4 digits.";
      }
    }
    if (p.paymentCard) {
      const m = Number(p.paymentCard.expMonth);
      const y = Number(p.paymentCard.expYear);
      if (p.paymentCard.expMonth && (isNaN(m) || m < 1 || m > 12)) {
        errs.paymentCard_expMonth = "Enter a valid month (1-12).";
      }
      const currentYear = new Date().getFullYear();
      if (p.paymentCard.expYear && (isNaN(y) || y < currentYear || y > 2100)) {
        errs.paymentCard_expYear = "Enter a valid year.";
      }
      if (m && y) {
        const now = new Date();
        const exp = new Date(y, m - 1, 1);
        if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) {
          errs.paymentCard_expMonth = "Card appears expired.";
        }
      }
    }
    return { valid: Object.keys(errs).length === 0, errors: errs };
  };

  const inputClass = (key) =>
    `${styles.profileInput} ${errors[key] ? " " + styles.inputError : ""}`;

  const validatePasswords = (pw) => {
    const errs = {};
    if (!pw.currentPassword || pw.currentPassword.length === 0) {
      errs.currentPassword = "Current password is required.";
    }
    if (!pw.newPassword || pw.newPassword.length < 4) {
      errs.newPassword = "New password must be at least 4 characters.";
    }
    if (pw.newPassword !== pw.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return { valid: Object.keys(errs).length === 0, errors: errs };
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
              className={inputClass("firstName")}
            />
            {errors.firstName && (
              <div className={styles.fieldError}>{errors.firstName}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={profile.lastName || ""}
              onChange={handleProfileChange}
              className={inputClass("lastName")}
            />
            {errors.lastName && (
              <div className={styles.fieldError}>{errors.lastName}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email || ""}
              className={inputClass("email")}
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
              className={inputClass("phone")}
            />
            {errors.phone && (
              <div className={styles.fieldError}>{errors.phone}</div>
            )}
          </div>

          <h3>Billing Address</h3>
          <div>
            <label className={styles.profileLabel}>Street</label>
            <input
              type="text"
              name="billingAddress.street"
              value={profile.billingAddress?.street || ""}
              onChange={handleProfileChange}
              className={inputClass("billingAddress_street")}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>City</label>
            <input
              type="text"
              name="billingAddress.city"
              value={profile.billingAddress?.city || ""}
              onChange={handleProfileChange}
              className={inputClass("billingAddress_city")}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>State</label>
            <input
              type="text"
              name="billingAddress.state"
              value={profile.billingAddress?.state || ""}
              onChange={handleProfileChange}
              className={inputClass("billingAddress_state")}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Postal Code</label>
            <input
              type="text"
              name="billingAddress.postalCode"
              value={profile.billingAddress?.postalCode || ""}
              onChange={handleProfileChange}
              className={inputClass("billingAddress_postalCode")}
            />
            {errors.billingAddress_postalCode && (
              <div className={styles.fieldError}>
                {errors.billingAddress_postalCode}
              </div>
            )}
          </div>

          <h3>Payment Card</h3>
          <CardManager
            userId={userId}
            cards={profile.paymentCards || []}
            cardLimit={CARD_LIMIT}
            firstName={profile.firstName}
            lastName={profile.lastName}
            onRefresh={() => {
              setLoading(true);
              fetchProfile();
            }}
          />

          <PromotionsToggle
            id={promotionsId}
            checked={!!profile.promotions}
            onToggle={togglePromotions}
            label="Register for promotions"
          />

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
          {message && (
            <p
              className={`${styles.formMessage} ${
                showAllErrors ? styles.fieldError : ""
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <h3>Change Password</h3>
        <form className={styles.profileForm}>
          <div>
            <label className={styles.profileLabel}>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className={inputClass("currentPassword")}
            />
            {errors.currentPassword && (
              <div className={styles.fieldError}>{errors.currentPassword}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className={inputClass("newPassword")}
            />
            {errors.newPassword && (
              <div className={styles.fieldError}>{errors.newPassword}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className={inputClass("confirmPassword")}
            />
            {errors.confirmPassword && (
              <div className={styles.fieldError}>{errors.confirmPassword}</div>
            )}
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
      </section>
    </main>
  );
}
