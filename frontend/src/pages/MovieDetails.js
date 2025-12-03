import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function MovieDetails() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    api.get(`/movies/${movieId}`)
      .then((res) => {
        if (res?.data?.ok) setMovie(res.data.movie);
        else setMovie(null);
      })
      .catch(() => setMovie(null))
      .finally(() => setLoading(false));
  }, [movieId]);

  const getYouTubeId = (url) => {
    try {
      const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^\s&?]+)/i
      );
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!movie) return (
    <div style={{ padding: 40 }}>
      <h3>Movie not found</h3>
      <button onClick={() => navigate('/movies')}>Back to movies</button>
    </div>
  );

  const videoId = movie.trailer_video_url ? getYouTubeId(movie.trailer_video_url) : null;

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#252933",
      color: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
    },
    mainContent: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
    },
    topSection: {
      display: "grid",
      gridTemplateColumns: "400px 1fr",
      gap: "30px",
      marginBottom: "40px",
    },
    poster: {
      width: "100%",
      aspectRatio: "2 / 3",
      backgroundColor: "#12151c",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      color: "#888",
      overflow: "hidden",
    },
    posterImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "8px",
      display: "block",
    },
    rightSection: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    movieTitle: {
      backgroundColor: "#12151c",
      padding: "20px",
      borderRadius: "8px",
    },
    title: {
      margin: 0,
      fontSize: "32px",
      fontWeight: "bold",
      marginBottom: "10px",
    },
    metaInfo: {
      display: "flex",
      gap: "20px",
      fontSize: "14px",
      color: "#bbb",
    },
    trailer: {
      backgroundColor: "#12151c",
      padding: "20px",
      borderRadius: "8px",
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "300px",
      fontSize: "18px",
      color: "#888",
    },
    trailerIframe: {
      width: "90%",
      height: "90%",
      border: "none",
      borderRadius: "8px",
    },
    descriptionSection: {
      backgroundColor: "#12151c",
      padding: "30px",
      borderRadius: "8px",
      marginBottom: "40px",
    },
    sectionTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "15px",
      color: "#f5f5f5",
    },
    description: {
      lineHeight: "1.8",
      color: "#ddd",
      fontSize: "16px",
    },
    bookButton: {
      backgroundColor: "#661b1c",
      color: "#f5f5f5",
      border: "none",
      padding: "16px 48px",
      fontSize: "18px",
      fontWeight: "bold",
      borderRadius: "8px",
      cursor: "pointer",
      display: "block",
      margin: "0 auto",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.topSection}>
          <div style={styles.poster}>
            {movie.trailer_image_url ? (
              <img src={movie.trailer_image_url} alt={`${movie.title} Poster`} style={styles.posterImg} />
            ) : (
              <div>No poster</div>
            )}
          </div>
          <div style={styles.rightSection}>
            <div style={styles.movieTitle}>
              <h2 style={styles.title}>{movie.title}</h2>
              <div style={styles.metaInfo}>
                <span>{movie.mpaa_rating || ''}</span>
              </div>
            </div>
            <div style={styles.trailer}>
              {videoId ? (
                <iframe
                  style={styles.trailerIframe}
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`${movie.title} Trailer`}
                  allow="clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div>No trailer available</div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.descriptionSection}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <p style={styles.description}>{movie.synopsis}</p>
        </div>

        <button style={styles.bookButton} onClick={() => navigate(`/shows/${movie.id}`)}>
          Book Now
        </button>
      </div>
    </div>
  );
}
