import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

export default function OrderSummary() {
  const { orderDraft, confirmOrder, selectedSeats, selectedShow, customer } = useBooking();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onConfirm() {
    setLoading(true);
    try {
      const res = await confirmOrder(orderDraft.orderId || orderDraft.id);
      navigate(`/order-confirmation/${res.orderId || res.id}`);
    } catch (err) {
      alert('Failed to confirm: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  if (!orderDraft) return <div style={{ padding: 16 }}>No order draft found. Go back to start.</div>;

  const subtotal = useMemo(() => (selectedSeats || []).reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '720px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Order Summary</h1>
          <div style={{ color: '#cbd5da', marginTop: 6 }}>Review your booking before confirming.</div>
        </header>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
              <div style={{ color: '#cbd5da' }}><strong>Show:</strong> {selectedShow?.title || orderDraft.showId}</div>
              <div style={{ marginTop: 6, color: '#cbd5da' }}><strong>Customer:</strong> {customer?.name || orderDraft.customer?.name}</div>
              <h4 style={{ marginTop: 12, color: '#fff' }}>Seats</h4>
              <ul>
                {(selectedSeats || orderDraft.seats || []).map((s) => (
                  <li key={s.id || s} style={{ color: '#f4f6f8' }}>{s.row ? `${s.row}${s.number}` : s} {s.price ? `— $${s.price.toFixed(2)}` : ''}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside style={{ width: 240 }}>
            <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Totals</h3>
              <div style={{ color: '#cbd5da' }}>Subtotal: <span style={{ color: '#fff' }}>${subtotal.toFixed(2)}</span></div>
              <div style={{ marginTop: 12 }}>
                <button onClick={onConfirm} disabled={loading} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>{loading ? 'Confirming...' : 'Confirm Booking'}</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
