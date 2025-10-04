import React from 'react';

export default function SeatMap({ seats = [], selectedSeatIds = [], onToggleSeat }) {
  // seats: array of { id, row, number, status, price }
  const rows = {};
  seats.forEach((s) => {
    rows[s.row] = rows[s.row] || [];
    rows[s.row].push(s);
  });

  return (
    <div>
      {Object.keys(rows)
        .sort()
        .map((r) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ width: 24, textAlign: 'center' }}>{r}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {rows[r].map((s) => {
                const isSelected = selectedSeatIds.includes(s.id);
                const disabled = s.status !== 'available';
                const bg = disabled ? '#e0e0e0' : isSelected ? '#4ea' : '#fff';
                return (
                  <button
                    key={s.id}
                    onClick={() => !disabled && onToggleSeat(s)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    title={`${r}${s.number} — ${s.price != null ? `$${s.price.toFixed(2)}` : '—'}`}
                    style={{
                      minWidth: 40,
                      height: 32,
                      background: bg,
                      border: '1px solid #333',
                      borderRadius: 4,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {s.number}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
