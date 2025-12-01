import React from "react";
import { X } from "lucide-react";

export default function MovieModal({
  movieFormData,
  handleInputChange,
  handleSave,
  close,
}) {
  const isEdit = !!movieFormData.id;

  return (
    <div className="modalOverlay" onClick={close}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modalHeader">
          <h2 className="modalTitle">
            {isEdit ? "Manage Movie" : "Add Movie"}
          </h2>
          <button className="closeButton" onClick={close}>
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div>
          {/* Title */}
          <div className="formGroup">
            <label className="label">Title *</label>
            <input
              className="input"
              type="text"
              name="title"
              value={movieFormData.title}
              onChange={handleInputChange}
              placeholder="Movie Title"
            />
          </div>

          {/* Description / Synopsis */}
          <div className="formGroup">
            <label className="label">Description</label>
              <textarea
                className="input autoGrow"
                name="description"
                value={movieFormData.description}
                onChange={(e) => {
                  handleInputChange(e);
                  e.target.style.height = "auto"; 
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Movie Description"
              />
          </div>

          {/* Rating (MPAA) */}
          <div className="formGroup">
            <label className="label">Rating (MPAA)</label>
            <input
              className="input"
              type="text"
              name="rating"
              value={movieFormData.rating}
              onChange={handleInputChange}
              placeholder="G, PG, PG-13, R..."
            />
          </div>

          {/* Poster URL */}
          <div className="formGroup">
            <label className="label">Poster Image URL</label>
            <input
              className="input"
              type="text"
              name="poster_url"
              value={movieFormData.poster_url}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>

          <div className="formGroup">
            <label className="label">
              <input
                type="checkbox"
                name="is_now_playing"
                checked={formData.is_now_playing}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_now_playing: e.target.checked }))
                }
              />
              Now Playing
            </label>
          </div>

          <div className="formGroup">
            <label className="label">
              <input
                type="checkbox"
                name="is_coming_soon"
                checked={formData.is_coming_soon}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_coming_soon: e.target.checked }))
                }
              />
              Coming Soon
            </label>
          </div>


          {/* Save Button */}
          <button className="btnSave" onClick={handleSave}>
            {isEdit ? "Save Changes" : "Add Movie"}
          </button>
        </div>
      </div>
    </div>
  );
}
