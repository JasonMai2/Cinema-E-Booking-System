import React, { useEffect, useState } from "react";
import { Film, Users, Percent, X } from "lucide-react";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8080/api";

const styles = {
  body: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#252933",
    color: "#f5f5f5",
  },
  header: {
    backgroundColor: "#661b1c",
    padding: "20px 40px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: 600,
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  adminCards: {
    display: "flex",
    gap: "30px",
    justifyContent: "center",
    marginBottom: "60px",
    flexWrap: "wrap",
  },
  adminCard: {
    backgroundColor: "#12151c",
    width: "280px",
    height: "360px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "3px solid transparent",
  },
  adminCardIcon: {
    width: "120px",
    height: "120px",
    backgroundColor: "#661b1c",
    borderRadius: "50%",
    marginBottom: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconStyle: {
    color: "#f5f5f5",
    width: "60px",
    height: "60px",
  },
  adminCardTitle: {
    fontSize: "24px",
    textAlign: "center",
    fontWeight: 500,
    padding: "0 20px",
  },
  backButton: {
    backgroundColor: "#661b1c",
    color: "#f5f5f5",
    border: "none",
    padding: "12px 30px",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "30px",
    transition: "all 0.3s ease",
  },
  managementHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  itemCardDetailed: {
    backgroundColor: "#12151c",
    padding: "25px",
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfoTitle: {
    fontSize: "20px",
    marginBottom: "8px",
  },
  itemInfoSubtitle: {
    color: "#b0b0b0",
    fontSize: "14px",
  },
  itemActions: {
    display: "flex",
    gap: "10px",
  },
  btnEdit: {
    padding: "8px 20px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    backgroundColor: "#661b1c",
    color: "#f5f5f5",
    transition: "all 0.3s ease",
  },
  btnDelete: {
    padding: "8px 20px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    backgroundColor: "#3a3a3a",
    color: "#f5f5f5",
    transition: "all 0.3s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#12151c",
    padding: "40px",
    borderRadius: "8px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "2px solid #661b1c",
    paddingBottom: "15px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#f5f5f5",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#f5f5f5",
    cursor: "pointer",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#f5f5f5",
  },
  input: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#252933",
    border: "1px solid #3a3a3a",
    borderRadius: "4px",
    color: "#f5f5f5",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#252933",
    border: "1px solid #3a3a3a",
    borderRadius: "4px",
    color: "#f5f5f5",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  modalActions: {
    display: "flex",
    gap: "15px",
    justifyContent: "flex-end",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #3a3a3a",
  },
  btnCancel: {
    padding: "12px 30px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    backgroundColor: "#3a3a3a",
    color: "#f5f5f5",
    borderRadius: "4px",
    transition: "all 0.3s ease",
  },
  btnSave: {
    padding: "12px 30px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    backgroundColor: "#661b1c",
    color: "#f5f5f5",
    borderRadius: "4px",
    transition: "all 0.3s ease",
  },
};

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

    // password update check
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
        role: formData.role
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
        try {
          const resRole = await fetch(`${API_BASE}/users/${formData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: formData.role }),
          });
          if (!resRole.ok) console.warn("Role update may have failed:", await resRole.text());
        } catch (err) {
          console.warn("Role patch request failed:", err);
        }
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
    <div style={styles.body}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Cinema Admin Dashboard</h1>
      </div>

      <div style={styles.container}>
        <div id="mainScreen">
          <div style={styles.adminCards}>
            <div style={styles.adminCard} onClick={() => window.showScreen("movies")}>
              <div style={styles.adminCardIcon}><Film style={styles.iconStyle} /></div>
              <h2 style={styles.adminCardTitle}>Manage<br />Movies</h2>
            </div>

            <div style={styles.adminCard} onClick={() => window.showScreen("users")}>
              <div style={styles.adminCardIcon}><Users style={styles.iconStyle} /></div>
              <h2 style={styles.adminCardTitle}>Manage<br />Users</h2>
            </div>

            <div style={styles.adminCard} onClick={() => window.showScreen("promotions")}>
              <div style={styles.adminCardIcon}><Percent style={styles.iconStyle} /></div>
              <h2 style={styles.adminCardTitle}>Manage<br />Promotions</h2>
            </div>
          </div>
        </div>

        <div id="usersScreen" style={{ display: "none" }}>
          <button style={styles.backButton} onClick={() => window.showScreen("main")}>← Back to Dashboard</button>

          <div style={styles.managementHeader}>
            <h2 style={{ fontSize: "28px" }}>Manage Users</h2>
            {/* Add User button removed */}
          </div>

          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} style={styles.itemCardDetailed}>
                <div>
                  <h3 style={styles.itemInfoTitle}>
                    {u.first_name} {u.last_name} {u.is_suspended ? "(Suspended)" : ""}
                  </h3>
                  <p style={styles.itemInfoSubtitle}>
                    {u.email} • Role: {u.role || "N/A"} • Created: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={styles.itemActions}>
                  <button style={styles.btnEdit} onClick={() => openEditModal(u)}>Edit</button>
                  <button style={styles.btnDelete} onClick={() => deleteUser(u.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div id="moviesScreen" style={{ display: "none" }}>
          <button style={styles.backButton} onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <h2 style={{ fontSize: "28px" }}>Manage Movies (Coming Soon)</h2>
        </div>

        <div id="promotionsScreen" style={{ display: "none" }}>
          <button style={styles.backButton} onClick={() => window.showScreen("main")}>← Back to Dashboard</button>
          <h2 style={{ fontSize: "28px" }}>Manage Promotions (Coming Soon)</h2>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit User</h2>
              <button style={styles.closeButton} onClick={closeModal}><X size={24} /></button>
            </div>

            <div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input style={styles.input} type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input style={styles.input} type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Last Mame"/>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" name="email" value={formData.email} readOnly />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input style={{ ...styles.input, marginBottom: "10px" }} type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="New password" />
                <input style={styles.input} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm new password" />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input style={styles.input} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number"/>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select style={styles.select} name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button style={styles.btnCancel} onClick={closeModal}>Cancel</button>
                <button style={styles.btnSave} onClick={handleSubmit} disabled={loadingSubmit}>{loadingSubmit ? "Saving..." : "Update User"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
