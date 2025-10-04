import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

export default function Checkout() {
  const { selectedShow, selectedSeats, setCustomer, createOrderDraft, customer } = useBooking();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [loading, setLoading] = useState(false);
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
    if (!name || !email) return alert('Please provide name and email');
    if (!selectedShow) return alert('No show selected');
    if (!selectedSeats || selectedSeats.length === 0) return alert('No seats selected');

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
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <h2>Checkout</h2>
        <div style={{ marginBottom: 8 }}>
          <label>
            Name
            <br />
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            Email
            <br />
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            Phone
            <br />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={submit} disabled={loading}>{loading ? 'Creating...' : 'Continue to Summary'}</button>
        </div>
      </div>

      <aside style={{ width: 360, borderLeft: '1px solid #eee', paddingLeft: 16 }}>
        <h3>Order Preview</h3>
        <div><strong>Show:</strong> {selectedShow?.id || '—'}</div>
        <div><strong>Seats:</strong></div>
        {selectedSeats.length === 0 ? (
          <div>No seats selected</div>
        ) : (
          <ul>
            {selectedSeats.map((s) => (
              <li key={s.id}>{`${s.row}${s.number} — $${(s.price||0).toFixed(2)}`}</li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 8 }}><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</div>
      </aside>
    </div>
  );
}
