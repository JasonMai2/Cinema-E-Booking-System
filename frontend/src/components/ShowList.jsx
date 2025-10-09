import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// movies: array of movie objects { id, title, shows? }
export default function ShowList({ movies = [] }) {
  const navigate = useNavigate();

  function openShow(showId) {
    // perform a full navigation+reload so the UI fully refreshes for the selected show
    try {
      window.location.href = `/shows/${showId}/seats`;
    } catch (e) {
      // fallback to SPA navigation if window is not available
      navigate(`/shows/${showId}/seats`);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {movies.map((m) => (
        <div key={m.id} style={{ background: '#0b0d0f', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>{m.title}</div>
              <div style={{ color: '#cbd5da', fontSize: 13 }}>{m.synopsis}</div>
            </div>
            <div style={{ marginLeft: 12 }}>
              {!Array.isArray(m.shows) || m.shows.length === 0 ? (
                <Link to={`/movies/${m.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                  <button style={{ padding: '8px 12px', borderRadius: 6 }}>Details</button>
                </Link>
              ) : null}
            </div>
          </div>

          {Array.isArray(m.shows) && m.shows.length > 0 ? (
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {m.shows.map((s) => (
                <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ color: '#cbd5da', fontSize: 13 }}>{s.startTime ? new Date(s.startTime).toLocaleString() : (s.time || 'TBD')}</div>
                  <button onClick={() => openShow(s.id)} style={{ background: '#7a1f1f', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Book</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
