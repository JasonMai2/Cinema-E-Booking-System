// frontend/src/components/TrendingMovies.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function TrendingMovies({ limit = 3 }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/movies?page=0&size=${limit}`)
      .then(res => {
        const content = res.data && res.data.content ? res.data.content : res.data;
        setMovies(content || []);
      })
      .catch(err => {
        console.error("failed to fetch trending movies", err);
        setMovies([]);
      })
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) return <div>Loading trending movies…</div>;
  if (!movies.length) return <div>No trending movies available</div>;

  return (
    <section className="trending-movies">
      <h2>Trending Now</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {movies.map(m => (
          <div key={m.id} style={{ width: 240, textAlign: "center" }}>
            <a href={`/movies/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img
                src={m.trailer_image_url || "/placeholder-poster.png"}
                alt={m.title}
                style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 8 }}
              />
              <div style={{ marginTop: 8 }}>
                <strong>{m.title}</strong>
                <div style={{ fontSize: 12, color: "#666" }}>{m.mpaa_rating}</div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
