import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingApi from '../services/bookingApi.js';
import ShowList from '../components/ShowList.jsx';
import { useSearch } from '../context/SearchContext.js';

export default function ShowTimes() {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const fetchId = useRef(0);

  useEffect(() => {
    // Demo-only mode: don't call backend, always show local demo movies/shows
    setLoading(true);
    setError(null);
    if (movieId) {
      const demoId = movieId || 'demo-1';
      const singleDemo = {
        id: demoId,
        title: movieId ? `Demo Movie ${movieId}` : 'Demo Movie 1',
        synopsis: 'Demo synopsis',
        shows: generateDemoShows(demoId),
      };
      setMovies([singleDemo]);
    } else {
      const demoMovies = [1, 2].map((n) => ({
        id: `demo-${n}`,
        title: `Demo Movie ${n}`,
        synopsis: `Demo synopsis ${n}`,
        shows: generateDemoShows(`demo-${n}`),
      }));
      setMovies(demoMovies);
    }
    setLoading(false);
  }, [movieId]);

  useEffect(() => {
    if (movies && movies.length > 0) {
      const updated = movies.map((m) => {
        if (Array.isArray(m.shows) && m.shows.length > 0) return m;
        return { ...m, shows: generateDemoShowsForMovie(m) };
      });
      setMovies(updated);
    } else if (!loading && (!movies || movies.length === 0)) {
      // Show a single demo movie with multiple showtimes so the demo page
      // focuses on booking different times for one movie.
      const demoId = movieId || 'demo-1';
      const singleDemo = {
        id: demoId,
        title: movieId ? `Demo Movie ${movieId}` : 'Demo Movie 1',
        synopsis: 'Demo synopsis',
        shows: generateDemoShows(demoId),
      };
      setMovies([singleDemo]);
    }
  }, [movies, loading]);

  function generateDemoShowsForMovie(movie) {
    const baseId = movie.id || 'demo-m';
    return generateDemoShows(baseId);
  }

  function generateDemoShows(seed) {
    const now = Date.now();
    return [0, 1, 2, 3].map((i) => ({ id: `demo-show-${seed}-${i}`, startTime: new Date(now + i * 3600 * 1000).toISOString(), runtimeMinutes: 120, auditorium: `Aud ${i + 1}` }));
  }

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
        const payload = res && res.data ? (res.data.content || res.data) : [];
        setMovies(payload || []);
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

  // Apply client-side name filter using global search query and filters
  const { query, filters } = useSearch();
  const navigate = useNavigate();
  const moviesFiltered = useMemo(() => {
    // If we're showing demo data (ids start with 'demo'), bypass the global search
    const isDemo = Array.isArray(movies) && movies.length > 0 && movies.every((m) => String(m.id).startsWith('demo'));
    // If demo, keep local behavior
    if (isDemo) return movies;

    // If name filter is active and a query exists, redirect user to /movies so search results are shown there
    const qRaw = (query || '').trim();
    if (filters && filters.name && qRaw) {
      // navigate to /movies which will render search results using SearchContext
      // Use a short timeout to avoid calling navigate during render of useMemo
      setTimeout(() => navigate('/movies'), 0);
      return movies;
    }
    const qLower = qRaw.toLowerCase();
    if (!filters || !filters.name) return movies;
    if (!qLower) return movies;
    return movies.filter((m) => (m.title || '').toLowerCase().includes(qLower));
  }, [movies, query, filters]);

  // Server-backed search disabled while disconnected from DB. Client-side filtering still applies.

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
                <ShowList movies={moviesFiltered} />
              )}
          </div>
        )}
      </div>
    </div>
  );
}
