import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

export default function ShowList({ movies = [] }) {
  const navigate = useNavigate();
  const { setSelectedMovie, setSelectedShow } = useBooking();

  function onPickShow(movie, show) {
    setSelectedMovie(movie);
    setSelectedShow(show);
    navigate(`/shows/${show.id}/seats`);
  }

  return (
    <div>
      {movies.map((m) => (
        <div key={m.id} style={{ border: '1px solid #ddd', margin: 8, padding: 8 }}>
          <h3>{m.title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {(m.shows || []).map((s) => (
              <button key={s.id} onClick={() => onPickShow(m, s)}>
                {new Date(s.startTime).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
