import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8080/api";

export default function AdminFees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Fee settings
  const [serviceFee, setServiceFee] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.roles || !user.roles.some(r => r.name === 'ADMIN')) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/fees`);
      if (!res.ok) throw new Error("Failed to load fee settings");
      const data = await res.json();
      
      // Service fee is stored in cents, convert to dollars for display
      setServiceFee(data.serviceFee ? (data.serviceFee / 100).toFixed(2) : "1.50");
      // Tax rate is stored as percentage (e.g., 8 for 8%)
      setTaxRate(data.taxRate ? data.taxRate.toString() : "8");
    } catch (err) {
      console.error("Error loading settings:", err);
      // Use defaults if API fails
      setServiceFee("1.50");
      setTaxRate("8");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    const feeValue = parseFloat(serviceFee);
    const taxValue = parseFloat(taxRate);
    
    if (isNaN(feeValue) || feeValue < 0) {
      setError("Service fee must be a valid positive number");
      return;
    }
    if (isNaN(taxValue) || taxValue < 0 || taxValue > 100) {
      setError("Tax rate must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/fees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceFeeCents: Math.round(feeValue * 100),
          taxRatePercent: taxValue
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save settings");
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="body">
        <div className="header">
          <h1 className="headerTitle">Manage Taxes & Fees</h1>
        </div>
        <div className="container">
          <p style={{ color: "#fff", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="body">
      <div className="header">
        <h1 className="headerTitle">Manage Taxes & Fees</h1>
      </div>

      <div className="container">
        <button 
          className="backButton" 
          onClick={() => navigate('/admin')}
          style={{ marginBottom: "20px" }}
        >
          ← Back to Dashboard
        </button>

        <div style={{
          backgroundColor: "#1a1a2e",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "500px",
          margin: "0 auto"
        }}>
          <h2 style={{ color: "#fff", marginBottom: "24px", textAlign: "center" }}>
            Fee Settings
          </h2>

          {error && (
            <div style={{
              backgroundColor: "#ff4444",
              color: "#fff",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: "#44aa44",
              color: "#fff",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              color: "#ccc", 
              marginBottom: "8px",
              fontSize: "14px"
            }}>
              Service Fee (per ticket)
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ 
                color: "#fff", 
                fontSize: "18px", 
                marginRight: "8px" 
              }}>$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  backgroundColor: "#12151c",
                  color: "#fff"
                }}
                placeholder="1.50"
              />
            </div>
            <p style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
              This fee is added per ticket purchased
            </p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label style={{ 
              display: "block", 
              color: "#ccc", 
              marginBottom: "8px",
              fontSize: "14px"
            }}>
              Sales Tax Rate
            </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  backgroundColor: "#12151c",
                  color: "#fff"
                }}
                placeholder="8"
              />
              <span style={{ 
                color: "#fff", 
                fontSize: "18px", 
                marginLeft: "8px" 
              }}>%</span>
            </div>
            <p style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
              Applied to subtotal + service fees after any discounts
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: saving ? "#555" : "#7d1b1d",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = "#9a2426";
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = "#7d1b1d";
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <div style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#12151c",
            borderRadius: "8px"
          }}>
            <h3 style={{ color: "#fff", marginBottom: "12px", fontSize: "14px" }}>
              Preview (2 Adult Tickets @ $15.00 each)
            </h3>
            <div style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.8" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>$30.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Service Fee ({serviceFee || 0} × 2):</span>
                <span>${(parseFloat(serviceFee || 0) * 2).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax ({taxRate || 0}%):</span>
                <span>${((30 + parseFloat(serviceFee || 0) * 2) * (parseFloat(taxRate || 0) / 100)).toFixed(2)}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                borderTop: "1px solid #333",
                paddingTop: "8px",
                marginTop: "8px",
                fontWeight: "bold",
                color: "#fff"
              }}>
                <span>Total:</span>
                <span>
                  ${(
                    30 + 
                    parseFloat(serviceFee || 0) * 2 + 
                    (30 + parseFloat(serviceFee || 0) * 2) * (parseFloat(taxRate || 0) / 100)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}