import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxRate, setTaxRate] = useState(8);

  // Fetch fee settings
  useEffect(() => {
    fetch('/api/admin/fees')
      .then(res => res.json())
      .then(data => {
        setTaxRate(data.taxRate || 8);
      })
      .catch(err => console.error('Failed to load fee settings:', err));
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch user's order history
    api.get(`/checkout/orders?userId=${user.id}`)
      .then((res) => {
        if (res?.data?.ok) {
          setOrders(res.data.orders || []);
        } else {
          setError(res?.data?.message || 'Failed to load orders');
        }
      })
      .catch((err) => {
        console.error('Failed to load order history:', err);
        setError('Failed to load order history');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading order history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ff6b6b' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', padding: '20px' }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>Order History</h1>
      {orders.length === 0 ? (
        <div style={{ color: '#cbd5da' }}>No orders found.</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#0b0d0f',
                padding: '16px',
                borderRadius: '8px',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Order #{order.bookingNumber || order.booking_number || order.id}</div>
                  <div style={{ color: '#cbd5da', fontSize: '14px' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date not available'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    ${((order.total_cents || order.totalCents || 0) / 100).toFixed(2)}
                  </div>
                  <div style={{ color: '#cbd5da', fontSize: '14px' }}>{order.status || 'Completed'}</div>
                </div>
              </div>
              {order.tickets && order.tickets.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#cbd5da', fontSize: '14px', marginBottom: '4px' }}>Tickets:</div>
                  {order.tickets.map((ticket, idx) => (
                    <div key={idx} style={{ color: '#f4f6f8', fontSize: '14px' }}>
                      {ticket.movie_title || ticket.movieTitle || 'Movie'} - Seat {ticket.seat_label || ticket.seatLabel} ({ticket.age_category || ticket.ageCategory || 'Adult'}) ${((ticket.price_cents || ticket.priceCents || 0) / 100).toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
              {order.totals && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #222' }}>
                  <div style={{ color: '#cbd5da', fontSize: '14px' }}>
                    Subtotal: ${order.totals.subtotal?.toFixed(2) || (order.subtotal_cents / 100).toFixed(2) || '0.00'}
                  </div>
                  <div style={{ color: '#cbd5da', fontSize: '14px' }}>
                    Service Fee: ${order.totals.serviceFee?.toFixed(2) || (order.fees_cents / 100).toFixed(2) || '0.00'}
                  </div>
                  {(order.promo_name || order.promo_code) && (
                    <div style={{ color: '#4ade80', fontSize: '14px' }}>
                      Promo ({order.promo_name || order.promo_code}): -${order.totals.discount?.toFixed(2) || '0.00'}
                    </div>
                  )}
                  <div style={{ color: '#cbd5da', fontSize: '14px' }}>
                    Tax ({taxRate}%): ${order.totals.tax?.toFixed(2) || (order.tax_cents / 100).toFixed(2) || '0.00'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}