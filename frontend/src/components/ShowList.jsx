import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// movies: array of movie objects { id, title, shows? }
export default function ShowList({ movies = [] }) {
  const navigate = useNavigate();

  function openShow(showId) {
    navigate(`/shows/${showId}/seats`);
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {movies.map((m) => (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff' }}>{m.title}</div>
            <div style={{ color: '#cbd5da', fontSize: 13 }}>{m.synopsis}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* If shows are provided, link to the first show's seats; otherwise link to movie details */}
            {Array.isArray(m.shows) && m.shows.length > 0 ? (
              <button onClick={() => openShow(m.shows[0].id)} style={{ background: '#7a1f1f', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>Book</button>
            ) : (
              <Link to={`/movies/${m.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                <button style={{ padding: '8px 12px', borderRadius: 6 }}>Details</button>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
