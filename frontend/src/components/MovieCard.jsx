import React from "react";
import { Link } from "react-router-dom";

function getYouTubeEmbedSrc(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      // /embed/ style already
      if (u.pathname.startsWith("/embed/"))
        return `https://www.youtube.com${u.pathname}`;
    }
  } catch (e) {
    // not a valid URL - try naive regex
    const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

export default function MovieCard({ movie, compact }) {
  if (!movie) return null;

  // Use user-provided trailer URL or fall back to a project-wide default so every card shows a video
  const DEFAULT_TRAILER = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
  const trailerUrl = movie.trailer_video_url || DEFAULT_TRAILER;
  const embedSrc = getYouTubeEmbedSrc(trailerUrl);
  const hasVideo = !!trailerUrl && !embedSrc; // non-YouTube direct video URL
  const poster = movie.trailer_image_url || null;
  console.log("Rendering MovieCard for:", movie.trailer_image_url);

  return (
    <div
      style={{
        background: "#1f2226",
        padding: 12,
        borderRadius: 6,
        color: "#fff",
      }}
    >
      {/* header: thumbnail + title/synopsis */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        {poster ? (
          <img
            src={poster}
            alt={`${movie.title} poster`}
            style={{
              width: 96,
              height: 140,
              objectFit: "cover",
              borderRadius: 6,
              flex: "0 0 96px",
            }}
          />
        ) : null}

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 8px 0" }}>{movie.title}</h3>
          {!compact && (
            <>
              <p style={{ margin: 0, color: "#cfcfcf" }}>{movie.synopsis}</p>
              <p style={{ marginTop: 8, fontSize: 12, color: "#9aa" }}>
                {movie.mpaa_rating}
              </p>
            </>
          )}
        </div>
      </div>

      {/* media area (video/embed/full-size image) */}
      <div style={{ marginBottom: 8 }}>
        {embedSrc ? (
          <div
            style={{
              position: "relative",
              paddingTop: "56.25%",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <iframe
              title={`${movie.title} trailer`}
              src={embedSrc}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : hasVideo ? (
          <video
            controls
            preload="metadata"
            poster={poster}
            style={{ width: "100%", borderRadius: 6, background: "#000" }}
          >
            <source src={movie.trailer_video_url} />
            Your browser does not support the video tag.
          </video>
        ) : poster ? (
          // show a larger poster when no video/embed is available
          <img
            src={poster}
            alt={`${movie.title} poster`}
            style={{ width: "100%", borderRadius: 6 }}
          />
        ) : null}
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <Link
          to={`/movies/${movie.id}`}
          style={{ color: "#fff", textDecoration: "none" }}
        >
          <button style={{ padding: "6px 10px", borderRadius: 6 }}>
            Details
          </button>
        </Link>
        <button
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            background: "#7d1b1d",
            color: "#fff",
          }}
        >
          Book
        </button>
      </div>
    </div>
  );
}
