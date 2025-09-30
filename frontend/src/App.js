import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import Login from "./pages/Login";
import RegistrationConfirmation from "./pages/RegistrationConfirmation";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/registration-confirmation"
          element={<RegistrationConfirmation />}
        />
      </Routes>
    </Router>
  );
}

export default App;
