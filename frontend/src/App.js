import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import Checkout from './pages/Checkout';
import EditProfile from './pages/EditProfile';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import MovieDetails from './pages/MovieDetails';
import MovieSelection from './pages/MovieSelection';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderSummary from './pages/OrderSummary';
import React from 'react';
import RegistrationConfirmation from './pages/RegistrationConfirmation';
import ResetPassword from './pages/ResetPassword';
import { SearchProvider } from './context/SearchContext';
import SearchResults from './pages/SearchResults';
import SeatSelection from './pages/SeatSelection';
import ShowTimes from './pages/ShowTimes';

function App() {
  return (
    <BookingProvider>
      <SearchProvider>
        <AuthProvider>
          <Router>
            <Header />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/movie-details" element={<MovieDetails />} />
          <Route path="/movies/:movieId" element={<MovieDetails />} />
          <Route path="/shows" element={<ShowTimes />} />
          <Route path="/shows/:movieId" element={<ShowTimes />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Admin / additional pages */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/movies" element={<MovieSelection />} />
          {/* Keep /search for compatibility but render MovieSelection so results live on /movies */}
          <Route path="/search" element={<MovieSelection />} />
          </Routes>
          </Router>
        </AuthProvider>
      </SearchProvider>
    </BookingProvider>
  );
}

export default App;
