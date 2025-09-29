import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function validate() {
    if (!email) return 'Email is required';
    if (!password) return 'Password is required';
    return null;
  }

  const onSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError(null);

    // TODO: call backend API to authenticate. For now simulate success.
    // On success navigate to home.
    navigate('/');
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

          <div className="login-actions">
            <button type="submit" className="btn-primary">Sign in</button>
          </div>
        </form>
      </section>
    </main>
  );
}
