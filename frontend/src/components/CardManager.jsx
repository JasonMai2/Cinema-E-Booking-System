import React, { useState } from "react";
import api from "../services/api";
import styles from "./CardManager.module.css";
import pageStyles from "./EditProfile.module.css";

export default function CardManager({
  userId,
  cards = [],
  cardLimit = 3,
  firstName,
  lastName,
  onRefresh,
  addButtonClassName,
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
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

    if (name === "cardHolderName") {
      const sanitized = value.replace(/[0-9]/g, "");
      setForm((f) => ({ ...f, [name]: sanitized }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      return;
    }

    if (name === "fullNumber") {
      const digits = (value || "").replace(/\D/g, "");
      const groups = [];
      for (let i = 0; i < digits.length; i += 4) {
        groups.push(digits.substring(i, i + 4));
      }
      const formatted = groups.join(" ");
      setForm((f) => ({ ...f, [name]: formatted }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      return;
    }

    if (name === "securityCode") {
      const digits = (value || "").replace(/\D/g, "").slice(0, 4);
      setForm((f) => ({ ...f, [name]: digits }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      return;
    }

    if (name === "expMonth") {
      const digits = (value || "").replace(/\D/g, "").slice(0, 2);
      setForm((f) => ({ ...f, [name]: digits }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      return;
    }

    if (name === "expYear") {
      const digits = (value || "").replace(/\D/g, "").slice(0, 4);
      setForm((f) => ({ ...f, [name]: digits }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const inputClass = (key) =>
    `${pageStyles.profileInput} ${
      errors[key] ? " " + pageStyles.inputError : ""
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
    const holder = (form.cardHolderName || "").trim();
    if (!holder || holder.length === 0) {
      errs.cardHolderName = "Card holder name required";
    }
    if (/[0-9]/.test(holder)) {
      errs.cardHolderName = "Card holder name must not contain numbers";
    }

    const digits = (form.fullNumber || "").replace(/\D/g, "");
    if (!/^\d{13,19}$/.test(digits)) {
      errs.fullNumber = "Enter a valid card number (13-19 digits)";
    } else if (!luhnCheck(digits)) {
      errs.fullNumber = "Card number not valid";
    }

    if (form.securityCode) {
      if (!/^\d{3,4}$/.test(form.securityCode)) {
        errs.securityCode = "Security code must be 3 or 4 digits";
      }
    }

    const m = Number(form.expMonth);
    const y = Number(form.expYear);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!form.expMonth || isNaN(m) || m < 1 || m > 12) {
      errs.expMonth = "Enter a valid month (1-12)";
    }

    if (!form.expYear || isNaN(y) || y < 1000 || y > 2100) {
      errs.expYear = `Enter a valid 4-digit year (e.g. ${currentYear})`;
    } else if (y < currentYear) {
      errs.expYear = `Year must be ${currentYear} or later`;
    }

    if (!errs.expMonth && !errs.expYear) {
      if (y === currentYear && m < currentMonth) {
        errs.expMonth = `Card expired - ${String(m).padStart(
          2,
          "0"
        )}/${y} is before ${String(currentMonth).padStart(
          2,
          "0"
        )}/${currentYear}`;
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
      // FIXME: placeholder client-side tokenization
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
            className={`${addButtonClassName ? addButtonClassName + " " : ""}${
              pageStyles.btnSave
            }`}
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
                      className={inputClass("brand")}
                    />
                  </div>
                  <div>
                    <label>Card Holder Name</label>
                    <input
                      name="cardHolderName"
                      value={form.cardHolderName}
                      onChange={handleChange}
                      className={inputClass("cardHolderName")}
                      inputMode="text"
                      aria-label="Card holder name"
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
                      className={inputClass("fullNumber")}
                      inputMode="numeric"
                      pattern="[0-9 ]*"
                      maxLength={23}
                      placeholder="xxxx xxxx xxxx xxxx"
                      aria-label="Card number"
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        className={inputClass("expMonth")}
                        placeholder="MM"
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        className={inputClass("expYear")}
                        placeholder="YYYY"
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
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
                      className={pageStyles.btnSave}
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
