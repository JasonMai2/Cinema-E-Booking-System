import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  // common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // registration-only
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");

  function validateLogin() {
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    return null;
  }

  function validateRegister() {
    if (!name) return "Full name is required";
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
      // TODO: replace with real auth endpoint when available
      // const res = await api.post('/auth/login', { email, password });
      // handle tokens / session
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 400);
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
      const payload = { name, email, password };
      if (phone) payload.phone = phone;
      // TODO: implement registration endpoint on backend and replace this placeholder
      console.log("TODO: register user (payload)", payload);
      setLoading(false);
      // Simulate success for now and navigate to the confirmation page
      setMode("login");
      setPassword("");
      setConfirm("");
      setPhone("");
      navigate("/registration-confirmation");
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

              <div className="login-actions" style={{ margin: 0 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </div>
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
