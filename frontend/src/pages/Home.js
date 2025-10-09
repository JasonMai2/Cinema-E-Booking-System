// frontend/src/pages/Home.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import MovieCard from "../components/MovieCard";
import TrendingMovies from "../components/TrendingMovies";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // central fetch function
  const fetchMovies = async (opts = { page: 0, size: 12 }) => {
    setLoading(true);
    setError(null);
    try {
      // use axios params instead of concatenating query string
      const res = await api.get("/movies", { params: opts });
      const data = res?.data;
      // backend returns paginated { content: [...] } — fall back to array if present
      const content = Array.isArray(data) ? data : data?.content || [];
      setMovies(content);
    } catch (err) {
      // Helpful debug messages for common problems:
      // - err.response exists -> server returned non-2xx
      // - err.request exists but no response -> network / CORS / server not reachable
      // - otherwise it's a request setup error
      console.error("Failed to load movies:", err);
      if (err.response) {
        setError(`Server error: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        // likely network or CORS issue
        setError(
          "Network error: no response from backend. If you're running frontend on localhost:3000 and backend on 8080 you may have a CORS issue. " +
            "Ensure backend allows requests from http://localhost:3000 or set REACT_APP_API_URL and restart the frontend."
        );
      } else {
        setError("Error: " + (err.message || "unknown"));
      }
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch first page on mount
    fetchMovies({ page: 0, size: 12 });
    // no cleanup required here because we aren't using AbortController for axios in this simple flow;
    // if you want cancellation, we can add AbortController + axios cancel token.
  }, []);

  // Simple split: show first half as currently running and rest as upcoming
  const mid = Math.ceil(movies.length / 2);
  const running = movies.slice(0, mid);
  const upcoming = movies.slice(mid);

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to Cinema E-Booking</h1>
      {error && (
        <div style={{ padding: 12, background: "#fee", border: "1px solid #f99", marginBottom: 12 }}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        <h2>Currently Running</h2>
        {loading ? (
          <p>Loading movies…</p>
        ) : running.length === 0 ? (
          <p>No movies available yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {running.map((m) => (
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
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            {upcoming.map((m) => (
              <MovieCard key={m.id} movie={m} compact />
            ))}
          </div>
        )}
      </section>

      {/* Trending top-3 posters */}
      <TrendingMovies limit={3} />

      <hr style={{ margin: "20px 0" }} />
      <h2>All movies (debug list)</h2>

      {loading ? (
        <p>Loading movies…</p>
      ) : movies.length === 0 ? (
        <p>No movies available yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            marginTop: 16,
          }}
        >
          {movies.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#1f2226",
                padding: 12,
                borderRadius: 6,
                color: "#fff",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0" }}>{m.title}</h3>
              <p style={{ margin: 0, color: "#cfcfcf" }}>{m.synopsis}</p>
              <p style={{ marginTop: 8, fontSize: 12, color: "#9aa" }}>{m.mpaa_rating}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
