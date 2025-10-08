import React, { useEffect } from "react";
import { Film, Users, Percent } from "lucide-react"; // ✅ Added icons

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
  addButton: {
    backgroundColor: "#661b1c",
    color: "#f5f5f5",
    border: "none",
    padding: "12px 30px",
    fontSize: "16px",
    cursor: "pointer",
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
};

export default function AdminDashboard() {
  useEffect(() => {
    const showScreen = (screen) => {
      const main = document.getElementById("mainScreen");
      const movies = document.getElementById("moviesScreen");
      const users = document.getElementById("usersScreen");
      const promos = document.getElementById("promotionsScreen");

      [main, movies, users, promos].forEach((s) => (s.style.display = "none"));
      if (screen === "main") main.style.display = "block";
      if (screen === "movies") movies.style.display = "block";
      if (screen === "users") users.style.display = "block";
      if (screen === "promotions") promos.style.display = "block";
    };
    window.showScreen = showScreen;
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Cinema Admin Dashboard</h1>
      </div>

      <div style={styles.container}>
        {/* MAIN DASHBOARD */}
        <div id="mainScreen">
          <div style={styles.adminCards}>
            <div
              style={styles.adminCard}
              onClick={() => window.showScreen("movies")}
            >
              <div style={styles.adminCardIcon}>
                <Film style={styles.iconStyle} /> {/* 🎬 Movie Icon */}
              </div>
              <h2 style={styles.adminCardTitle}>
                Manage<br />Movies
              </h2>
            </div>

            <div
              style={styles.adminCard}
              onClick={() => window.showScreen("users")}
            >
              <div style={styles.adminCardIcon}>
                <Users style={styles.iconStyle} /> {/* 👤 Users Icon */}
              </div>
              <h2 style={styles.adminCardTitle}>
                Manage<br />Users
              </h2>
            </div>

            <div
              style={styles.adminCard}
              onClick={() => window.showScreen("promotions")}
            >
              <div style={styles.adminCardIcon}>
                <Percent style={styles.iconStyle} /> {/* 💰 Promotions Icon */}
              </div>
              <h2 style={styles.adminCardTitle}>
                Manage<br />Promotions
              </h2>
            </div>
          </div>
        </div>

        {/* MOVIES SCREEN */}
        <div id="moviesScreen" style={{ display: "none" }}>
          <button style={styles.backButton} onClick={() => window.showScreen("main")}>
            ← Back to Dashboard
          </button>

          <div style={styles.managementHeader}>
            <h2 style={{ fontSize: "28px" }}>Manage Movies</h2>
            <button style={styles.addButton}>+ Add New Movie</button>
          </div>

          {["Movie 1", "Movie 2", "Movie 3"].map(
            (title, i) => (
              <div key={i} style={styles.itemCardDetailed}>
                <div>
                  <h3 style={styles.itemInfoTitle}>{title}</h3>
                  <p style={styles.itemInfoSubtitle}>
                    {i === 0
                      ? "Movie 1 Description Placeholder"
                      : i === 1
                      ? "Movie 2 Description Placeholder"
                      : "Movie 3 Description Placeholder"}
                  </p>
                </div>
                <div style={styles.itemActions}>
                  <button style={styles.btnEdit}>Edit</button>
                  <button style={styles.btnDelete}>Delete</button>
                </div>
              </div>
            )
          )}
        </div>

        {/* USERS SCREEN */}
        <div id="usersScreen" style={{ display: "none" }}>
          <button style={styles.backButton} onClick={() => window.showScreen("main")}>
            ← Back to Dashboard
          </button>

          <div style={styles.managementHeader}>
            <h2 style={{ fontSize: "28px" }}>Manage Users</h2>
            <button style={styles.addButton}>+ Add New User</button>
          </div>

          {[
            { name: "User 1", email: "user1@email.com", joined: "Jan 2025" },
            { name: "User 2", email: "user2@email.com", joined: "Dec 2024" },
            { name: "User 3", email: "user3@email.com", joined: "Oct 2024" },
          ].map((u, i) => (
            <div key={i} style={styles.itemCardDetailed}>
              <div>
                <h3 style={styles.itemInfoTitle}>{u.name}</h3>
                <p style={styles.itemInfoSubtitle}>
                  {u.email} • Joined: {u.joined}
                </p>
              </div>
              <div style={styles.itemActions}>
                <button style={styles.btnEdit}>Edit</button>
                <button style={styles.btnDelete}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* PROMOTIONS SCREEN */}
        <div id="promotionsScreen" style={{ display: "none" }}>
          <button style={styles.backButton} onClick={() => window.showScreen("main")}>
            ← Back to Dashboard
          </button>

          <div style={styles.managementHeader}>
            <h2 style={{ fontSize: "28px" }}>Manage Promotions</h2>
            <button style={styles.addButton}>+ Add New Promotion</button>
          </div>

          {[
            {
              title: "Discount 1",
              desc: "Discount 1 Description Placeholder",
            },
            {
              title: "Discount 2",
              desc: "Discount 2 Description Placeholder",
            },
            {
              title: "Discount 3",
              desc: "Discount 3 Description Placeholder",
            },
          ].map((p, i) => (
            <div key={i} style={styles.itemCardDetailed}>
              <div>
                <h3 style={styles.itemInfoTitle}>{p.title}</h3>
                <p style={styles.itemInfoSubtitle}>{p.desc}</p>
              </div>
              <div style={styles.itemActions}>
                <button style={styles.btnEdit}>Edit</button>
                <button style={styles.btnDelete}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
