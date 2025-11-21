import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    bookingData, 
    bookingId, 
    bookingNumber, 
    ticketNumbers, 
    movie, 
    showtime, 
    selectedSeats,
    ageCategories 
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [processing, setProcessing] = useState(false);

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData || !bookingId || !movie || !user) {
      navigate('/movies');
    }
  }, [bookingData, bookingId, movie, user, navigate]);

  const processPayment = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
      alert('Please fill in all payment details');
      return;
    }

    try {
      setProcessing(true);
      
      // Simulate payment processing (in real app, this would integrate with Stripe/PayPal etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, proceed to confirmation
      navigate('/booking-confirmation', {
        state: {
          bookingData,
          bookingId,
          bookingNumber,
          ticketNumbers,
          movie,
          showtime,
          selectedSeats,
          paymentConfirmed: true
        }
      });
    } catch (error) {
      alert('Payment processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!bookingData || !bookingId || !movie || !user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>Invalid checkout session</div>
        <button onClick={() => navigate('/movies')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
          Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: '900px', width: '100%', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}
          >
            ← Back to Seat Selection
          </button>
          <h1 style={{ margin: 0, color: '#fff', marginBottom: 8 }}>Checkout</h1>
          <p style={{ color: '#cbd5da', margin: 0 }}>Complete your booking for {movie.title}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
          
          {/* Payment Form */}
          <div>
            <div style={{ background: '#0b0d0f', padding: 24, borderRadius: 8, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Payment Information</h3>
              
              {/* Payment Method Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: '#cbd5da', fontSize: 14, display: 'block', marginBottom: 8 }}>Payment Method</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 6,
                      border: '1px solid #222',
                      background: paymentMethod === 'card' ? '#7a1f1f' : 'transparent',
                      color: paymentMethod === 'card' ? '#fff' : '#cbd5da',
                      cursor: 'pointer'
                    }}
                  >
                    Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 6,
                      border: '1px solid #222',
                      background: paymentMethod === 'paypal' ? '#7a1f1f' : 'transparent',
                      color: paymentMethod === 'paypal' ? '#fff' : '#cbd5da',
                      cursor: 'pointer'
                    }}
                  >
                    PayPal
                  </button>
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ color: '#cbd5da', fontSize: 14, display: 'block', marginBottom: 6 }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      placeholder="John Doe"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 6,
                        background: '#1a1d21',
                        color: '#fff',
                        border: '1px solid #222',
                        fontSize: 14
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#cbd5da', fontSize: 14, display: 'block', marginBottom: 6 }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 6,
                        background: '#1a1d21',
                        color: '#fff',
                        border: '1px solid #222',
                        fontSize: 14
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ color: '#cbd5da', fontSize: 14, display: 'block', marginBottom: 6 }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        placeholder="MM/YY"
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 6,
                          background: '#1a1d21',
                          color: '#fff',
                          border: '1px solid #222',
                          fontSize: 14
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#cbd5da', fontSize: 14, display: 'block', marginBottom: 6 }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        placeholder="123"
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 6,
                          background: '#1a1d21',
                          color: '#fff',
                          border: '1px solid #222',
                          fontSize: 14
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #222', borderRadius: 8 }}>
                  <div style={{ color: '#cbd5da', marginBottom: 12 }}>You will be redirected to PayPal to complete payment</div>
                  <div style={{ fontSize: 14, color: '#888' }}>PayPal integration coming soon</div>
                </div>
              )}

              {/* Process Payment Button */}
              <button
                onClick={processPayment}
                disabled={processing || (paymentMethod === 'paypal')}
                style={{
                  width: '100%',
                  padding: '16px',
                  marginTop: 24,
                  borderRadius: 8,
                  border: 'none',
                  background: processing ? '#444' : (paymentMethod === 'paypal' ? '#666' : '#51cf66'),
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: processing || (paymentMethod === 'paypal') ? 'not-allowed' : 'pointer',
                  opacity: processing || (paymentMethod === 'paypal') ? 0.6 : 1
                }}
              >
                {processing ? 'Processing Payment...' : `Pay $${bookingData.total?.toFixed(2)}`}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ background: '#0b0d0f', padding: 24, borderRadius: 8, position: 'sticky', top: 20 }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Order Summary</h3>
              
              {/* Movie Info */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #222' }}>
                <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>{movie.title}</div>
                <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>
                  {formatDateTime(bookingData.showTime)}
                </div>
                <div style={{ color: '#cbd5da', fontSize: 14 }}>
                  {bookingData.auditoriumName}
                </div>
              </div>

              {/* Seats */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #222' }}>
                <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 8 }}>Selected Seats</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {selectedSeats && selectedSeats.map((seat, index) => (
                    <div key={seat} style={{
                      background: '#222',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 14,
                      color: '#fff'
                    }}>
                      {seat} ({ageCategories?.[seat] || 'Adult'})
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#cbd5da' }}>
                  <span>Subtotal ({selectedSeats?.length || 0} tickets)</span>
                  <span>${bookingData.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {bookingData.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#51cf66' }}>
                    <span>Discount</span>
                    <span>-${bookingData.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#cbd5da' }}>
                  <span>Taxes & Fees</span>
                  <span>$0.00</span>
                </div>
                <div style={{ borderTop: '1px solid #222', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                  <span>Total</span>
                  <span>${bookingData.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Booking Details */}
              <div style={{ background: '#1a1d21', padding: 12, borderRadius: 6 }}>
                <div style={{ color: '#cbd5da', fontSize: 12, marginBottom: 4 }}>Booking Number</div>
                <div style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace' }}>{bookingNumber}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}