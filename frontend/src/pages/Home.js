// frontend/src/pages/Home.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import MovieCard from "../components/MovieCard";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/movies")
      .then((res) => {
        setMovies(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load movies:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Simple split: show first half as currently running and rest as upcoming
  const mid = Math.ceil(movies.length / 2);
  const running = movies.slice(0, mid);
  const upcoming = movies.slice(mid);

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to Cinema E-Booking</h1>

      <section style={{ marginTop: 18 }}>
        <h2>Currently Running</h2>
        {loading ? (
          <p>Loading movies…</p>
        ) : running.length === 0 ? (
          <p>No movies available yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            {running.map(m => (
              <MovieCard key={m.id} movie={m} compact />
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Upcoming</h2>
        {loading ? (
          <p>Loading movies…</p>
        ) : upcoming.length === 0 ? (
          <p>No upcoming movies at this time.</p>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            {upcoming.map(m => (
              <MovieCard key={m.id} movie={m} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
