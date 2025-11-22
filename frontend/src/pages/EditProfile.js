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
  const [homeAddress, setHomeAddress] = useState({
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
  const [pmExpiration, setPmExpiration] = useState(""); // MM/YY format
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState(null);
  const [pmFieldErrors, setPmFieldErrors] = useState({});
  const [initialUser, setInitialUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormMode, setPaymentFormMode] = useState("add"); // "add" or "edit"
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const promotionsId = useId();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (user === null) {
      navigate("/login");
    }
  }, [user, navigate]);

  const togglePromotions = useCallback(() => {
    setPromotions((prev) => !prev);
  }, []);

  const handleRemoveAddress = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        id: user?.id,
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email,
        phone: user?.phone,
        home_address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
        shipping_address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
        promotions: user?.promotions,
      };
      
      const res = await api.put("/auth/profile", payload);
      
      if (res?.data?.ok && res?.data?.user) {
        // Update context with new user data
        login(res.data.user);
        
        // Clear form states
        setHomeAddress({ street: "", city: "", state: "", postalCode: "" });
        setShippingAddress({ street: "", city: "", state: "", postalCode: "" });
        
        // Update initial user state to reflect removal
        setInitialUser({
          ...initialUser,
          home_address: { street: "", city: "", state: "", postalCode: "" },
          shipping_address: { street: "", city: "", state: "", postalCode: "" },
        });
        
        // Show form after removal so user can add new address
        setShowAddressForm(true);
        setMessage({ type: "success", text: "Address removed successfully!" });
      } else {
        setMessage({ type: "error", text: res?.data?.message || "Failed to remove address" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to remove address" });
    } finally {
      setLoading(false);
    }
  }, [user, login, initialUser]);

  const handleEditAddress = useCallback(() => {
    // Use home address if available, otherwise use shipping address
    const addressSource = user?.home_address || user?.shipping_address;
    if (addressSource) {
      const newAddress = {
        street: addressSource.street || "",
        city: addressSource.city || "",
        state: addressSource.state || "",
        postalCode: addressSource.postalCode || "",
      };
      setHomeAddress(newAddress);
      setShippingAddress(newAddress);
      setShowAddressForm(true); // Show form when editing
    }
  }, [user]);

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
      setHomeAddress({
        street: user.home_address?.street || "",
        city: user.home_address?.city || "",
        state: user.home_address?.state || "",
        postalCode: user.home_address?.postalCode || "",
      });
      setPromotions(user.promotions !== undefined ? user.promotions : true);
      
      // Show address form if no saved address exists
      const hasAddress = (user?.home_address && (user.home_address.street || user.home_address.city)) ||
                        (user?.shipping_address && (user.shipping_address.street || user.shipping_address.city));
      setShowAddressForm(!hasAddress);
      
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
        home_address: {
          street: user.home_address?.street || "",
          city: user.home_address?.city || "",
          state: user.home_address?.state || "",
          postalCode: user.home_address?.postalCode || "",
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
        if (!value || value.length < 6) {
          return "New password must be at least 6 characters.";
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
      case "pmExpiration":
        if (!value) {
          return "Expiration date is required.";
        }
        if (!/^\d{2}\/\d{2}$/.test(value)) {
          return "Enter expiration as MM/YY.";
        }
        const [monthStr, yearStr] = value.split('/');
        const month = parseInt(monthStr, 10);
        const year = parseInt('20' + yearStr, 10); // Convert YY to 20YY
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        if (isNaN(month) || month < 1 || month > 12) {
          return "Enter a valid month (01-12).";
        }
        if (isNaN(year) || year < currentYear || year > currentYear + 20) {
          return `Enter a valid year (${String(currentYear).slice(-2)}-${String(currentYear + 20).slice(-2)}).`;
        }
        // Check if card is already expired
        if (year === currentYear && month < currentMonth) {
          return "Card has already expired.";
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
        if (fieldName === "pmExpiration") {
          delete newErrors.expiration;
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
    if (!password || password.length < 6) {
      errs.newPassword = "New password must be at least 6 characters.";
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
        home_address: {
          street: homeAddress.street,
          city: homeAddress.city,
          state: homeAddress.state,
          postalCode: homeAddress.postalCode,
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
          home_address: {
            street: res.data.user.home_address?.street || "",
            city: res.data.user.home_address?.city || "",
            state: res.data.user.home_address?.state || "",
            postalCode: res.data.user.home_address?.postalCode || "",
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
      setHomeAddress({
        street: user.home_address?.street || "",
        city: user.home_address?.city || "",
        state: user.home_address?.state || "",
        postalCode: user.home_address?.postalCode || "",
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
      initialUser.home_address?.street !== (homeAddress.street || "") ||
      initialUser.home_address?.city !== (homeAddress.city || "") ||
      initialUser.home_address?.state !== (homeAddress.state || "") ||
      initialUser.home_address?.postalCode !==
        (homeAddress.postalCode || "") ||
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
    if (!pmExpiration) {
      e.expiration = "Expiration date is required.";
    } else if (!/^\d{2}\/\d{2}$/.test(pmExpiration)) {
      e.expiration = "Enter expiration as MM/YY.";
    } else {
      const [monthStr, yearStr] = pmExpiration.split('/');
      const month = parseInt(monthStr, 10);
      const year = parseInt('20' + yearStr, 10);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (isNaN(month) || month < 1 || month > 12) {
        e.expiration = "Enter a valid month (01-12).";
      } else if (isNaN(year) || year < currentYear || year > currentYear + 20) {
        e.expiration = `Enter a valid year (${String(currentYear).slice(-2)}-${String(currentYear + 20).slice(-2)}).`;
      } else if (year === currentYear && month < currentMonth) {
        e.expiration = "Card has already expired.";
      }
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
        // Failed to parse billing address, use defaults
      }
    }

    // Backend now returns DECRYPTED full card number in provider_token
    let cardNumber = "";
    if (paymentMethod.provider_token) {
      cardNumber = String(paymentMethod.provider_token);
    }

    // Backend now returns DECRYPTED CVV in last4 field
    let cvv = "";
    if (paymentMethod.last4) {
      cvv = String(paymentMethod.last4);
    }

    // Format expiration date as MM/YY
    let expiration = "";
    if (paymentMethod.exp_month && paymentMethod.exp_year) {
      const month = String(paymentMethod.exp_month).padStart(2, '0');
      const year = String(paymentMethod.exp_year).slice(-2);
      expiration = `${month}/${year}`;
    }

    setEditingPaymentId(paymentMethod.id);
    setPmName(nameOnCard || paymentMethod.cardholder_name || "");
    setPmBrand(paymentMethod.brand || "");
    setPmNumberDigits(cardNumber);
    // The formatted number will be set by the useEffect hook
    setPmBillingAddress(billing);
    setPmCvv(cvv);
    setPmExpiration(expiration);

    setPaymentFormMode("edit");
    setShowPaymentForm(true);
    setPmFieldErrors({});
  };

  const handleAddPaymentMethod = () => {
    setPaymentFormMode("add");
    setEditingPaymentId(null);
    
    // Default billing address to home address if it exists
    if (homeAddress && (homeAddress.street || homeAddress.city)) {
      setPmBillingAddress({
        street: homeAddress.street || "",
        city: homeAddress.city || "",
        state: homeAddress.state || "",
        postalCode: homeAddress.postalCode || ""
      });
    } else {
      setPmBillingAddress({ street: "", city: "", state: "", postalCode: "" });
    }
    
    // Reset other form fields
    setPmBrand("");
    setPmNumber("");
    setPmNumberDigits("");
    setPmName("");
    setPmCvv("");
    setPmExpiration("");
    setPmFieldErrors({});
    setShowPaymentForm(true);
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
    setPmExpiration("");
    setPmFieldErrors({});
  };

  const handleSaveEditPayment = async (paymentId) => {
    const errors = validatePmFields();

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
      // Parse combined expiration date
      const [monthStr, yearStr] = pmExpiration.split('/');
      const payload = {
        billing_address: billingAddressStr,
        brand: pmBrand,
        provider_token: pmNumberDigits,
        exp_month: parseInt(monthStr, 10),
        exp_year: parseInt('20' + yearStr, 10), // Convert YY to 20YY
        last4: pmCvv,
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
          text: "Payment method updated successfully",
        });
        setTimeout(() => setMessage(null), 2500);
        handleCancelPaymentForm();
      } else {
        setMessage({
          type: "error",
          text: res?.data?.message || "Failed to update payment method",
        });
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update payment method";
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
              Your email cannot be changed.
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

          {/* Home/Shipping Address Section */}
          <div style={{ margin: "24px 0 12px 0" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", color: "var(--text-primary)" }}>
              Home/Shipping Address
            </h3>
            
            {/* Show saved address if it exists */}
            {((user?.home_address && (user.home_address.street || user.home_address.city)) || 
              (user?.shipping_address && (user.shipping_address.street || user.shipping_address.city))) && (
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: "500", color: "#fff", marginBottom: "4px" }}>
                      Saved Address:
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)", lineHeight: "1.4" }}>
                      {((user?.home_address?.street || user?.shipping_address?.street)) && 
                        <div>{user?.home_address?.street || user?.shipping_address?.street}</div>}
                      <div>
                        {[
                          user?.home_address?.city || user?.shipping_address?.city,
                          user?.home_address?.state || user?.shipping_address?.state,
                          user?.home_address?.postalCode || user?.shipping_address?.postalCode
                        ].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={handleEditAddress}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#007bff";
                        e.target.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#007bff";
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #007bff",
                        color: "#007bff",
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAddress}
                      disabled={loading}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.background = "#dc3545";
                          e.target.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.background = "transparent";
                          e.target.style.color = "#dc3545";
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #dc3545",
                        color: "#dc3545",
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {loading ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Address input form - only show if no saved address or user is editing */}
            {showAddressForm && (
            <>
            <div className={styles.twoCol}>
              <div>
                <label className={styles.profileLabel}>Street</label>
                <input
                  type="text"
                  value={homeAddress.street}
                  onChange={(e) => {
                    const newAddress = {
                      ...homeAddress,
                      street: e.target.value
                    };
                    setHomeAddress(newAddress);
                    setShippingAddress(newAddress);
                  }}
                  placeholder="Street address"
                  className={styles.profileInput}
                />
              </div>
              
              <div>
                <label className={styles.profileLabel}>City</label>
                <input
                  type="text"
                  value={homeAddress.city}
                  onChange={(e) => {
                    const newAddress = {
                      ...homeAddress,
                      city: e.target.value
                    };
                    setHomeAddress(newAddress);
                    setShippingAddress(newAddress);
                  }}
                  placeholder="City"
                  className={styles.profileInput}
                />
              </div>
            </div>
            
            <div className={styles.twoCol}>
              <div>
                <label className={styles.profileLabel}>State</label>
                <input
                  type="text"
                  value={homeAddress.state}
                  onChange={(e) => {
                    const newAddress = {
                      ...homeAddress,
                      state: e.target.value
                    };
                    setHomeAddress(newAddress);
                    setShippingAddress(newAddress);
                  }}
                  placeholder="State"
                  className={styles.profileInput}
                />
              </div>
              
              <div>
                <label className={styles.profileLabel}>Postal Code</label>
                <input
                  type="text"
                  value={homeAddress.postalCode}
                  onChange={(e) => {
                    const newAddress = {
                      ...homeAddress,
                      postalCode: e.target.value
                    };
                    setHomeAddress(newAddress);
                    setShippingAddress(newAddress);
                  }}
                  placeholder="Postal code"
                  className={styles.profileInput}
                />
              </div>
            </div>
            
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "8px" }}>
              This address will be used for both your home address and shipping address.
            </div>
            </>
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
              disabled={loading || !user || !isDirty()}
              aria-disabled={loading || !user || !isDirty()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden /> Saving…
                </>
              ) : (
                "Save changes"
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
              {isDirty() && (
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={onCancel}
                  disabled={loading || !user}
                  aria-disabled={loading || !user}
                >
                  Discard changes
                </button>
              )}
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
                          // Failed to parse billing address
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
                  onClick={handleAddPaymentMethod}
                  role="button"
                  tabIndex={0}
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleAddPaymentMethod();
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
                      ? "Edit Payment Method"
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
                  {/* Cardholder name - editable in both modes */}
                  <div>
                    <label className={styles.profileLabel}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Cardholder name"
                      value={pmName}
                      onChange={(e) => {
                        setPmName(e.target.value);
                        if (pmFieldErrors.name) {
                          const copy = { ...pmFieldErrors };
                          delete copy.name;
                          setPmFieldErrors(copy);
                        }
                      }}
                      onBlur={(e) => handlePmBlur("pmName", e.target.value)}
                      className={pmInputClass("name")}
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

                  {/* Card Brand - editable in both modes */}
                  <div>
                    <label className={styles.profileLabel}>Card Brand</label>
                    <select
                      value={pmBrand}
                      onChange={(e) => {
                        setPmBrand(e.target.value);
                        if (pmFieldErrors.brand) {
                          const copy = { ...pmFieldErrors };
                          delete copy.brand;
                          setPmFieldErrors(copy);
                        }
                      }}
                      onBlur={(e) => handlePmBlur("pmBrand", e.target.value)}
                      className={pmInputClass("brand")}
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

                  {/* Card Number - editable in both modes */}
                  <div>
                    <label className={styles.profileLabel}>Card Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      placeholder="Card number"
                      value={pmNumber}
                      onChange={(e) => {
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
                        handlePmBlur("pmNumber", pmNumber, { pmNumberDigits })
                      }
                      className={pmInputClass("number")}
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

                  {/* Expiration Date and CVV - on same row */}
                  <div className={styles.twoCol}>
                    <div>
                      <label className={styles.profileLabel}>
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={pmExpiration}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + "/" + value.slice(2, 4);
                          }
                          setPmExpiration(value);
                          if (pmFieldErrors.expiration) {
                            const copy = { ...pmFieldErrors };
                            delete copy.expiration;
                            setPmFieldErrors(copy);
                          }
                        }}
                        onBlur={(e) =>
                          handlePmBlur("pmExpiration", e.target.value)
                        }
                        maxLength={5}
                        inputMode="numeric"
                        className={pmInputClass("expiration")}
                        aria-invalid={!!pmFieldErrors.expiration}
                        aria-describedby={
                          pmFieldErrors.expiration ? "err-pm-expiration" : undefined
                        }
                      />
                      {pmFieldErrors.expiration && (
                        <div id="err-pm-expiration" className={styles.fieldError}>
                          {pmFieldErrors.expiration}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={styles.profileLabel}>CVV</label>
                      <input
                        type="text"
                        placeholder="CVV"
                        value={pmCvv}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setPmCvv(digits.slice(0, 4));
                          if (pmFieldErrors.cvv) {
                            const copy = { ...pmFieldErrors };
                            delete copy.cvv;
                            setPmFieldErrors(copy);
                          }
                        }}
                        onBlur={(e) => handlePmBlur("pmCvv", e.target.value)}
                        maxLength={4}
                        inputMode="numeric"
                        className={pmInputClass("cvv")}
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
                            // Parse combined expiration date for optimistic update
                            const [monthStr, yearStr] = pmExpiration.split('/');
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
                              exp_month: monthStr,
                              exp_year: '20' + yearStr, // Convert YY to 20YY
                              provider_token: pmNumberDigits,
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
                              exp_month: parseInt(monthStr, 10),
                              exp_year: parseInt('20' + yearStr, 10), // Convert YY to 20YY
                              billing_address: billingAddressStr,
                            };

                            try {
                              setPmLoading(true);
                              
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
                                setPmExpiration("");
                                setPmFieldErrors({});
                                setShowPaymentForm(false);
                                setMessage({
                                  type: "success",
                                  text: "Payment method saved successfully!",
                                });
                                setTimeout(() => setMessage(null), 2500);
                              } else {
                                setPaymentMethods((prev) =>
                                  prev.filter((p) => p.id !== tempId)
                                );
                                setMessage({
                                  type: "error",
                                  text: res?.data?.message || "Failed to save payment method",
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
                                "Failed to save payment method";
                              setMessage({ type: "error", text: serverMsg });
                              setTimeout(() => setMessage(null), 2500);
                            } finally {
                              setPmLoading(false);
                            }
                          })();
                        }
                      }}
                      className={styles.btnAddCard}
                      disabled={!isPmValid || pmLoading}
                      title={
                        paymentFormMode === "edit"
                          ? "Update payment method"
                          : "Save payment method"
                      }
                    >
                      {pmLoading ? (
                        <>
                          <span className={styles.spinner} aria-hidden />{" "}
                          Saving…
                        </>
                      ) : paymentFormMode === "edit" ? (
                        "Update Payment Method"
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
      </section>
    </main>
  );
}