// frontend/src/pages/MovieSelection.js
import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import bookingApi from "../services/bookingApi.js";
import { useSearch } from "../context/SearchContext.js";

export default function MovieSelection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { query, filters } = useSearch();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        // If name filter is active and a query is present, perform a search
        if (filters && filters.name && (query || '').trim()) {
          const q = (query || '').trim();
          const res = await bookingApi.getMovies({ q });
          const payload = res && res.data ? (res.data.content || res.data) : [];
          if (mounted) setMovies(payload || []);
        } else {
          // default: load all movies
          const res = await bookingApi.getMovies();
          const payload = res && res.data ? (res.data.content || res.data) : [];
          if (mounted) setMovies(payload || []);
        }
      } catch (err) {
        console.error("Error loading movies:", err);
        if (mounted) setError("Failed to load movies. Please try again later.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();

    return () => {
      mounted = false;
    };
  }, [query, filters]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Movie Selection</h1>

      {error && (
        <div style={{ padding: 12, background: "#fee", border: "1px solid #f99", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <p>Loading movies...</p>
      ) : movies.length === 0 ? (
        <p>No movies available.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}