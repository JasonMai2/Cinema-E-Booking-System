import React, { useEffect, useState } from "react";
import PromotionModal from "./PromotionModal";
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8080/api";

export default function AdminPromotions({ onBack }) {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [promoFormData, setPromoFormData] = useState({
    title: "",
    description: "",
    discountType: "PERCENT",
    discount: "",
    startDate: "",
    endDate: "",
  });
  const [loadingPromo, setLoadingPromo] = useState(false);
  
  // Promo codes state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedPromoForCode, setSelectedPromoForCode] = useState(null);
  const [newCode, setNewCode] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const res = await fetch(`${API_BASE}/promotions`);
      if (!res.ok) throw new Error("Failed to load promotions");
      const data = await res.json();
      
      // Load codes for each promotion
      const promotionsWithCodes = await Promise.all(
        data.map(async (p) => {
          try {
            const codeRes = await fetch(`${API_BASE}/promotions/${p.id}`);
            const codeData = await codeRes.json();
            return {
              id: p.id,
              title: p.name,
              description: p.description || "",
              discountType: p.percent_off != null ? "PERCENT" : "FLAT",
              discount:
                p.percent_off != null
                  ? p.percent_off
                  : p.flat_off_cents != null
                  ? p.flat_off_cents / 100
                  : "",
              startDate: p.starts_at.split("T")[0],
              endDate: p.ends_at.split("T")[0],
              active: p.active,
              codes: codeData.codes || []
            };
          } catch (err) {
            return {
              id: p.id,
              title: p.name,
              description: p.description || "",
              discountType: p.percent_off != null ? "PERCENT" : "FLAT",
              discount:
                p.percent_off != null
                  ? p.percent_off
                  : p.flat_off_cents != null
                  ? p.flat_off_cents / 100
                  : "",
              startDate: p.starts_at.split("T")[0],
              endDate: p.ends_at.split("T")[0],
              active: p.active,
              codes: []
            };
          }
        })
      );
      
      setPromotions(promotionsWithCodes);
    } catch (err) {
      console.error(err);
      alert("Failed to load promotions: " + err.message);
    }
  };

  const openManagePromotion = (promo) => {
    setSelectedPromotion(promo);
    setPromoFormData({ ...promo });
    setShowPromoModal(true);
  };

  const handlePromoInputChange = (e) => {
    const { name, value } = e.target;
    setPromoFormData((prev) => ({
      ...prev,
      [name]: name === "discount" ? Number(value) : value,
    }));
  };

  const handleSavePromotion = async () => {
    if (!promoFormData.title || promoFormData.discount === "") {
      alert("Title and discount are required");
      return;
    }

    setLoadingPromo(true);
    try {
      const payload = {
        name: promoFormData.title,
        description: promoFormData.description,
        percent_off:
          promoFormData.discountType === "PERCENT"
            ? Number(promoFormData.discount)
            : null,
        flat_off_cents:
          promoFormData.discountType === "FLAT"
            ? Math.round(Number(promoFormData.discount) * 100)
            : null,
        starts_at: promoFormData.startDate + " 00:00:00",
        ends_at: promoFormData.endDate + " 23:59:59",
        active: true,
      };

      if (selectedPromotion) {
        const res = await fetch(
          `${API_BASE}/promotions/${selectedPromotion.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const result = await res.json();
        if (!res.ok)
          throw new Error(result.error || "Failed to update promotion");
      } else {
        const res = await fetch(`${API_BASE}/promotions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok)
          throw new Error(result.error || "Failed to create promotion");
      }

      await loadPromotions();
      setShowPromoModal(false);
      setSelectedPromotion(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save promotion: " + err.message);
    } finally {
      setLoadingPromo(false);
    }
  };

  const deletePromotion = async (id) => {
    console.log("deletePromotion called with id:", id);
    console.log("Confirmed deletion");

    try {
      const res = await fetch(`${API_BASE}/promotions/${id}`, {
        method: "DELETE",
      });
      console.log("Response:", res);

      if (!res.ok) throw new Error("Failed to delete promotion");

      alert("Promotion deleted successfully");
      await loadPromotions();
    } catch (err) {
      console.error("Error deleting promotion:", err);
      alert("Failed to delete promotion: " + err.message);
    }
  };

  const sendPromotion = async (promo) => {
    if (!window.confirm(`Send promotion "${promo.title}" to all subscribed users?`))
      return;

    try {
      const res = await fetch(`${API_BASE}/send-promotion/${promo.id}`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok)
        throw new Error(result.message || "Failed to send promotion");

      if (result.status === "no_subscribers") {
        alert("No subscribed users found.");
      } else if (result.status === "success") {
        alert(`✅ Successfully sent promotion to ${result.sentCount} users.`);
      } else {
        alert(`⚠️ ${result.message}`);
      }

      console.log("Promotion Email Response:", result);
    } catch (err) {
      console.error("Error sending promotion:", err);
      alert("❌ Failed to send promotion: " + err.message);
    }
  };

  // Promo code functions
  const openAddCode = (promo) => {
    setSelectedPromoForCode(promo);
    setNewCode("");
    setMaxRedemptions("");
    setShowCodeModal(true);
  };

  const handleAddCode = async () => {
    if (!newCode.trim()) {
      alert("Please enter a promo code");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/promotions/${selectedPromoForCode.id}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add code");

      alert("Promo code added successfully");
      setShowCodeModal(false);
      await loadPromotions();
    } catch (err) {
      console.error(err);
      alert("Failed to add promo code: " + err.message);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if (!window.confirm("Delete this promo code?")) return;

    try {
      const res = await fetch(`${API_BASE}/promotions/codes/${codeId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete code");

      alert("Code deleted successfully");
      await loadPromotions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete code: " + err.message);
    }
  };

  return (
    <div className="container">
        <button className="backButton" onClick={() => navigate('/admin') }>
          ← Back to Dashboard
        </button>

        <div className="managementHeader">
          <h2 className="headerTitle">Manage Promotions</h2>
          <button
            className="btnSave"
            onClick={() => {
              setSelectedPromotion(null);
              setPromoFormData({
                title: "",
                description: "",
                discountType: "PERCENT",
                discount: "",
                startDate: "",
                endDate: "",
              });
              setShowPromoModal(true);
            }}
          >
            + Add Promotion
          </button>
        </div>

        {promotions.length === 0 ? (
          <p>No promotions found.</p>
        ) : (
          promotions.map((p) => (
            <div key={p.id} className="itemCardDetailed" style={{ marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <h3 className="itemInfoTitle">{p.title}</h3>
                <p className="itemInfoSubtitle">
                  Description: {p.description} • Discount:{" "}
                  {p.discountType === "PERCENT"
                    ? `${p.discount}%`
                    : `$${p.discount}`}{" "}
                  • Start: {p.startDate} • End: {p.endDate}
                  {p.active === false && " • INACTIVE"}
                </p>
                
                {/* Display promo codes */}
                <div style={{ marginTop: 8 }}>
                  <strong style={{ color: '#cbd5da', fontSize: 14 }}>Promo Codes:</strong>
                  {p.codes && p.codes.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {p.codes.map((code) => (
                        <span key={code.id} style={{
                          background: '#1a1f24',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          color: '#4ade80',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <code>{code.code}</code>
                          {code.max_redemptions && (
                            <span style={{ color: '#888' }}>
                              ({code.redeemed_count || 0}/{code.max_redemptions})
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ff6b6b',
                              cursor: 'pointer',
                              padding: '0 4px',
                              fontSize: 14
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>No codes - add one to enable this promotion</span>
                  )}
                </div>
              </div>

              <div className="itemActions" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="btnManage" onClick={() => openManagePromotion(p)}>
                  Edit
                </button>
                <button className="btnManage" onClick={() => openAddCode(p)} style={{ background: '#336' }}>
                  + Add Code
                </button>
                <button className="btnManage" onClick={() => sendPromotion(p)}>
                  Send Email
                </button>
                <button className="btnDelete" onClick={() => deletePromotion(p.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {showPromoModal && (
          <PromotionModal
            promoFormData={promoFormData}
            handleInputChange={handlePromoInputChange}
            handleSave={handleSavePromotion}
            close={() => setShowPromoModal(false)}
          />
        )}

        {/* Add Code Modal */}
        {showCodeModal && (
          <div className="modalOverlay" onClick={() => setShowCodeModal(false)}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modalHeader">
                <h2 className="modalTitle">Add Promo Code</h2>
                <button className="closeButton" onClick={() => setShowCodeModal(false)}>×</button>
              </div>
              <p style={{ color: '#888', marginBottom: 16 }}>
                Adding code for: <strong>{selectedPromoForCode?.title}</strong>
              </p>
              <div className="formGroup">
                <label className="label">Code *</label>
                <input
                  className="input"
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER20"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="formGroup">
                <label className="label">Max Redemptions (optional)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <button className="btnSave" onClick={handleAddCode}>
                Add Code
              </button>
            </div>
          </div>
        )}
    </div>
  );
}