import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import bookingApi from "../services/bookingApi.js";
import { useSearch } from "../context/SearchContext.js";

const API_BASE = "http://localhost:8080/api";

export default function MovieSelection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { query, filters, selectedCategory, dateRange } = useSearch();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        let filteredMovies = [];

        // If date range is active, use the showtimes endpoint
        if (dateRange.startDate || dateRange.endDate) {
          filteredMovies = await fetchMoviesWithShowtimes(dateRange);
        } else {
          // Otherwise, use the regular movies endpoint
          const res = await bookingApi.getMovies();
          const payload = res && res.data ? (res.data.content || res.data) : [];
          filteredMovies = payload || [];
        }

        // Apply name filter
        if (filters && filters.name && (query || '').trim()) {
          const q = (query || '').trim().toLowerCase();
          filteredMovies = filteredMovies.filter(movie =>
            movie.title.toLowerCase().includes(q)
          );
        }

        // Apply category filter
        if (selectedCategory) {
          filteredMovies = filteredMovies.filter(movie =>
            movie.categories && movie.categories.some(cat => cat.id === parseInt(selectedCategory))
          );
        }

        if (mounted) setMovies(filteredMovies || []);
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
  }, [query, filters, selectedCategory, dateRange]);

  // Helper function to fetch movies with showtimes in date range
  const fetchMoviesWithShowtimes = async (dateRange) => {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const url = `${API_BASE}/movies/with-showtimes${params.toString() ? '?' + params.toString() : ''}`;
      const res = await window.fetch(url);
      
      if (!res.ok) {
        throw new Error("Failed to fetch movies with showtimes");
      }
      
      const data = await res.json();
      return data.content || [];
    } catch (err) {
      console.error("Error fetching movies with showtimes:", err);
      // If the endpoint doesn't exist, fall back to the old method
      return await filterByDateRangeFallback(dateRange);
    }
  };

  // Fallback method using the existing bookings endpoint
  const filterByDateRangeFallback = async (dateRange) => {
    try {
      // First get all movies
      const res = await bookingApi.getMovies();
      const payload = res && res.data ? (res.data.content || res.data) : [];
      let allMovies = payload || [];

      // Fetch all showtimes
      const showtimesRes = await window.fetch(`${API_BASE}/bookings/movies`);
      const showtimesData = await showtimesRes.json();
      const moviesWithShowtimes = showtimesData.movies || [];

      // Create a set of movie IDs that have showtimes in the date range
      const validMovieIds = new Set();

      moviesWithShowtimes.forEach(movie => {
        const showtimes = movie.showtimes || [];
        
        showtimes.forEach(showtime => {
          const showtimeDate = new Date(showtime.starts_at);
          const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
          const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

          // Set end date to end of day if provided
          if (endDate) {
            endDate.setHours(23, 59, 59, 999);
          }

          let isInRange = true;

          if (startDate && showtimeDate < startDate) {
            isInRange = false;
          }

          if (endDate && showtimeDate > endDate) {
            isInRange = false;
          }

          if (isInRange) {
            validMovieIds.add(movie.id);
          }
        });
      });

      // Filter movies that have valid showtimes
      return allMovies.filter(movie => validMovieIds.has(movie.id));
    } catch (err) {
      console.error("Error filtering by date range:", err);
      // If there's an error, return empty array
      return [];
    }
  };

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
        <p>No movies available{(dateRange.startDate || dateRange.endDate) ? ' for the selected date range' : ''}.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, 300px)",
            justifyContent: "start",
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