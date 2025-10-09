import React from 'react';
import { Link } from 'react-router-dom';

export default function MovieCard({ movie, compact }) {
  if (!movie) return null;

  console.log(movie.title, movie.trailer_image_url, movie.id);
  
  return (
    <div style={{ background: '#1f2226', padding: 12, borderRadius: 6 }}>
      <h3 style={{ margin: '0 0 8px 0' }}>{movie.title}</h3>

      {/* Display trailer image if available */}
      {movie.trailer_image_url && (
        <img
          src={movie.trailer_image_url}
          alt={`${movie.title} trailer`}
          style={{ width: '100%', borderRadius: 6, marginBottom: 8 }}
        />
      )}


      {!compact && (
        <>
          <p style={{ margin: 0, color: '#cfcfcf' }}>{movie.synopsis}</p>
          <p style={{ marginTop: 8, fontSize: 12, color: '#9aa' }}>{movie.mpaa_rating}</p>
        </>
      )}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <Link to={`/movies/${movie.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
          <button style={{ padding: '6px 10px', borderRadius: 6 }}>Details</button>
        </Link>
        <button style={{ padding: '6px 10px', borderRadius: 6, background: '#7d1b1d', color: '#fff' }}>
          Book
        </button>
      </div>
    </div>
  );
}
