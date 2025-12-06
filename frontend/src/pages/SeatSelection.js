import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import SeatMap from '../components/SeatMap.jsx';
import bookingApi from '../services/bookingApi.js';
import { useBooking } from '../context/BookingContext.js';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const {
    selectedShow,
    selectedSeats,
    addSeat,
    removeSeat,
    updateSeat,
    createOrderDraft,
    reservation,
    setOrderDetails,
    setSelectedShow,
  } = useBooking();

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [useDemo, setUseDemo] = useState(false);
  const [ageCategory, setAgeCategory] = useState('adult');
  const [ticketPrices, setTicketPrices] = useState({ adult: 15.00, senior: 12.50, child: 9.00 });

  const pollRef = useRef(null);

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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Fetch show details and seat map in parallel
    Promise.all([
      bookingApi.getShow(showId).catch(() => null), // ignore errors for show
      bookingApi.getSeatMap(showId)
    ])
      .then(([showRes, res]) => {
        if (!mounted) return;
        const showData = showRes && showRes.data ? showRes.data.show : null;
        if (showData) {
          setSelectedShow(showData);
        } else {
          // Fallback for demo or missing show
          setSelectedShow({ id: showId, title: showId.startsWith('demo-') ? 'Demo Movie' : 'Unknown Show' });
        }
        // support multiple shapes: array, { seats: [...] }, or paginated { content: [...] }
        const payload = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.seats || res.data.content || res.data)) : [];
        if (!payload || payload.length === 0) {
          // if API returned nothing, automatically show demo seatmap so the user can continue
          const demo = generateDemoSeats();
          setSeats(demo);
          setUseDemo(true);
          setError(null);
        } else {
          setSeats(payload || []);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        const msg = err && (err.message || (err.response && err.response.statusText)) || 'Failed to load seat map';
        // on error, fall back to demo seatmap automatically
        const demo = generateDemoSeats();
        setSeats(demo);
        setUseDemo(true);
        setError(msg);
        // Set fallback show
        setSelectedShow({ id: showId, title: 'Demo Show' });
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [showId]);

  useEffect(() => {
    // Optionally poll seat map every 15s to keep availability fresh
    if (useDemo) return; // skip polling when demo mode is active
    pollRef.current = setInterval(() => {
      bookingApi.getSeatMap(showId).then((res) => {
        const payload = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.seats || res.data.content || res.data)) : [];
        if (payload && payload.length > 0) setSeats(payload || []);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [showId]);

  const subtotal = useMemo(() => selectedSeats.reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);

  function toggleSeat(seat) {
    if (seat.status !== 'available') return;
    const exists = selectedSeats.find((s) => s.id === seat.id);
    if (exists) {
      removeSeat(seat.id);
    } else {
      // Use actual database prices instead of modifiers
      const price = ticketPrices[ageCategory] || ticketPrices.adult || 15.00;
      const seatWithAge = { ...seat, price, ageCategory, originalPrice: price };
      addSeat(seatWithAge);
    }
  }

  async function proceedToCheckout() {
    if (selectedSeats.length === 0) return alert('Select seats first');
    setReserving(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      
      // Always try to call the backend API first
      const res = await bookingApi.reserveSeats(showId, { seats: seatIds });
      const data = res && res.data ? res.data : res;
      
      // Store resulting reservation/order in context
      if (setOrderDetails) setOrderDetails(data);
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (err) {
      console.error('Reserve seats failed:', err);
      // Try to refresh seat map and show helpful message
      try {
        const res = await bookingApi.getSeatMap(showId);
        const payload = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.seats || res.data.content || res.data)) : [];
        setSeats(payload || []);
      } catch (refreshErr) {
        console.error('Failed to refresh seats:', refreshErr);
      }
      alert('Failed to reserve seats — some may no longer be available. Please reselect.');
    } finally {
      setReserving(false);
    }
  }

  async function refreshSeats() {
    setLoading(true);
    try {
  const res = await bookingApi.getSeatMap(showId);
  const payload = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.seats || res.data.content || res.data)) : [];
  setSeats(payload || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }

  function generateDemoSeats() {
    const rows = 'ABCDEFGHIJ'.split('');
    const seats = [];
    let id = 1;
    for (const r of rows) {
      for (let n = 1; n <= 12; n++) {
        seats.push({ id: `demo-${r}${n}-${id}`, row: r, number: n, status: 'available', price: 10.0 });
        id += 1;
      }
    }
    return seats;
  }

  function showDemoSeatmap() {
    setUseDemo(true);
    setError(null);
    const demo = generateDemoSeats();
    setSeats(demo);
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '820px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Seat Selection</h1>
          <div style={{ color: '#cbd5da', marginTop: 6, fontWeight: 500 }}>{selectedShow ? `${selectedShow.title || selectedShow.id}` : `Show ${showId}`}</div>
        </header>

        {loading ? (
          <div style={{ color: '#cbd5da' }}>Loading seats…</div>
        ) : error ? (
          <div>
            <div style={{ color: '#ff6b6b' }}>Error: {error}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={refreshSeats} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}>Retry</button>
              <button onClick={showDemoSeatmap} style={{ marginLeft: 8, background: '#444', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}>Show demo seatmap</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#0b0d0f', padding: 16, borderRadius: 8 }}>
                <SeatMap seats={seats} selectedSeatIds={selectedSeats.map((s) => s.id)} onToggleSeat={toggleSeat} />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={refreshSeats} style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6 }}>Refresh</button>
                <button onClick={proceedToCheckout} disabled={reserving} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none' }}>{reserving ? 'Reserving...' : 'Reserve & Checkout'}</button>
              </div>
            </div>

            <aside style={{ width: 320, paddingLeft: 8 }}>
              <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
                <h3 style={{ marginTop: 0, color: '#fff' }}>Selected Seats</h3>
                {selectedSeats.length === 0 ? (
                  <div style={{ color: '#cbd5da' }}>No seats selected</div>
                ) : (
                  <ul>
                    {selectedSeats.map((s) => (
                      <li key={s.id} style={{ color: '#f4f6f8', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>{`${s.row}${s.number} — $${(s.price || 0).toFixed(2)}`}</div>
                          <div>
                            <select value={s.ageCategory || ageCategory} onChange={(e) => {
                              const newAge = e.target.value;
                              const modifiers = { adult: 1.0, child: 0.5, senior: 0.8 };
                              const basePrice = (s.originalPrice || s.price || 0);
                              const newPrice = +(basePrice * (modifiers[newAge] || 1)).toFixed(2);
                              // update seat in context: store originalPrice if not present
                              updateSeat(s.id, { ageCategory: newAge, price: newPrice, originalPrice: s.originalPrice || s.price || 0 });
                            }} style={{ background: '#0b0d0f', color: '#fff', border: '1px solid #222', borderRadius: 6, padding: '4px 6px' }}>
                              <option value="adult">Adult</option>
                              <option value="child">Child</option>
                              <option value="senior">Senior</option>
                            </select>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ marginTop: 12, color: '#cbd5da' }}>
                  <div>Subtotal: <strong style={{ color: '#fff' }}>${subtotal.toFixed(2)}</strong></div>
                </div>

                {reservation ? (
                  <div style={{ marginTop: 12 }}>
                    <h4 style={{ color: '#fff' }}>Reservation</h4>
                    <div style={{ color: '#cbd5da' }}>Reservation id: {reservation.reservationId || reservation.id}</div>
                    {reservation.expiresAt && <div style={{ color: '#cbd5da' }}>Expires at: {new Date(reservation.expiresAt).toLocaleString()}</div>}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}