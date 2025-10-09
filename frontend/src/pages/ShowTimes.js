import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import bookingApi from '../services/bookingApi';
import ShowList from '../components/ShowList';
import { useSearch } from '../context/SearchContext';

export default function ShowTimes() {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const fetchId = useRef(0);

  useEffect(() => {
    // When no shows exist, create demo shows so the user can continue booking
    let mounted = true;
    const id = ++fetchId.current; // request identifier to avoid race conditions
    setLoading(true);
    // clear previous error only when starting a fresh request
    setError(null);
    // If a movieId is present, fetch shows for that specific movie and shape
    // them into the expected `movies` array where each movie has a `shows` list.
    const fetchPromise = movieId
      ? bookingApi.getShowsForMovie(movieId).then((res) => {
          const payload = res && res.data ? (res.data.shows || res.data.content || res.data) : [];
          // shape into movie-like object for ShowList: include title, synopsis, shows
          const movieObj = { id: movieId, title: `Movie ${movieId}`, synopsis: '', shows: payload };
          return [movieObj];
        })
      : bookingApi.getMovies().then((res) => (res && res.data ? (res.data.content || res.data) : []));

    fetchPromise
      .then((payload) => {
        if (!mounted || id !== fetchId.current) return;
        setMovies(payload || []);
      })
      .catch((err) => {
        if (!mounted || id !== fetchId.current) return;
        const msg = (err && (err.message || (err.response && err.response.statusText))) || 'Failed to load shows';
        setError(msg);
        // leave movies empty so demo message appears in UI
      })
      .finally(() => {
        if (!mounted || id !== fetchId.current) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
  const moviesFiltered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!filters || !filters.name) return movies;
    if (!q) return movies;
    return movies.filter((m) => (m.title || '').toLowerCase().includes(q));
  }, [movies, query, filters]);

  // Server-backed search: when name filter is enabled, debounce queries to the backend
  useEffect(() => {
    if (!filters || !filters.name) return; // only search by name when enabled
    const q = (query || '').trim();
    // if empty query, don't call server — we already have the full list
    if (!q) return;

    let mounted = true;
    const id = ++fetchId.current;
    setLoading(true);
    const timer = setTimeout(() => {
      bookingApi.getMovies({ q })
        .then((res) => {
          if (!mounted || id !== fetchId.current) return;
          const payload = res && res.data ? (res.data.content || res.data) : [];
          setMovies(payload || []);
        })
        .catch((err) => {
          if (!mounted || id !== fetchId.current) return;
          const msg = (err && (err.message || (err.response && err.response.statusText))) || 'Search failed';
          setError(msg);
        })
        .finally(() => {
          if (!mounted || id !== fetchId.current) return;
          setLoading(false);
        });
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [query, filters]);

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
