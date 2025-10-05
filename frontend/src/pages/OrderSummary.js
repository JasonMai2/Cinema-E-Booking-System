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

  if (!orderDraft) return <div>No order draft found. Go back to start.</div>;

  const subtotal = useMemo(() => (selectedSeats || []).reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <h2>Order Summary</h2>
        <div><strong>Show:</strong> {selectedShow?.id || orderDraft.showId}</div>
        <div><strong>Customer:</strong> {customer?.name || orderDraft.customer?.name}</div>
        <h4>Seats</h4>
        <ul>
          {(selectedSeats || orderDraft.seats || []).map((s) => (
            <li key={s.id || s}>{s.row ? `${s.row}${s.number}` : s} {s.price ? `— $${s.price.toFixed(2)}` : ''}</li>
          ))}
        </ul>
      </div>

      <aside style={{ width: 360, borderLeft: '1px solid #eee', paddingLeft: 16 }}>
        <h3>Totals</h3>
        <div>Subtotal: ${subtotal.toFixed(2)}</div>
        <div style={{ marginTop: 12 }}>
          <button onClick={onConfirm} disabled={loading}>{loading ? 'Confirming...' : 'Confirm Booking'}</button>
        </div>
      </aside>
    </div>
  );
}
