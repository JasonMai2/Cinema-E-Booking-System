import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const API_BASE = "http://localhost:8080/api";

export default function AdminMovies() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Updated to match backend fields
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    rating: "",
    poster_url: "",
  });

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const res = await fetch(`${API_BASE}/movies`);
      if (!res.ok) throw new Error("Failed to load movies");
      const data = await res.json();

      // Backend returns pagination wrapper
      setMovies(data.content || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load movies: " + err.message);
    }
  };

  const openAddMovie = () => {
    setSelectedMovie(null);
    setFormData({
      id: null,
      title: "",
      description: "",
      rating: "",
      poster_url: "",
    });
    setShowMovieModal(true);
  };

  const openManageMovie = (movie) => {
    setSelectedMovie(movie);
    setFormData({
      id: movie.id,
      title: movie.title || "",
      description: movie.synopsis || "",
      rating: movie.mpaa_rating || "",
      poster_url: movie.trailer_image_url || "",
    });
    setShowMovieModal(true);
  };

  const deleteMovie = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;

    try {
      const res = await fetch(`${API_BASE}/movies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete movie");
      alert("Movie deleted successfully");
      loadMovies();
    } catch (err) {
      console.error(err);
      alert("Failed to delete movie: " + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert("Title is required");
      return;
    }

    // Match backend field names
    const payload = {
      title: formData.title,
      mpaa_rating: formData.rating,
      synopsis: formData.description,
      trailer_image_url: formData.poster_url,
    };

    try {
      let res;
      if (selectedMovie) {
        // UPDATE
        res = await fetch(`${API_BASE}/movies/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE
        res = await fetch(`${API_BASE}/movies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save movie");

      alert(`Movie ${selectedMovie ? "updated" : "created"} successfully`);
      setShowMovieModal(false);
      setSelectedMovie(null);
      loadMovies();
    } catch (err) {
      console.error(err);
      alert("Failed to save movie: " + err.message);
    }
  };

  return (
    <div className="container">
      <button className="backButton" onClick={() => navigate("/admin")}>
        ← Back to Dashboard
      </button>

      <div className="managementHeader">
        <h2 className="headerTitle">Manage Movies</h2>
        <button className="btnSave" onClick={openAddMovie}>
          + Add Movie
        </button>
      </div>

      {movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        movies.map((m) => (
          <div key={m.id} className="itemCardDetailed">
            <div>
              <h3 className="itemInfoTitle">{m.title}</h3>
              <p className="itemInfoSubtitle">
                Rating: {m.mpaa_rating || "N/A"}
              </p>
            </div>

            <div className="itemActions">
              <button className="btnManage" onClick={() => openManageMovie(m)}>
                Manage
              </button>
              <button className="btnDelete" onClick={() => deleteMovie(m.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {showMovieModal && (
        <div className="modalOverlay" onClick={() => setShowMovieModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">
                {selectedMovie ? "Edit Movie" : "Add Movie"}
              </h2>
              <button className="closeButton" onClick={() => setShowMovieModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="formGroup">
              <label className="label">Title *</label>
              <input
                className="input"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="formGroup">
              <label className="label">Description</label>
              <textarea
                className="input"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="formGroup">
              <label className="label">MPAA Rating</label>
              <input
                className="input"
                name="rating"
                value={formData.rating}
                onChange={handleInputChange}
              />
            </div>

            <div className="formGroup">
              <label className="label">Poster Image URL</label>
              <input
                className="input"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleInputChange}
              />
            </div>

            <button className="btnSave" onClick={handleSubmit}>
              {selectedMovie ? "Save Changes" : "Add Movie"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
