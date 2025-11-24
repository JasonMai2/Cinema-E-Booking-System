import React, { useEffect, useState } from "react";
import UserModal from "./UserModal";
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8080/api";

export default function AdminUsers({ onBack }) {
  const navigate = useNavigate();
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
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      alert("User deleted successfully");
      loadUsers();
    } catch (err) {
      console.error(err);
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
    });
    setShowUserModal(true);
  };

  const openAddUser = () => {
    setSelectedUser(null);
    setFormData({
      id: null,
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "REGISTERED",
      is_suspended: false,
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
    // Validate fields (adapted from Login.js registration)
    if (!formData.first_name || !formData.first_name.trim()) {
      alert("First name is required");
      return;
    }
    if (!formData.email || formData.email.trim() === "") {
      alert("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    const pw = formData.password?.trim() || "";
    const cpw = formData.confirmPassword?.trim() || "";

    if (!selectedUser) { // New user
      if (pw.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      if (pw !== cpw) {
        alert("Passwords do not match");
        return;
      }
    } else { // Existing user
      if ((pw || cpw) && (pw !== cpw || pw.length < 6)) {
        alert("Passwords must match and be at least 6 characters");
        return;
      }
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        is_suspended: formData.is_suspended,
      };
      if (pw) payload.password = pw;

      let res;
      if (selectedUser) {
        payload.id = formData.id;
        res = await fetch(`${API_BASE}/users/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `Failed to ${selectedUser ? "update" : "create"} user`);

      await loadUsers();
      alert(`User ${selectedUser ? "updated" : "created"} successfully`);
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
    <div className="container">
      <button className="backButton" onClick={() => navigate('/admin')}>
        ← Back to Dashboard
      </button>

      <div className="managementHeader">
        <h2 className="headerTitle">Manage Users</h2>
        <button className="btnSave" onClick={openAddUser}>
          + Add User
        </button>
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
    </div>
  );
}
