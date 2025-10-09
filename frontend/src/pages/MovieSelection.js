import React, { useEffect, useMemo, useState, useRef } from 'react';
import api from '../services/api';
import bookingApi from '../services/bookingApi';
import MovieCard from '../components/MovieCard';
import { useSearch } from '../context/SearchContext';

export default function MovieSelection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchId = useRef(0);
  useEffect(() => {
    let mounted = true;
    const id = ++fetchId.current;
    api.get('/movies')
      .then(res => { if (mounted && id === fetchId.current) setMovies(res.data || []) })
      .catch(err => console.error('Failed to load movies:', err))
      .finally(() => { if (mounted && id === fetchId.current) setLoading(false) });
    return () => { mounted = false };
  }, []);

  const { query, filters } = useSearch();
  // Server-backed search: debounce calls to bookingApi.getMovies when name filter is enabled
  useEffect(() => {
    if (!filters || !filters.name) return;
    const q = (query || '').trim();
    if (!q) return; // keep local list when query is empty
    let mounted = true;
    const id = ++fetchId.current;
    setLoading(true);
    const t = setTimeout(() => {
      bookingApi.getMovies({ q }).then((res) => {
        if (!mounted || id !== fetchId.current) return;
        setMovies(res && res.data ? (res.data.content || res.data) : []);
      }).catch((err) => {
        if (!mounted || id !== fetchId.current) return;
        console.error('Search failed', err);
      }).finally(() => {
        if (!mounted || id !== fetchId.current) return;
        setLoading(false);
      });
    }, 300);
    return () => { mounted = false; clearTimeout(t); };
  }, [query, filters]);

  const moviesFiltered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!filters || !filters.name) return movies;
    if (!q) return movies;
    return movies.filter((m) => (m.title || '').toLowerCase().includes(q));
  }, [movies, query, filters]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Browse Movies</h1>
      {loading ? (
        <p>Loading movies…</p>
      ) : moviesFiltered.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {moviesFiltered.map(m => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}
