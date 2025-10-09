import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext.js';

export default function Checkout() {
  const { selectedShow, selectedSeats, setCustomer, createOrderDraft, customer } = useBooking();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
    }
  }, [customer]);

  const subtotal = useMemo(() => selectedSeats.reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);

  async function submit() {
    const errs = {};
    if (!name) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    if (!selectedShow) errs.show = 'No show selected';
    if (!selectedSeats || selectedSeats.length === 0) errs.seats = 'No seats selected';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      showId: selectedShow.id,
      seats: selectedSeats.map((s) => s.id),
      customer: { name, email, phone },
    };
    setLoading(true);
    try {
      await createOrderDraft(payload);
      setCustomer({ name, email, phone });
      navigate('/order-summary');
    } catch (err) {
      alert('Failed to create order: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '640px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Checkout</h1>
          <div style={{ color: '#cbd5da', marginTop: 6 }}>Enter your details to complete the booking.</div>
        </header>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#0b0d0f', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Contact Details</h3>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Name
                  <br />
                  <input required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} />
                  {errors.name && <div style={{ color: '#ff6b6b', marginTop: 6 }}>{errors.name}</div>}
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Email
                  <br />
                  <input required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} />
                  {errors.email && <div style={{ color: '#ff6b6b', marginTop: 6 }}>{errors.email}</div>}
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Phone
                  <br />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} />
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={submit} disabled={loading} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>{loading ? 'Creating...' : 'Continue to Summary'}</button>
                <button onClick={() => navigate('/order-summary')} style={{ marginLeft: 8, background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 14px', borderRadius: 6 }}>Cancel</button>
                <button onClick={async () => {
                  // create a demo order draft and go straight to order summary
                  const demoSeats = (selectedSeats && selectedSeats.length > 0) ? selectedSeats : [
                    { id: 'demo-A1', row: 'A', number: 1, price: 10 },
                    { id: 'demo-A2', row: 'A', number: 2, price: 10 }
                  ];
                  const draft = {
                    id: `demo-draft-${Date.now()}`,
                    orderId: `demo-draft-${Date.now()}`,
                    showId: selectedShow?.id || 'demo-show-1',
                    show: selectedShow || { id: 'demo-show-1', title: 'Demo Movie — 7:00 PM' },
                    seats: demoSeats,
                    customer: { name: name || 'Demo User', email: email || 'demo@example.com', phone: phone || '' }
                  };
                  setLoading(true);
                  try {
                    await createOrderDraft(draft);
                    setCustomer({ name: draft.customer.name, email: draft.customer.email, phone: draft.customer.phone });
                    navigate('/order-summary');
                  } catch (err) {
                    alert('Failed to create demo order: ' + (err.message || err));
                  } finally {
                    setLoading(false);
                  }
                }} style={{ marginLeft: 8, background: '#444', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>Generate demo order</button>
              </div>
            </div>
          </div>

          <aside style={{ width: 260 }}>
            <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Order Preview</h3>
              <div style={{ color: '#cbd5da' }}><strong>Show:</strong> {selectedShow?.title || selectedShow?.id || '—'}</div>
              <div style={{ marginTop: 6, color: '#cbd5da' }}><strong>Seats:</strong></div>
              {selectedSeats.length === 0 ? (
                <div style={{ color: '#cbd5da' }}>No seats selected</div>
              ) : (
                <ul>
                  {selectedSeats.map((s) => (
                    <li key={s.id} style={{ color: '#f4f6f8' }}>{`${s.row}${s.number} — $${(s.price||0).toFixed(2)}`}</li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 8, color: '#cbd5da' }}><strong>Subtotal:</strong> <span style={{ color: '#fff' }}>${subtotal.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
