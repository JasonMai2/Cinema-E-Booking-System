import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    bookingApi
      .getOrder(orderId)
      .then((res) => mounted && setOrder(res.data))
      .catch((err) => mounted && setError(err.message || 'Failed to fetch'))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [orderId]);

  if (loading) return <div style={{ padding: 16 }}>Loading confirmation...</div>;
  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '640px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Booking Confirmed</h1>
          <div style={{ color: '#cbd5da', marginTop: 6 }}>Thank you — your booking is complete.</div>
        </header>

        <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
          <p style={{ color: '#cbd5da' }}>Your booking id: <strong style={{ color: '#fff' }}>{order?.confirmationCode || order?.id || orderId}</strong></p>
          <h4 style={{ marginTop: 8, color: '#fff' }}>Summary</h4>
          <div style={{ color: '#cbd5da' }}><strong>Show:</strong> {order.show?.title || order.showId || order.show?.id}</div>
          <div style={{ color: '#cbd5da' }}><strong>Seats:</strong> {(order.seats || []).join(', ')}</div>
          <div style={{ color: '#cbd5da' }}><strong>Total:</strong> ${order.totals?.subtotal?.toFixed ? order.totals.subtotal.toFixed(2) : order.totals?.subtotal || '—'}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => window.print()} style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6 }}>Print</button>
          <button onClick={() => navigate('/')} style={{ marginLeft: 8, background: '#7a1f1f', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}>Back to Home</button>
        </div>
      </div>
    </div>
  );
}
