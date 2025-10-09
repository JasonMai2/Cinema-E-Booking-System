import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AdminDashboard from "./pages/AdminDashboard";
import Home from './pages/Home';
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/Login";
import RegistrationConfirmation from "./pages/RegistrationConfirmation";
import EditProfile from "./pages/EditProfile";
import MovieSelection from './pages/MovieSelection';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/registration-confirmation"
          element={<RegistrationConfirmation />}
        />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/movies" element={<MovieSelection />} />
      </Routes>
    </Router>
  );
}

export default App;
