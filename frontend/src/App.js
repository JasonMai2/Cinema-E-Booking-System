import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MovieSelection from './pages/MovieSelection';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Header /> 
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<MovieSelection />} />
      </Routes>
    </Router>
  );
}

export default App;
