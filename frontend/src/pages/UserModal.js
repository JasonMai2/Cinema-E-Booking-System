import React from "react";
import { X } from "lucide-react";

export default function UserModal({
  formData,
  handleInputChange,
  handleSubmit,
  loading,
  close,
}) {
  return (
    <div className="modalOverlay" onClick={close}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">Manage User</h2>
          <button className="closeButton" onClick={close}>
            <X size={24} />
          </button>
        </div>
        <div>
          <div className="formRow">
            <div className="formGroup">
              <label className="label">First Name</label>
              <input
                className="input"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="First Name"
              />
            </div>
            <div className="formGroup">
              <label className="label">Last Name</label>
              <input
                className="input"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Last Name"
              />
            </div>
          </div>
          <div className="formGroup">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              value={formData.email}
              readOnly
            />
          </div>
          <div className="formGroup">
            <label className="label">New Password</label>
            <input
              className="input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{ marginBottom: "10px" }}
              placeholder="New password"
            />
            <input
              className="input"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm new password"
            />
          </div>
          <div className="formGroup">
            <label className="label">Phone Number</label>
            <input
              className="input"
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone Number"
            />
          </div>
          <div className="formGroup">
            <label className="label">Role</label>
            <select
              className="input"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="REGISTERED">Registered</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="formGroup">
            <label className="label">
              <input
                type="checkbox"
                name="is_suspended"
                checked={formData.is_suspended}
                onChange={handleInputChange}
              />
              Suspended
            </label>
          </div>
          <button className="btnSave" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
