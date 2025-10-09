import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);

  const addSeat = (seat) => {
    setSelectedSeats((s) => {
      if (s.find((x) => x.id === seat.id)) return s;
      return [...s, seat];
    });
  };

  const removeSeat = (seatId) => {
    setSelectedSeats((s) => s.filter((x) => x.id !== seatId));
  };

  const clearSelection = () => {
    setSelectedShow(null);
    setSelectedSeats([]);
    setOrderDetails(null);
  };

  const value = {
    selectedShow,
    setSelectedShow,
    selectedSeats,
    addSeat,
    removeSeat,
    clearSelection,
    orderDetails,
    setOrderDetails,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}

export default BookingContext;
