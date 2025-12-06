import React, { useEffect, useMemo, useState } from 'react';

import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useBooking } from '../context/BookingContext.js';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { selectedShow, selectedSeats, setCustomer, createOrderDraft, customer } = useBooking();
  const [promoCode, setPromoCode] = useState('');
  const { user } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
    }
  }, [customer]);

  useEffect(() => {
    if (user) {
      api.get(`/payment-methods?userId=${user.id}`)
        .then((res) => {
          if (res?.data?.ok) {
            setPaymentMethods(res.data.methods || []);
            if (res.data.methods && res.data.methods.length > 0) {
              setSelectedPaymentMethod(res.data.methods[0]); // default to first
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load payment methods:', err);
        });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      alert('You must be logged in to proceed with checkout.');
      navigate('/login');
    }
  }, [user, navigate]);

  // Safety check: redirect if no show or seats selected
  useEffect(() => {
    if (!selectedShow || !selectedSeats || selectedSeats.length === 0) {
      console.warn('No show or seats selected, cannot proceed with checkout');
    }
  }, [selectedShow, selectedSeats]);

  const subtotal = useMemo(() => selectedSeats.reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);
  const serviceFee = useMemo(() => selectedSeats.length * 1.50, [selectedSeats]); // $1.50 per ticket
  const taxRate = 0.08; // 8% sales tax (matches backend)
  const tax = useMemo(() => Math.round((subtotal + serviceFee) * taxRate * 100) / 100, [subtotal, serviceFee]);
  const discount = useMemo(() => promoCode.trim() ? 5.00 : 0, [promoCode]);
  const total = useMemo(() => subtotal + serviceFee + tax - discount, [subtotal, serviceFee, tax, discount]);

  async function submit(e) {
    if (e) e.preventDefault();
    
    console.log('🎯 Submit button clicked!');
    console.log('Selected Show:', selectedShow);
    console.log('Selected Seats:', selectedSeats);
    console.log('Customer:', { name, email, phone });
    
    const errs = {};
    if (!name || name.trim() === '') errs.name = 'Name is required';
    if (!email || email.trim() === '') errs.email = 'Email is required';
    if (!selectedShow) errs.show = 'No show selected';
    if (!selectedSeats || selectedSeats.length === 0) errs.seats = 'No seats selected';
    if (!selectedPaymentMethod) errs.payment = 'Please select a payment method';
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      console.error('❌ Validation errors:', errs);
      alert('Please fill in all required fields:\n' + Object.values(errs).join('\n'));
      return;
    }

    const payload = {
      showId: selectedShow.id,
      seats: selectedSeats,  // Send full seat objects with age categories
      customer: { name, email, phone },
      paymentMethodId: selectedPaymentMethod.id,
      userId: user.id,
      promoCode: promoCode.trim() || undefined,
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '640px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Checkout</h1>
          <div style={{ color: '#cbd5da', marginTop: 6 }}>Enter your details to complete the booking.</div>
        </header>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#0b0d0f', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Contact Details</h3>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Promo Code <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(optional)</span>
                  <br />
                  <input 
                    value={promoCode} 
                    onChange={(e) => setPromoCode(e.target.value)} 
                    placeholder="Enter promo code (optional)" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} 
                  />
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Name
                  <br />
                  <input required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} />
                  {errors.name && <div style={{ color: '#ff6b6b', marginTop: 6 }}>{errors.name}</div>}
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Email
                  <br />
                  <input required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} />
                  {errors.email && <div style={{ color: '#ff6b6b', marginTop: 6 }}>{errors.email}</div>}
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Phone
                  <br />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }} />
                </label>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ color: '#cbd5da', fontWeight: 500 }}>
                  Payment Method
                  <br />
                  {paymentMethods.length === 0 ? (
                    <div style={{ color: '#ff6b6b', marginBottom: 8 }}>
                      No payment methods found. Please add one in your <a href="/profile" style={{ color: '#7a1f1f' }}>profile</a>.
                    </div>
                  ) : (
                    <select 
                      value={selectedPaymentMethod?.id || ''} 
                      onChange={(e) => {
                        const pm = paymentMethods.find(m => m.id == e.target.value);
                        setSelectedPaymentMethod(pm);
                      }} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#0a0b0c', border: '1px solid #222', color: '#e6eef3' }}
                    >
                      <option value="">Select a payment method</option>
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.brand} •••• {pm.provider_token ? pm.provider_token.slice(-4) : '****'}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.payment && <div style={{ color: '#ff6b6b', marginTop: 6 }}>{errors.payment}</div>}
                </label>
              </div>

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
              </div>
            </div>
          </div>

          <aside style={{ width: 260 }}>
            <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Order Preview</h3>
              <div style={{ color: '#cbd5da' }}><strong>Show:</strong> {selectedShow?.title || selectedShow?.id || '—'}</div>
              <div style={{ marginTop: 6, color: '#cbd5da' }}><strong>Seats:</strong></div>
              {selectedSeats.length === 0 ? (
                <div style={{ color: '#cbd5da' }}>No seats selected</div>
              ) : (
                <ul>
                  {selectedSeats.map((s) => (
                    <li key={s.id} style={{ color: '#f4f6f8' }}>{`${s.row}${s.number} — $${(s.price||0).toFixed(2)}`}</li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 8, color: '#cbd5da' }}><strong>Subtotal:</strong> <span style={{ color: '#fff' }}>${subtotal.toFixed(2)}</span></div>
              <div style={{ color: '#cbd5da' }}><strong>Service Fee:</strong> <span style={{ color: '#fff' }}>${serviceFee.toFixed(2)}</span></div>
              <div style={{ color: '#cbd5da' }}><strong>Sales Tax (8%):</strong> <span style={{ color: '#fff' }}>${tax.toFixed(2)}</span></div>
              {promoCode.trim() && (
                <div style={{ marginTop: 4, color: '#7a1f1f', fontSize: '14px' }}>
                  Promo Discount: -${discount.toFixed(2)}
                </div>
              )}
              <div style={{ marginTop: 8, borderTop: '1px solid #222', paddingTop: 8, color: '#cbd5da', fontWeight: 'bold', fontSize: '16px' }}>
                <strong>Total:</strong> <span style={{ color: '#fff' }}>${total.toFixed(2)}</span>
              </div>
              {promoCode.trim() && (
                <div style={{ marginTop: 8, color: '#7a1f1f', fontSize: '12px' }}>
                  Promo: {promoCode}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
