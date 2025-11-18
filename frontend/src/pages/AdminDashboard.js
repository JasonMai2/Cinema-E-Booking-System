import React, { useEffect, useState } from "react";
import { Film, Users, Percent } from "lucide-react";
import AdminUsers from "./AdminUsers";
import AdminPromotions from "./AdminPromotions";
import { useNavigate } from 'react-router-dom';

import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [currentScreen, setCurrentScreen] = useState("main");
  const navigate = useNavigate();

  const showScreen = (screen) => {
    setCurrentScreen(screen);
  };

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
              <div className="adminCard" onClick={() => navigate('/') }>
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
