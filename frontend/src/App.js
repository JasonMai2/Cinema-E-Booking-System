import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ShowTimes from './pages/ShowTimes';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import OrderSummary from './pages/OrderSummary';
import OrderConfirmation from './pages/OrderConfirmation';
import { BookingProvider } from './context/BookingContext';
import Header from './components/Header';
import Login from './pages/Login';

function App() {
  return (
    <BookingProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shows" element={<ShowTimes />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        </Routes>
      </Router>
    </BookingProvider>
  );
}

export default App;
