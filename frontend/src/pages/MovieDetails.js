import React from "react";

export default function MovieDetails() {
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#252933",
      color: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      backgroundColor: "#661b1c",
      padding: "20px 40px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    },
    headerTitle: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "bold",
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
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Cinema Booking System</h1>
      </header>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Top Section - Poster and Info */}
        <div style={styles.topSection}>
          <div style={styles.poster}>Movie Poster</div>
          <div style={styles.rightSection}>
            <div style={styles.movieTitle}>
              <h2 style={styles.title}>Movie Title</h2>
              <div style={styles.metaInfo}>
                <span>Year Placeholder</span>
                <span>•</span>
                <span>Length Placeholder</span>
                <span>•</span>
                <span>Movie Rating Placeholder</span>
                <span>•</span>
                <span>Critic Rating Placeholder</span>
              </div>
            </div>
            <div style={styles.trailer}>Trailer Placeholder</div>
          </div>
        </div>

        {/* Description */}
        <div style={styles.descriptionSection}>
          <h3 style={styles.sectionTitle}>
            Description
          </h3>
          <p style={styles.description}>
            Description Placeholder.
          </p>
        </div>

        {/* Book Button */}
        <button style={styles.bookButton}>Book Now</button>
      </div>
    </div>
  );
}