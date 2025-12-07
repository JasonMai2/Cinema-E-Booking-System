import { X } from "lucide-react";
import React from "react";

export default function TicketModal({
  ticketFormData,
  handleInputChange,
  handleSave,
  close,
}) {
  return (
    <div className="modalOverlay" onClick={close}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">
            {ticketFormData.id ? "Manage Ticket Type" : "Add Ticket Type"}
          </h2>
          <button className="closeButton" onClick={close}>
            <X size={24} />
          </button>
        </div>

        <div className="formGroup">
          <label className="label">Name *</label>
          <input
            className="input"
            type="text"
            name="name"
            value={ticketFormData.name}
            onChange={handleInputChange}
            placeholder="e.g., Adult, Child, Student, Senior"
          />
          <p style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
            This name will appear in the ticket type dropdown during seat selection
          </p>
        </div>

        <div className="formGroup">
          <label className="label">Price ($) *</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            name="price"
            value={ticketFormData.price}
            onChange={handleInputChange}
            placeholder="e.g., 15.00"
          />
        </div>

        <div className="formGroup checkboxRow">
          <label className="label">Active?</label>
          <input
            type="checkbox"
            name="active"
            checked={ticketFormData.active}
            onChange={handleInputChange}
          />
        </div>

        <button className="btnSave" onClick={handleSave}>
          Save Ticket Type
        </button>
      </div>
    </div>
  );
}