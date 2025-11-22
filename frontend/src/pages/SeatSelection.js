import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import api from '../services/api';

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedShow, addSeat, clearSelection } = useBooking();
  const { movie, showtime } = location.state || {};
  
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [ageCategories, setAgeCategories] = useState({});
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showtimeDetails, setShowtimeDetails] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Redirect to home if missing required data
  useEffect(() => {
    if (!movie || !showtime || !user) {
      console.log('Missing data:', { movie, showtime, user: user ? 'present' : 'missing' });
      navigate('/');
    }
  }, [movie, showtime, user, navigate]);

  // Check for required data - show loading state if redirecting
  if (!movie || !showtime || !user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>Redirecting...</h2>
        <p>Taking you back to the home page...</p>
      </div>
    );
  }

  useEffect(() => {
    if (movie && showtime && user && showtime.id) {
      loadSeats();
    }
  }, [movie?.id, showtime?.id, user?.id]); // Use IDs instead of objects to prevent infinite loops

  // Cleanup effect to release seats when user leaves this component
  useEffect(() => {
    return () => {
      // Release temporary seats when component unmounts
      if (user?.id && showtime?.id) {
        releaseTemporarySeats();
      }
    };
  }, [user?.id, showtime?.id]);

  // Refresh seats when component becomes visible again (e.g., returning from checkout)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && movie && showtime && user && showtime.id) {
        console.log('Page became visible, releasing temp seats and refreshing...');
        await releaseTemporarySeats();
        await loadSeats();
      }
    };

    const handleBeforeUnload = () => {
      // Release temporary seats when user closes browser or navigates away
      if (user?.id && showtime?.id) {
        navigator.sendBeacon('/api/bookings/release-temp-seats', JSON.stringify({
          userId: user.id,
          showtimeId: showtime.id
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [movie?.id, showtime?.id, user?.id]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      console.log('Loading seats for showtime:', showtime.id);
      const response = await api.get(`/bookings/showtimes/${showtime.id}/seats`);
      console.log('Seats response:', response.data);
      if (response.data.ok) {
        setSeats(response.data.seats.seats || []);
        setBookedSeats(response.data.bookedSeats || []);
        setShowtimeDetails(response.data.showtime || showtime);
      } else {
        console.error('Seats API error:', response.data.message);
        setError(response.data.message || 'Failed to load seats');
        // Try to continue with basic seat layout if API fails
        setSeats([]);
        setBookedSeats([]);
        setShowtimeDetails(showtime);
      }
    } catch (err) {
      console.error('Seats loading error:', err);
      setError('Failed to load seats: ' + err.message);
      // Try to continue with basic functionality
      setSeats([]);
      setBookedSeats([]);
      setShowtimeDetails(showtime);
    } finally {
      setLoading(false);
    }
  };

  // Release temporarily held seats for this user
  const releaseTemporarySeats = async () => {
    try {
      console.log('Releasing temporary seats for user:', user.id);
      await api.post('/bookings/release-temp-seats', {
        userId: user.id,
        showtimeId: showtime.id
      });
      console.log('Temporary seats released successfully');
    } catch (err) {
      console.error('Error releasing temporary seats:', err);
      // Don't throw error, just log it
    }
  };

  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return; // Can't select booked seats
    
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
      // Remove age category when deselecting seat
      const newAgeCategories = { ...ageCategories };
      delete newAgeCategories[seatNumber];
      setAgeCategories(newAgeCategories);
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
      // Set default age category to ADULT
      setAgeCategories({...ageCategories, [seatNumber]: 'ADULT'});
    }
  };

  const updateAgeCategory = (seatNumber, ageCategory) => {
    setAgeCategories({...ageCategories, [seatNumber]: ageCategory});
  };

  const getSeatClass = (seat) => {
    const seatNumber = seat.number;
    if (bookedSeats.includes(seatNumber)) return 'seat booked';
    if (selectedSeats.includes(seatNumber)) return 'seat selected';
    return 'seat available';
  };

  const calculateTotal = () => {
    let total = 0;
    selectedSeats.forEach(seatNumber => {
      const ageCategory = ageCategories[seatNumber] || 'ADULT';
      // Get price from multiple possible sources
      let basePrice = parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50);
      let price = basePrice;
      if (ageCategory === 'CHILD') {
        price *= 0.75; // 25% discount for children
      } else if (ageCategory === 'SENIOR') {
        price *= 0.80; // 20% discount for seniors  
      }
      total += price;
    });
    return total;
  };

  const proceedToBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    // Always set booking context data first
    console.log('Showtime data for pricing:', showtime);
    console.log('Selected seats before pricing:', selectedSeats);
    console.log('Age categories:', ageCategories);
    
    const seatsWithPrices = selectedSeats.map(seatNumber => {
      const ageCategory = ageCategories[seatNumber] || 'ADULT';
      // Get price from multiple possible sources
      let basePrice = parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50);
      
      console.log(`Processing seat ${seatNumber}: basePrice=${basePrice}, ageCategory=${ageCategory}`);
      
      // Apply age discounts
      let finalPrice = basePrice;
      if (ageCategory === 'CHILD') {
        finalPrice = basePrice * 0.75; // 25% discount for children
      } else if (ageCategory === 'SENIOR') {
        finalPrice = basePrice * 0.80; // 20% discount for seniors
      }
      
      const seatData = {
        id: seatNumber,
        seat_number: seatNumber,
        price: finalPrice,
        age_category: ageCategory
      };
      
      console.log(`Seat ${seatNumber} final data:`, seatData);
      return seatData;
    });
    
    // Clear existing selections and add new data
    clearSelection();
    seatsWithPrices.forEach(seat => addSeat(seat));
    setSelectedShow({
      id: showtime.id,
      movie_title: movie.title,
      start_time: showtime.start_time,
      auditorium_name: showtime.auditorium_name
    });
    
    console.log('SeatSelection - Set show:', {
      id: showtime.id,
      movie_title: movie.title,
      start_time: showtime.start_time,
      auditorium_name: showtime.auditorium_name
    });
    console.log('SeatSelection - Set seats:', seatsWithPrices);

    try {
      setBookingInProgress(true);
      const bookingData = {
        userId: parseInt(user.id),
        showtimeId: showtime.id,
        selectedSeats: selectedSeats,
        ageCategories: selectedSeats.map(seat => ageCategories[seat] || 'ADULT'),
        promoCode: promoCode.trim() || null
      };

      const response = await api.post('/bookings/create', bookingData);
      
      if (response.data.ok) {
        // Navigate to checkout
        navigate('/checkout');
      } else {
        // Even if booking creation fails, allow user to proceed to checkout
        console.warn('Booking creation failed, proceeding anyway:', response.data.message);
        navigate('/checkout');
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      // Still proceed to checkout with the context data we set
      alert('Note: Booking creation had an issue, but you can continue to checkout.');
      navigate('/checkout');
    } finally {
      setBookingInProgress(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#0f1417', color: 'white' }}>
      <h1 style={{ color: 'yellow', fontSize: '32px', marginBottom: '20px' }}>🎬 SEAT SELECTION LOADING 🎬</h1>
      <div>Loading seats for showtime {showtime?.id}...</div>
      <div style={{ color: '#cbd5da', fontSize: '14px', marginTop: '8px' }}>
        Movie: {movie?.title || 'Unknown'} | Showtime: {showtime?.id || 'Unknown'}
      </div>
    </div>
  );
  
  if (error) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#0f1417', color: 'white' }}>
      <h1 style={{ color: 'red', fontSize: '32px', marginBottom: '20px' }}>🚨 SEAT SELECTION ERROR 🚨</h1>
      <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>{error}</div>
      <button onClick={() => navigate('/shows')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
        Back to Show Times
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
            onClick={() => navigate('/shows')} 
            style={{ background: 'transparent', color: '#cbd5da', border: '1px solid #222', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}
          >
            ← Back to Showtimes
          </button>
          <h1 style={{ margin: 0, color: '#fff' }}>{movie.title}</h1>
          <div style={{ color: '#cbd5da', marginTop: 6, fontWeight: 500 }}>
            {formatDateTime(showtime.show_time || showtimeDetails?.starts_at)} • {showtimeDetails?.auditorium_name || showtime.theater_name} • ${parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50).toFixed(2)} per seat
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
                    Selected Seats:
                  </div>
                  {selectedSeats.sort().map(seatNumber => (
                    <div key={seatNumber} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '8px', background: '#1a1d21', borderRadius: 4 }}>
                      <span style={{ color: '#f4f6f8' }}>Seat {seatNumber}</span>
                      <select
                        value={ageCategories[seatNumber] || 'ADULT'}
                        onChange={(e) => updateAgeCategory(seatNumber, e.target.value)}
                        style={{ 
                          background: '#0b0d0f', 
                          color: '#fff', 
                          border: '1px solid #222', 
                          borderRadius: 4, 
                          padding: '4px 8px',
                          fontSize: '12px'
                        }}
                      >
                        <option value="CHILD">Child (${ (parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50) * 0.75).toFixed(2) })</option>
                        <option value="ADULT">Adult (${ parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50).toFixed(2) })</option>
                        <option value="SENIOR">Senior (${ (parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50) * 0.80).toFixed(2) })</option>
                      </select>
                    </div>
                  ))}
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
                {selectedSeats.length > 0 && (
                  <>
                    {selectedSeats.sort().map(seatNumber => {
                      const ageCategory = ageCategories[seatNumber] || 'ADULT';
                      let price = parseFloat(showtime.price || showtime.ticketPrice || showtimeDetails?.price || 12.50);
                      if (ageCategory === 'CHILD') price *= 0.75;
                      else if (ageCategory === 'SENIOR') price *= 0.80;
                      return (
                        <div key={seatNumber} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5da', marginBottom: 4, fontSize: 12 }}>
                          <span>Seat {seatNumber} ({ageCategory.toLowerCase()}):</span>
                          <span>${price.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div style={{ borderTop: '1px solid #333', paddingTop: 8, marginTop: 8 }}></div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5da', marginBottom: 8 }}>
                  <span>Subtotal ({selectedSeats.length} seats):</span>
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
