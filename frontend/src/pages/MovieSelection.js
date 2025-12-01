import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import bookingApi from "../services/bookingApi.js";
import { useSearch } from "../context/SearchContext.js";

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
        // If name filter is active and a query is present, perform a search
        const res = await bookingApi.getMovies();
        const payload = res && res.data ? (res.data.content || res.data) : [];
        let filteredMovies = payload || [];

        if (filters && filters.name && (query || '').trim()) {
          const q = (query || '').trim().toLowerCase();
          filteredMovies = filteredMovies.filter(movie =>
            movie.title.toLowerCase().includes(q)
          );
        }

        // Category filter
        if (selectedCategory) {
          filteredMovies = filteredMovies.filter(movie =>
            movie.categories.some(cat => cat.id === parseInt(selectedCategory))
          );
        }

        // Date range filter - filter by showtimes
        if (dateRange.startDate || dateRange.endDate) {
          filteredMovies = await filterByDateRange(filteredMovies, dateRange);
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

  // Helper function to filter movies by date range
  const filterByDateRange = async (movies, dateRange) => {
    try {
      // Fetch all showtimes
      const showtimesRes = await bookingApi.get('/bookings/movies');
      const showtimesData = showtimesRes.data;
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
      return movies.filter(movie => validMovieIds.has(movie.id));
    } catch (err) {
      console.error("Error filtering by date range:", err);
      // If there's an error fetching showtimes, return original movies
      return movies;
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