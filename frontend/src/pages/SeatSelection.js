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
    addSeat,
    removeSeat,
    reservation,
    setOrderDetails,
    setSelectedShow,
  } = useBooking();

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [useDemo, setUseDemo] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    bookingApi
      .getSeatMap(showId)
      .then((res) => {
        if (!mounted) return;
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
      addSeat(seat);
    }
  }

  async function proceedToCheckout() {
    if (selectedSeats.length === 0) return alert('Select seats first');
    setReserving(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      if (useDemo) {
        // create a simple order draft in context and go to checkout
        const draft = {
          showId: showId,
          show: selectedShow,
          seats: selectedSeats,
          customer: null,
        };
        if (typeof createOrderDraft === 'function') {
          await createOrderDraft(draft);
        }
        navigate('/checkout');
      } else {
        // call API to reserve seats; bookingApi.reserveSeats returns reservation/order data
        const res = await bookingApi.reserveSeats(showId, { seats: seatIds });
        const data = res && res.data ? res.data : res;
        // store resulting reservation/order in context if setter exists
        if (setOrderDetails) setOrderDetails(data);
        // start a countdown or show expiry info if provided
        navigate('/checkout');
      }
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
                      <li key={s.id} style={{ color: '#f4f6f8' }}>{`${s.row}${s.number} — $${(s.price || 0).toFixed(2)}`}</li>
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
