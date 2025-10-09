import React from 'react';

// seats: [{ id, row, number, status, price }]
export default function SeatMap({ seats = [], selectedSeatIds = [], onToggleSeat = () => {} }) {
  if (!Array.isArray(seats)) return null;

  // Group seats by row for a simple grid
  const rows = seats.reduce((acc, seat) => {
    (acc[seat.row] = acc[seat.row] || []).push(seat);
    return acc;
  }, {});

  const sortedRows = Object.keys(rows).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sortedRows.map((row) => (
        <div key={row} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 24, color: '#cbd5da' }}>{row}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {rows[row]
              .sort((a, b) => (a.number || 0) - (b.number || 0))
              .map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const disabled = seat.status !== 'available';
                return (
                  <button
                    key={seat.id}
                    onClick={() => onToggleSeat(seat)}
                    disabled={disabled}
                    title={disabled ? seat.status : `Seat ${seat.row}${seat.number} - $${seat.price || 0}`}
                    style={{
                      width: 40,
                      height: 36,
                      borderRadius: 6,
                      border: '1px solid #222',
                      background: isSelected ? '#7a1f1f' : disabled ? '#2b2b2b' : '#0b0d0f',
                      color: isSelected ? '#fff' : '#cbd5da',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {seat.number}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
