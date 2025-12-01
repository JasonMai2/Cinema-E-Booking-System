import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const API_BASE = "http://localhost:8080/api";

export default function AdminMovies() {
  const navigate = useNavigate();

  const [selectedAuditorium, setSelectedAuditorium] = useState(null);
  const [movies, setMovies] = useState([]);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    rating: "",
    trailer_video_url: "",
    poster_url: "",
    is_now_playing: false,
    is_coming_soon: false,
  });

  // Showtimes related state
  const [showtimes, setShowtimes] = useState([]);
  const [formStartTime, setFormStartTime] = useState(""); // For the new showtime input
  const [newShowtime, setNewShowtime] = useState({
    auditoriumId: "",
    startsAt: ""
  });
  const [auditoriums, setAuditoriums] = useState([]);

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      loadShowtimes(selectedMovie.id);
      loadAuditoriums();
    } else {
      setShowtimes([]);
    }
  }, [selectedMovie]);

  // ===================== LOAD DATA =====================
  const loadMovies = async () => {
    try {
      const res = await fetch(`${API_BASE}/movies`);
      if (!res.ok) throw new Error("Failed to load movies");
      const data = await res.json();
      setMovies(data.content || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load movies: " + err.message);
    }
  };

  const loadAuditoriums = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings/admin/auditoriums`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to load auditoriums");
      setAuditoriums(data.auditoriums || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load auditoriums: " + err.message);
    }
  };

  const loadShowtimes = async (movieId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/admin/showtimes`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to load showtimes");
      const movieShowtimes = data.showtimes.filter(st => st.movie_id === movieId);
      setShowtimes(movieShowtimes);
    } catch (err) {
      console.error(err);
      alert("Failed to load showtimes: " + err.message);
    }
  };


  // ===================== MODAL OPERATIONS =====================
  const openAddMovie = () => {
    setSelectedMovie(null);
    setFormData({
      id: null,
      title: "",
      description: "",
      rating: "",
      trailer_video_url: "",
      poster_url: "",
      is_now_playing: false,
      is_coming_soon: false,
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
      trailer_video_url: movie.trailer_video_url || "",
      poster_url: movie.trailer_image_url || "",
      is_now_playing: movie.is_now_playing || false,
      is_coming_soon: movie.is_coming_soon || false,
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title) return alert("Title is required");

    const payload = {
      title: formData.title,
      mpaa_rating: formData.rating,
      synopsis: formData.description,
      trailer_video_url: formData.trailer_video_url,
      trailer_image_url: formData.poster_url,
      is_now_playing: formData.is_now_playing,
      is_coming_soon: formData.is_coming_soon
    };

    try {
      let res;
      if (selectedMovie) {
        res = await fetch(`${API_BASE}/movies/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/movies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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

  // ===================== SHOWTIME OPERATIONS =====================
  const handleAddShowtime = async () => {
    if (!selectedAuditorium || !formStartTime) {
      alert("Please select an auditorium and start time");
      return;
    }

    try {
      const payload = {
        movieId: Number(formData.id),
        auditoriumId: Number(selectedAuditorium.id),
        startsAt: formStartTime, // must be ISO format
      };

      const res = await fetch(`${API_BASE}/bookings/admin/showtimes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to create showtime");

      alert("Showtime added successfully");
      loadShowtimes(formData.id);
      setFormStartTime("");
      setSelectedAuditorium(null);

    } catch (err) {
      console.error(err);
      alert("Failed to add showtime: " + err.message);
    }
  };

  const handleDeleteShowtime = async (showtimeId) => {
    if (!window.confirm("Are you sure you want to delete this showtime?")) return;
    try {
      const res = await fetch(`${API_BASE}/bookings/admin/showtimes/${showtimeId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to delete showtime");

      alert("Showtime deleted successfully");
      loadShowtimes(selectedMovie.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete showtime: " + err.message);
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="container">
      <button className="backButton" onClick={() => navigate("/admin")}>← Back to Dashboard</button>

      <div className="managementHeader">
        <h2 className="headerTitle">Manage Movies</h2>
        <button className="btnSave" onClick={openAddMovie}>+ Add Movie</button>
      </div>

      {movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        movies.map(m => (
          <div key={m.id} className="itemCardDetailed">
            <div>
              <h3 className="itemInfoTitle">{m.title}</h3>
              <p className="itemInfoSubtitle">Rating: {m.mpaa_rating || "N/A"}</p>
            </div>
            <div className="itemActions">
              <button className="btnManage" onClick={() => openManageMovie(m)}>Manage</button>
              <button className="btnDelete" onClick={() => deleteMovie(m.id)}>Delete</button>
            </div>
          </div>
        ))
      )}

      {showMovieModal && (
        <div className="modalOverlay" onClick={() => setShowMovieModal(false)}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">{selectedMovie ? "Edit Movie" : "Add Movie"}</h2>
              <button className="closeButton" onClick={() => setShowMovieModal(false)}><X size={24} /></button>
            </div>

            {/* ===== Movie Form ===== */}
            <div className="formGroup">
              <label className="label">Title *</label>
              <input className="input" name="title" value={formData.title} onChange={handleInputChange} />
            </div>

            <div className="formGroup">
              <label className="label">Description</label>
              <textarea className="input" name="description" value={formData.description} onChange={handleInputChange} />
            </div>

            <div className="formGroup">
              <label className="label">MPAA Rating</label>
              <input className="input" name="rating" value={formData.rating} onChange={handleInputChange} />
            </div>

            <div className="formGroup">
              <label className="label">Trailer Video URL</label>
              <input type="text" className="input" name="trailer_video_url" value={formData.trailer_video_url} onChange={handleInputChange} placeholder="https://..." />
            </div>

            <div className="formGroup">
              <label className="label">Poster Image URL</label>
              <input className="input" name="poster_url" value={formData.poster_url} onChange={handleInputChange} />
            </div>

            <div className="formGroup">
              <label className="label"><input type="checkbox" name="is_now_playing" checked={formData.is_now_playing} onChange={handleInputChange} /> Now Playing</label>
            </div>

            <div className="formGroup">
              <label className="label"><input type="checkbox" name="is_coming_soon" checked={formData.is_coming_soon} onChange={handleInputChange} /> Coming Soon</label>
            </div>

            <button className="btnSave" onClick={handleSubmit}>{selectedMovie ? "Save Changes" : "Add Movie"}</button>

            {/* ===== Showtimes Section ===== */}
            {selectedMovie && (
              <div className="showtimesSection" style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
                <h3>Showtimes</h3>

                {showtimes.length === 0 ? <p>No showtimes yet.</p> : (
                  <ul>
                    {showtimes.map(st => (
                      <li key={st.id}>
                        {new Date(st.starts_at).toLocaleString()} - {st.auditorium_name} 
                        <button style={{ marginLeft: "1rem" }} onClick={() => handleDeleteShowtime(st.id)}>Delete</button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="formGroup">
                  <label className="label">Auditorium</label>
                  <select
                    className="input"
                    value={selectedAuditorium?.id || ""}
                    onChange={(e) => {
                      const aud = auditoriums.find(a => a.id === Number(e.target.value));
                      setSelectedAuditorium(aud);
                    }}
                  >
                    <option value="">Select Auditorium</option>
                    {auditoriums.map(aud => (
                      <option key={aud.id} value={aud.id}>{aud.name}</option>
                    ))}
                  </select>
                </div>

                <div className="formGroup">
                  <label className="label">Start Time</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>

                <button className="btnSave" onClick={handleAddShowtime}>
                  Add Showtime
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
