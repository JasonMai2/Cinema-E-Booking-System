import React, { useEffect, useMemo, useState } from 'react';

import { useBooking } from '../context/BookingContext.js';
import { useNavigate } from 'react-router-dom';

export default function OrderSummary() {
  const { orderDraft, confirmOrder, selectedSeats, selectedShow, customer, createOrderDraft, updateSeat, removeSeat, setCustomer } = useBooking();
  const [loading, setLoading] = useState(false);
  const [ticketPrices, setTicketPrices] = useState({ adult: 15.00, senior: 12.50, child: 9.00 });
  const navigate = useNavigate();

  // Fetch ticket prices from backend
  useEffect(() => {
    fetch('/api/ticket-types')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          const prices = {};
          data.forEach(type => {
            prices[type.age_category.toLowerCase()] = type.price_cents / 100;
          });
          setTicketPrices(prices);
        }
      })
      .catch(err => console.error('Failed to load ticket prices:', err));
  }, []);

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

  // Normalize seats: selectedSeats preferred (full objects), otherwise map orderDraft.seats
  const seatsList = useMemo(() => {
    if (selectedSeats && selectedSeats.length > 0) return selectedSeats;
    const draftSeats = orderDraft?.seats || [];
    return draftSeats.map((s) => (typeof s === 'string' || typeof s === 'number' ? { id: s, price: 0 } : s));
  }, [selectedSeats, orderDraft]);

  const subtotal = useMemo(() => (seatsList || []).reduce((s, x) => s + (x.price || 0), 0), [seatsList]);
  const serviceFee = useMemo(() => seatsList.length * 1.50, [seatsList]);
  const tax = useMemo(() => (subtotal + serviceFee) * 0.08, [subtotal, serviceFee]);
  const discount = orderDraft?.promoCode ? 5.00 : 0;
  const total = useMemo(() => subtotal + serviceFee + tax - discount, [subtotal, serviceFee, tax, discount]);

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
                {(seatsList || []).map((s) => (
                  <li key={s.id || s} style={{ color: '#f4f6f8', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>{s.row ? `${s.row}${s.number}` : s} {s.price ? `— $${(s.price||0).toFixed(2)}` : ''}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select value={s.ageCategory || 'adult'} onChange={(e) => {
                          const newAge = e.target.value;
                          const newPrice = ticketPrices[newAge] || ticketPrices.adult || 15.00;
                          updateSeat(s.id, { ageCategory: newAge, price: newPrice });
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
              <div style={{ color: '#cbd5da' }}>Service Fee: <span style={{ color: '#fff' }}>${serviceFee.toFixed(2)}</span></div>
              <div style={{ color: '#cbd5da' }}>Sales Tax (8%): <span style={{ color: '#fff' }}>${tax.toFixed(2)}</span></div>
              {orderDraft?.promoCode && (
                <div style={{ color: '#7a1f1f', fontSize: '14px', marginTop: 4 }}>
                  Promo: {orderDraft.promoCode} (-${discount.toFixed(2)})
                </div>
              )}
              <div style={{ marginTop: 8, borderTop: '1px solid #222', paddingTop: 8, color: '#cbd5da', fontWeight: 'bold', fontSize: '16px' }}>
                Total: <span style={{ color: '#fff' }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button 
                  onClick={onUpdateOrder} 
                  disabled={loading}
                  style={{ 
                    background: '#336', 
                    color: '#fff', 
                    padding: '10px 14px', 
                    borderRadius: 6, 
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                  {loading ? '⏳ Updating...' : 'Update Order'}
                </button>
                <button 
                  onClick={() => navigate(-1)} 
                  style={{ 
                    background: 'transparent', 
                    color: '#cbd5da', 
                    border: '1px solid #222', 
                    padding: '10px 14px', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                  Cancel
                </button>
                <button 
                  onClick={onConfirm} 
                  disabled={loading} 
                  style={{ 
                    background: loading ? '#555' : '#7a1f1f', 
                    color: '#fff', 
                    padding: '10px 14px', 
                    borderRadius: 6, 
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                  {loading ? '⏳ Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
