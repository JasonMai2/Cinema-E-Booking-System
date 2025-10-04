import React, { useEffect, useState } from 'react';
import bookingApi from '../services/bookingApi';
import ShowList from '../components/ShowList';

export default function ShowTimes() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    bookingApi
      .getMovies()
      .then((res) => {
        if (mounted) setMovies(res.data || []);
      })
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  if (loading) return <div>Loading shows...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Show Times</h2>
      <ShowList movies={movies} />
    </div>
  );
}
