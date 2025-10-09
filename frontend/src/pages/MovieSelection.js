import React from "react";

export default function MovieDetails() {
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
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    posterImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
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
    },
    trailerIframe: {
      width: "100%",
      height: "100%",
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
      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Top Section - Poster and Info */}
        <div style={styles.topSection}>
          <div style={styles.poster}>
            <img
              src="/images/Inception.jpg"
              alt="Inception Poster"
              style={styles.posterImg}
            />
          </div>
          <div style={styles.rightSection}>
            <div style={styles.movieTitle}>
              <h2 style={styles.title}>Inception</h2>
              <div style={styles.metaInfo}>
                <span>2010</span>
                <span>•</span>
                <span>2hr 28min</span>
                <span>•</span>
                <span>PG-13</span>
                <span>•</span>
                <span>Critic Rating: 8.8/10</span>
              </div>
            </div>
            <div style={styles.trailer}>
              <iframe
                style={styles.trailerIframe}
                src="https://www.youtube.com/embed/YoHD9XEInc0"
                title="Inception Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={styles.descriptionSection}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <p style={styles.description}>
            A thief who steals corporate secrets through dream-sharing
            technology.
          </p>
        </div>

        {/* Book Button */}
        <button style={styles.bookButton}>Book Now</button>
      </div>
    </div>
  );
}
