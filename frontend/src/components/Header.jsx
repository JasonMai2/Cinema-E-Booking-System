import { Filter, Home, Search, User } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from "../context/SearchContext.js";
import ConfirmationModal from './ConfirmationModal';

export default function Header() {
  const [showFilters, setShowFilters] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { query, setQuery } = useSearch();
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

  useEffect(() => {
    console.log("Header loaded");
  }, []);

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
                e.currentTarget.style.backgroundColor = "#1a1f2a";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#12151c";
                e.currentTarget.style.transform = "scale(1)";
              }}
              onClick={() => { navigate('/profile/edit'); }}
            >
              {displayName}
              <User size={20} style={{ marginLeft: "8px" }} />
            </div>
            {/* Admin button - only show if user has ADMIN role */}
            {user.roles && user.roles.some(r => r.name === 'ADMIN') && (
              <button
                onClick={() => { navigate('/admin'); }}
                style={{
                  backgroundColor: "#b8860b",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#daa520";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#b8860b";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => { navigate('/order-history'); }}
              style={{
                backgroundColor: "#12151c",
                color: "#fff",
                border: "1px solid #12151c",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Order History
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutModal(true);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ff1a1a";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "#ff1a1a";
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 26, 26, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#12151c";
                e.currentTarget.style.borderColor = "#12151c";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
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
              alignItems: "center",
            }}
          >
            {/* Name filter */}
            <NameFilterCheckbox />
            {/* Category filter */}
            <CategoryFilterDropdown />
            {/* Date range filter */}
            <DateRangeFilter />
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
    <label style={{ cursor: "pointer" }}>
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
        const res = await fetch('http://localhost:8080/api/movies/categories');
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();

        if (mounted) {
          if (Array.isArray(data)) setCategories(data);
          else if (data.categories) setCategories(data.categories);
          else setCategories([]);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        if (mounted) setCategories([]);
      }
    };

    fetchCategories();
    return () => { mounted = false; };
  }, []);

  return (
    <select
      value={selectedCategory || ""}
      onChange={(e) => setSelectedCategory(e.target.value)}
      style={{ 
        padding: "6px 10px", 
        borderRadius: "6px", 
        cursor: "pointer",
        border: "1px solid #ccc"
      }}
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

function DateRangeFilter() {
  const { dateRange, setDateRange } = useSearch();

  const handleStartDateChange = (e) => {
    setDateRange(prev => ({ ...prev, startDate: e.target.value }));
  };

  const handleEndDateChange = (e) => {
    setDateRange(prev => ({ ...prev, endDate: e.target.value }));
  };

  const clearDates = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "0.9rem" }}>From:</span>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={handleStartDateChange}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "0.9rem" }}>To:</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={handleEndDateChange}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        />
      </label>
      {(dateRange.startDate || dateRange.endDate) && (
        <button
          onClick={clearDates}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "500",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}