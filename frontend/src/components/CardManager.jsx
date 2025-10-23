import React, { useState } from "react";
import api from "../services/api";
import styles from "./EditProfile.module.css";

export default function CardManager({
  userId,
  cards = [],
  cardLimit = 3,
  firstName,
  lastName,
  onRefresh,
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    brand: "",
    cardHolderName: "",
    fullNumber: "",
    securityCode: "",
    expMonth: "",
    expYear: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const inputClass = (key) =>
    `${styles.profileInput} ${
      touched[key] && errors[key] ? " " + styles.inputError : ""
    }`;

  const handleDelete = async (cardId) => {
    setMessage("");
    try {
      await api.delete(`/users/payment-cards/${cardId}?userId=${userId}`);
      setMessage("Card removed");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Failed to remove card");
    }
  };

  // Luhn algorithm
  const luhnCheck = (digits) => {
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  };

  const validateForm = () => {
    const errs = {};
    if (!form.cardHolderName || form.cardHolderName.trim().length === 0) {
      errs.cardHolderName = "Card holder name required";
    }

    const digits = (form.fullNumber || "").replace(/\D/g, "");
    if (!/^\d{13,19}$/.test(digits)) {
      errs.fullNumber = "Enter a valid card number (13-19 digits)";
    } else if (!luhnCheck(digits)) {
      errs.fullNumber = "Card number failed Luhn check";
    }

    // CVV: 3 or 4 digits
    if (form.securityCode) {
      if (!/^\d{3,4}$/.test(form.securityCode)) {
        errs.securityCode = "Security code must be 3 or 4 digits";
      }
    }

    // month/year
    const m = Number(form.expMonth);
    const y = Number(form.expYear);
    if (!form.expMonth || isNaN(m) || m < 1 || m > 12) {
      errs.expMonth = "Enter a valid month (1-12)";
    }
    const currentYear = new Date().getFullYear();
    if (!form.expYear || isNaN(y) || y < currentYear || y > 2100) {
      errs.expYear = "Enter a valid year";
    }

    // expiry not in past
    if (!errs.expMonth && !errs.expYear) {
      const now = new Date();
      const exp = new Date(y, m - 1, 1);
      if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) {
        errs.expMonth = "Card appears expired";
      }
    }

    return Object.keys(errs).length === 0 ? null : errs;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage("");
    const v = validateForm();
    if (v) {
      setErrors(v);
      const newTouched = { ...touched };
      Object.keys(v).forEach((k) => {
        newTouched[k] = true;
      });
      setTouched(newTouched);
      setMessage("Fix the highlighted errors before adding the card.");
      return;
    }
    if (cards.length >= cardLimit) {
      setMessage(`Max ${cardLimit} cards stored`);
      return;
    }

    setSaving(true);
    try {
      const digits = (form.fullNumber || "").replace(/\D/g, "");
      const last4 = digits.slice(-4);
      // placeholder client-side tokenization
      const processorToken = `tok_${btoa(last4 + Date.now())}`;

      const payload = {
        firstName: firstName || "",
        lastName: lastName || "",
        paymentCard: {
          brand: form.brand,
          processorToken,
          last4,
          expMonth: form.expMonth,
          expYear: form.expYear,
        },
      };

      await api.put(`/users/profile?userId=${userId}`, payload);
      setMessage("Card added");
      setForm({
        brand: "",
        cardHolderName: "",
        fullNumber: "",
        securityCode: "",
        expMonth: "",
        expYear: "",
      });
      setShowForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Failed to add card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        Stored cards: {cards.length} / {cardLimit}
      </div>

      {cards.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {cards.map((c) => (
            <div
              key={c.id}
              className={styles.storedCardRow}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                {c.brand || "Card"} •••• {c.last4} (exp {c.expMonth}/{c.expYear}
                ) {c.isDefault ? "[default]" : ""}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className={styles.btnSmall}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cards.length < cardLimit && (
        <div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={styles.btnSave}
          >
            Add Card
          </button>

          {showForm && (
            <div
              className={styles.modalBackdrop}
              onClick={() => setShowForm(false)}
            >
              <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Add Payment Card</h3>
                <div>
                  <div>
                    <label>Brand</label>
                    <input
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                      onFocus={() => setTouched((t) => ({ ...t, brand: true }))}
                      className={inputClass("brand")}
                    />
                  </div>
                  <div>
                    <label>Card Holder Name</label>
                    <input
                      name="cardHolderName"
                      value={form.cardHolderName}
                      onChange={handleChange}
                      onFocus={() =>
                        setTouched((t) => ({ ...t, cardHolderName: true }))
                      }
                      className={inputClass("cardHolderName")}
                    />
                    {errors.cardHolderName && (
                      <div className={styles.fieldError}>
                        {errors.cardHolderName}
                      </div>
                    )}
                  </div>
                  <div>
                    <label>Full Card Number</label>
                    <input
                      name="fullNumber"
                      value={form.fullNumber}
                      onChange={handleChange}
                      onFocus={() =>
                        setTouched((t) => ({ ...t, fullNumber: true }))
                      }
                      className={inputClass("fullNumber")}
                    />
                    {errors.fullNumber && (
                      <div className={styles.fieldError}>
                        {errors.fullNumber}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label>Exp Month</label>
                      <input
                        name="expMonth"
                        value={form.expMonth}
                        onChange={handleChange}
                        onFocus={() =>
                          setTouched((t) => ({ ...t, expMonth: true }))
                        }
                        type="number"
                        className={inputClass("expMonth")}
                      />
                      {errors.expMonth && (
                        <div className={styles.fieldError}>
                          {errors.expMonth}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Exp Year</label>
                      <input
                        name="expYear"
                        value={form.expYear}
                        onChange={handleChange}
                        onFocus={() =>
                          setTouched((t) => ({ ...t, expYear: true }))
                        }
                        type="number"
                        className={inputClass("expYear")}
                      />
                      {errors.expYear && (
                        <div className={styles.fieldError}>
                          {errors.expYear}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>Security Code (CVV)</label>
                    <input
                      name="securityCode"
                      value={form.securityCode}
                      onChange={handleChange}
                      onFocus={() =>
                        setTouched((t) => ({ ...t, securityCode: true }))
                      }
                      className={inputClass("securityCode")}
                    />
                    {errors.securityCode && (
                      <div className={styles.fieldError}>
                        {errors.securityCode}
                      </div>
                    )}
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className={styles.btnSmall}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={saving}
                      className={styles.btnSave}
                    >
                      {saving ? "Adding..." : "Add Card"}
                    </button>
                  </div>
                  {message && (
                    <div className={styles.fieldError} style={{ marginTop: 8 }}>
                      {message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {cards.length >= cardLimit && (
        <div className={styles.fieldError} style={{ marginTop: 6 }}>
          You have reached the maximum of {cardLimit} stored cards. Remove one
          to add another.
        </div>
      )}
    </div>
  );
}
