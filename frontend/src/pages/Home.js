// frontend/src/pages/Home.js
import React, { useEffect, useState } from "react";

import MovieCard from "../components/MovieCard";
import TrendingMovies from "../components/TrendingMovies";
import api from "../services/api";

export default function Home() {
  const [nowPlaying, setNowPlaying] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Now Playing and Coming Soon movies
  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both endpoints in parallel
      const [nowPlayingRes, comingSoonRes] = await Promise.all([
        api.get("/movies/now-playing"),
        api.get("/movies/coming-soon")
      ]);
      
      setNowPlaying(nowPlayingRes?.data || []);
      setComingSoon(comingSoonRes?.data || []);
    } catch (err) {
      console.error("Failed to load movies:", err);
      if (err.response) {
        setError(`Server error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        setError(
          "Network error: no response from backend. If you're running frontend on localhost:3000 and backend on 8080 you may have a CORS issue. " +
            "Ensure backend allows requests from http://localhost:3000 or set REACT_APP_API_URL and restart the frontend."
        );
      } else {
        setError("Error: " + (err.message || "unknown"));
      }
      setNowPlaying([]);
      setComingSoon([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch movies on mount
    fetchMovies();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to Cinema E-Booking</h1>
      {error && (
        <div style={{ padding: 12, background: "#fee", border: "1px solid #f99", marginBottom: 12 }}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        <h2>Now Playing</h2>
        {loading ? (
          <p>Loading movies…</p>
        ) : nowPlaying.length === 0 ? (
          <p>No movies currently playing.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, 300px)", justifyContent: "start", }}>
            {nowPlaying.map((m) => (
              <MovieCard key={m.id} movie={m} compact />
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Coming Soon</h2>
        {loading ? (
          <p>Loading movies…</p>
        ) : comingSoon.length === 0 ? (
          <p>No upcoming movies at this time.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, 300px)", justifyContent: "start", }}>
            {comingSoon.map((m) => (
              <MovieCard key={m.id} movie={m} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
