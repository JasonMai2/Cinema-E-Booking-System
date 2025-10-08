import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD

export default function Login() {
=======
import api from "../services/api";

export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  // common
>>>>>>> e8dc06508f47122fdbc81a44f27bd8c1deda6bc2
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

<<<<<<< HEAD
  function validate() {
=======
  // registration-only
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");

  function validateLogin() {
>>>>>>> e8dc06508f47122fdbc81a44f27bd8c1deda6bc2
    if (!email) return "Email is required";
    if (!password) return "Password is required";
    return null;
  }

  const onSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError(null);

<<<<<<< HEAD
    // TODO: call backend API to authenticate. For now simulate success.
    // On success navigate to home.
    navigate("/");
=======
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
>>>>>>> e8dc06508f47122fdbc81a44f27bd8c1deda6bc2
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>Login</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={onSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
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
            />
          </label>

<<<<<<< HEAD
          <div className="login-actions">
            <button type="submit" className="btn-primary">
              Sign in
            </button>
          </div>
        </form>
=======
            <div className="login-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
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
>>>>>>> e8dc06508f47122fdbc81a44f27bd8c1deda6bc2
      </section>
    </main>
  );
}
