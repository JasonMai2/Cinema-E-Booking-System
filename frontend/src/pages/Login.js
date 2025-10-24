import React, { useState, useEffect } from "react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  // common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // registration-only
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  function validateLogin() {
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    return null;
  }

  function validateRegister() {
    if (!firstName) return "First name is required";
    // last name optional
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirm) return "Passwords do not match";
    return null;
  }

  const onLogin = async (e) => {
    e.preventDefault();
    const v = validateLogin();
    if (v) return setError(v);
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setLoading(false);
      if (res?.data?.ok) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        // set auth user (backend returns { ok: true, user: { ... } })
        if (res.data.user) {
          authLogin(res.data.user);
        }
        navigate("/");
      } else {
        setError(res?.data?.message || "Login failed");
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
    setLoading(true);
    try {
      // prefer explicit first/last_name fields
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      };
      if (phone) payload.phone = phone;
      const res = await api.post("/auth/register", payload);
      setLoading(false);
      if (res?.data?.ok) {
        // clear form and show confirmation
        setMode("login");
        setPassword("");
        setConfirm("");
        setPhone("");
        navigate("/registration-confirmation");
      } else {
        setError(res?.data?.message || "Registration failed");
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    style={{ margin: 0 }}
                  />
                  <span>Remember me</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="muted-text">No account?</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="link-action"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " " ||
                        e.key === "Spacebar"
                      ) {
                        setMode("register");
                        setError(null);
                      }
                    }}
                  >
                    Create an account
                  </span>
                </div>
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
              First name
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
              Last name (optional)
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={loading}
              />
            </label>

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
              Phone (optional)
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional: (555) 555-5555"
                disabled={loading}
              />
            </label>

            <label>
              Password
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
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                disabled={loading}
              />
            </label>

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
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " " ||
                      e.key === "Spacebar"
                    ) {
                      setMode("login");
                      setError(null);
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
