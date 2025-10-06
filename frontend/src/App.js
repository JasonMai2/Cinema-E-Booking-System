import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import AdminDashboard from "./pages/AdminDashboard";
import Home from './pages/Home';
import MovieDetails from "./pages/MovieDetails";

function App() {
  return (
    <Router>
      <Header /> 
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/movie-details" element={<MovieDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
