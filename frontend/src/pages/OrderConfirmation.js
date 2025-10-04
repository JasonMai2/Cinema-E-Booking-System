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

  if (loading) return <div>Loading confirmation...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Booking Confirmed</h2>
      <p>Your booking id: <strong>{order?.confirmationCode || order?.id || orderId}</strong></p>
      <div>
        <h4>Summary</h4>
        <div><strong>Show:</strong> {order.showId || order.show?.id}</div>
        <div><strong>Seats:</strong> {(order.seats || []).join(', ')}</div>
        <div><strong>Total:</strong> ${order.totals?.subtotal?.toFixed ? order.totals.subtotal.toFixed(2) : order.totals?.subtotal || '—'}</div>
      </div>
      <pre style={{ marginTop: 12 }}>{JSON.stringify(order, null, 2)}</pre>
      <div>
        <button onClick={() => window.print()}>Print</button>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
}
