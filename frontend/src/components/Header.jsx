import { Filter, Home, Search, User } from "lucide-react";
import React, { useState, useEffect } from "react";

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSearch } from "../context/SearchContext.js";
import ConfirmationModal from './ConfirmationModal';
import bookingApi from "../services/bookingApi.js";

export default function Header() {
  const [showFilters, setShowFilters] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { query, setQuery, selectedCategory, setSelectedCategory } = useSearch();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user ? `${user.first_name || user.email}${user.last_name ? ' ' + user.last_name : ''}` : '';

  const handleLogoutConfirm = () => {
    logout();
    navigate('/');
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

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
            padding: "8px 12px",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.02)";
            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "none";
            e.target.style.backgroundColor = "transparent";
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
            onKeyDown={(e) => { if (e.key === 'Enter') { window.location.href = '/movies'; } }}
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
            onClick={() => { window.location.href = '/movies'; }}
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

        {/* Login / user area */}
        {user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#12151c",
                padding: "8px 12px",
                borderRadius: "8px",
                color: "#fff",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#1a1f2a";
                e.target.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#12151c";
                e.target.style.transform = "scale(1)";
              }}
              onClick={() => { navigate('/profile/edit'); }}
            >
              {displayName}
              <User size={20} style={{ marginLeft: "8px" }} />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutModal(true);
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#ff1a1a";
                e.target.style.color = "#fff";
                e.target.style.borderColor = "#ff1a1a";
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 0 15px rgba(255, 26, 26, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#12151c";
                e.target.style.borderColor = "#12151c";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }}
              style={{
                backgroundColor: "transparent",
                color: "#12151c",
                border: "1px solid #12151c",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div
            onClick={() => { navigate('/login'); }}
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
        )}
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
            <CategoryFilterDropdown />
            <label>
              <input type="checkbox" /> Filter 3
            </label>
          </div>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        confirmStyle="danger"
      />
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

function CategoryFilterDropdown() {
  const { selectedCategory, setSelectedCategory } = useSearch();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const res = await bookingApi.get('/movies/categories');
        const data = res.data;

        if (mounted) {
          if (Array.isArray(data)) setCategories(data);
          else if (data.categories) setCategories(data.categories);
          else setCategories([]);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      }
    };

    fetchCategories();
    return () => { mounted = false; };
  }, []);


  return (
    <select
      value={selectedCategory || ""}
      onChange={(e) => setSelectedCategory(e.target.value)}
      style={{ padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
