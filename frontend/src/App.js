import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import React from 'react';
import Header from './components/Header';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { SearchProvider } from './context/SearchContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminFees from "./pages/AdminFees";
import AdminMovies from "./pages/AdminMovies";
import AdminPromotions from "./pages/AdminPromotions";
import AdminTickets from "./pages/AdminTickets";
import AdminUsers from "./pages/AdminUsers";
import BookingConfirmation from './pages/BookingConfirmation';
import Checkout from './pages/Checkout';
import EditProfile from './pages/EditProfile';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import MovieDetails from './pages/MovieDetails';
import MovieSelection from './pages/MovieSelection';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import OrderSummary from './pages/OrderSummary';
import RegistrationConfirmation from './pages/RegistrationConfirmation';
import ResetPassword from './pages/ResetPassword';
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
          
          {/* Put specific routes before parameterized ones */}
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/shows" element={<ShowTimes />} />
          <Route path="/shows/:movieId" element={<ShowTimes />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          
          <Route path="/movies/:movieId" element={<MovieDetails />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Admin / additional pages */}
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/admin/movies" element={<AdminMovies />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/promotions" element={<AdminPromotions />} />
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/admin/fees" element={<AdminFees />} />
          
          <Route path="/admin/movies" element={<AdminDashboard />} />

          <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/order-history" element={<OrderHistory />} />
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