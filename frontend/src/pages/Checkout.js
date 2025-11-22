import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext.js';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { selectedShow, selectedSeats, setCustomer, createOrderDraft, customer } = useBooking();
  const { user } = useAuth();
  
  // Debug logging
  console.log('Checkout - selectedShow:', selectedShow);
  console.log('Checkout - selectedSeats:', selectedSeats);
  console.log('Checkout - selectedSeats length:', selectedSeats?.length);
  
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (user === null) {
      navigate('/login');
    }
  }, [user, navigate]);

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

    setLoading(true);
    try {
      setCustomer({ name, email, phone });
      const res = await createOrderDraft({
        showId: selectedShow.id,
        seats: selectedSeats,
        customer: { name, email, phone },
      });
      navigate('/order-summary');
    } catch (err) {
      alert('Error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  if (!selectedShow || !selectedSeats || selectedSeats.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>No booking data found</div>
        <button onClick={() => navigate('/movies')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
          Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#0f1417', color: '#f4f6f8', padding: '28px', borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px' }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '0 0 8px 0', color: '#fff' }}>Checkout</h1>
          <p style={{ color: '#cbd5da', margin: 0 }}>Complete your booking details</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
          
          {/* Customer Form */}
          <div>
            <div style={{ background: '#0b0d0f', padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Customer Information</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#cbd5da', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#1a1d21', 
                    border: '1px solid #222', 
                    borderRadius: '6px', 
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.name && <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#cbd5da', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#1a1d21', 
                    border: '1px solid #222', 
                    borderRadius: '6px', 
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.email && <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#cbd5da', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#1a1d21', 
                    border: '1px solid #222', 
                    borderRadius: '6px', 
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={submit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? '#555' : '#7a1f1f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '16px'
                }}
              >
                {loading ? 'Processing...' : 'Continue to Order Summary'}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ background: '#0b0d0f', padding: '20px', borderRadius: '8px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Booking Summary</h3>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#cbd5da', fontSize: '14px' }}>Movie</div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{selectedShow?.movie_title || 'Unknown Movie'}</div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#cbd5da', fontSize: '14px' }}>Showtime</div>
                <div style={{ color: '#fff' }}>{selectedShow?.start_time ? new Date(selectedShow.start_time).toLocaleString() : 'Unknown Time'}</div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#cbd5da', fontSize: '14px' }}>Seats</div>
                <div style={{ color: '#fff' }}>{selectedSeats.map(s => s.seat_number || s.id).join(', ')}</div>
              </div>

              <div style={{ borderTop: '1px solid #222', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}