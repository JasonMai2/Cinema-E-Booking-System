<<<<<<< HEAD
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AdminDashboard from "./pages/AdminDashboard";
import Home from './pages/Home';
import MovieDetails from "./pages/MovieDetails";
=======
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import Login from "./pages/Login";
import RegistrationConfirmation from "./pages/RegistrationConfirmation";
import EditProfile from "./pages/EditProfile";
>>>>>>> page/profile

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
<<<<<<< HEAD
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/movie-details" element={<MovieDetails />} />
=======
        <Route path="/login" element={<Login />} />
        <Route
          path="/registration-confirmation"
          element={<RegistrationConfirmation />}
        />
        <Route path="/profile/edit" element={<EditProfile />} />
>>>>>>> page/profile
      </Routes>
    </Router>
  );
}

export default App;
