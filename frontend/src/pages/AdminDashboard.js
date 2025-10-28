import React, { useEffect, useState } from "react";
import { Film, Users, Percent, X } from "lucide-react";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8080/api";

export default function AdminDashboard() {
  // Users state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "REGISTERED",
    is_suspended: false,
    payment_cards: [],
  });

  // Promotions state
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

  // --- Load screens ---
  useEffect(() => {
    const showScreen = (screen) => {
      const main = document.getElementById("mainScreen");
      const movies = document.getElementById("moviesScreen");
      const usersS = document.getElementById("usersScreen");
      const promos = document.getElementById("promotionsScreen");

      [main, movies, usersS, promos].forEach((s) => (s.style.display = "none"));
      if (screen === "main") main.style.display = "block";
      if (screen === "movies") movies.style.display = "block";
      if (screen === "users") {
        loadUsers();
        usersS.style.display = "block";
      }
      if (screen === "promotions") {
        loadPromotions();
        promos.style.display = "block";
      }
    };
    window.showScreen = showScreen;
    window.showScreen("main");
  }, []);

  // --- Users API ---
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error(`Load users failed: ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      alert("Failed to load users: " + err.message);
    }
  };

  const deleteUser = async (id) => {
    console.log("deleteUser called with id:", id);
    console.log("Confirmed deletion");
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
      console.log("Response:", res);
      if (!res.ok) throw new Error("Failed to delete user");
      alert("User deleted successfully");
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.message);
    }
  };

  const openManageUser = (user) => {
    setSelectedUser(user);
    setFormData({
      id: user.id,
      email: user.email || "",
      password: "",
      confirmPassword: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      role: user.role || "REGISTERED",
      is_suspended: user.is_suspended || false,
      payment_cards: user.payment_cards || [],
    });
    setShowUserModal(true);
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUserSubmit = async () => {
    if (!formData.email || formData.email.trim() === "") {
      alert("Email is required");
      return;
    }

    const pw = formData.password?.trim() || "";
    const cpw = formData.confirmPassword?.trim() || "";
    if ((pw !== "" || cpw !== "") && (pw !== cpw || pw.length < 6)) {
      alert("Passwords must match and be at least 6 characters");
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        id: formData.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        is_suspended: formData.is_suspended,
      };
      if (pw) payload.password = pw;

      const res = await fetch(`${API_BASE}/users/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update user");

      await loadUsers();
      alert("User updated successfully");
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Save failed: " + err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // --- Promotions API ---
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
        discount: p.percent_off != null ? p.percent_off : p.flat_off_cents != null ? p.flat_off_cents / 100 : "",
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
        percent_off: promoFormData.discountType === "PERCENT" ? Number(promoFormData.discount) : null,
        flat_off_cents: promoFormData.discountType === "FLAT" ? Math.round(Number(promoFormData.discount) * 100) : null,
        starts_at: promoFormData.startDate + " 00:00:00",
        ends_at: promoFormData.endDate + " 23:59:59",
        active: true,
      };

      if (selectedPromotion) {
        const res = await fetch(`${API_BASE}/promotions/${selectedPromotion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to update promotion");
      } else {
        const res = await fetch(`${API_BASE}/promotions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to create promotion");
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
      const res = await fetch(`${API_BASE}/promotions/${id}`, { method: "DELETE" });
      console.log("Response:", res);

      if (!res.ok) throw new Error("Failed to delete promotion");

      alert("Promotion deleted successfully");
      await loadPromotions();
    } catch (err) {
      console.error("Error deleting promotion:", err);
      alert("Failed to delete promotion: " + err.message);
    }
  };

    // --- Subscribed Users API ---
  const logSubscribedUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/subscribed-users`);
      if (!res.ok) throw new Error("Failed to fetch subscribed users");
      const data = await res.json();

      const userIds = data.map((u) => u.id);
      console.log("Subscribed User IDs:", userIds);

      alert(`Logged ${userIds.length} subscribed user IDs to console.`);
    } catch (err) {
      console.error("Error fetching subscribed users:", err);
      alert("Failed to fetch subscribed users: " + err.message);
    }
  };

  // --- Render ---
  return (
    <div className="body">
      <div className="header">
        <h1 className="headerTitle">Cinema Admin Dashboard</h1>
      </div>

      <div className="container">
        {/* Main Dashboard Screen */}
        <div id="mainScreen">
          <div className="adminCards">
            <div className="adminCard" onClick={() => window.showScreen("movies")}>
              <div className="adminCardIcon"><Film className="iconStyle" /></div>
              <h2 className="adminCardTitle">Manage<br />Movies</h2>
            </div>

            <div className="adminCard" onClick={() => window.showScreen("users")}>
              <div className="adminCardIcon"><Users className="iconStyle" /></div>
              <h2 className="adminCardTitle">Manage<br />Users</h2>
            </div>

            <div className="adminCard" onClick={() => window.showScreen("promotions")}>
              <div className="adminCardIcon"><Percent className="iconStyle" /></div>
              <h2 className="adminCardTitle">Manage<br />Promotions</h2>
            </div>
          </div>
        </div>

        {/* Users Screen */}
        <div id="usersScreen" style={{ display: "none" }}>
          <button className="backButton" onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <h2 className="headerTitle">Manage Users</h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="itemCardDetailed">
                <div>
                  <h3 className="itemInfoTitle">{u.first_name} {u.last_name}</h3>
                  <p className="itemInfoSubtitle">
                    {u.email} • Role: {u.role || "N/A"} • Status: {u.is_suspended ? "Suspended" : "Active"} • Created: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="itemActions">
                  <button className="btnManage" onClick={() => openManageUser(u)}>Manage</button>
                  <button className="btnDelete" onClick={() => deleteUser(u.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Movies Screen */}
        <div id="moviesScreen" style={{ display: "none" }}>
          <button className="backButton" onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <h2 className="headerTitle">Manage Movies (Coming Soon)</h2>
        </div>

        {/* Promotions Screen */}
        <div id="promotionsScreen" style={{ display: "none" }}>
          <button className="backButton" onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <div className="managementHeader">
            <h2 className="headerTitle">Manage Promotions</h2>
            <button
              className="btnSave"
              onClick={() => {
                setSelectedPromotion(null);
                setPromoFormData({ title: "", description: "", discountType: "PERCENT", discount: "", startDate: "", endDate: "" });
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
                    Description: {p.description} • Discount: {p.discountType === "PERCENT" ? `${p.discount}%` : `$${p.discount}`} • Start: {p.startDate} • End: {p.endDate}
                  </p>
                </div>
                <div className="itemActions">
                  <button className="btnManage" onClick={() => openManagePromotion(p)}>Manage</button>
                  <button
  className="btnManage"
  onClick={async () => {
    if (!window.confirm(`Send promotion "${p.title}" to all subscribed users?`)) return;

    try {
      const res = await fetch(`${API_BASE}/send-promotion/${p.id}`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to send promotion");

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
  }}
>
  Send Promotion
</button>

                  <button className="btnDelete" onClick={() => deletePromotion(p.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          formData={formData}
          handleInputChange={handleUserInputChange}
          handleSubmit={handleUserSubmit}
          loading={loadingSubmit}
          close={() => setShowUserModal(false)}
        />
      )}

      {/* Promotion Modal */}
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

// --- User Modal ---
function UserModal({ formData, handleInputChange, handleSubmit, loading, close }) {
  return (
    <div className="modalOverlay" onClick={close}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">Manage User</h2>
          <button className="closeButton" onClick={close}><X size={24} /></button>
        </div>
        <div>
          <div className="formRow">
            <div className="formGroup">
              <label className="label">First Name</label>
              <input className="input" type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="First Name"/>
            </div>
            <div className="formGroup">
              <label className="label">Last Name</label>
              <input className="input" type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Last Name" />
            </div>
          </div>
          <div className="formGroup">
            <label className="label">Email</label>
            <input className="input" type="email" name="email" value={formData.email} readOnly />
          </div>
          <div className="formGroup">
            <label className="label">New Password</label>
            <input className="input" type="password" name="password" value={formData.password} onChange={handleInputChange} style={{ marginBottom: "10px" }} placeholder="New password" />
            <input className="input" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm new password" />
          </div>
          <div className="formGroup">
            <label className="label">Phone Number</label>
            <input className="input" type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" />
          </div>
          <div className="formGroup">
            <label className="label">Role</label>
            <select className="input" name="role" value={formData.role} onChange={handleInputChange}>
              <option value="REGISTERED">Registered</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="formGroup">
            <label className="label">
              <input type="checkbox" name="is_suspended" checked={formData.is_suspended} onChange={handleInputChange} />
              Suspended
            </label>
          </div>
          <button className="btnSave" onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// --- Promotion Modal ---
function PromotionModal({ promoFormData, handleInputChange, handleSave, close }) {
  return (
    <div className="modalOverlay" onClick={close}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">{promoFormData.id ? "Manage Promotion" : "Add Promotion"}</h2>
          <button className="closeButton" onClick={close}><X size={24} /></button>
        </div>
        <div>
          <div className="formGroup">
            <label className="label">Title</label>
            <input className="input" type="text" name="title" value={promoFormData.title} onChange={handleInputChange} />
          </div>
          <div className="formGroup">
            <label className="label">Description</label>
            <textarea className="input" name="description" value={promoFormData.description} onChange={handleInputChange} />
          </div>
          <div className="formRow">
            <div className="formGroup">
              <label className="label">Discount Type</label>
              <select className="input" name="discountType" value={promoFormData.discountType} onChange={handleInputChange}>
                <option value="PERCENT">Percent (%)</option>
                <option value="FLAT">Flat ($)</option>
              </select>
            </div>
            <div className="formGroup">
              <label className="label">Discount Value</label>
              <input className="input" type="number" name="discount" value={promoFormData.discount} onChange={handleInputChange} />
            </div>
          </div>
          <div className="formRow">
            <div className="formGroup">
              <label className="label">Start Date</label>
              <input className="input" type="date" name="startDate" value={promoFormData.startDate} onChange={handleInputChange} />
            </div>
            <div className="formGroup">
              <label className="label">End Date</label>
              <input className="input" type="date" name="endDate" value={promoFormData.endDate} onChange={handleInputChange} />
            </div>
          </div>
          <button className="btnSave" onClick={handleSave}>Save Promotion</button>
        </div>
      </div>
    </div>
  );
}
