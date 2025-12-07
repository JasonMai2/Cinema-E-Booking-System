import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import SeatMap from '../components/SeatMap.jsx';
import bookingApi from '../services/bookingApi.js';
import { useBooking } from '../context/BookingContext.js';

export default function SeatSelection() {
  const { showId: paramShowId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get movie and showtime from navigation state (passed from ShowList)
  const movieFromState = location.state?.movie;
  const showtimeFromState = location.state?.showtime;
  
  // Use showId from state or URL params
  const showId = showtimeFromState?.id || paramShowId;
  
  const {
    selectedShow,
    selectedSeats,
    addSeat,
    removeSeat,
    updateSeat,
    reservation,
    setOrderDetails,
    setSelectedShow,
  } = useBooking();

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [ageCategory, setAgeCategory] = useState('adult');
  const [ticketTypes, setTicketTypes] = useState([]);
  const [ticketPrices, setTicketPrices] = useState({ child: 9.00, adult: 15.00, senior: 11.00 });

  const pollRef = useRef(null);

  // Set the selected show from navigation state on mount
  useEffect(() => {
    if (movieFromState && showtimeFromState) {
      const showData = {
        id: showtimeFromState.id,
        movieId: movieFromState.id,
        title: movieFromState.title,
        movieTitle: movieFromState.title,
        startTime: showtimeFromState.start_time,
        auditorium: showtimeFromState.auditorium_name,
        synopsis: movieFromState.synopsis,
        poster_url: movieFromState.poster_url,
      };
      setSelectedShow(showData);
    }
  }, [movieFromState, showtimeFromState, setSelectedShow]);

  // Fetch ticket types from backend
  useEffect(() => {
    fetch('/api/ticket-types')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setTicketTypes(data);
          const prices = {};
          data.forEach(type => {
            const category = (type.age_category || '').toLowerCase();
            prices[category] = type.price_cents / 100;
          });
          if (Object.keys(prices).length > 0) {
            setTicketPrices(prices);
          }
        }
      })
      .catch(err => console.error('Failed to load ticket types:', err));
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    // Safety check for showId
    if (!showId) {
      setError('No showtime selected. Please go back and select a showtime.');
      setLoading(false);
      return;
    }
    
    // Fetch seat map from backend
    bookingApi.getSeatMap(showId)
      .then((res) => {
        if (!mounted) return;
        
        // Handle seat map - backend returns { ok: true, seats: [...] }
        let payload = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) {
            payload = res.data;
          } else if (res.data.seats && Array.isArray(res.data.seats)) {
            payload = res.data.seats;
          } else if (res.data.content && Array.isArray(res.data.content)) {
            payload = res.data.content;
          }
        }
        
        if (!payload || payload.length === 0) {
          setError('No seats available for this showtime. Please contact support.');
          setSeats([]);
        } else {
          setSeats(payload);
          setError(null);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load seat map:', err);
        setError('Failed to load seats. Please try again or contact support.');
        setSeats([]);
      })
      .finally(() => mounted && setLoading(false));
      
    return () => (mounted = false);
  }, [showId, movieFromState, selectedShow, setSelectedShow]);

  useEffect(() => {
    // Poll seat map every 15s to keep availability fresh
    if (!showId || seats.length === 0) return;
    pollRef.current = setInterval(() => {
      bookingApi.getSeatMap(showId).then((res) => {
        let payload = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) {
            payload = res.data;
          } else if (res.data.seats && Array.isArray(res.data.seats)) {
            payload = res.data.seats;
          } else if (res.data.content && Array.isArray(res.data.content)) {
            payload = res.data.content;
          }
        }
        if (payload && payload.length > 0) setSeats(payload);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [showId, seats.length]);

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
    if (selectedSeats.length === 0) return alert('Please select at least one seat');
    setReserving(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      
      // Call the backend API to reserve seats
      const res = await bookingApi.reserveSeats(showId, { seats: seatIds });
      const data = res && res.data ? res.data : res;
      
      if (!data.ok) {
        throw new Error(data.message || 'Failed to reserve seats');
      }
      
      // Store resulting reservation/order in context
      if (setOrderDetails) setOrderDetails(data);
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (err) {
      console.error('Reserve seats failed:', err);
      // Try to refresh seat map and show helpful message
      try {
        const res = await bookingApi.getSeatMap(showId);
        let payload = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) {
            payload = res.data;
          } else if (res.data.seats && Array.isArray(res.data.seats)) {
            payload = res.data.seats;
          }
        }
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
    if (!showId) return;
    setLoading(true);
    try {
      const res = await bookingApi.getSeatMap(showId);
      let payload = [];
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          payload = res.data;
        } else if (res.data.seats && Array.isArray(res.data.seats)) {
          payload = res.data.seats;
        }
      }
      setSeats(payload || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to refresh seats');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '820px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Seat Selection</h1>
          <div style={{ color: '#fff', marginTop: 6, fontWeight: 600, fontSize: 18 }}>
            {selectedShow?.movieTitle || selectedShow?.title || movieFromState?.title || 'Select Your Seats'}
          </div>
          {(selectedShow?.startTime || showtimeFromState?.start_time) && (
            <div style={{ color: '#cbd5da', marginTop: 4, fontSize: 14 }}>
              {new Date(selectedShow?.startTime || showtimeFromState?.start_time).toLocaleString()}
              {(selectedShow?.auditorium || showtimeFromState?.auditorium_name) && 
                ` • ${selectedShow?.auditorium || showtimeFromState?.auditorium_name}`}
            </div>
          )}
        </header>

        {/* Screen indicator */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            background: 'linear-gradient(180deg, #444 0%, #222 100%)', 
            height: 8, 
            borderRadius: '50%/100% 100% 0 0',
            marginBottom: 8
          }} />
          <div style={{ color: '#666', fontSize: 12, letterSpacing: 2 }}>SCREEN</div>
        </div>

        {loading ? (
          <div style={{ color: '#cbd5da', textAlign: 'center', padding: 40 }}>Loading seats…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#ff6b6b', marginBottom: 16 }}>{error}</div>
            <button onClick={refreshSeats} style={{ background: '#7a1f1f', color: '#fff', padding: '10px 20px', borderRadius: 6, border: 'none', marginRight: 8 }}>Retry</button>
            <button onClick={() => navigate(-1)} style={{ background: '#444', color: '#fff', padding: '10px 20px', borderRadius: 6, border: 'none' }}>Go Back</button>
          </div>
        ) : seats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ color: '#cbd5da', marginBottom: 16 }}>No seats available for this showtime.</div>
            <button onClick={() => navigate(-1)} style={{ background: '#7a1f1f', color: '#fff', padding: '10px 20px', borderRadius: 6, border: 'none' }}>Go Back</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#0b0d0f', padding: 16, borderRadius: 8 }}>
                <SeatMap seats={seats} selectedSeatIds={selectedSeats.map((s) => s.id)} onToggleSeat={toggleSeat} />
              </div>
              
              {/* Legend */}
              <div style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 18, background: '#0b0d0f', border: '1px solid #222', borderRadius: 4 }} />
                  <span style={{ color: '#cbd5da', fontSize: 12 }}>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 18, background: '#7a1f1f', borderRadius: 4 }} />
                  <span style={{ color: '#cbd5da', fontSize: 12 }}>Selected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 18, background: '#2b2b2b', borderRadius: 4 }} />
                  <span style={{ color: '#cbd5da', fontSize: 12 }}>Taken</span>
                </div>
              </div>
              
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={refreshSeats} style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6 }}>Refresh</button>
                <button onClick={proceedToCheckout} disabled={reserving || selectedSeats.length === 0} style={{ background: selectedSeats.length === 0 ? '#444' : '#7a1f1f', color: '#fff', padding: '8px 14px', borderRadius: 6, border: 'none', cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer' }}>{reserving ? 'Reserving...' : 'Reserve & Checkout'}</button>
              </div>
            </div>

            <aside style={{ width: 320, paddingLeft: 8 }}>
              <div style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
                <h3 style={{ marginTop: 0, color: '#fff' }}>Selected Seats</h3>
                {selectedSeats.length === 0 ? (
                  <div style={{ color: '#cbd5da' }}>No seats selected</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {selectedSeats.map((s) => (
                      <li key={s.id} style={{ color: '#f4f6f8', marginBottom: 8 }}>
                        <div>
                          <div>{`${s.row}${s.number} — $${(s.price || 0).toFixed(2)}`}</div>
                          <div>
                            <select value={s.ageCategory || ageCategory} onChange={(e) => {
                              const newAge = e.target.value;
                              const newPrice = ticketPrices[newAge] || ticketPrices.adult || 15.00;
                              updateSeat(s.id, { ageCategory: newAge, price: newPrice, originalPrice: s.originalPrice || s.price || 0 });
                            }} style={{ background: '#0b0d0f', color: '#fff', border: '1px solid #222', borderRadius: 6, padding: '4px 6px' }}>
                              {ticketTypes.length > 0 ? (
                                ticketTypes.map(type => (
                                  <option key={type.id || type.age_category} value={(type.age_category || '').toLowerCase()}>
                                    {type.name || type.age_category} (${(type.price_cents / 100).toFixed(2)})
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="child">Child (${ticketPrices.child?.toFixed(2) || '9.00'})</option>
                                  <option value="adult">Adult (${ticketPrices.adult?.toFixed(2) || '15.00'})</option>
                                  <option value="senior">Senior (${ticketPrices.senior?.toFixed(2) || '11.00'})</option>
                                </>
                              )}
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