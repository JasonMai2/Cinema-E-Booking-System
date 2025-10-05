import React, { createContext, useContext, useState } from 'react';
import bookingApi from '../services/bookingApi';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [orderDraft, setOrderDraft] = useState(null);

  const value = {
    selectedMovie,
    setSelectedMovie,
    selectedShow,
    setSelectedShow,
    selectedSeats,
    setSelectedSeats,
    reservation,
    setReservation,
    customer,
    setCustomer,
    orderDraft,
    setOrderDraft,

    // helpers
    async createReservation(showId, seatIds) {
      const res = await bookingApi.reserveSeats(showId, { seats: seatIds });
      setReservation(res.data);
      return res.data;
    },

    clearReservation() {
      setReservation(null);
    },

    async createOrderDraft(payload) {
      const res = await bookingApi.createOrder(payload);
      setOrderDraft(res.data);
      return res.data;
    },

    async confirmOrder(orderId) {
      const res = await bookingApi.confirmOrder(orderId);
      setOrderDraft(res.data);
      return res.data;
    },

    resetBooking() {
      setSelectedMovie(null);
      setSelectedShow(null);
      setSelectedSeats([]);
      setReservation(null);
      setCustomer(null);
      setOrderDraft(null);
    },
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  return useContext(BookingContext);
}

export default BookingContext;
