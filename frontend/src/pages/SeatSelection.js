import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { movie, showtime } = location.state || {};
  
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showtimeDetails, setShowtimeDetails] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (!movie || !showtime || !user) {
      navigate('/movies');
      return;
    }
    loadSeats();
  }, [movie, showtime, user, navigate]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/showtimes/${showtime.id}/seats`);
      if (response.data.ok) {
        setSeats(response.data.seats.seats);
        setBookedSeats(response.data.bookedSeats);
        setShowtimeDetails(response.data.showtime);
      } else {
        setError(response.data.message || 'Failed to load seats');
      }
    } catch (err) {
      setError('Failed to load seats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return; // Can't select booked seats
    
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const getSeatClass = (seat) => {
    const seatNumber = seat.number;
    if (bookedSeats.includes(seatNumber)) return 'seat booked';
    if (selectedSeats.includes(seatNumber)) return 'seat selected';
    return 'seat available';
  };

  const calculateTotal = () => {
    return selectedSeats.length * parseFloat(showtime.price);
  };

  const proceedToBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    try {
      setBookingInProgress(true);
      const bookingData = {
        userId: parseInt(user.id),
        showtimeId: showtime.id,
        selectedSeats: selectedSeats,
        promoCode: promoCode.trim() || null
      };

      const response = await api.post('/bookings/create', bookingData);
      
      if (response.data.ok) {
        // Navigate to booking confirmation
        navigate('/booking-confirmation', {
          state: {
            bookingData: response.data.bookingDetails,
            bookingIds: response.data.bookingIds,
            movie: movie
          }
        });
      } else {
        alert(response.data.message || 'Failed to create booking');
        // Reload seats in case some were taken
        await loadSeats();
        setSelectedSeats([]);
      }
    } catch (err) {
      alert('Failed to create booking: ' + err.message);
    } finally {
      setBookingInProgress(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>Loading seats...</div>
    </div>
  );
  
  if (error) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>{error}</div>
      <button onClick={() => navigate('/movies')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
        Back to Movies
      </button>
    </div>
  );
  
  if (!movie || !showtime) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>Invalid booking session</div>
      <button onClick={() => navigate('/movies')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
        Back to Movies
      </button>
    </div>
  );

  // Group seats by row for display
  const seatRows = {};
  seats.forEach(seat => {
    if (!seatRows[seat.row]) {
      seatRows[seat.row] = [];
    }
    seatRows[seat.row].push(seat);
  });

  // Sort rows alphabetically and seats numerically within each row
  const sortedRows = Object.keys(seatRows).sort();
  sortedRows.forEach(row => {
    seatRows[row].sort((a, b) => a.seat - b.seat);
  });

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '820px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 20 }}>
          <button 
            onClick={() => navigate('/movies')} 
            style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}
          >
            ← Back to Movies
          </button>
          <h1 style={{ margin: 0, color: '#fff' }}>{movie.title}</h1>
          <div style={{ color: '#cbd5da', marginTop: 6, fontWeight: 500 }}>
            {formatDateTime(showtime.show_time)} • {showtimeDetails?.theater_name} • ${showtime.price} per seat
          </div>
        </header>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#0b0d0f', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', background: '#222', padding: '8px', marginBottom: '20px', borderRadius: '4px' }}>
                SCREEN
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {sortedRows.map(rowLetter => (
                  <div key={rowLetter} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', textAlign: 'center', color: '#cbd5da', fontSize: '14px' }}>{rowLetter}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {seatRows[rowLetter].map(seat => (
                        <button
                          key={seat.number}
                          onClick={() => toggleSeat(seat.number)}
                          disabled={bookedSeats.includes(seat.number)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '12px',
                            cursor: bookedSeats.includes(seat.number) ? 'not-allowed' : 'pointer',
                            background: bookedSeats.includes(seat.number) ? '#ff6b6b' :
                                      selectedSeats.includes(seat.number) ? '#51cf66' : '#444',
                            color: '#fff'
                          }}
                          title={`Seat ${seat.number} - ${
                            bookedSeats.includes(seat.number) ? 'Booked' :
                            selectedSeats.includes(seat.number) ? 'Selected' : 'Available'
                          }`}
                        >
                          {seat.seat}
                        </button>
                      ))}
                    </div>
                    <div style={{ width: '20px', textAlign: 'center', color: '#cbd5da', fontSize: '14px' }}>{rowLetter}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: '#444', borderRadius: '2px' }}></div>
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: '#51cf66', borderRadius: '2px' }}></div>
                  <span>Selected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: '#ff6b6b', borderRadius: '2px' }}></div>
                  <span>Booked</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={loadSeats} 
                style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6 }}
              >
                Refresh Seats
              </button>
              <button 
                onClick={proceedToBooking} 
                disabled={selectedSeats.length === 0 || bookingInProgress}
                style={{ 
                  background: selectedSeats.length === 0 || bookingInProgress ? '#444' : '#7a1f1f', 
                  color: '#fff', 
                  padding: '8px 14px', 
                  borderRadius: 6, 
                  border: 'none',
                  cursor: selectedSeats.length === 0 || bookingInProgress ? 'not-allowed' : 'pointer'
                }}
              >
                {bookingInProgress ? 'Creating Booking...' : 'Proceed to Booking'}
              </button>
            </div>
          </div>

          <aside style={{ width: 300 }}>
            <div style={{ background: '#0b0d0f', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, color: '#fff' }}>Selected Seats</h3>
              
              {selectedSeats.length === 0 ? (
                <div style={{ color: '#cbd5da' }}>No seats selected</div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#f4f6f8', marginBottom: 8 }}>
                    Seats: {selectedSeats.sort().join(', ')}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#cbd5da', fontSize: 13, display: 'block', marginBottom: 6 }}>
                  Promo Code (optional):
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: 6, 
                    background: '#0b0d0f', 
                    color: '#fff', 
                    border: '1px solid #222' 
                  }}
                />
              </div>

              <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5da', marginBottom: 8 }}>
                  <span>Seats ({selectedSeats.length}):</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                {promoCode.trim() && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5da', marginBottom: 8, fontSize: 12 }}>
                    <span>Promo: {promoCode}</span>
                    <span>Applied at checkout</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
