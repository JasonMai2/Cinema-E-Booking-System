import React, { useEffect, useState } from "react";
import { Film, Users, Percent, Ticket } from "lucide-react";
import AdminUsers from "./AdminUsers";
import AdminPromotions from "./AdminPromotions";
import { useNavigate } from 'react-router-dom';

import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [currentScreen, setCurrentScreen] = useState("main");

  const showScreen = (screen) => {
    setCurrentScreen(screen);
  };

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    // You may want to add additional admin role check here
    // if (user.role !== 'ADMIN') {
    //   navigate('/');
    //   return;
    // }
  }, [user, navigate]);

  // Users state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Redirect to login if user is not authenticated or not an admin
  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    // You may want to add additional admin role check here
    // if (user.role !== 'ADMIN') {
    //   navigate('/');
    //   return;
    // }
  }, [user, navigate]);

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

      // Add null checks to prevent errors
      [main, movies, usersS, promos].forEach((s) => {
        if (s) s.style.display = "none";
      });
      
      if (screen === "main" && main) main.style.display = "block";
      if (screen === "movies" && movies) movies.style.display = "block";
      if (screen === "users" && usersS) {
        loadUsers();
        usersS.style.display = "block";
      }
      if (screen === "promotions" && promos) {
        loadPromotions();
        promos.style.display = "block";
      }
    };
    window.showScreen = showScreen;
    
    // Delay the initial screen show to ensure DOM is ready
    setTimeout(() => {
      window.showScreen("main");
    }, 0);
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
        {currentScreen === "main" && (
          <div id="mainScreen">
            <div className="adminCards">
              <div className="adminCard" onClick={() => navigate('/admin/movies') }>
                <div className="adminCardIcon">
                  <Film className="iconStyle" />
                </div>
                <h2 className="adminCardTitle">
                  Manage
                  <br />
                  Movies
                </h2>
              </div>

              <div className="adminCard" onClick={() => navigate('/admin/users') }>
                <div className="adminCardIcon">
                  <Users className="iconStyle" />
                </div>
                <h2 className="adminCardTitle">
                  Manage
                  <br />
                  Users
                </h2>
              </div>

              <div className="adminCard" onClick={() => navigate('/admin/promotions') }>
                <div className="adminCardIcon">
                  <Percent className="iconStyle" />
                </div>
                <h2 className="adminCardTitle">
                  Manage
                  <br />
                  Promotions
                </h2>
              </div>

              {/* NEW: Ticket Prices Card */}
              <div className="adminCard" onClick={() => navigate('/admin/ticket') }>
                <div className="adminCardIcon">
                  <Ticket className="iconStyle" />
                </div>
                <h2 className="adminCardTitle">
                  Manage
                  <br />
                  Ticket Prices
                </h2>
              </div>

            </div>
          </div>
        )}

        {/* Movies Screen */}
        {currentScreen === "movies" && (
          <div id="moviesScreen">
            <button className="backButton" onClick={() => showScreen("main")}>
              ← Back to Dashboard
            </button>
            <h2 className="headerTitle">Manage Movies (Coming Soon)</h2>
          </div>
        )}

        {/* Users Screen */}
        {currentScreen === "users" && (
          <AdminUsers onBack={() => showScreen("main")} />
        )}

        {/* Promotions Screen */}
        {currentScreen === "promotions" && (
          <AdminPromotions onBack={() => showScreen("main")} />
        )}
      </div>
    </div>
  );
}
