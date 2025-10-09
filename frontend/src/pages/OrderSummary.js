import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext.js';

export default function OrderSummary() {
  const { orderDraft, confirmOrder, selectedSeats, selectedShow, customer, createOrderDraft, updateSeat, removeSeat, setCustomer } = useBooking();
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

  async function onUpdateOrder() {
    setLoading(true);
    try {
      const payload = {
        showId: selectedShow?.id || orderDraft?.showId,
        seats: selectedSeats || orderDraft?.seats || [],
        customer: customer || orderDraft?.customer || null,
      };
      await createOrderDraft(payload);
      alert('Order draft updated');
    } catch (err) {
      alert('Failed to update order: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function onConfirmAndCheckout() {
    setLoading(true);
    try {
      const payload = {
        showId: selectedShow?.id || orderDraft?.showId,
        seats: selectedSeats || orderDraft?.seats || [],
        customer: customer || orderDraft?.customer || null,
      };
      await createOrderDraft(payload);
      navigate('/checkout');
    } catch (err) {
      alert('Failed to prepare checkout: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  // If there's no orderDraft, suggest going to Checkout to create one
  if (!orderDraft) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '720px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          <h2 style={{ color: '#fff' }}>No order draft</h2>
          <div style={{ color: '#cbd5da', marginBottom: 12 }}>You don't have an order draft yet. Go to Checkout to create one or use the demo option there.</div>
          <div>
            <button onClick={() => navigate('/checkout')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>Go to Checkout</button>
          </div>
        </div>
      </div>
    );
  }

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
                  <li key={s.id || s} style={{ color: '#f4f6f8', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>{s.row ? `${s.row}${s.number}` : s} {s.price ? `— $${(s.price||0).toFixed(2)}` : ''}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select value={s.ageCategory || 'adult'} onChange={(e) => {
                          const newAge = e.target.value;
                          const modifiers = { adult: 1.0, child: 0.5, senior: 0.8 };
                          const basePrice = (s.originalPrice || s.price || 0);
                          const newPrice = +(basePrice * (modifiers[newAge] || 1)).toFixed(2);
                          updateSeat(s.id, { ageCategory: newAge, price: newPrice, originalPrice: basePrice });
                        }} style={{ background: '#0b0d0f', color: '#fff', border: '1px solid #222', borderRadius: 6, padding: '4px 6px' }}>
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                          <option value="senior">Senior</option>
                        </select>
                        <button onClick={() => removeSeat(s.id)} style={{ background: 'transparent', color: '#ff6b6b', border: 'none' }}>Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside style={{ width: 240 }}>
            <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Totals</h3>
              <div style={{ color: '#cbd5da' }}>Subtotal: <span style={{ color: '#fff' }}>${subtotal.toFixed(2)}</span></div>
              <div style={{ marginTop: 12 }}>
                {/* Back button removed per request */}
                <button onClick={onUpdateOrder} style={{ marginRight: 8, background: '#336', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}>Update Order</button>
                <button onClick={onConfirmAndCheckout} disabled={loading} style={{ marginRight: 8, background: '#1b5e20', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}>{loading ? 'Preparing...' : 'Return to Checkout'}</button>
                <button onClick={onConfirm} disabled={loading} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>{loading ? 'Confirming...' : 'Confirm Booking'}</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
