import React from "react";
import { X } from "lucide-react";

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
          <label className="label">Name</label>
          <input
            className="input"
            type="text"
            name="name"
            value={ticketFormData.name}
            onChange={handleInputChange}
          />
        </div>



        <div className="formGroup">
          <label className="label">Price ($)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            name="price"
            value={ticketFormData.price}
            onChange={handleInputChange}
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
