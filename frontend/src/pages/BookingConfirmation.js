import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookingData, bookingIds, movie } = location.state || {};
  
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingData || !bookingIds || !movie || !user) {
      navigate('/movies');
      return;
    }
    loadUserBookings();
  }, [bookingData, bookingIds, movie, user, navigate]);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/user/${user.id}`);
      if (response.data.ok) {
        setUserBookings(response.data.bookings);
      }
    } catch (err) {
      setError('Failed to load booking history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await api.delete(`/bookings/${bookingId}/cancel`);
      if (response.data.ok) {
        alert('Booking cancelled successfully');
        // Remove the cancelled booking from the list
        setUserBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      } else {
        alert(response.data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      alert('Failed to cancel booking: ' + err.message);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSeats = (seats) => {
    if (Array.isArray(seats)) {
      return seats.join(', ');
    }
    return seats || '';
  };

  if (!bookingData || !bookingIds || !movie || !user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>Invalid booking confirmation session</div>
        <button onClick={() => navigate('/movies')} style={{ background: '#7a1f1f', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
          Back to Movies
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: '800px', width: '100%', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '48px', color: '#51cf66', marginBottom: 16 }}>✓</div>
          <h1 style={{ margin: 0, color: '#fff', marginBottom: 8 }}>Booking Confirmed!</h1>
          <p style={{ color: '#cbd5da', fontSize: 16 }}>Your tickets have been successfully booked</p>
        </div>

        {/* Booking Details */}
        <div style={{ background: '#0b0d0f', padding: 20, borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Booking Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>Movie</div>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{movie.title}</div>
            </div>
            <div>
              <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>Show Time</div>
              <div style={{ color: '#fff' }}>{formatDateTime(bookingData.show_time)}</div>
            </div>
            <div>
              <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>Theater</div>
              <div style={{ color: '#fff' }}>{bookingData.theater_name}</div>
            </div>
            <div>
              <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>Seats</div>
              <div style={{ color: '#fff' }}>{formatSeats(bookingData.seats)}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #222', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>Total Amount</div>
              <div style={{ color: '#51cf66', fontSize: 20, fontWeight: 'bold' }}>${bookingData.total_price}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#cbd5da', fontSize: 14, marginBottom: 4 }}>Booking IDs</div>
              <div style={{ color: '#fff', fontSize: 12, fontFamily: 'monospace' }}>
                {bookingIds.slice(0, 3).join(', ')}
                {bookingIds.length > 3 && '...'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          <button 
            onClick={() => navigate('/movies')}
            style={{ 
              background: 'transparent', 
              color: '#cbd5da', 
              border: '1px solid #222', 
              padding: '12px 24px', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}
          >
            Browse More Movies
          </button>
          <button 
            onClick={() => window.print()}
            style={{ 
              background: '#7a1f1f', 
              color: '#fff', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}
          >
            Print Tickets
          </button>
        </div>

        {/* User's Booking History */}
        <div style={{ background: '#0b0d0f', padding: 20, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Your Recent Bookings</h3>
          
          {loading ? (
            <div style={{ color: '#cbd5da' }}>Loading your bookings...</div>
          ) : error ? (
            <div style={{ color: '#ff6b6b' }}>{error}</div>
          ) : userBookings.length === 0 ? (
            <div style={{ color: '#cbd5da' }}>No previous bookings found</div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {userBookings.map((booking) => (
                <div key={booking.booking_id} style={{ 
                  border: '1px solid #222', 
                  borderRadius: 6, 
                  padding: 16, 
                  marginBottom: 12, 
                  background: '#0f1417' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>{booking.movie_title}</div>
                      <div style={{ color: '#cbd5da', fontSize: 14 }}>
                        {formatDateTime(booking.show_time)} • {booking.theater_name}
                      </div>
                      <div style={{ color: '#cbd5da', fontSize: 14 }}>
                        Seat {booking.seat_number} • ${booking.price}
                      </div>
                    </div>
                    <button 
                      onClick={() => cancelBooking(booking.booking_id)}
                      style={{ 
                        background: '#ff6b6b', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: 4, 
                        fontSize: 12, 
                        cursor: 'pointer' 
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                    Booking ID: {booking.booking_id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;