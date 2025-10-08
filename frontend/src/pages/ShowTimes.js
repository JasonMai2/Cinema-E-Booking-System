import React, { useEffect, useRef, useState } from 'react';
import bookingApi from '../services/bookingApi';
import ShowList from '../components/ShowList';

export default function ShowTimes() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const fetchId = useRef(0);

  useEffect(() => {
    let mounted = true;
    const id = ++fetchId.current; // request identifier to avoid race conditions
    setLoading(true);
    // clear previous error only when starting a fresh request
    setError(null);

    bookingApi
      .getMovies()
      .then((res) => {
        // ignore responses from stale requests
        if (!mounted || id !== fetchId.current) return;
        setMovies(res.data || []);
      })
      .catch((err) => {
        if (!mounted || id !== fetchId.current) return;
        // preserve the full error object in the message so user can inspect details
        const msg = (err && (err.message || (err.response && err.response.statusText))) || 'Failed to load shows';
        setError(msg);
      })
      .finally(() => {
        if (!mounted || id !== fetchId.current) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function retry() {
    // start a new fetch id to invalidate previous requests
    fetchId.current += 1;
    setError(null);
    setErrorDetailsOpen(false);
    setLoading(true);
    const id = fetchId.current;

    bookingApi
      .getMovies()
      .then((res) => {
        if (id !== fetchId.current) return;
        setMovies(res.data || []);
      })
      .catch((err) => {
        if (id !== fetchId.current) return;
        const msg = (err && (err.message || (err.response && err.response.statusText))) || 'Failed to load shows';
        setError(msg);
      })
      .finally(() => {
        if (id !== fetchId.current) return;
        setLoading(false);
      });
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
