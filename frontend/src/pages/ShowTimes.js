import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ShowList from '../components/ShowList.jsx';
import { useSearch } from '../context/SearchContext.js';
import bookingApi from '../services/bookingApi.js';

export default function ShowTimes() {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchId = useRef(0);

  useEffect(() => {
    // Fetch real movies and showtimes from backend
    setLoading(true);
    setError(null);
    const id = ++fetchId.current;
    
    if (movieId) {
      // Fetch shows for specific movie
      bookingApi.getShowsForMovie(movieId)
        .then((res) => {
          if (id !== fetchId.current) return;
          const shows = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.shows || res.data.content || [])) : [];
          // Fetch movie details
          return bookingApi.getMovie(movieId).then((movRes) => {
            if (id !== fetchId.current) return;
            const movieData = movRes && movRes.data && movRes.data.ok ? movRes.data.movie : null;
            if (movieData) {
              setMovies([{ ...movieData, shows }]);
            } else {
              setError('Movie not found');
              setMovies([]);
            }
          });
        })
        .catch((err) => {
          if (id !== fetchId.current) return;
          console.error('Failed to load shows:', err);
          setError(err.message || 'Failed to load shows');
          setMovies([]);
        })
        .finally(() => {
          if (id !== fetchId.current) return;
          setLoading(false);
        });
    } else {
      // Fetch all movies with showtimes
      bookingApi.getMovies()
        .then((res) => {
          if (id !== fetchId.current) return;
          const payload = res && res.data ? (res.data.content || res.data) : [];
          setMovies(payload || []);
        })
        .catch((err) => {
          if (id !== fetchId.current) return;
          console.error('Failed to load movies:', err);
          setError(err.message || 'Failed to load movies');
          setMovies([]);
        })
        .finally(() => {
          if (id !== fetchId.current) return;
          setLoading(false);
        });
    }
  }, [movieId]);

  function retry() {
    setError(null);
    setLoading(true);
    // Re-trigger the effect
    const id = ++fetchId.current;
    if (movieId) {
      bookingApi.getShowsForMovie(movieId)
        .then((res) => {
          if (id !== fetchId.current) return;
          const shows = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.shows || res.data.content || [])) : [];
          return bookingApi.getMovie(movieId).then((movRes) => {
            if (id !== fetchId.current) return;
            const movieData = movRes && movRes.data && movRes.data.ok ? movRes.data.movie : null;
            if (movieData) {
              setMovies([{ ...movieData, shows }]);
            }
          });
        })
        .catch((err) => {
          if (id !== fetchId.current) return;
          setError(err.message || 'Failed to load shows');
        })
        .finally(() => {
          if (id !== fetchId.current) return;
          setLoading(false);
        });
    } else {
      bookingApi.getMovies()
        .then((res) => {
          if (id !== fetchId.current) return;
          const payload = res && res.data ? (res.data.content || res.data) : [];
          setMovies(payload || []);
        })
        .catch((err) => {
          if (id !== fetchId.current) return;
          setError(err.message || 'Failed to load movies');
        })
        .finally(() => {
          if (id !== fetchId.current) return;
          setLoading(false);
        });
    }
  }

  // Apply client-side name filter using global search query and filters
  // But DON'T redirect if we're viewing a specific movie's showtimes
  const { query, filters } = useSearch();
  const navigate = useNavigate();
  const moviesFiltered = useMemo(() => {
    // If we have a movieId, we're viewing showtimes for a specific movie - don't filter or redirect
    if (movieId) {
      return movies;
    }
    
    const qRaw = (query || '').trim();
    // If name filter is active and a query exists, redirect user to /movies (search results)
    if (filters && filters.name && qRaw) {
      setTimeout(() => navigate('/movies'), 0);
      return movies;
    }
    const qLower = qRaw.toLowerCase();
    if (!filters || !filters.name) return movies;
    if (!qLower) return movies;
    return movies.filter((m) => (m.title || '').toLowerCase().includes(qLower));
  }, [movies, query, filters, navigate, movieId]);

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
            <div style={{ color: '#ff6b6b', marginBottom: 12 }}>{error}</div>
            <button onClick={retry} style={{ background: '#7a1f1f', color: '#fff', borderRadius: 6, padding: '8px 12px', border: 'none' }}>Retry</button>
          </div>
        ) : (
          <div>
            {moviesFiltered.length === 0 ? (
              <div style={{ color: '#cbd5da' }}>No shows available right now. Please check back later.</div>
            ) : (
              <ShowList movies={moviesFiltered} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}