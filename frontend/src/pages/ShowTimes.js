import React, { useEffect, useState } from 'react';
import bookingApi from '../services/bookingApi';
import ShowList from '../components/ShowList';

export default function ShowTimes() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    bookingApi
      .getMovies()
      .then((res) => {
        if (mounted) setMovies(res.data || []);
      })
      .catch((err) => mounted && setError(err.message || 'Failed to load shows'))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  function retry() {
    setError(null);
    setLoading(true);
    bookingApi
      .getMovies()
      .then((res) => setMovies(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load shows'))
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'transparent' }}>
      <div style={{ width: '720px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#fff' }}>Show Times</h1>
          <p style={{ margin: '6px 0 0', color: '#cbd5da' }}>Pick a movie and time to start your booking.</p>
        </header>

        {loading ? (
          <div style={{ color: '#cbd5da' }}>Loading shows…</div>
        ) : error ? (
          <div>
            <div style={{ color: '#ff6b6b' }}>Error: {error}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={retry} style={{ background: '#7a1f1f', color: '#fff', borderRadius: 6, padding: '8px 12px', border: 'none' }}>Retry</button>
            </div>
          </div>
        ) : (
          <div>
            {movies.length === 0 ? (
              <div style={{ color: '#cbd5da' }}>No shows available right now.</div>
            ) : (
              <ShowList movies={movies} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
