import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const EmailVerification = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state if available
  React.useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!verificationCode.trim()) {
      setError('Verification code is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/verify-email', {
        email: email,
        code: verificationCode
      });

      if (response.data.ok) {
        setMessage('Email verified successfully! You can now log in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // In a real app, you'd have a resend endpoint
      setMessage('If an account exists with this email, a new verification code has been sent.');
    } catch (err) {
      setError('Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h2>Verify Your Email</h2>
        <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
          We've sent a 6-digit verification code to your email address. 
          Please enter it below to activate your account.
        </p>

        {error && <div className="login-error">{error}</div>}
        {message && <div className="login-success" style={{
          background: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #c3e6cb'
        }}>{message}</div>}

        <form onSubmit={handleVerification} className="login-form">
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </label>

          <label>
            Verification Code
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              pattern="[0-9]{6}"
              required
              disabled={loading}
              style={{ fontSize: '1.2em', letterSpacing: '0.2em', textAlign: 'center' }}
            />
          </label>

          <div className="login-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginBottom: '12px' }}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '12px' }}>
            Didn't receive the code?
          </p>
          <button
            onClick={resendCode}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9em',
              marginBottom: '12px'
            }}
          >
            Resend verification code
          </button>
          <br />
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
};

export default EmailVerification;