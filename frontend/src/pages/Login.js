import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function validateLogin() {
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    return null;
  }

  function validateRegister() {
    if (!name) return "Name is required";
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    if (password !== confirm) return "Passwords do not match";
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validateLogin();
    if (v) return setError(v);
    setError(null);
    setLoading(true);
    try {
      // TODO: replace with real auth call
      await new Promise((r) => setTimeout(r, 500));
      setLoading(false);
      navigate("/");
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Sign in failed");
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    const v = validateRegister();
    if (v) return setError(v);
    setError(null);
    setLoading(true);
    try {
      // TODO: call registration endpoint when available
      await new Promise((r) => setTimeout(r, 500));
      setLoading(false);
      setMode("login");
      setPassword("");
      setConfirm("");
      setPhone("");
      navigate("/registration-confirmation");
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Registration failed");
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>{mode === "login" ? "Login" : "Create account"}</h2>

        {error && <div className="login-error">{error}</div>}

        {mode === "login" ? (
          <form onSubmit={onSubmit} className="login-form">
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

            <div className="login-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted-text">No account?</span>
              <button
                type="button"
                className="link-action"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                Create an account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onRegister} className="login-form">
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
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

            <div className="login-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating…" : "Create account"}
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="btn-primary"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

