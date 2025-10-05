import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MovieCard from '../components/MovieCard';

export default function MovieSelection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies')
      .then(res => setMovies(res.data || []))
      .catch(err => console.error('Failed to load movies:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Browse Movies</h1>
      {loading ? (
        <p>Loading movies…</p>
      ) : movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {movies.map(m => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}
