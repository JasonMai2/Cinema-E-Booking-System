import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import styles from './EmailVerification.module.css';

const EmailVerification = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state if available
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      setMessage(location.state.message);
    }
    
    // Auto-send verification email if user came from login with unverified account
    if (location.state?.email && location.state?.autoResend) {
      const autoResendCode = async () => {
        try {
          setMessage('Sending fresh verification code...');
          const response = await api.post('/auth/resend-verification', {
            email: location.state.email
          });
          
          if (response.data.ok) {
            setMessage('Fresh verification code sent! Please check your email.');
            setCountdown(60);
          } else {
            setMessage(response.data.message || 'Verification code sent earlier. Please check your email.');
          }
        } catch (err) {
          // Don't show error for auto-resend, just show default message
          setMessage('Please check your email for the verification code or click resend below.');
        }
      };
      
      autoResendCode();
    }
  }, [location.state]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
    setMessage('');
    
    try {
      const response = await api.post('/auth/verify-email', {
        email: email,
        code: verificationCode
      });

      if (response.data.ok) {
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email: email,
              message: 'Email verified successfully! You can now log in.' 
            } 
          });
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

    if (countdown > 0) {
      return;
    }

    setResendLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await api.post('/auth/resend-verification', {
        email: email
      });

      if (response.data.ok) {
        setMessage(response.data.message || 'Verification code sent! Please check your email.');
        setCountdown(60); // 1 minute cooldown
      } else {
        setError(response.data.message || 'Failed to resend verification code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className={styles.verificationPage}>
      <div className={styles.verificationContainer}>
        <div className={styles.verificationCard}>
          <h2 className={styles.title}>Email Verification</h2>
          <p className={styles.subtitle}>
            We've sent a 6-digit verification code to your email address. 
            Please enter it below to activate your account.
          </p>

          {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
          {message && <div className={`${styles.message} ${styles.success}`}>{message}</div>}

          <form onSubmit={handleVerification} className={styles.verificationForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email address"
                required
                disabled={loading || resendLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="code" className={styles.label}>Verification Code</label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className={styles.input}
                placeholder="Enter 6-digit code"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                disabled={loading || resendLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.verifyButton}
              disabled={loading || resendLoading}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className={styles.resendSection}>
            <p className={styles.resendText}>
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={resendCode}
              disabled={resendLoading || countdown > 0 || loading}
              className={styles.resendButton}
            >
              {resendLoading 
                ? 'Sending...' 
                : countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : 'Resend verification code'
              }
            </button>
          </div>

          <div className={styles.loginLink}>
            <p>
              Already verified?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={styles.linkButton}
              >
                Back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EmailVerification;