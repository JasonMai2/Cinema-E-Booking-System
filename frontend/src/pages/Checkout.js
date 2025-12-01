import React, { useEffect, useMemo, useState } from 'react';

import { useBooking } from '../context/BookingContext.js';
<<<<<<< HEAD
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
=======
import { useNavigate } from 'react-router-dom';
>>>>>>> origin/Checkout-Fixes

export default function Checkout() {
  const { selectedShow, selectedSeats, removeSeat, updateSeat, setCustomer, createOrderDraft } = useBooking();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Redirect to home if user is not authenticated
  useEffect(() => {
    if (user === null) {
      navigate('/');
    }
  }, [user, navigate]);

  // Redirect to home if no selected show or seats
  useEffect(() => {
    if (user && (!selectedShow || !selectedSeats || selectedSeats.length === 0)) {
      navigate('/');
    }
  }, [user, selectedShow, selectedSeats, navigate]);

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!user?.id) return;
      
      try {
        setPaymentLoading(true);
        const res = await api.get(`/payment-methods?userId=${user.id}`);
        if (res?.data?.ok) {
          const methods = res.data.methods || [];
          setPaymentMethods(methods);
          if (methods.length > 0) {
            setSelectedPaymentMethod(methods[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading payment methods:', err);
      } finally {
        setPaymentLoading(false);
      }
    };

    loadPaymentMethods();
  }, [user?.id]);

  // Safety check: redirect if no show or seats selected
  useEffect(() => {
    if (!selectedShow || !selectedSeats || selectedSeats.length === 0) {
      console.warn('No show or seats selected, cannot proceed with checkout');
    }
  }, [selectedShow, selectedSeats]);

  const subtotal = useMemo(() => selectedSeats.reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);
  const taxes = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + taxes, [subtotal, taxes]);

  const ageCategories = [
    { value: 'ADULT', label: 'Adult', multiplier: 1.0 },
    { value: 'CHILD', label: 'Child', multiplier: 0.75 },
    { value: 'SENIOR', label: 'Senior', multiplier: 0.80 }
  ];

  const handleRemoveSeat = (seatId) => {
    removeSeat(seatId);
  };

  const handleAgeChange = (seatId, newAge) => {
    const category = ageCategories.find(cat => cat.value === newAge);
    const basePrice = 12.00;
    const newPrice = basePrice * category.multiplier;
    
    updateSeat(seatId, { 
      age_category: newAge,
      price: newPrice
    });
  };

  const handleBackToSeats = () => {
    // Navigate directly to seat selection instead of using navigate(-1)
    // to avoid going back to edit profile page if user came from there
    navigate('/seat-selection', { 
      state: { 
        movie: { title: selectedShow?.movie_title },
        showtime: selectedShow 
      } 
    });
  };

  const handleAddPaymentMethod = () => {
    navigate('/profile/edit#payment-methods');
  };

  async function submit(e) {
    if (e) e.preventDefault();
    
    console.log('🎯 Submit button clicked!');
    console.log('Selected Show:', selectedShow);
    console.log('Selected Seats:', selectedSeats);
    console.log('Customer:', { name, email, phone });
    
    const errs = {};
<<<<<<< HEAD
    if (!selectedShow) errs.show = 'No show selected';
    if (!selectedSeats || selectedSeats.length === 0) errs.seats = 'No seats selected';
    if (!selectedPaymentMethod) errs.payment = 'Please select a payment method';
=======
    if (!name || name.trim() === '') errs.name = 'Name is required';
    if (!email || email.trim() === '') errs.email = 'Email is required';
    if (!selectedShow) errs.show = 'No show selected';
    if (!selectedSeats || selectedSeats.length === 0) errs.seats = 'No seats selected';
>>>>>>> origin/Checkout-Fixes
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      console.error('❌ Validation errors:', errs);
      alert('Please fill in all required fields:\n' + Object.values(errs).join('\n'));
      return;
    }

<<<<<<< HEAD
    setLoading(true);
    try {
      setCustomer({ 
        name: `${user.first_name} ${user.last_name}`,
        email: user.email, 
        phone: user.phone 
      });
      
      const res = await createOrderDraft({
        showId: selectedShow.id,
        seats: selectedSeats,
        customer: { 
          name: `${user.first_name} ${user.last_name}`,
          email: user.email, 
          phone: user.phone 
        },
        paymentMethodId: selectedPaymentMethod,
        total: total
      });
      
      if (res) {
        navigate('/order-summary');
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to process booking' });
=======
    const payload = {
      showId: selectedShow.id,
      seats: selectedSeats.map((s) => s.id || s),
      customer: { name, email, phone },
    };
    
    setLoading(true);
    try {
      console.log('✅ Validation passed! Creating order draft with payload:', payload);
      const result = await createOrderDraft(payload);
      console.log('✅ Order draft created:', result);
      setCustomer({ name, email, phone });
      console.log('✅ Customer saved, navigating to summary...');
      navigate('/order-summary');
    } catch (err) {
      console.error('❌ Failed to create order:', err);
      alert('Failed to create order: ' + (err.message || err));
>>>>>>> origin/Checkout-Fixes
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
    <div style={{ minHeight: '70vh', padding: '24px', background: '#0f1417' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#f4f6f8' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <button 
            onClick={handleBackToSeats}
            style={{ background: 'transparent', border: 'none', color: '#cbd5da', fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}
          >
            ← Back to Seat Selection
          </button>
          <h1 style={{ color: 'white', fontSize: '32px', margin: '0 0 8px 0' }}>🎬 Checkout</h1>
          <p style={{ color: '#cbd5da', margin: 0 }}>Review your ticket selection and payment details</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          
          <div>
            <div style={{ background: '#1a2025', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', margin: '0 0 16px 0' }}>Movie & Showtime</h2>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>{selectedShow.movie_title}</div>
              <div style={{ color: '#cbd5da', fontSize: '14px' }}>
                {selectedShow.auditorium_name} • {new Date(selectedShow.start_time).toLocaleDateString()} at {new Date(selectedShow.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

<<<<<<< HEAD
            <div style={{ background: '#1a2025', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', margin: '0 0 16px 0' }}>Selected Tickets</h2>
              
              {selectedSeats.map((seat) => (
                <div key={seat.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 0', 
                  borderBottom: '1px solid #2a3339' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      background: '#2a3339', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      fontWeight: 'bold', 
                      color: 'white' 
                    }}>
                      Seat {seat.seat_number}
                    </div>
                    
                    <select
                      value={seat.age_category || 'ADULT'}
                      onChange={(e) => handleAgeChange(seat.id, e.target.value)}
                      style={{ 
                        background: '#0f1417', 
                        color: '#f4f6f8', 
                        border: '1px solid #2a3339', 
                        padding: '6px 8px', 
                        borderRadius: '4px' 
                      }}
                    >
                      {ageCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    
                    <div style={{ color: '#cbd5da', fontSize: '14px' }}>
                      ${seat.price?.toFixed(2) || '12.00'}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveSeat(seat.id)}
                    style={{ 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '12px' 
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              {selectedSeats.length === 0 && (
                <div style={{ color: '#cbd5da', fontStyle: 'italic', padding: '16px', textAlign: 'center' }}>
                  No seats selected. Please go back and select seats.
                </div>
              )}
            </div>

            <div style={{ background: '#1a2025', padding: '24px', borderRadius: '12px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', margin: '0 0 16px 0' }}>Payment Method</h2>
              
              {paymentLoading ? (
                <div style={{ color: '#cbd5da' }}>Loading payment methods...</div>
              ) : paymentMethods.length === 0 ? (
                <div>
                  <div style={{ color: '#cbd5da', marginBottom: '16px' }}>
                    No payment methods found. Please add a payment method to continue.
                  </div>
                  <button
                    onClick={handleAddPaymentMethod}
                    style={{ 
                      background: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: '6px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <div>
                  {paymentMethods.map((method) => (
                    <div key={method.id} style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '12px', 
                        background: selectedPaymentMethod === method.id ? '#2a3339' : '#0f1417', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        border: selectedPaymentMethod === method.id ? '2px solid white' : '1px solid #2a3339'
                      }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          style={{ marginRight: '12px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>**** **** **** {method.card_number?.slice(-4)}</div>
                          <div style={{ color: '#cbd5da', fontSize: '12px' }}>
                            {method.cardholder_name} • Expires {method.expiry_date}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleAddPaymentMethod}
                    style={{ 
                      background: 'transparent', 
                      color: '#28a745', 
                      border: '1px solid #28a745', 
                      padding: '8px 16px', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontSize: '12px',
                      marginTop: '8px'
                    }}
                  >
                    + Add Another Payment Method
                  </button>
                </div>
              )}
              
              {errors.payment && (
                <div style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '8px' }}>{errors.payment}</div>
              )}
=======
              <div style={{ marginTop: 12 }}>
                <button 
                  type="button"
                  onClick={submit} 
                  disabled={loading} 
                  style={{ 
                    background: loading ? '#555' : '#7a1f1f', 
                    color: '#fff', 
                    padding: '10px 16px', 
                    borderRadius: 6, 
                    border: 'none', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                  {loading ? '⏳ Creating...' : 'Continue to Summary →'}
                </button>
                <button 
                  type="button"
                  onClick={() => navigate(-1)} 
                  style={{ 
                    marginLeft: 8, 
                    background: 'transparent', 
                    color: '#cbd5da', 
                    border: '1px solid #222', 
                    padding: '10px 16px', 
                    borderRadius: 6, 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                  Cancel
                </button>
                <button onClick={async () => {
                  // create a demo order draft and go straight to order summary
                  const demoSeats = (selectedSeats && selectedSeats.length > 0) ? selectedSeats : [
                    { id: 'demo-A1', row: 'A', number: 1, price: 10 },
                    { id: 'demo-A2', row: 'A', number: 2, price: 10 }
                  ];
                  const draft = {
                    id: `demo-draft-${Date.now()}`,
                    orderId: `demo-draft-${Date.now()}`,
                    showId: selectedShow?.id || 'demo-show-1',
                    show: selectedShow || { id: 'demo-show-1', title: 'Demo Movie — 7:00 PM' },
                    seats: demoSeats,
                    customer: { name: name || 'Demo User', email: email || 'demo@example.com', phone: phone || '' }
                  };
                  setLoading(true);
                  try {
                    await createOrderDraft(draft);
                    setCustomer({ name: draft.customer.name, email: draft.customer.email, phone: draft.customer.phone });
                    navigate('/order-summary');
                  } catch (err) {
                    alert('Failed to create demo order: ' + (err.message || err));
                  } finally {
                    setLoading(false);
                  }
                }} style={{ marginLeft: 8, background: '#444', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>Generate demo order</button>
              </div>
>>>>>>> origin/Checkout-Fixes
            </div>
          </div>

          <div>
            <div style={{ background: '#1a2025', padding: '24px', borderRadius: '12px', position: 'sticky', top: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', margin: '0 0 20px 0' }}>Order Summary</h2>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Subtotal ({selectedSeats.length} ticket{selectedSeats.length !== 1 ? 's' : ''})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#cbd5da', fontSize: '14px' }}>
                  <span>Taxes & Fees</span>
                  <span>${taxes.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid #2a3339', paddingTop: '8px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '14px' }}>{errors.submit}</div>
              )}

              <button
                onClick={submit}
                disabled={loading || selectedSeats.length === 0 || !selectedPaymentMethod}
                style={{ 
                  width: '100%', 
                  background: loading || selectedSeats.length === 0 || !selectedPaymentMethod ? '#555' : '#dc3545', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '16px', 
                  borderRadius: '6px', 
                  cursor: loading || selectedSeats.length === 0 || !selectedPaymentMethod ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : 'Continue to Order Summary'}
              </button>
              
              <div style={{ fontSize: '12px', color: '#cbd5da', textAlign: 'center', marginTop: '12px' }}>
                By continuing, you agree to our terms of service
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}