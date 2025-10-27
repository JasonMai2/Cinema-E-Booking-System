import React, { useEffect, useState } from "react";
import { Film, Users, Percent, X } from "lucide-react";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8080/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
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
      if (screen === "promotions") promos.style.display = "block";
    };
    window.showScreen = showScreen;
    window.showScreen("main");
  }, []);

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
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
      const result = await res.json();
      alert(result.message || result.status || JSON.stringify(result));
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user: " + err.message);
    }
  };

  const openEditModal = (user) => {
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
    setShowModal(true);
  };

  const closeModal = () => {
    if (loadingSubmit) return;
    setShowModal(false);
    setSelectedUser(null);
    setLoadingSubmit(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
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
      const profilePayload = {
        id: formData.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        is_suspended: formData.is_suspended,
      };
      if (pw) profilePayload.password = pw;

      const resProfile = await fetch(`${API_BASE}/users/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      const profileResult = await resProfile.json();
      if (!resProfile.ok) throw new Error(profileResult.message || JSON.stringify(profileResult));

      if (selectedUser && formData.role !== (selectedUser.role || "REGISTERED")) {
        const resRole = await fetch(`${API_BASE}/users/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: formData.role }),
        });
        if (!resRole.ok) console.warn("Role update may have failed:", await resRole.text());
      }

      await loadUsers();
      alert("User updated successfully");
      closeModal();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoadingSubmit(false);
    }
  };

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

        {/* Users Management Screen */}
        <div id="usersScreen" style={{ display: "none" }}>
          <button className="backButton" onClick={() => window.showScreen("main")}>← Back to Dashboard</button>

          <div className="managementHeader">
            <h2 className="headerTitle">Manage Users</h2>
          </div>

          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="itemCardDetailed">
                <div>
                  <h3 className="itemInfoTitle">
                    {u.first_name} {u.last_name}
                  </h3>
                  <p className="itemInfoSubtitle">
                    {u.email} • Role: {u.role || "N/A"} • Status: {u.is_suspended ? "Suspended" : "Active"} • Created: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="itemActions">
                  <button className="btnEdit" onClick={() => openEditModal(u)}>Edit</button>
                  <button className="btnDelete" onClick={() => deleteUser(u.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Movies Management Screen */}
        <div id="moviesScreen" style={{ display: "none" }}>
          <button className="backButton" onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <h2 className="headerTitle">Manage Movies (Coming Soon)</h2>
        </div>

        {/* Promotions Management Screen */}
        <div id="promotionsScreen" style={{ display: "none" }}>
          <button className="backButton" onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <h2 className="headerTitle">Manage Promotions (Coming Soon)</h2>
        </div>
      </div>

      {showModal && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Edit User</h2>
              <button className="closeButton" onClick={closeModal}><X size={24} /></button>
            </div>

            <div>
              <div className="formRow">
                <div className="formGroup">
                  <label className="label">First Name</label>
                  <input className="input" type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} />
                </div>
                <div className="formGroup">
                  <label className="label">Last Name</label>
                  <input className="input" type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Last Name"/>
                </div>
              </div>

              <div className="formGroup">
                <label className="label">Email</label>
                <input className="input" type="email" name="email" value={formData.email} readOnly />
              </div>

              <div className="formGroup">
                <label className="label">New Password</label>
                <input className="input" type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="New password" />
                <input className="input" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm new password" />
              </div>

              <div className="formGroup">
                <label className="label">Phone Number</label>
                <input className="input" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number"/>
              </div>

              <div className="formGroup">
                <label className="label">Role</label>
                <select className="select" name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="formGroup">
                <label className="label">Suspension Status</label>
                <select
                  className="select"
                  name="is_suspended"
                  value={formData.is_suspended ? "SUSPENDED" : "ACTIVE"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_suspended: e.target.value === "SUSPENDED",
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="modalActions">
                <button className="btnCancel" onClick={closeModal}>Cancel</button>
                <button className="btnSave" onClick={handleSubmit} disabled={loadingSubmit}>{loadingSubmit ? "Saving..." : "Update User"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
