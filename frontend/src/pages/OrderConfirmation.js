import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import bookingApi from '../services/bookingApi.js';
import { useBooking } from '../context/BookingContext.js';
import { useAuth } from '../context/AuthContext';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderDetails } = useBooking();

  // Redirect to home if user is not authenticated
  useEffect(() => {
    if (user === null) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    const doLoad = async () => {
      try {
        if (!orderId && orderDetails) {
          if (mounted) {
            console.log('Order details from context:', orderDetails);
            setOrder(orderDetails);
          }
          return;
        }
        const res = await bookingApi.getOrder(orderId);
        if (mounted) {
          console.log('Order details from API:', res.data);
          setOrder(res.data);
        }
      } catch (err) {
        // If fetching from server fails, use context-stored confirmation if available
        if (orderDetails) {
          if (mounted) {
            console.log('Order details fallback:', orderDetails);
            setOrder(orderDetails);
          }
        } else if (mounted) {
          setError(err.message || 'Failed to fetch');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    doLoad();
    return () => (mounted = false);
  }, [orderId, orderDetails]);

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
          <p style={{ color: '#cbd5da' }}>Your booking id: <strong style={{ color: '#fff' }}>{order?.confirmationCode || order?.bookingNumber || order?.id || orderId}</strong></p>
          <h4 style={{ marginTop: 8, color: '#fff' }}>Summary</h4>
          <div style={{ color: '#cbd5da' }}><strong>Show:</strong> {order.show?.title || order.showId || order.show?.id}</div>
          
          <h4 style={{ marginTop: 12, color: '#fff' }}>Seats</h4>
          {(order.seats || []).length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {(order.seats || []).map((s, idx) => {
                // Handle different seat formats
                let seatLabel = '';
                let ageCategory = 'Adult';
                let price = '';
                
                if (typeof s === 'object' && s !== null) {
                  // Try multiple possible properties for seat label
                  if (s.seatLabel) {
                    seatLabel = s.seatLabel;
                  } else if (s.seat_label) {
                    seatLabel = s.seat_label;
                  } else if (s.row && s.number) {
                    seatLabel = `${s.row}${s.number}`;
                  } else if (s.row && s.seat_number) {
                    seatLabel = `${s.row}${s.seat_number}`;
                  } else if (s.id) {
                    seatLabel = `Seat ${s.id}`;
                  } else {
                    seatLabel = `Seat ${idx + 1}`;
                  }
                  
                  ageCategory = s.ageCategory || s.age_category || 'Adult';
                  // Capitalize first letter
                  ageCategory = ageCategory.charAt(0).toUpperCase() + ageCategory.slice(1);
                  price = s.price ? `$${s.price.toFixed(2)}` : '';
                } else if (typeof s === 'string' && s !== '[object Object]') {
                  seatLabel = s;
                } else {
                  seatLabel = `Seat ${idx + 1}`;
                }
                
                return (
                  <li key={idx} style={{ color: '#f4f6f8' }}>
                    Seat {seatLabel} ({ageCategory}) {price}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{ color: '#cbd5da' }}>No seat information available</div>
          )}

          <div style={{ marginTop: 12, borderTop: '1px solid #222', paddingTop: 8 }}>
            <div style={{ color: '#cbd5da' }}><strong>Subtotal:</strong> <span style={{ color: '#fff' }}>${order.totals?.subtotal?.toFixed ? order.totals.subtotal.toFixed(2) : (order.totals?.subtotal || '0.00')}</span></div>
            <div style={{ color: '#cbd5da' }}><strong>Service Fee:</strong> <span style={{ color: '#fff' }}>${order.totals?.serviceFee?.toFixed ? order.totals.serviceFee.toFixed(2) : (order.totals?.serviceFee || '0.00')}</span></div>
            {(order.promoName || order.promoCode) && order.totals?.discount > 0 && (
              <div style={{ color: '#4ade80', fontSize: '14px', marginTop: 4 }}>
                <strong>Promo Applied:</strong> {order.promoName || order.promoCode}
                <span> (-${order.totals?.discount?.toFixed ? order.totals.discount.toFixed(2) : order.totals?.discount})</span>
              </div>
            )}
            <div style={{ color: '#cbd5da' }}><strong>Sales Tax (8%):</strong> <span style={{ color: '#fff' }}>${order.totals?.tax?.toFixed ? order.totals.tax.toFixed(2) : (order.totals?.tax || '0.00')}</span></div>
            <div style={{ marginTop: 8, color: '#cbd5da', fontWeight: 'bold', fontSize: '16px' }}>
              <strong>Total:</strong> <span style={{ color: '#fff' }}>${order.totals?.total?.toFixed ? order.totals.total.toFixed(2) : (order.totals?.total || order.totals?.subtotal || '0.00')}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => window.print()} style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6 }}>Print</button>
          <button onClick={() => navigate('/')} style={{ marginLeft: 8, background: '#7a1f1f', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}>Back to Home</button>
        </div>
      </div>
    </div>
  );
}
