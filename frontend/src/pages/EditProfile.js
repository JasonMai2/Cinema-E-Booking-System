import React, { useEffect, useState, useId, useCallback } from "react";

import api from "../services/api";
import styles from "../components/EditProfile.module.css";
import { useAuth } from "../context/AuthContext";
import PromotionsToggle from "../components/PromotionsToggle";

export default function EditProfile() {
  const { user, login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [promotions, setPromotions] = useState(true);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmToken, setPmToken] = useState("");
  const [pmBrand, setPmBrand] = useState("");
  const [pmLast4, setPmLast4] = useState("");
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState(null);
  const [initialUser, setInitialUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  const promotionsId = useId();

  const togglePromotions = useCallback(() => {
    setPromotions((prev) => !prev);
  }, []);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setBillingAddress({
        street: user.billing_street || "",
        city: user.billing_city || "",
        state: user.billing_state || "",
        postalCode: user.billing_postal_code || "",
      });
      setPromotions(user.promotions !== undefined ? user.promotions : true);
      // remember original values to compute "dirty"
      setInitialUser({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        billing_street: user.billing_street || "",
        billing_city: user.billing_city || "",
        billing_state: user.billing_state || "",
        billing_postal_code: user.billing_postal_code || "",
        promotions: user.promotions !== undefined ? user.promotions : true,
      });
      // load payment methods for this user (dev: pass user id)
      setPmLoading(true);
      setPmError(null);
      api
        .get(`/payment-methods?userId=${user.id}`)
        .then((res) => {
          if (res?.data?.ok) setPaymentMethods(res.data.methods || []);
          else
            setPmError(res?.data?.message || "Unable to load payment methods");
        })
        .catch((err) => {
          // surface error so user can see why no methods are shown
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Payment methods endpoint not available";
          setPmError(msg);
        })
        .finally(() => setPmLoading(false));
    }
  }, [user]);

  const validateProfile = () => {
    const errs = {};
    if (!firstName || firstName.trim().length === 0) {
      errs.firstName = "First name is required.";
    }
    if (!lastName || lastName.trim().length === 0) {
      errs.lastName = "Last name is required.";
    }
    if (phone && !/^\+?[0-9\s()-]{7,15}$/.test(phone)) {
      errs.phone = "Enter a valid phone number.";
    }
    if (
      billingAddress.postalCode &&
      !/^[A-Za-z0-9 \-]{3,10}$/.test(billingAddress.postalCode)
    ) {
      errs.postalCode = "Enter a valid postal code.";
    }
    return errs;
  };

  const validatePasswordChange = () => {
    const errs = {};
    if (!currentPassword || currentPassword.length === 0) {
      errs.currentPassword = "Current password is required.";
    }
    if (!password || password.length < 4) {
      errs.newPassword = "New password must be at least 4 characters.";
    }
    if (password !== confirm) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});
    setShowAllErrors(false);

    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowAllErrors(true);
      setMessage({
        type: "error",
        text: "Please fix the highlighted errors before saving.",
      });
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
        billing_street: billingAddress.street,
        billing_city: billingAddress.city,
        billing_state: billingAddress.state,
        billing_postal_code: billingAddress.postalCode,
        promotions,
      };

      const res = await api.put("/auth/profile", payload);
      setLoading(false);
      if (res?.data?.ok && res?.data?.user) {
        // update context so header updates
        login(res.data.user);
        // update the initial snapshot so the form no longer appears dirty
        setInitialUser({
          first_name: res.data.user.first_name || "",
          last_name: res.data.user.last_name || "",
          email: res.data.user.email || "",
          phone: res.data.user.phone || "",
          billing_street: res.data.user.billing_street || "",
          billing_city: res.data.user.billing_city || "",
          billing_state: res.data.user.billing_state || "",
          billing_postal_code: res.data.user.billing_postal_code || "",
          promotions:
            res.data.user.promotions !== undefined
              ? res.data.user.promotions
              : true,
        });
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({
          type: "error",
          text: res?.data?.message || "Update failed",
        });
      }
    } catch (err) {
      setLoading(false);
      const serverMsg = err?.response?.data?.message || err?.message;
      setMessage({ type: "error", text: serverMsg || "Update failed" });
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});
    setShowAllErrors(false);

    const validationErrors = validatePasswordChange();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowAllErrors(true);
      setMessage({
        type: "error",
        text: "Please fix the highlighted password errors.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/users/change-password?userId=${user?.id}`, {
        currentPassword,
        newPassword: password,
      });
      setLoading(false);
      if (res?.data?.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setPassword("");
        setConfirm("");
        setErrors({});
      } else {
        setMessage({
          type: "error",
          text: res?.data?.message || "Password change failed",
        });
      }
    } catch (err) {
      setLoading(false);
      const serverMsg = err?.response?.data?.message || err?.message;
      setMessage({
        type: "error",
        text: serverMsg || "Password change failed",
      });
    }
  };

  const onCancel = (e) => {
    e.preventDefault();
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setBillingAddress({
        street: user.billing_street || "",
        city: user.billing_city || "",
        state: user.billing_state || "",
        postalCode: user.billing_postal_code || "",
      });
      setPromotions(user.promotions !== undefined ? user.promotions : true);
      setPassword("");
      setCurrentPassword("");
      setConfirm("");
      setPmToken("");
      setPmBrand("");
      setPmLast4("");
      setMessage(null);
      setErrors({});
      setShowAllErrors(false);
    }
  };

  const inputClass = (key) =>
    `${styles.profileInput} ${
      errors[key] && (showAllErrors || errors[key])
        ? " " + styles.inputError
        : ""
    }`;

  return (
    <main className={styles.profilePage}>
      <h2 className={styles.profileTitle}>Edit Profile</h2>

      <section className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={onSave}>
          {message && (
            <div
              className={message.type === "error" ? "error" : "success"}
              style={{ marginBottom: 12 }}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className={styles.profileLabel}>First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) {
                  const newErrors = { ...errors };
                  delete newErrors.firstName;
                  setErrors(newErrors);
                }
              }}
              className={inputClass("firstName")}
            />
            {errors.firstName && (
              <div className={styles.fieldError}>{errors.firstName}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) {
                  const newErrors = { ...errors };
                  delete newErrors.lastName;
                  setErrors(newErrors);
                }
              }}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.profileInput}
              disabled
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  const newErrors = { ...errors };
                  delete newErrors.phone;
                  setErrors(newErrors);
                }
              }}
              placeholder="e.g. +1 (555) 555-5555"
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
              value={billingAddress.street}
              onChange={(e) =>
                setBillingAddress({ ...billingAddress, street: e.target.value })
              }
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>City</label>
            <input
              type="text"
              value={billingAddress.city}
              onChange={(e) =>
                setBillingAddress({ ...billingAddress, city: e.target.value })
              }
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>State</label>
            <input
              type="text"
              value={billingAddress.state}
              onChange={(e) =>
                setBillingAddress({ ...billingAddress, state: e.target.value })
              }
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Postal Code</label>
            <input
              type="text"
              value={billingAddress.postalCode}
              onChange={(e) => {
                setBillingAddress({
                  ...billingAddress,
                  postalCode: e.target.value,
                });
                if (errors.postalCode) {
                  const newErrors = { ...errors };
                  delete newErrors.postalCode;
                  setErrors(newErrors);
                }
              }}
              className={inputClass("postalCode")}
            />
            {errors.postalCode && (
              <div className={styles.fieldError}>{errors.postalCode}</div>
            )}
          </div>

          <PromotionsToggle
            id={promotionsId}
            checked={!!promotions}
            onToggle={togglePromotions}
            label="Register for promotions"
          />

          <div className={styles.profileActions}>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={
                loading ||
                !user ||
                (initialUser &&
                  initialUser.first_name === firstName &&
                  (initialUser.last_name || "") === (lastName || "") &&
                  (initialUser.email || "") === (email || "") &&
                  (initialUser.phone || "") === (phone || "") &&
                  (initialUser.billing_street || "") ===
                    (billingAddress.street || "") &&
                  (initialUser.billing_city || "") ===
                    (billingAddress.city || "") &&
                  (initialUser.billing_state || "") ===
                    (billingAddress.state || "") &&
                  (initialUser.billing_postal_code || "") ===
                    (billingAddress.postalCode || "") &&
                  initialUser.promotions === promotions)
              }
            >
              {loading ? "Saving…" : "Save Profile"}
            </button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onCancel}
              disabled={loading || !user}
            >
              Cancel
            </button>
          </div>
        </form>

        <hr />

        <h3>Change Password</h3>
        <form className={styles.profileForm} onSubmit={onChangePassword}>
          <div>
            <label className={styles.profileLabel}>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.currentPassword) {
                  const newErrors = { ...errors };
                  delete newErrors.currentPassword;
                  setErrors(newErrors);
                }
              }}
              placeholder="Enter current password"
              className={inputClass("currentPassword")}
            />
            {errors.currentPassword && (
              <div className={styles.fieldError}>{errors.currentPassword}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.newPassword) {
                  const newErrors = { ...errors };
                  delete newErrors.newPassword;
                  setErrors(newErrors);
                }
              }}
              placeholder="Enter new password"
              className={inputClass("newPassword")}
            />
            {errors.newPassword && (
              <div className={styles.fieldError}>{errors.newPassword}</div>
            )}
          </div>

          <div>
            <label className={styles.profileLabel}>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (errors.confirmPassword) {
                  const newErrors = { ...errors };
                  delete newErrors.confirmPassword;
                  setErrors(newErrors);
                }
              }}
              placeholder="Confirm new password"
              className={inputClass("confirmPassword")}
            />
            {errors.confirmPassword && (
              <div className={styles.fieldError}>{errors.confirmPassword}</div>
            )}
          </div>

          <div className={styles.profileActions}>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={loading || !currentPassword || !password || !confirm}
            >
              {loading ? "Changing…" : "Change Password"}
            </button>
          </div>
        </form>

        <hr />

        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: "6px 0" }}>Payment methods</h3>
          {pmLoading ? (
            <div style={{ color: "#999" }}>Loading payment methods…</div>
          ) : pmError ? (
            <div style={{ color: "#e66" }}>Error: {pmError}</div>
          ) : paymentMethods.length === 0 ? (
            <div style={{ color: "#ddd" }}>
              No saved payment methods. Use the form below to add one (dev
              mode).
            </div>
          ) : (
            <ul>
              {paymentMethods.map((m) => (
                <li key={m.id} style={{ marginBottom: 8 }}>
                  {m.brand || "Card"} ****{m.last4 || "----"} exp{" "}
                  {m.exp_month || "--"}/{m.exp_year || "--"}
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={async (ev) => {
                      ev.preventDefault();
                      try {
                        const res = await api.delete(
                          `/payment-methods/${m.id}`
                        );
                        if (res?.data?.ok)
                          setPaymentMethods(
                            paymentMethods.filter((pm) => pm.id !== m.id)
                          );
                      } catch (e) {
                        // show ephemeral error
                        setMessage({
                          type: "error",
                          text: "Unable to remove payment method",
                        });
                        setTimeout(() => setMessage(null), 3000);
                      }
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 8 }}>
            <p style={{ margin: 0 }}>
              Add a payment method (dev mode — enter a provider token)
            </p>
            <input
              type="text"
              placeholder="provider token"
              value={pmToken}
              onChange={(e) => setPmToken(e.target.value)}
            />
            <input
              type="text"
              placeholder="brand (Visa)"
              value={pmBrand}
              onChange={(e) => setPmBrand(e.target.value)}
            />
            <input
              type="text"
              placeholder="last4"
              value={pmLast4}
              onChange={(e) => setPmLast4(e.target.value)}
            />
            <button
              onClick={async (ev) => {
                ev.preventDefault();
                if (!pmToken || !user) {
                  setMessage({ type: "error", text: "Enter a provider token" });
                  setTimeout(() => setMessage(null), 2500);
                  return;
                }
                try {
                  const payload = {
                    user_id: user.id,
                    provider_token: pmToken,
                    brand: pmBrand,
                    last4: pmLast4,
                  };
                  const res = await api.post("/payment-methods", payload);
                  if (res?.data?.ok) {
                    // refresh list
                    const list = await api.get(
                      `/payment-methods?userId=${user.id}`
                    );
                    setPaymentMethods(list.data.methods || []);
                    setPmToken("");
                    setPmBrand("");
                    setPmLast4("");
                  } else {
                    setMessage({
                      type: "error",
                      text: res?.data?.message || "Save failed",
                    });
                    setTimeout(() => setMessage(null), 2500);
                  }
                } catch (e) {
                  setMessage({ type: "error", text: "Save failed" });
                  setTimeout(() => setMessage(null), 2500);
                }
              }}
            >
              Save payment method
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
