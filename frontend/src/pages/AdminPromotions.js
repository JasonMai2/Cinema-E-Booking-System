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

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const res = await fetch(`${API_BASE}/promotions`);
      if (!res.ok) throw new Error("Failed to load promotions");
      const data = await res.json();
      const formatted = data.map((p) => ({
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
      }));
      setPromotions(formatted);
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
            <div key={p.id} className="itemCardDetailed">
              <div>
                <h3 className="itemInfoTitle">{p.title}</h3>
                <p className="itemInfoSubtitle">
                  Description: {p.description} • Discount:{" "}
                  {p.discountType === "PERCENT"
                    ? `${p.discount}%`
                    : `$${p.discount}`}{" "}
                  • Start: {p.startDate} • End: {p.endDate}
                </p>
              </div>

              <div className="itemActions">
                <button className="btnManage" onClick={() => openManagePromotion(p)}>
                  Manage
                </button>
                <button className="btnManage" onClick={() => sendPromotion(p)}>
                  Send Promotion
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
    </div>
  );
}