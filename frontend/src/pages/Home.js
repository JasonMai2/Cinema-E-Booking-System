// frontend/src/pages/Home.js
import React, { useEffect, useState } from "react";
import api from "../services/api";
import TrendingMovies from "../components/TrendingMovies";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/movies?page=0&size=12")
      .then((res) => {
        const data = res.data;
        // backend returns paginated { content: [...] }
        const content = Array.isArray(data) ? data : data?.content || [];
        setMovies(content);
      })
      .catch((err) => {
        console.error("Failed to load movies:", err);
        setMovies([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to Cinema E-Booking</h1>

      {/* Trending top-3 posters */}
      <TrendingMovies limit={3} />

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
