import React, { useState } from "react";
import { Home, Search, Filter, User } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [showFilters, setShowFilters] = useState(false);
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();

  return (
    <>
      <header
        style={{
          padding: "10px 20px",
          backgroundColor: "#7d1b1d",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Home button with icon + site name */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
          }}
        >
          <Home size={22} style={{ marginRight: "8px" }} />
          Cinema E-Booking
        </a>

        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "5px 10px",
            flex: 1,
            maxWidth: "600px",
            margin: "0 20px",
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/search'); }}
            type="text"
            placeholder="Search movies..."
            style={{
              border: "none",
              outline: "none",
              flex: 1,
              padding: "5px",
              fontSize: "1rem",
            }}
          />
          {/* Search */}
          <Search
            size={20}
            color="#12151c"
            style={{ cursor: "pointer", marginRight: "12px" }}
            onClick={() => navigate('/search')}
          />
          {/* Filter */}
          <div
            onClick={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: "#12151c",
              borderRadius: "50%",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Filter size={18} color="#fff" />
          </div>
        </div>

        {/* Login button */}
        <div
          onClick={() => {}}
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#12151c",
            padding: "8px 16px",
            borderRadius: "8px",
            color: "#fff",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          Login
          <User size={20} style={{ marginLeft: "8px" }} />
        </div>
      </header>

      {/* Filter dropdown section */}
      {showFilters && (
        <div
          style={{
            backgroundColor: "#12151c",
            padding: "15px 20px",
            borderTop: "1px solid #333",
            color: "#f5f5f5",
            textAlign: "center",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>Filter Options</h4>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* Name filter (first option) */}
            <NameFilterCheckbox />
            <label>
              <input type="checkbox" /> Filter 2
            </label>
            <label>
              <input type="checkbox" /> Filter 3
            </label>
          </div>
        </div>
      )}
    </>
  );
}

function NameFilterCheckbox() {
  const { filters, toggleNameFilter, setQuery } = useSearch();

  function onChange() {
    // toggling off the name filter should clear the query to avoid confusion
    toggleNameFilter();
    if (filters && filters.name) {
      // it was enabled, now disabling -> clear query
      setQuery('');
    }
  }

  return (
    <label>
      <input type="checkbox" checked={!!(filters && filters.name)} onChange={onChange} /> Name
    </label>
  );
}
