// frontend/src/pages/Home.js
import React, { useEffect, useState } from "react";
import api from "../services/api";

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

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to Cinema E-Booking</h1>
      {loading ? (
        <p>Loading movies…</p>
      ) : movies.length === 0 ? (
        <p>No movies available yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {movies.map((m) => (
            <div key={m.id} style={{ background: "#1f2226", padding: 12, borderRadius: 6 }}>
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
