import React, { useEffect, useState, useId, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import styles from "../components/EditProfile.module.css";
import { useAuth } from "../context/AuthContext";
import PromotionsToggle from "../components/PromotionsToggle";

export default function EditProfile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmBrand, setPmBrand] = useState("");
  const [pmNumber, setPmNumber] = useState("");
  const [pmNumberDigits, setPmNumberDigits] = useState("");
  const [pmName, setPmName] = useState("");
  const [pmBillingAddress, setPmBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [pmCvv, setPmCvv] = useState("");
  const [pmExpMonth, setPmExpMonth] = useState("");
  const [pmExpYear, setPmExpYear] = useState("");
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState(null);
  const [pmFieldErrors, setPmFieldErrors] = useState({});
  const [initialUser, setInitialUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormMode, setPaymentFormMode] = useState("add"); // "add" or "edit"
  const [editingPaymentId, setEditingPaymentId] = useState(null);

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
      setShippingAddress({
        street: user.shipping_address?.street || "",
        city: user.shipping_address?.city || "",
        state: user.shipping_address?.state || "",
        postalCode: user.shipping_address?.postalCode || "",
      });
      setPromotions(user.promotions !== undefined ? user.promotions : true);
      // remember original values to compute "dirty"
      setInitialUser({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        shipping_address: {
          street: user.shipping_address?.street || "",
          city: user.shipping_address?.city || "",
          state: user.shipping_address?.state || "",
          postalCode: user.shipping_address?.postalCode || "",
        },
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

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "firstName":
        if (!value || value.trim().length === 0) {
          return "First name is required.";
        }
        break;
      case "lastName":
        if (!value || value.trim().length === 0) {
          return "Last name is required.";
        }
        break;
      case "phone":
        if (value && !/^\+?[0-9\s()-]{7,15}$/.test(value)) {
          return "Enter a valid phone number.";
        }
        break;
      case "postalCode":
        if (value && !/^[A-Za-z0-9 \-]{3,10}$/.test(value)) {
          return "Enter a valid postal code.";
        }
        break;
      case "currentPassword":
        if (!value || value.length === 0) {
          return "Current password is required.";
        }
        break;
      case "newPassword":
        if (!value || value.length < 8) {
          return "New password must be at least 8 characters.";
        }
        break;
      case "confirmPassword":
        if (value !== password) {
          return "Passwords do not match.";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const handleBlur = (fieldName, value) => {
    const error = validateField(fieldName, value);
    setErrors((prev) => {
      if (error) {
        return { ...prev, [fieldName]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      }
    });
  };

  const validatePmField = (fieldName, value, additionalContext = {}) => {
    switch (fieldName) {
      case "pmName":
        if (!value || value.trim().length === 0) {
          return "Cardholder name is required.";
        }
        break;
      case "pmBrand":
        if (!value || value.trim().length === 0) {
          return "Select a card brand.";
        }
        break;
      case "pmNumber":
        if (!additionalContext.pmNumberDigits) {
          return "Card number is required.";
        }
        if (!luhnCheck(additionalContext.pmNumberDigits)) {
          return "Enter a valid card number.";
        }
        break;
      case "pmCvv":
        if (!value) {
          return "CVV is required.";
        }
        if (!/^\d{3,4}$/.test(value)) {
          return "Enter a valid CVV (3-4 digits).";
        }
        break;
      case "pmExpMonth":
        if (!value) {
          return "Expiration month is required.";
        }
        const month = parseInt(value, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          return "Enter a valid month (1-12).";
        }
        break;
      case "pmExpYear":
        if (!value) {
          return "Expiration year is required.";
        }
        const year = parseInt(value, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < currentYear || year > currentYear + 20) {
          return `Enter a valid year (${currentYear}-${currentYear + 20}).`;
        }
        break;
      case "pmStreet":
        if (!value || value.trim().length === 0) {
          return "Billing street is required.";
        }
        break;
      case "pmPostalCode":
        if (!value || value.trim().length === 0) {
          return "Postal code is required.";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const handlePmBlur = (fieldName, value, additionalContext = {}) => {
    const error = validatePmField(fieldName, value, additionalContext);
    setPmFieldErrors((prev) => {
      if (error) {
        return { ...prev, [fieldName.replace("pm", "").toLowerCase()]: error };
      } else {
        const newErrors = { ...prev };
        const key = fieldName.replace("pm", "").toLowerCase();
        delete newErrors[key];
        if (fieldName === "pmStreet") {
          delete newErrors.street;
        }
        if (fieldName === "pmPostalCode") {
          delete newErrors.postalCode;
        }
        if (fieldName === "pmNumber") {
          delete newErrors.number;
        }
        if (fieldName === "pmExpMonth") {
          delete newErrors.expmonth;
        }
        if (fieldName === "pmExpYear") {
          delete newErrors.expyear;
        }
        return newErrors;
      }
    });
  };

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
    return errs;
  };

  const validatePasswordChange = () => {
    const errs = {};
    if (!currentPassword || currentPassword.length === 0) {
      errs.currentPassword = "Current password is required.";
    }
    if (!password || password.length < 8) {
      errs.newPassword = "New password must be at least 8 characters.";
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
        shipping_address: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
        },
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
          shipping_address: {
            street: res.data.user.shipping_address?.street || "",
            city: res.data.user.shipping_address?.city || "",
            state: res.data.user.shipping_address?.state || "",
            postalCode: res.data.user.shipping_address?.postalCode || "",
          },
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
      const res = await api.put(
        `/auth/users/change-password?userId=${user?.id}`,
        {
          currentPassword,
          newPassword: password,
        }
      );
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
      setShippingAddress({
        street: user.shipping_address?.street || "",
        city: user.shipping_address?.city || "",
        state: user.shipping_address?.state || "",
        postalCode: user.shipping_address?.postalCode || "",
      });
      setPromotions(user.promotions !== undefined ? user.promotions : true);
      setPassword("");
      setCurrentPassword("");
      setConfirm("");
      setPmBrand("");
      setPmNumber("");
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

  const pmInputClass = (key) =>
    `${styles.profileInput} ${
      pmFieldErrors[key] ? " " + styles.inputError : ""
    }`;

  const isDirty = () => {
    if (!initialUser) return false;
    return (
      initialUser.first_name !== (firstName || "") ||
      initialUser.last_name !== (lastName || "") ||
      initialUser.phone !== (phone || "") ||
      initialUser.shipping_address?.street !== (shippingAddress.street || "") ||
      initialUser.shipping_address?.city !== (shippingAddress.city || "") ||
      initialUser.shipping_address?.state !== (shippingAddress.state || "") ||
      initialUser.shipping_address?.postalCode !==
        (shippingAddress.postalCode || "") ||
      initialUser.promotions !== promotions
    );
  };

  // Luhn algorithm to validate card numbers (returns true for valid numbers)
  const luhnCheck = (num) => {
    if (!num) return false;
    const digits = String(num).replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        d = d * 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Format card number for display based on brand (Amex vs others)
  const formatCardNumber = (rawDigits, brand) => {
    if (!rawDigits) return "";
    const digits = rawDigits.replace(/\D/g, "");
    const limited = digits.slice(0, 19);
    if (brand === "American Express" || /^3[47]/.test(limited)) {
      const parts = [];
      if (limited.length > 0)
        parts.push(limited.slice(0, Math.min(4, limited.length)));
      if (limited.length > 4)
        parts.push(limited.slice(4, Math.min(10, limited.length)));
      if (limited.length > 10) parts.push(limited.slice(10, 15));
      return parts.join(" ").trim();
    }
    return limited.replace(/(.{4})/g, "$1 ").trim();
  };

  // Reformat display whenever the selected brand or digits change
  useEffect(() => {
    const formatted = formatCardNumber(pmNumberDigits, pmBrand);
    setPmNumber(formatted);
  }, [pmBrand, pmNumberDigits]);

  const validatePmFields = () => {
    const e = {};
    if (!user) e.user = "You must be signed in.";
    if (!pmName || pmName.trim().length === 0)
      e.name = "Cardholder name is required.";
    if (!pmBrand || pmBrand.trim().length === 0)
      e.brand = "Select a card brand.";
    if (!pmNumberDigits) e.number = "Card number is required.";
    else if (!luhnCheck(pmNumberDigits))
      e.number = "Enter a valid card number.";
    if (!pmCvv) e.cvv = "CVV is required.";
    else if (!/^\d{3,4}$/.test(pmCvv))
      e.cvv = "Enter a valid CVV (3-4 digits).";
    if (!pmExpMonth) e.expmonth = "Expiration month is required.";
    else {
      const month = parseInt(pmExpMonth, 10);
      if (isNaN(month) || month < 1 || month > 12)
        e.expmonth = "Enter a valid month (1-12).";
    }
    if (!pmExpYear) e.expyear = "Expiration year is required.";
    else {
      const year = parseInt(pmExpYear, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 20)
        e.expyear = `Enter a valid year (${currentYear}-${currentYear + 20}).`;
    }
    if (!pmBillingAddress.street || pmBillingAddress.street.trim().length === 0)
      e.street = "Billing street is required.";
    if (
      !pmBillingAddress.postalCode ||
      pmBillingAddress.postalCode.trim().length === 0
    )
      e.postalCode = "Postal code is required.";
    return e;
  };

  const isPmValid = Object.keys(validatePmFields()).length === 0;

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
        navigate("/");
      } else {
        setMessage({
          type: "error",
          text: res?.data?.message || "Delete failed",
        });
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setLoading(false);
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Delete failed",
      });
      setShowDeleteConfirm(false);
    }
  };

  const handleEditPayment = (paymentMethod) => {
    // Parse billing address from stored JSON string or use empty object
    let billing = { street: "", city: "", state: "", postalCode: "" };
    let nameOnCard = "";
    if (paymentMethod.billing_address) {
      try {
        const parsed =
          typeof paymentMethod.billing_address === "string"
            ? JSON.parse(paymentMethod.billing_address)
            : paymentMethod.billing_address;
        billing = {
          street: parsed.street || "",
          city: parsed.city || "",
          state: parsed.state || "",
          postalCode: parsed.postalCode || "",
        };
        nameOnCard = parsed.nameOnCard || "";
      } catch (e) {
        console.error("Failed to parse billing address:", e);
      }
    }

    let last4Digits = "••••";
    if (paymentMethod.provider_token) {
      const cardNum = String(paymentMethod.provider_token);
      last4Digits = cardNum.slice(-4);
    }

    setEditingPaymentId(paymentMethod.id);
    setPmName(nameOnCard || paymentMethod.cardholder_name || "");
    setPmBrand(paymentMethod.brand || "");
    setPmNumber(`•••• •••• •••• ${last4Digits}`);
    setPmNumberDigits(last4Digits);
    setPmBillingAddress(billing);
    setPmCvv(
      paymentMethod.last4 ? "•".repeat(String(paymentMethod.last4).length) : ""
    );
    setPmExpMonth(
      paymentMethod.exp_month ? String(paymentMethod.exp_month) : ""
    );
    setPmExpYear(paymentMethod.exp_year ? String(paymentMethod.exp_year) : "");

    setPaymentFormMode("edit");
    setShowPaymentForm(true);
    setPmFieldErrors({});
  };

  const handleCancelPaymentForm = () => {
    setShowPaymentForm(false);
    setPaymentFormMode("add");
    setEditingPaymentId(null);

    // Reset form
    setPmBrand("");
    setPmNumber("");
    setPmNumberDigits("");
    setPmName("");
    setPmBillingAddress({ street: "", city: "", state: "", postalCode: "" });
    setPmCvv("");
    setPmExpMonth("");
    setPmExpYear("");
    setPmFieldErrors({});
  };

  const handleSaveEditPayment = async (paymentId) => {
    // Only validate billing address for edit mode
    const errors = {};
    if (
      !pmBillingAddress.street ||
      pmBillingAddress.street.trim().length === 0
    ) {
      errors.street = "Billing street is required.";
    }
    if (
      !pmBillingAddress.postalCode ||
      pmBillingAddress.postalCode.trim().length === 0
    ) {
      errors.postalCode = "Postal code is required.";
    }

    if (Object.keys(errors).length > 0) {
      setPmFieldErrors(errors);
      return;
    }

    setPmLoading(true);
    try {
      const billingAddressStr = JSON.stringify({
        street: pmBillingAddress.street,
        city: pmBillingAddress.city,
        state: pmBillingAddress.state,
        postalCode: pmBillingAddress.postalCode,
        nameOnCard: pmName,
      });
      const payload = {
        billing_address: billingAddressStr,
      };

      const res = await api.put(`/payment-methods/${paymentId}`, payload);

      if (res?.data?.ok) {
        // Refresh payment methods
        const refreshRes = await api.get(`/payment-methods?userId=${user.id}`);
        if (refreshRes?.data?.ok) {
          setPaymentMethods(refreshRes.data.methods || []);
        }

        setMessage({
          type: "success",
          text: "Billing address updated successfully",
        });
        setTimeout(() => setMessage(null), 2500);
        handleCancelPaymentForm();
      } else {
        setMessage({
          type: "error",
          text: res?.data?.message || "Failed to update billing address",
        });
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update billing address";
      setMessage({ type: "error", text: serverMsg });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setPmLoading(false);
    }
  };

  return (
    <main className={styles.profilePage}>
      <h2 className={styles.profileTitle}>Edit Profile</h2>

      <section className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={onSave}>
          {message && (
            <div
              className={`${styles.formMessage} ${
                message.type === "error"
                  ? styles.errorBadge
                  : styles.successBadge
              }`}
              role="status"
              aria-live="polite"
            >
              {message.text}
            </div>
          )}

          <div className={styles.twoCol}>
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
                onBlur={(e) => handleBlur("firstName", e.target.value)}
                className={inputClass("firstName")}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "err-firstName" : undefined
                }
              />
              {errors.firstName && (
                <div id="err-firstName" className={styles.fieldError}>
                  {errors.firstName}
                </div>
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
                onBlur={(e) => handleBlur("lastName", e.target.value)}
                className={inputClass("lastName")}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "err-lastName" : undefined}
              />
              {errors.lastName && (
                <div id="err-lastName" className={styles.fieldError}>
                  {errors.lastName}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={styles.profileLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.profileInput}
              disabled
              aria-disabled
            />
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 6,
              }}
            >
              Your email is your account identifier and can't be changed here.
            </div>
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
              onBlur={(e) => handleBlur("phone", e.target.value)}
              placeholder="e.g. +1 (555) 555-5555"
              className={inputClass("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <div className={styles.fieldError}>{errors.phone}</div>
            )}
          </div>

          <h3>Shipping Address</h3>
          <div>
            <label className={styles.profileLabel}>Street</label>
            <input
              type="text"
              value={shippingAddress.street}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  street: e.target.value,
                })
              }
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>City</label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, city: e.target.value })
              }
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>State</label>
            <input
              type="text"
              value={shippingAddress.state}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  state: e.target.value,
                })
              }
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Postal Code</label>
            <input
              type="text"
              value={shippingAddress.postalCode}
              onChange={(e) => {
                setShippingAddress({
                  ...shippingAddress,
                  postalCode: e.target.value,
                });
              }}
              className={styles.profileInput}
            />
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
              disabled={loading || !user || !isDirty()}
              aria-disabled={loading || !user || !isDirty()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden /> Saving…
                </>
              ) : (
                "Save Profile"
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isDirty() && (
                <div
                  className={styles.dirtyIndicator}
                  title="You have unsaved changes"
                >
                  <span className={styles.dirtyDot} aria-hidden /> Unsaved
                </div>
              )}
              <button
                type="button"
                className={styles.btnCancel}
                onClick={onCancel}
                disabled={loading || !user}
                aria-disabled={loading || !user}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>

        <div style={{ margin: "24px 0", borderTop: "1px solid #ddd" }}></div>

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
              onBlur={(e) => handleBlur("currentPassword", e.target.value)}
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
              onBlur={(e) => handleBlur("newPassword", e.target.value)}
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
              onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
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

        <div style={{ margin: "24px 0", borderTop: "1px solid #ddd" }}></div>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: "6px 0 12px 0" }}>Payment Methods</h3>
          {pmLoading ? (
            <div style={{ color: "#999" }}>Loading payment methods…</div>
          ) : pmError ? (
            <div style={{ color: "#e66" }}>Error: {pmError}</div>
          ) : (
            <div className={styles.paymentList}>
              {/* Display existing payment methods */}
              {paymentMethods.map((m) => (
                <div key={m.id} className={styles.paymentCard}>
                  <div className={styles.paymentInfo}>
                    <div className={styles.cardBrand}>{m.brand || "Card"}</div>
                    <div className={styles.cardDetails}>
                      {(() => {
                        let last4 = "••••";
                        if (m.provider_token) {
                          const cardNum = String(m.provider_token);
                          last4 = cardNum.slice(-4);
                        }
                        return <span>•••• •••• •••• {last4}</span>;
                      })()}
                    </div>
                    {(() => {
                      let displayName = m.cardholder_name;
                      if (m.billing_address) {
                        try {
                          const parsed =
                            typeof m.billing_address === "string"
                              ? JSON.parse(m.billing_address)
                              : m.billing_address;
                          if (parsed.nameOnCard) {
                            displayName = parsed.nameOnCard;
                          }
                        } catch (e) {
                          console.error("Failed to parse billing address:", e);
                        }
                      }
                      return displayName ? (
                        <div className={styles.cardName}>{displayName}</div>
                      ) : null;
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className={styles.editBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditPayment(m);
                      }}
                      disabled={pmLoading || showPaymentForm}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.removeBtn}
                      onClick={async (ev) => {
                        ev.preventDefault();
                        const ok = window.confirm(
                          "Remove this payment method?"
                        );
                        if (!ok) return;
                        if (String(m.id).startsWith("temp-")) {
                          setPaymentMethods((prev) =>
                            prev.filter((pm) => pm.id !== m.id)
                          );
                          return;
                        }

                        // optimistic remove
                        const previous = paymentMethods;
                        setPaymentMethods((prev) =>
                          prev.filter((pm) => pm.id !== m.id)
                        );
                        try {
                          const res = await api.delete(
                            `/payment-methods/${m.id}`
                          );
                          if (!res?.data?.ok) {
                            setPaymentMethods(previous);
                            setMessage({
                              type: "error",
                              text: res?.data?.message || "Unable to remove",
                            });
                            setTimeout(() => setMessage(null), 2500);
                          }
                        } catch (e) {
                          setPaymentMethods(previous);
                          const serverMsg =
                            e?.response?.data?.message ||
                            e?.message ||
                            "Unable to remove payment method";
                          setMessage({ type: "error", text: serverMsg });
                          setTimeout(() => setMessage(null), 3000);
                        }
                      }}
                      disabled={pmLoading || showPaymentForm}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Show skeleton box if user can add more cards (max 3) */}
              {paymentMethods.length < 3 && !showPaymentForm && (
                <div
                  className={styles.addCardSkeleton}
                  onClick={() => setShowPaymentForm(true)}
                  role="button"
                  tabIndex={0}
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setShowPaymentForm(true);
                    }
                  }}
                >
                  <div className={styles.plusIcon}>+</div>
                  <div className={styles.addCardText}>Add Payment Method</div>
                </div>
              )}
            </div>
          )}

          {/* Payment method form - shown for both add and edit */}
          {showPaymentForm &&
            (paymentMethods.length < 3 || paymentFormMode === "edit") && (
              <div className={styles.paymentFormContainer}>
                <div className={styles.paymentFormHeader}>
                  <h4 className={styles.paymentFormTitle}>
                    {paymentFormMode === "edit"
                      ? "Edit Billing Address"
                      : "Add Payment Method"}
                  </h4>
                  <button
                    className={styles.closeFormBtn}
                    onClick={handleCancelPaymentForm}
                  >
                    Cancel
                  </button>
                </div>

                <div className={styles.profileForm}>
                  {/* Cardholder name - read-only in edit mode */}
                  <div>
                    <label className={styles.profileLabel}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Cardholder name"
                      value={pmName}
                      onChange={(e) => {
                        if (paymentFormMode === "edit") return;
                        setPmName(e.target.value);
                        if (pmFieldErrors.name) {
                          const copy = { ...pmFieldErrors };
                          delete copy.name;
                          setPmFieldErrors(copy);
                        }
                      }}
                      onBlur={(e) =>
                        paymentFormMode === "add" &&
                        handlePmBlur("pmName", e.target.value)
                      }
                      className={pmInputClass("name")}
                      disabled={paymentFormMode === "edit"}
                      aria-invalid={!!pmFieldErrors.name}
                      aria-describedby={
                        pmFieldErrors.name ? "err-pm-name" : undefined
                      }
                    />
                    {pmFieldErrors.name && (
                      <div id="err-pm-name" className={styles.fieldError}>
                        {pmFieldErrors.name}
                      </div>
                    )}
                  </div>

                  {/* Billing Address - always editable */}
                  <h4 style={{ margin: "12px 0 6px 0", fontSize: "1rem" }}>
                    Billing Address
                  </h4>

                  <div className={styles.twoCol}>
                    <div>
                      <label className={styles.profileLabel}>Street</label>
                      <input
                        type="text"
                        placeholder="Billing street"
                        value={pmBillingAddress.street}
                        onChange={(e) => {
                          setPmBillingAddress({
                            ...pmBillingAddress,
                            street: e.target.value,
                          });
                          if (pmFieldErrors.street) {
                            const copy = { ...pmFieldErrors };
                            delete copy.street;
                            setPmFieldErrors(copy);
                          }
                        }}
                        onBlur={(e) => handlePmBlur("pmStreet", e.target.value)}
                        className={pmInputClass("street")}
                        aria-invalid={!!pmFieldErrors.street}
                        aria-describedby={
                          pmFieldErrors.street ? "err-pm-street" : undefined
                        }
                      />
                      {pmFieldErrors.street && (
                        <div id="err-pm-street" className={styles.fieldError}>
                          {pmFieldErrors.street}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={styles.profileLabel}>City</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={pmBillingAddress.city}
                        onChange={(e) =>
                          setPmBillingAddress({
                            ...pmBillingAddress,
                            city: e.target.value,
                          })
                        }
                        className={styles.profileInput}
                      />
                    </div>
                  </div>

                  <div className={styles.twoCol}>
                    <div>
                      <label className={styles.profileLabel}>State</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={pmBillingAddress.state}
                        onChange={(e) =>
                          setPmBillingAddress({
                            ...pmBillingAddress,
                            state: e.target.value,
                          })
                        }
                        className={styles.profileInput}
                      />
                    </div>
                    <div>
                      <label className={styles.profileLabel}>Postal Code</label>
                      <input
                        type="text"
                        placeholder="Postal code"
                        value={pmBillingAddress.postalCode}
                        onChange={(e) => {
                          setPmBillingAddress({
                            ...pmBillingAddress,
                            postalCode: e.target.value,
                          });
                          if (pmFieldErrors.postalCode) {
                            const copy = { ...pmFieldErrors };
                            delete copy.postalCode;
                            setPmFieldErrors(copy);
                          }
                        }}
                        onBlur={(e) =>
                          handlePmBlur("pmPostalCode", e.target.value)
                        }
                        className={pmInputClass("postalCode")}
                        aria-invalid={!!pmFieldErrors.postalCode}
                        aria-describedby={
                          pmFieldErrors.postalCode
                            ? "err-pm-postalCode"
                            : undefined
                        }
                      />
                      {pmFieldErrors.postalCode && (
                        <div
                          id="err-pm-postalCode"
                          className={styles.fieldError}
                        >
                          {pmFieldErrors.postalCode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Brand - read-only in edit mode */}
                  <div>
                    <label className={styles.profileLabel}>Card Brand</label>
                    <select
                      value={pmBrand}
                      onChange={(e) => {
                        if (paymentFormMode === "edit") return;
                        setPmBrand(e.target.value);
                        if (pmFieldErrors.brand) {
                          const copy = { ...pmFieldErrors };
                          delete copy.brand;
                          setPmFieldErrors(copy);
                        }
                      }}
                      onBlur={(e) =>
                        paymentFormMode === "add" &&
                        handlePmBlur("pmBrand", e.target.value)
                      }
                      className={pmInputClass("brand")}
                      disabled={paymentFormMode === "edit"}
                      aria-label="Card brand"
                      aria-invalid={!!pmFieldErrors.brand}
                      aria-describedby={
                        pmFieldErrors.brand ? "err-pm-brand" : undefined
                      }
                    >
                      <option value="">Select a brand</option>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                    {pmFieldErrors.brand && (
                      <div id="err-pm-brand" className={styles.fieldError}>
                        {pmFieldErrors.brand}
                      </div>
                    )}
                  </div>

                  {/* Card Number - shown in both modes but read-only in edit */}
                  <div>
                    <label className={styles.profileLabel}>Card Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      placeholder="Card number"
                      value={pmNumber}
                      onChange={(e) => {
                        if (paymentFormMode === "edit") return;
                        const raw = e.target.value;
                        const digits = raw.replace(/\D/g, "");
                        setPmNumberDigits(digits);
                        const formatted = formatCardNumber(digits, pmBrand);
                        setPmNumber(formatted);
                        if (pmFieldErrors.number) {
                          const copy = { ...pmFieldErrors };
                          delete copy.number;
                          setPmFieldErrors(copy);
                        }
                      }}
                      onBlur={() =>
                        paymentFormMode === "add" &&
                        handlePmBlur("pmNumber", pmNumber, { pmNumberDigits })
                      }
                      className={pmInputClass("number")}
                      disabled={paymentFormMode === "edit"}
                      aria-invalid={!!pmFieldErrors.number}
                      aria-describedby={
                        pmFieldErrors.number ? "err-pm-number" : undefined
                      }
                    />
                    {pmFieldErrors.number && (
                      <div id="err-pm-number" className={styles.fieldError}>
                        {pmFieldErrors.number}
                      </div>
                    )}
                  </div>

                  {/* Expiration Date - shown in both modes but read-only in edit */}
                  <div className={styles.twoCol}>
                    <div>
                      <label className={styles.profileLabel}>
                        Expiration Month
                      </label>
                      <input
                        type="text"
                        placeholder="MM (1-12)"
                        value={pmExpMonth}
                        onChange={(e) => {
                          if (paymentFormMode === "edit") return;
                          const digits = e.target.value.replace(/\D/g, "");
                          setPmExpMonth(digits.slice(0, 2));
                          if (pmFieldErrors.expmonth) {
                            const copy = { ...pmFieldErrors };
                            delete copy.expmonth;
                            setPmFieldErrors(copy);
                          }
                        }}
                        onBlur={(e) =>
                          paymentFormMode === "add" &&
                          handlePmBlur("pmExpMonth", e.target.value)
                        }
                        maxLength={2}
                        inputMode="numeric"
                        className={pmInputClass("expmonth")}
                        disabled={paymentFormMode === "edit"}
                        aria-invalid={!!pmFieldErrors.expmonth}
                        aria-describedby={
                          pmFieldErrors.expmonth ? "err-pm-expmonth" : undefined
                        }
                      />
                      {pmFieldErrors.expmonth && (
                        <div id="err-pm-expmonth" className={styles.fieldError}>
                          {pmFieldErrors.expmonth}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={styles.profileLabel}>
                        Expiration Year
                      </label>
                      <input
                        type="text"
                        placeholder="YYYY"
                        value={pmExpYear}
                        onChange={(e) => {
                          if (paymentFormMode === "edit") return;
                          const digits = e.target.value.replace(/\D/g, "");
                          setPmExpYear(digits.slice(0, 4));
                          if (pmFieldErrors.expyear) {
                            const copy = { ...pmFieldErrors };
                            delete copy.expyear;
                            setPmFieldErrors(copy);
                          }
                        }}
                        onBlur={(e) =>
                          paymentFormMode === "add" &&
                          handlePmBlur("pmExpYear", e.target.value)
                        }
                        maxLength={4}
                        inputMode="numeric"
                        className={pmInputClass("expyear")}
                        disabled={paymentFormMode === "edit"}
                        aria-invalid={!!pmFieldErrors.expyear}
                        aria-describedby={
                          pmFieldErrors.expyear ? "err-pm-expyear" : undefined
                        }
                      />
                      {pmFieldErrors.expyear && (
                        <div id="err-pm-expyear" className={styles.fieldError}>
                          {pmFieldErrors.expyear}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CVV - shown in both modes but masked and read-only in edit */}
                  <div>
                    <label className={styles.profileLabel}>CVV</label>
                    <input
                      type="text"
                      placeholder={
                        paymentFormMode === "edit"
                          ? "CVV (hidden for security)"
                          : "CVV"
                      }
                      value={pmCvv}
                      onChange={(e) => {
                        if (paymentFormMode === "edit") {
                          return;
                        }
                        const digits = e.target.value.replace(/\D/g, "");
                        setPmCvv(digits.slice(0, 4));
                        if (pmFieldErrors.cvv) {
                          const copy = { ...pmFieldErrors };
                          delete copy.cvv;
                          setPmFieldErrors(copy);
                        }
                      }}
                      onBlur={(e) =>
                        paymentFormMode === "add" &&
                        handlePmBlur("pmCvv", e.target.value)
                      }
                      maxLength={4}
                      inputMode="numeric"
                      className={pmInputClass("cvv")}
                      disabled={paymentFormMode === "edit"}
                      aria-invalid={!!pmFieldErrors.cvv}
                      aria-describedby={
                        pmFieldErrors.cvv ? "err-pm-cvv" : undefined
                      }
                    />
                    {pmFieldErrors.cvv && (
                      <div id="err-pm-cvv" className={styles.fieldError}>
                        {pmFieldErrors.cvv}
                      </div>
                    )}
                  </div>

                  <div className={styles.paymentFormActions}>
                    <button
                      onClick={async (ev) => {
                        ev.preventDefault();

                        if (paymentFormMode === "edit") {
                          // Handle edit mode
                          await handleSaveEditPayment(editingPaymentId);
                        } else {
                          // Handle add mode
                          await (async function handleAddPayment() {
                            const fieldErrors = validatePmFields();
                            if (Object.keys(fieldErrors).length > 0) {
                              setPmFieldErrors(fieldErrors);
                              return;
                            }

                            const tempId = `temp-${Date.now()}`;
                            const optimistic = {
                              id: tempId,
                              brand: pmBrand || "Card",
                              last4: pmCvv,
                              cardholder_name: pmName,
                              billing_address: JSON.stringify({
                                street: pmBillingAddress.street,
                                city: pmBillingAddress.city,
                                state: pmBillingAddress.state,
                                postalCode: pmBillingAddress.postalCode,
                                nameOnCard: pmName,
                              }),
                              exp_month: pmExpMonth,
                              exp_year: pmExpYear,
                            };
                            setPaymentMethods((prev) => [...prev, optimistic]);

                            const billingAddressStr = JSON.stringify({
                              street: pmBillingAddress.street,
                              city: pmBillingAddress.city,
                              state: pmBillingAddress.state,
                              postalCode: pmBillingAddress.postalCode,
                              nameOnCard: pmName,
                            });

                            const payload = {
                              user_id: user.id,
                              provider: "dev",
                              provider_token: pmNumberDigits,
                              brand: pmBrand,
                              last4: pmCvv,
                              exp_month: parseInt(pmExpMonth, 10),
                              exp_year: parseInt(pmExpYear, 10),
                              billing_address: billingAddressStr,
                            };

                            try {
                              const res = await api.post(
                                "/payment-methods",
                                payload
                              );
                              if (res?.data?.ok) {
                                const refreshRes = await api.get(
                                  `/payment-methods?userId=${user.id}`
                                );
                                if (refreshRes?.data?.ok) {
                                  setPaymentMethods(
                                    refreshRes.data.methods || []
                                  );
                                }

                                // Reset form
                                setPmBrand("");
                                setPmNumber("");
                                setPmNumberDigits("");
                                setPmName("");
                                setPmBillingAddress({
                                  street: "",
                                  city: "",
                                  state: "",
                                  postalCode: "",
                                });
                                setPmCvv("");
                                setPmExpMonth("");
                                setPmExpYear("");
                                setPmFieldErrors({});
                                setShowPaymentForm(false);
                                setMessage({
                                  type: "success",
                                  text: "Payment method saved",
                                });
                                setTimeout(() => setMessage(null), 2500);
                              } else {
                                setPaymentMethods((prev) =>
                                  prev.filter((p) => p.id !== tempId)
                                );
                                setMessage({
                                  type: "error",
                                  text: res?.data?.message || "Save failed",
                                });
                                setTimeout(() => setMessage(null), 2500);
                              }
                            } catch (e) {
                              setPaymentMethods((prev) =>
                                prev.filter((p) => p.id !== tempId)
                              );
                              const serverMsg =
                                e?.response?.data?.message ||
                                e?.message ||
                                "Save failed";
                              setMessage({ type: "error", text: serverMsg });
                              setTimeout(() => setMessage(null), 2500);
                            }
                          })();
                        }
                      }}
                      className={styles.btnAddCard}
                      disabled={
                        paymentFormMode === "add" ? !isPmValid : pmLoading
                      }
                      title={
                        paymentFormMode === "edit"
                          ? "Update billing address"
                          : "Save payment method"
                      }
                    >
                      {pmLoading ? (
                        <>
                          <span className={styles.spinner} aria-hidden />{" "}
                          Saving…
                        </>
                      ) : paymentFormMode === "edit" ? (
                        "Update Billing Address"
                      ) : (
                        "Add Card"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Show message if user has reached max cards */}
          {paymentMethods.length >= 3 && (
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginTop: "12px",
                padding: "8px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "6px",
              }}
            >
              You have reached the maximum of 3 payment methods.
            </div>
          )}
        </div>

        <div style={{ margin: "24px 0", borderTop: "1px solid #ddd" }}></div>

        {/* Delete Account Section */}
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              margin: "0 0 8px 0",
              color: "#dc3545",
              fontWeight: "500",
            }}
          >
            Danger Zone
          </p>
          <p style={{ margin: "0 0 12px 0", fontSize: "0.9em", color: "#666" }}>
            Once you delete your account, there is no going back. Please be
            certain.
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
              fontWeight: "500",
            }}
          >
            {showDeleteConfirm
              ? "Click again to confirm deletion"
              : "Delete Account"}
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
                marginLeft: "8px",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
