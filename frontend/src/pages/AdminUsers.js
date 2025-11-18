import React, { useEffect, useState } from "react";
import UserModal from "./UserModal";

const API_BASE = "http://localhost:8080/api";

export default function AdminUsers({ onBack }) {
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

  useEffect(() => {
    loadUsers();
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

  return (
    <>
      <button className="backButton" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <h2 className="headerTitle">Manage Users</h2>
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
                {u.email} • Role: {u.role || "N/A"} • Status:{" "}
                {u.is_suspended ? "Suspended" : "Active"} • Created:{" "}
                {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="itemActions">
              <button className="btnManage" onClick={() => openManageUser(u)}>
                Manage
              </button>
              <button className="btnDelete" onClick={() => deleteUser(u.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {showUserModal && (
        <UserModal
          formData={formData}
          handleInputChange={handleUserInputChange}
          handleSubmit={handleUserSubmit}
          loading={loadingSubmit}
          close={() => setShowUserModal(false)}
        />
      )}
    </>
  );
}