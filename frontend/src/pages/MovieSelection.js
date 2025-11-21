// frontend/src/pages/MovieSelection.js
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MovieCard from "../components/MovieCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext.js";

export default function MovieSelection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { query, filters } = useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        // Load movies with showtimes for booking
        const res = await api.get('/bookings/movies');
        if (res.data.ok) {
          let moviesData = res.data.movies || [];
          
          // Apply search filter if active
          if (filters && filters.name && (query || '').trim()) {
            const q = (query || '').trim().toLowerCase();
            moviesData = moviesData.filter(movie => 
              movie.title.toLowerCase().includes(q) ||
              movie.genre.toLowerCase().includes(q) ||
              movie.description.toLowerCase().includes(q)
            );
          }
          
          if (mounted) setMovies(moviesData);
        } else {
          if (mounted) setError(res.data.message || "Failed to load movies");
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

  const selectShowtime = (movie, showtime) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          message: 'Please log in to book tickets',
          returnTo: '/movies' 
        }
      });
      return;
    }

    navigate('/seat-selection', {
      state: {
        movie,
        showtime,
        userId: user.id
      }
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return {
      date: date.toLocaleDateString('en-US', dateOptions),
      time: date.toLocaleTimeString('en-US', timeOptions)
    };
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Movie Selection</h1>

      {error && (
        <div style={{ padding: 12, background: "#fee", border: "1px solid #f99", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
          <button onClick={() => window.location.reload()} style={{ marginLeft: 12 }}>
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <div>Loading movies...</div>
        </div>
      ) : movies.length === 0 ? (
        <p>No movies available.</p>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: 24 
        }}>
          {movies.map(movie => (
            <div key={movie.id} style={{ 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              padding: 16,
              backgroundColor: "white"
            }}>
              <div style={{ marginBottom: 12 }}>
                {movie.poster_url ? (
                  <img 
                    src={movie.poster_url} 
                    alt={movie.title}
                    style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 4 }}
                  />
                ) : (
                  <div style={{ 
                    width: "100%", 
                    height: 200, 
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4
                  }}>
                    {movie.title}
                  </div>
                )}
              </div>
              
              <h3 style={{ marginBottom: 8 }}>{movie.title}</h3>
              <div style={{ marginBottom: 8, fontSize: 14, color: "#666" }}>
                <span>{movie.genre}</span> • 
                <span>{movie.rating}</span> • 
                <span>{formatDuration(movie.duration)}</span>
              </div>
              <p style={{ marginBottom: 16, fontSize: 14, lineHeight: 1.4 }}>
                {movie.description}
              </p>
              
              <div>
                <h4 style={{ marginBottom: 12 }}>Showtimes:</h4>
                {movie.showtimes && movie.showtimes.length > 0 ? (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                    gap: 8 
                  }}>
                    {movie.showtimes.map(showtime => {
                      const { date, time } = formatDateTime(showtime.show_time);
                      return (
                        <button
                          key={showtime.id}
                          onClick={() => selectShowtime(movie, showtime)}
                          style={{
                            padding: "12px 8px",
                            border: "1px solid #007bff",
                            borderRadius: 4,
                            backgroundColor: "white",
                            cursor: "pointer",
                            fontSize: 12,
                            textAlign: "center"
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>{date}</div>
                          <div>{time}</div>
                          <div style={{ marginTop: 4, fontSize: 11, color: "#666" }}>
                            {showtime.theater_name}
                          </div>
                          <div style={{ fontWeight: "bold", color: "#007bff" }}>
                            ${showtime.price}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 12, backgroundColor: "#f8f9fa", textAlign: "center" }}>
                    No showtimes available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}