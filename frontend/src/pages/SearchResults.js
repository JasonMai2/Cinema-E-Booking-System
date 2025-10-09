import React, { useEffect, useRef, useState } from 'react';
import bookingApi from '../services/bookingApi.js';
import ShowList from '../components/ShowList.jsx';
import { useSearch } from '../context/SearchContext.js';

export default function SearchResults() {
  const { query, filters } = useSearch();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchId = useRef(0);

  useEffect(() => {
    if (!filters || !filters.name) return;
    const q = (query || '').trim();
    if (!q) {
      setMovies([]);
      return;
    }

    let mounted = true;
    const id = ++fetchId.current;
    setLoading(true);
    bookingApi
      .getMovies({ q })
      .then((res) => {
        if (!mounted || id !== fetchId.current) return;
        const payload = res && res.data ? (res.data.content || res.data) : [];
        setMovies(payload || []);
      })
      .catch((err) => {
        if (!mounted || id !== fetchId.current) return;
        setError(err.message || 'Search failed');
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [query, filters]);

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '720px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, color: '#fff' }}>Search Results</h1>
          <div style={{ color: '#cbd5da', marginTop: 6 }}>Results for: <strong>{query}</strong></div>
        </header>

        {loading ? (
          <div style={{ color: '#cbd5da' }}>Searching…</div>
        ) : error ? (
          <div style={{ color: '#ff6b6b' }}>Error: {error}</div>
        ) : movies.length === 0 ? (
          <div style={{ color: '#cbd5da' }}>No results for "{query}".</div>
        ) : (
          <ShowList movies={movies} />
        )}
      </div>
    </div>
  );
}
