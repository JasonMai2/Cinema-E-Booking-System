import React, { useState, useEffect } from "react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  // common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  // Handle messages from navigation state (like from email verification)
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state after showing the message
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // registration-only
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  
  // Enhanced registration fields
  const [subscribeToPromotions, setSubscribeToPromotions] = useState(false);
  
  // Optional address fields
  const [useSeparateBillingAddress, setUseSeparateBillingAddress] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: ""
  });
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: ""
  });
  
  // Optional payment card
  const [paymentCards, setPaymentCards] = useState([{
    cardType: "",
    cardNumber: "",
    nameOnCard: "",
    expirationMonth: "",
    expirationYear: "",
    cvv: ""
  }]);

  // Helper functions for payment cards
  const updatePaymentCard = (index, field, value) => {
    const updatedCards = [...paymentCards];
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value
    };
    setPaymentCards(updatedCards);
  };

  // Auto-fill name on card when first/last name changes
  React.useEffect(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName && firstName && lastName) {
      setPaymentCards(prevCards => 
        prevCards.map(card => ({
          ...card,
          nameOnCard: fullName
        }))
      );
    }
  }, [firstName, lastName]);
  
  const updateAddress = (type, field, value) => {
    if (type === 'main') {
      setAddress(prev => {
        const newAddress = { ...prev, [field]: value };
        // If not using separate billing address, also update billing address
        if (!useSeparateBillingAddress) {
          setBillingAddress(newAddress);
        }
        return newAddress;
      });
    } else if (type === 'billing') {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  function validateLogin() {
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    return null;
  }

  function validateRegister() {
    if (!firstName) return "First name is required";
    // last name optional but recommended
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirm) return "Passwords do not match";
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    
    // Payment card validation (if any card information is provided)
    const card = paymentCards[0];
    if (card.cardNumber || card.cardType || card.expirationMonth || card.expirationYear) {
      if (!card.cardNumber) return "Payment card: Card number is required";
      if (!card.cardType) return "Payment card: Card type is required";
      if (!card.expirationMonth) return "Payment card: Expiration month is required";
      if (!card.expirationYear) return "Payment card: Expiration year is required";
      if (!card.cvv) return "Payment card: CVV is required";
      
      // Require billing address if adding a payment card
      if (!billingAddress.street || !billingAddress.city || !billingAddress.state || !billingAddress.zipCode) {
        return "Payment card: Billing address is required (please fill in the address section above)";
      }
    }
    
    return null;
  }

  const onLogin = async (e) => {
    e.preventDefault();
    const v = validateLogin();
    if (v) return setError(v);
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setLoading(false);
      if (res?.data?.ok) {
        // set auth user (backend returns { ok: true, user: { ... } })
        if (res.data.user) {
          authLogin(res.data.user);
        }
        navigate('/');
      } else {
        // Check if email verification is required
        if (res?.data?.email_verification_required) {
          navigate('/verify-email', { 
            state: { 
              email: email,
              message: res?.data?.message || 'Please verify your email address before logging in'
            } 
          });
        } else {
          setError(res?.data?.message || 'Login failed');
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    const v = validateRegister();
    if (v) return setError(v);
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      // Prepare comprehensive registration payload
      const payload = { 
        first_name: firstName, 
        last_name: lastName, 
        email, 
        password,
        phone,
        subscribe_to_promotions: subscribeToPromotions
      };
      
      // Add optional address if provided (UI mapping: Address -> shipping_address, Billing Address -> home_address)
      if (address.street) {
        payload.shipping_address = address; // UI "Address" field goes to shipping_address in DB
      }
      if (billingAddress.street) {
        payload.home_address = billingAddress; // UI "Billing Address" field goes to home_address in DB
      }
      
      // Add payment cards if provided (max 3)
      const validCards = paymentCards.filter(card => 
        card.cardNumber && card.cardType && card.expirationMonth && card.expirationYear
      );
      if (validCards.length > 0) {
        payload.payment_cards = validCards;
      }
      
      const res = await api.post('/auth/register', payload);
      setLoading(false);
      if (res?.data?.ok) {
        // Clear form and show email verification message
        setMode('login');
        setPassword('');
        setConfirm('');
        setPhone('');
        setSubscribeToPromotions(false);
        setAddress({street: "", city: "", state: "", zipCode: ""});
        setBillingAddress({street: "", city: "", state: "", zipCode: ""});
        setUseSeparateBillingAddress(false);
        setPaymentCards([{cardType: "", cardNumber: "", nameOnCard: "", expirationMonth: "", expirationYear: "", cvv: ""}]);
        
        // Navigate to email verification page with email pre-filled
        navigate('/verify-email', { 
          state: { 
            email: email,
            message: 'Registration successful! Please check your email for a verification code to activate your account.'
          } 
        });
      } else {
        setError(res?.data?.message || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>{mode === "login" ? "Login" : "Create account"}</h2>

        {error && <div className="login-error">{error}</div>}
        {successMessage && (
          <div className="login-success" style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            border: '1px solid #c3e6cb'
          }}>
            {successMessage}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={onLogin} className="login-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
              <span
                role="button"
                tabIndex={0}
                className="link-action"
                onClick={() => {
                  window.location.href = '/forgot-password';
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                    window.location.href = '/forgot-password';
                  }
                }}
                style={{ fontSize: "14px" }}
              >
                Forgot Password?
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="muted-text">No account?</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="link-action"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " " ||
                      e.key === "Spacebar"
                    ) {
                      setMode("register");
                      setError(null);
                      setSuccessMessage(null);
                    }
                  }}
                >
                  Create an account
                </span>
              </div>

              <div className="login-actions" style={{ margin: 0 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  onClick={(e) => onLogin(e)}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={onRegister} className="login-form">
            <label>
              First name *
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
                disabled={loading}
              />
            </label>

            <label>
              Last name
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={loading}
              />
            </label>

            <label>
              Email *
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </label>

            <label>
              Phone (Optional)
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                disabled={loading}
              />
            </label>

            {/* Address Separator */}
            <div style={{margin: "24px 0 16px 0", borderTop: "1px solid #ddd", paddingTop: "16px"}}>
              <div style={{display: "grid", gap: "12px"}}>
                <div>
                  <strong style={{fontSize: "0.9em", color: "white"}}>Address</strong>
                  <div style={{display: "grid", gap: "8px", marginTop: "8px"}}>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={address.street}
                      onChange={(e) => updateAddress('main', 'street', e.target.value)}
                      disabled={loading}
                      style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                    />
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "8px"}}>
                      <input
                        type="text"
                        placeholder="City"
                        value={address.city}
                        onChange={(e) => updateAddress('main', 'city', e.target.value)}
                        disabled={loading}
                        style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={address.state}
                        onChange={(e) => updateAddress('main', 'state', e.target.value)}
                        disabled={loading}
                        style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                      />
                      <input
                        type="text"
                        placeholder="ZIP"
                        value={address.zipCode}
                        onChange={(e) => updateAddress('main', 'zipCode', e.target.value)}
                        disabled={loading}
                        style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Checkbox for separate billing address */}
                <div style={{margin: "8px 0"}}>
                  <label style={{display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "14px", userSelect: "none"}}>
                    <input
                      type="checkbox"
                      checked={useSeparateBillingAddress}
                      onChange={(e) => {
                        setUseSeparateBillingAddress(e.target.checked);
                        if (!e.target.checked) {
                          // If unchecking, copy main address to billing address
                          setBillingAddress({...address});
                        }
                      }}
                      disabled={loading}
                      style={{
                        width: "16px",
                        height: "16px",
                        marginTop: "2px",
                        accentColor: "#dc3545",
                        cursor: "pointer"
                      }}
                    />
                    <span style={{cursor: "pointer"}}>Use separate billing address</span>
                  </label>
                </div>
                  
                  {useSeparateBillingAddress && (
                    <div>
                      <strong style={{fontSize: "0.9em", color: "white"}}>Billing Address</strong>
                      <div style={{display: "grid", gap: "8px", marginTop: "8px"}}>
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={billingAddress.street}
                          onChange={(e) => updateAddress('billing', 'street', e.target.value)}
                          disabled={loading}
                          style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                        />
                        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "8px"}}>
                          <input
                            type="text"
                            placeholder="City"
                            value={billingAddress.city}
                            onChange={(e) => updateAddress('billing', 'city', e.target.value)}
                            disabled={loading}
                            style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={billingAddress.state}
                            onChange={(e) => updateAddress('billing', 'state', e.target.value)}
                            disabled={loading}
                            style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                          />
                          <input
                            type="text"
                            placeholder="ZIP"
                            value={billingAddress.zipCode}
                            onChange={(e) => updateAddress('billing', 'zipCode', e.target.value)}
                            disabled={loading}
                            style={{padding: "8px", border: "1px solid #ccc", borderRadius: "4px"}}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            </div>

            {/* Payment Card Separator */}
            <div style={{margin: "24px 0 16px 0", borderTop: "1px solid #ddd", paddingTop: "16px"}}>
              <div style={{marginBottom: "12px"}}>
                <strong style={{fontSize: "0.9em", color: "white"}}>Payment Card</strong>
              </div>
              <div style={{display: "grid", gap: "16px"}}>
                {paymentCards.map((card, index) => (
                  <div key={index} style={{borderRadius: "6px"}}>
                    <div style={{display: "grid", gap: "12px"}}>
                      {/* Name */}
                      <div style={{display: "grid", gridTemplateColumns: "70px 1fr", gap: "0px", alignItems: "center"}}>
                        <label style={{
                          fontSize: "0.9em", 
                          color: "white", 
                          fontWeight: "500", 
                          textAlign: "left",
                          lineHeight: "1",
                          margin: "0",
                          padding: "0"
                        }}>
                          Name
                        </label>
                        <input
                          type="text"
                          placeholder="Name on Card"
                          value={card.nameOnCard}
                          onChange={(e) => updatePaymentCard(index, 'nameOnCard', e.target.value)}
                          disabled={loading}
                          style={{
                            padding: "8px", 
                            border: "1px solid #ccc", 
                            borderRadius: "4px"
                          }}
                        />
                      </div>

                      {/* Card Type and Number - full width */}
                      <div style={{display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px"}}>
                        <select
                          value={card.cardType}
                          onChange={(e) => updatePaymentCard(index, 'cardType', e.target.value)}
                          disabled={loading}
                          style={{
                            padding: "8px", 
                            border: "1px solid #ccc", 
                            borderRadius: "4px"
                          }}
                        >
                          <option value="">Card Type</option>
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="amex">American Express</option>
                          <option value="discover">Discover</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Card Number"
                          value={card.cardNumber}
                          onChange={(e) => updatePaymentCard(index, 'cardNumber', e.target.value)}
                          disabled={loading}
                          style={{
                            padding: "8px", 
                            border: "1px solid #ccc", 
                            borderRadius: "4px"
                          }}
                        />
                      </div>
                      
                      {/* Month, Year, CVV - full width */}
                      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px"}}>
                        <select
                          value={card.expirationMonth}
                          onChange={(e) => updatePaymentCard(index, 'expirationMonth', e.target.value)}
                          disabled={loading}
                          style={{
                            padding: "8px", 
                            border: "1px solid #ccc", 
                            borderRadius: "4px"
                          }}
                        >
                          <option value="">Month</option>
                          {Array.from({length: 12}, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {(i + 1).toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <select
                          value={card.expirationYear}
                          onChange={(e) => updatePaymentCard(index, 'expirationYear', e.target.value)}
                          disabled={loading}
                          style={{
                            padding: "8px", 
                            border: "1px solid #ccc", 
                            borderRadius: "4px"
                          }}
                        >
                          <option value="">Year</option>
                          {Array.from({length: 10}, (_, i) => {
                            const year = new Date().getFullYear() + i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                        <input
                          type="text"
                          placeholder="CVV"
                          value={card.cvv}
                          onChange={(e) => updatePaymentCard(index, 'cvv', e.target.value)}
                          disabled={loading}
                          maxLength="4"
                          style={{
                            padding: "8px", 
                            border: "1px solid #ccc", 
                            borderRadius: "4px"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator after Payment Cards */}
            <div style={{margin: "24px 0", borderTop: "1px solid #ddd"}}></div>

            <label>
              Password *
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
                disabled={loading}
              />
            </label>

            <label>
              Confirm password *
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                disabled={loading}
              />
            </label>

            {/* Promotions Subscription */}
            <div style={{margin: "24px 0 24px 0"}}>
              <label style={{display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "14px", userSelect: "none"}}>
                <input
                  type="checkbox"
                  checked={subscribeToPromotions}
                  onChange={(e) => setSubscribeToPromotions(e.target.checked)}
                  disabled={loading}
                  style={{
                    width: "16px",
                    height: "16px",
                    marginTop: "2px",
                    accentColor: "#dc3545",
                    cursor: "pointer"
                  }}
                />
                <span style={{cursor: "pointer"}}>Get exclusive deals and movie updates delivered to your inbox</span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  role="button"
                  tabIndex={0}
                  className="link-action"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " " ||
                      e.key === "Spacebar"
                    ) {
                      setMode("login");
                      setError(null);
                      setSuccessMessage(null);
                    }
                  }}
                >
                  Back to sign in
                </span>
              </div>

              <div className="login-actions" style={{ margin: 0 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  onClick={(e) => onRegister(e)}
                >
                  {loading ? "Creating…" : "Create account"}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
