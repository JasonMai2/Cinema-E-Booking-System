import React from "react";
import { X } from "lucide-react";

export default function PromotionModal({
  promoFormData,
  handleInputChange,
  handleSave,
  close,
}) {
  return (
    <div className="modalOverlay" onClick={close}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">
            {promoFormData.id ? "Manage Promotion" : "Add Promotion"}
          </h2>
          <button className="closeButton" onClick={close}>
            <X size={24} />
          </button>
        </div>
        <div>
          <div className="formGroup">
            <label className="label">Title</label>
            <input
              className="input"
              type="text"
              name="title"
              value={promoFormData.title}
              onChange={handleInputChange}
            />
          </div>
          <div className="formGroup">
            <label className="label">Description</label>
            <textarea
              className="input"
              name="description"
              value={promoFormData.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="formRow">
            <div className="formGroup">
              <label className="label">Discount Type</label>
              <select
                className="input"
                name="discountType"
                value={promoFormData.discountType}
                onChange={handleInputChange}
              >
                <option value="PERCENT">Percent (%)</option>
                <option value="FLAT">Flat ($)</option>
              </select>
            </div>
            <div className="formGroup">
              <label className="label">Discount Value</label>
              <input
                className="input"
                type="number"
                name="discount"
                value={promoFormData.discount}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="formRow">
            <div className="formGroup">
              <label className="label">Start Date</label>
              <input
                className="input"
                type="date"
                name="startDate"
                value={promoFormData.startDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label className="label">End Date</label>
              <input
                className="input"
                type="date"
                name="endDate"
                value={promoFormData.endDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <button className="btnSave" onClick={handleSave}>
            Save Promotion
          </button>
        </div>
      </div>
    </div>
  );
}
