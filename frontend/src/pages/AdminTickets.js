import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TicketModal from "./TicketModal";

const API_BASE = "http://localhost:8080/api";

export default function AdminTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [ticketFormData, setTicketFormData] = useState({
    name: "",
    price: "",
    active: true,
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/ticket-types`);
      if (!res.ok) throw new Error("Failed to load ticket types");

      const data = await res.json();
      
      // Handle both array response and response with ticketTypes property
      const ticketList = Array.isArray(data) ? data : (data.ticketTypes || []);

      const formatted = ticketList.map((t) => ({
        id: t.id,
        name: t.name,
        price: ((t.price_cents || t.priceCents) / 100).toFixed(2),
        active: t.is_active !== undefined ? t.is_active : (t.active !== undefined ? t.active : true),
      }));

      setTickets(formatted);
    } catch (err) {
      console.error(err);
      alert("Failed to load ticket types: " + err.message);
    }
  };

  const openManageTicket = (ticket) => {
    setSelectedTicket(ticket);
    setTicketFormData({
      name: ticket.name,
      price: ticket.price,
      active: ticket.active,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTicketFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveTicket = async () => {
    if (!ticketFormData.name) {
      alert("Name is required");
      return;
    }
    if (!ticketFormData.price || Number(ticketFormData.price) < 0) {
      alert("Valid price is required");
      return;
    }

    const payload = {
      name: ticketFormData.name,
      price_cents: Math.round(Number(ticketFormData.price) * 100),
      is_active: ticketFormData.active,
    };

    try {
      let res;
      if (selectedTicket) {
        res = await fetch(`${API_BASE}/ticket-types/${selectedTicket.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/ticket-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || result.error || "Failed to save ticket type");
      }

      alert(selectedTicket ? "Ticket type updated successfully" : "Ticket type created successfully");
      await loadTickets();
      setShowModal(false);
      setSelectedTicket(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save ticket type: " + err.message);
    }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Delete this ticket type?")) return;

    try {
      const res = await fetch(`${API_BASE}/ticket-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete ticket type");

      await loadTickets();
      alert("Deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete ticket type: " + err.message);
    }
  };

  return (
    <div className="container">
      <button className="backButton" onClick={() => navigate("/admin")}>
        ← Back to Dashboard
      </button>

      <div className="managementHeader">
        <h2 className="headerTitle">Manage Ticket Types</h2>

        <button
          className="btnSave"
          onClick={() => {
            setSelectedTicket(null);
            setTicketFormData({
              name: "",
              price: "",
              active: true,
            });
            setShowModal(true);
          }}
        >
          + Add Ticket Type
        </button>
      </div>

      {tickets.length === 0 ? (
        <p>No ticket types found.</p>
      ) : (
        tickets.map((t) => (
          <div key={t.id} className="itemCardDetailed">
            <div>
              <h3 className="itemInfoTitle">{t.name}</h3>
              <p className="itemInfoSubtitle">
                Price: ${t.price} • {t.active ? "Active" : "Inactive"}
              </p>
            </div>

            <div className="itemActions">
              <button className="btnManage" onClick={() => openManageTicket(t)}>
                Manage
              </button>
              <button className="btnDelete" onClick={() => deleteTicket(t.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <TicketModal
          ticketFormData={ticketFormData}
          handleInputChange={handleInputChange}
          handleSave={handleSaveTicket}
          close={() => setShowModal(false)}
        />
      )}
    </div>
  );
}