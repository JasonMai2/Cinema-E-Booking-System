import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import SeatMap from '../components/SeatMap';
import { useBooking } from '../context/BookingContext';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const {
    selectedShow,
    selectedSeats,
    setSelectedSeats,
    createReservation,
    reservation,
    setReservation,
    setSelectedShow,
  } = useBooking();

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    bookingApi
      .getSeatMap(showId)
      .then((res) => {
        if (!mounted) return;
        setSeats(res.data.seats || []);
      })
      .catch((err) => mounted && setError(err.message || 'Failed to load seat map'))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [showId]);

  useEffect(() => {
    // Optionally poll seat map every 15s to keep availability fresh
    pollRef.current = setInterval(() => {
      bookingApi.getSeatMap(showId).then((res) => setSeats(res.data.seats || [])).catch(() => {});
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [showId]);

  const subtotal = useMemo(() => selectedSeats.reduce((s, x) => s + (x.price || 0), 0), [selectedSeats]);

  function toggleSeat(seat) {
    if (seat.status !== 'available') return;
    const exists = selectedSeats.find((s) => s.id === seat.id);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  }

  async function proceedToCheckout() {
    if (selectedSeats.length === 0) return alert('Select seats first');
    setReserving(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const data = await createReservation(showId, seatIds);
      // reservation stored in context
      // start a countdown or show expiry info if provided
      navigate('/checkout');
    } catch (err) {
      // Try to refresh seat map and show helpful message
      await bookingApi.getSeatMap(showId).then((res) => setSeats(res.data.seats || [])).catch(() => {});
      alert('Failed to reserve seats — some may no longer be available. Please reselect.');
    } finally {
      setReserving(false);
    }
  }

  async function refreshSeats() {
    setLoading(true);
    try {
      const res = await bookingApi.getSeatMap(showId);
      setSeats(res.data.seats || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading seats...</div>;
  if (error) return (
    <div>
      <div>Error: {error}</div>
      <button onClick={refreshSeats}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <h2>Seat Selection {selectedShow ? `- ${selectedShow.title || selectedShow.id}` : ''}</h2>
        <SeatMap seats={seats} selectedSeatIds={selectedSeats.map((s) => s.id)} onToggleSeat={toggleSeat} />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={refreshSeats}>Refresh</button>
          <button onClick={proceedToCheckout} disabled={reserving}>{reserving ? 'Reserving...' : 'Reserve & Checkout'}</button>
        </div>
      </div>

      <aside style={{ width: 320, borderLeft: '1px solid #eee', paddingLeft: 16 }}>
        <h3>Selected Seats</h3>
        {selectedSeats.length === 0 ? (
          <div>No seats selected</div>
        ) : (
          <ul>
            {selectedSeats.map((s) => (
              <li key={s.id}>{`${s.row}${s.number} — $${(s.price || 0).toFixed(2)}`}</li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 12 }}>
          <div>Subtotal: <strong>${subtotal.toFixed(2)}</strong></div>
        </div>

        {reservation ? (
          <div style={{ marginTop: 12 }}>
            <h4>Reservation</h4>
            <div>Reservation id: {reservation.reservationId || reservation.id}</div>
            {reservation.expiresAt && <div>Expires at: {new Date(reservation.expiresAt).toLocaleString()}</div>}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
