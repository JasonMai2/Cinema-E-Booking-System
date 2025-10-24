import React, { useEffect, useState } from "react";

import api from "../services/api";
import styles from "../components/EditProfile.module.css";
import { useAuth } from "../context/AuthContext";

export default function EditProfile() {
  const { user, login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmToken, setPmToken] = useState('');
  const [pmBrand, setPmBrand] = useState('');
  const [pmLast4, setPmLast4] = useState('');
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState(null);
  const [initialUser, setInitialUser] = useState(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      // remember original values to compute "dirty"
      setInitialUser({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      // load payment methods for this user (dev: pass user id)
      setPmLoading(true);
      setPmError(null);
      api.get(`/payment-methods?userId=${user.id}`).then((res) => {
        if (res?.data?.ok) setPaymentMethods(res.data.methods || []);
        else setPmError(res?.data?.message || 'Unable to load payment methods');
      }).catch((err) => {
        // surface error so user can see why no methods are shown
        const msg = err?.response?.data?.message || err?.message || 'Payment methods endpoint not available';
        setPmError(msg);
      }).finally(() => setPmLoading(false));
    }
  }, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (password && password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    // basic client-side validation
    if (!firstName || !email) {
      setMessage({ type: 'error', text: 'First name and email are required' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: user?.id,
        first_name: firstName,
          last_name: lastName,
        email,
        phone,
      };
      if (password) payload.password = password;

      const res = await api.put('/auth/profile', payload);
      setLoading(false);
      if (res?.data?.ok && res?.data?.user) {
        // update context so header updates
        login(res.data.user);
        // update the initial snapshot so the form no longer appears dirty
        setInitialUser({ first_name: res.data.user.first_name || '', last_name: res.data.user.last_name || '', email: res.data.user.email || '', phone: res.data.user.phone || '' });
        setMessage({ type: 'success', text: 'Profile updated' });
        // clear password fields
        setPassword(''); setConfirm('');
      } else {
        setMessage({ type: 'error', text: res?.data?.message || 'Update failed' });
      }
    } catch (err) {
      setLoading(false);
      const serverMsg = err?.response?.data?.message || err?.message;
      setMessage({ type: 'error', text: serverMsg || 'Update failed' });
    }
  };

  const onCancel = (e) => {
    e.preventDefault();
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setPassword("");
      setConfirm("");
      setMessage(null);
    }
  };

  return (
    <main className={styles.profilePage}>
      <h2 className={styles.profileTitle}>Edit Profile</h2>

      <section className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={onSave}>
          {message && (
            <div className={message.type === 'error' ? 'error' : 'success'} style={{ marginBottom: 12 }}>
              {message.text}
            </div>
          )}

          <div>
            <label className={styles.profileLabel}>First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 555-5555"
              className={styles.profileInput}
            />
          </div>

          <hr />

          <div>
            <p style={{ margin: 0 }}>Change password (optional)</p>
          </div>

          <div>
            <label className={styles.profileLabel}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className={styles.profileInput}
            />
          </div>

          <div>
            <label className={styles.profileLabel}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className={styles.profileInput}
            />
          </div>

          <div className={styles.profileActions}>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={loading || !user || (
                initialUser &&
                initialUser.first_name === firstName &&
                (initialUser.last_name || '') === (lastName || '') &&
                (initialUser.email || '') === (email || '') &&
                (initialUser.phone || '') === (phone || '') &&
                !password
              )}
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={loading || !user}>
              Cancel
            </button>
          </div>
        </form>

        <hr />

        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: '6px 0' }}>Payment methods</h3>
          {pmLoading ? (
            <div style={{ color: '#999' }}>Loading payment methods…</div>
          ) : pmError ? (
            <div style={{ color: '#e66' }}>Error: {pmError}</div>
          ) : paymentMethods.length === 0 ? (
            <div style={{ color: '#ddd' }}>No saved payment methods. Use the form below to add one (dev mode).</div>
          ) : (
            <ul>
              {paymentMethods.map((m) => (
                <li key={m.id} style={{ marginBottom: 8 }}>
                  {m.brand || 'Card'} ****{m.last4 || '----'} exp {m.exp_month || '--'}/{m.exp_year || '--'}
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={async (ev) => {
                      ev.preventDefault();
                      try {
                        const res = await api.delete(`/payment-methods/${m.id}`);
                        if (res?.data?.ok) setPaymentMethods(paymentMethods.filter(pm => pm.id !== m.id));
                      } catch (e) {
                        // show ephemeral error
                        setMessage({ type: 'error', text: 'Unable to remove payment method' });
                        setTimeout(() => setMessage(null), 3000);
                      }
                    }}
                  >Remove</button>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 8 }}>
            <p style={{ margin: 0 }}>Add a payment method (dev mode — enter a provider token)</p>
            <input type="text" placeholder="provider token" value={pmToken} onChange={(e) => setPmToken(e.target.value)} />
            <input type="text" placeholder="brand (Visa)" value={pmBrand} onChange={(e) => setPmBrand(e.target.value)} />
            <input type="text" placeholder="last4" value={pmLast4} onChange={(e) => setPmLast4(e.target.value)} />
            <button onClick={async (ev) => {
              ev.preventDefault();
              if (!pmToken || !user) {
                setMessage({ type: 'error', text: 'Enter a provider token' });
                setTimeout(() => setMessage(null), 2500);
                return;
              }
              try {
                const payload = { user_id: user.id, provider_token: pmToken, brand: pmBrand, last4: pmLast4 };
                const res = await api.post('/payment-methods', payload);
                if (res?.data?.ok) {
                  // refresh list
                  const list = await api.get(`/payment-methods?userId=${user.id}`);
                  setPaymentMethods(list.data.methods || []);
                  setPmToken(''); setPmBrand(''); setPmLast4('');
                } else {
                  setMessage({ type: 'error', text: res?.data?.message || 'Save failed' });
                  setTimeout(() => setMessage(null), 2500);
                }
              } catch (e) {
                setMessage({ type: 'error', text: 'Save failed' });
                setTimeout(() => setMessage(null), 2500);
              }
            }}>Save payment method</button>
          </div>
        </div>
      </section>
    </main>
  );
}
