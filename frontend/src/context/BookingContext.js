import React, { createContext, useContext, useState } from 'react';

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

  // Create an order draft. Try to call server-side API if available; otherwise create a demo draft locally.
  const createOrderDraft = async (payload) => {
    try {
      // try server call if available (bookingApi is a runtime import in pages)
      // avoid importing bookingApi here to keep context lightweight; callers may call API themselves
      // If a server call is desired, the pages should call bookingApi and then setOrderDraft.
      // For demo mode, just create a local draft object.
      const draft = {
        id: payload.orderId || `demo-order-${Date.now()}`,
        orderId: payload.orderId || `demo-order-${Date.now()}`,
        ...payload,
      };
      setOrderDraft(draft);
      return draft;
    } catch (err) {
      const draft = {
        id: payload.orderId || `demo-order-${Date.now()}`,
        orderId: payload.orderId || `demo-order-${Date.now()}`,
        ...payload,
      };
      setOrderDraft(draft);
      return draft;
    }
  };

  // Confirm an order. If there is no server, return a demo confirmation object.
  const confirmOrder = async (orderId) => {
    // If a real API exists pages can call bookingApi.confirmOrder and then call this to set state.
    const draft = orderDraft || orderDetails || { orderId };
    const confirmation = {
      orderId: draft.orderId || orderId || `demo-confirm-${Date.now()}`,
      id: draft.orderId || orderId || `demo-confirm-${Date.now()}`,
      confirmationCode: `CONF-${Math.floor(Math.random() * 900000 + 100000)}`,
      show: draft.show || selectedShow,
      showId: draft.showId || selectedShow?.id,
      seats: (draft.seats || selectedSeats || []).map((s) => (s.id ? (s.id) : s)),
      totals: { subtotal: (selectedSeats || []).reduce((s, x) => s + (x.price || 0), 0) },
    };
    setOrderDetails(confirmation);
    return confirmation;
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
