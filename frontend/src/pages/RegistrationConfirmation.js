import React from "react";
import { useNavigate } from "react-router-dom";

export default function RegistrationConfirmation() {
  const navigate = useNavigate();

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>Registration complete</h2>

        <p>
          Thank you - your account has been created. Please check your email for
          any confirmation steps. When you're ready, sign in to continue.
        </p>

        <div className="login-actions" style={{ marginTop: 12 }}>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button
            className="btn-primary"
            style={{ marginLeft: 8 }}
            onClick={() => navigate("/")}
          >
            Go to home
          </button>
        </div>
      </section>
    </main>
  );
}
