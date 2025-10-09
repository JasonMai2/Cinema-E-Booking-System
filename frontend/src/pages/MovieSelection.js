import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';
import { useSearch } from '../context/SearchContext';

export default function MovieSelection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies')
      .then(res => {
        const payload = res && res.data ? (res.data.content || res.data) : [];
        setMovies(payload || []);
      })
      .catch(err => console.error('Failed to load movies:', err))
      .finally(() => setLoading(false));
  }, []);

  const { query } = useSearch();
  const { filters } = useSearch();
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
