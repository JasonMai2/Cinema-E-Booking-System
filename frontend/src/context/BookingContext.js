import React, { createContext, useContext, useState } from 'react';

import api from '../services/api';
import bookingApi from '../services/bookingApi';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderDraft, setOrderDraft] = useState(null);
  const [customer, setCustomer] = useState(null);

  const addSeat = (seat) => {
    setSelectedSeats((s) => {
      if (s.find((x) => x.id === seat.id)) return s;
      return [...s, seat];
    });
  };

  const removeSeat = (seatId) => {
    setSelectedSeats((s) => s.filter((x) => x.id !== seatId));
  };

  const updateSeat = (seatId, patch) => {
    setSelectedSeats((s) => s.map((x) => (x.id === seatId ? { ...x, ...patch } : x)));
  };

  const clearSelection = () => {
    setSelectedShow(null);
    setSelectedSeats([]);
    setOrderDetails(null);
  };

  // Create an order draft with the given payload
  const createOrderDraft = async (payload) => {
    try {
      const draft = {
        id: payload.orderId || `order-${Date.now()}`,
        orderId: payload.orderId || `order-${Date.now()}`,
        ...payload,
      };
      setOrderDraft(draft);
      return draft;
    } catch (err) {
      const draft = {
        id: payload.orderId || `order-${Date.now()}`,
        orderId: payload.orderId || `order-${Date.now()}`,
        ...payload,
      };
      setOrderDraft(draft);
      return draft;
    }
  };

  // Confirm an order and process checkout
  const confirmOrder = async (orderId) => {
    try {
      // Prepare the checkout payload from orderDraft
      const draft = orderDraft || { orderId };
      
      // Validate required fields
      if (!draft.userId) {
        throw new Error('User ID is missing. Please log in again.');
      }
      if (!draft.showId) {
        throw new Error('Show ID is missing. Please select a show again.');
      }
      if (!draft.paymentMethodId) {
        throw new Error('Payment method is missing. Please go back to checkout and select a payment method.');
      }
      if (!draft.seats || draft.seats.length === 0) {
        throw new Error('No seats selected. Please select seats.');
      }
      
      // Call the actual checkout API
      const checkoutPayload = {
        userId: draft.userId,
        showId: draft.showId,
        seats: (draft.seats || selectedSeats || []).map((s) => ({
          seatId: typeof s === 'object' ? s.id : s,
          ageCategory: (typeof s === 'object' ? s.ageCategory : 'adult').toUpperCase()
        })),
        paymentMethodId: draft.paymentMethodId,
        promoCode: draft.promoCode || undefined,
      };
      
      console.log('Calling checkout API with:', checkoutPayload);
      const res = await api.post('/checkout', checkoutPayload);
      
      console.log('Checkout API response:', res);
      
      if (res?.data?.success) {
        // Calculate totals from seats
        const seats = draft.seats || selectedSeats || [];
        const subtotal = seats.reduce((s, x) => s + (x.price || 0), 0);
        const serviceFee = seats.length * 1.50;
        
        // Get discount from draft if promo was applied
        const discount = draft.promoDiscount || 0;
        
        // Calculate tax on (subtotal + fees - discount)
        const taxableAmount = Math.max(0, subtotal + serviceFee - discount);
        const tax = Math.round(taxableAmount * 0.08 * 100) / 100; // 8% tax, rounded
        const total = subtotal + serviceFee + tax - discount;
        
        const confirmation = {
          orderId: res.data.bookingId || res.data.id,
          id: res.data.bookingId || res.data.id,
          bookingNumber: res.data.bookingNumber,
          confirmationCode: res.data.bookingNumber || `CONF-${Math.floor(Math.random() * 900000 + 100000)}`,
          show: draft.show || selectedShow,
          showId: draft.showId || selectedShow?.id,
          seats: seats,
          promoCode: draft.promoCode || undefined,
          promoName: draft.promoName || undefined,
          totals: { 
            subtotal: subtotal,
            serviceFee: serviceFee,
            tax: tax,
            discount: discount,
            total: total
          },
        };
        setOrderDetails(confirmation);
        return confirmation;
      } else {
        throw new Error(res?.data?.message || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      console.error('Error details:', err.response?.data);
      throw err;
    }
  };

  const value = {
    selectedShow,
    setSelectedShow,
    selectedSeats,
    addSeat,
    removeSeat,
    updateSeat,
    clearSelection,
    customer,
    setCustomer,
    orderDraft,
    createOrderDraft,
    confirmOrder,
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
