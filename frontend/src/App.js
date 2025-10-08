import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ShowTimes from './pages/ShowTimes';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import OrderSummary from './pages/OrderSummary';
import OrderConfirmation from './pages/OrderConfirmation';
import { BookingProvider } from './context/BookingContext';
import Login from './pages/Login';
import MovieDetails from './pages/MovieDetails';
import AdminDashboard from './pages/AdminDashboard';
import RegistrationConfirmation from './pages/RegistrationConfirmation';
import EditProfile from './pages/EditProfile';
import MovieSelection from './pages/MovieSelection';

function App() {
  return (
    <BookingProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/movie-details" element={<MovieDetails />} />
          <Route path="/shows" element={<ShowTimes />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Admin / additional pages */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/movies" element={<MovieSelection />} />
        </Routes>
      </Router>
    </BookingProvider>
  );
}

export default App;
