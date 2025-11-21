import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import ShowList from '../components/ShowList.jsx';
import { useSearch } from '../context/SearchContext.js';

export default function ShowTimes() {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const fetchId = useRef(0);

  useEffect(() => {
    loadMoviesAndShowtimes();
  }, [movieId]);

  const loadMoviesAndShowtimes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/bookings/movies');
      
      if (response.data.ok) {
        let moviesData = response.data.movies;
        
        // Filter by specific movie if movieId is provided
        if (movieId) {
          moviesData = moviesData.filter(movie => movie.id.toString() === movieId);
        }
        
        // Transform data to match ShowList component expectations
        const transformedMovies = moviesData.map(movie => ({
          id: movie.id,
          title: movie.title,
          synopsis: movie.description || movie.synopsis || 'No description available',
          poster_url: movie.poster_url || movie.trailer_image_url,
          shows: movie.showtimes.map(showtime => ({
            id: showtime.id,
            startTime: showtime.starts_at, // Updated to use correct API field
            runtimeMinutes: movie.duration || 120,
            auditorium: showtime.auditorium_name, // Updated to use correct API field
            price: showtime.price || 12.50, // Default price if not provided
            capacity: showtime.capacity || (showtime.seat_rows * showtime.seat_cols)
          }))
        }));
        
        setMovies(transformedMovies);
      } else {
        throw new Error(response.data.message || 'Failed to load movies');
      }
    } catch (err) {
      console.error('Error loading movies and showtimes:', err);
      setError(err.message || 'Failed to load shows');
      
      // Fallback to demo data if API fails
      setMovies(generateDemoMovies());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoMovies = () => {
    if (movieId) {
      return [{
        id: movieId,
        title: `Demo Movie ${movieId}`,
        synopsis: 'Demo synopsis',
        shows: generateDemoShows(movieId),
      }];
    } else {
      return [1, 2].map((n) => ({
        id: `demo-${n}`,
        title: `Demo Movie ${n}`,
        synopsis: `Demo synopsis ${n}`,
        shows: generateDemoShows(`demo-${n}`),
      }));
    }
  };

  useEffect(() => {
    if (movies && movies.length > 0) {
      const needsUpdate = movies.some(m => !Array.isArray(m.shows) || m.shows.length === 0);
      if (needsUpdate) {
        const updated = movies.map((m) => {
          if (Array.isArray(m.shows) && m.shows.length > 0) return m;
          return { ...m, shows: generateDemoShowsForMovie(m) };
        });
        setMovies(updated);
      }
    } else if (!loading && (!movies || movies.length === 0)) {
      // Show a single demo movie with multiple showtimes so the demo page
      // focuses on booking different times for one movie.
      const demoId = movieId || 'demo-1';
      const singleDemo = {
        id: demoId,
        title: movieId ? `Demo Movie ${movieId}` : 'Demo Movie 1',
        synopsis: 'Demo synopsis',
        shows: generateDemoShows(demoId),
      };
      setMovies([singleDemo]);
    }
  }, [movies, loading]);

  function generateDemoShowsForMovie(movie) {
    const baseId = movie.id || 'demo-m';
    return generateDemoShows(baseId);
  }

  function generateDemoShows(seed) {
    const now = Date.now();
    // Use small sequential IDs that are more likely to exist in the database
    const baseId = parseInt(seed.toString().replace(/\D/g, '') || '1'); // Extract numbers or default to 1
    
    // Generate future dates: start from 2 hours from now, then add 3-hour intervals
    return [0, 1, 2, 3].map((i) => ({ 
      id: baseId + i, // Use small sequential IDs like 1, 2, 3, 4 instead of 1000, 1001, etc.
      startTime: new Date(now + (2 + i * 3) * 3600 * 1000).toISOString(), // 2h, 5h, 8h, 11h from now
      runtimeMinutes: 120, 
      auditorium: `Aud ${i + 1}` 
    }));
  }

  function retry() {
    loadMoviesAndShowtimes();
  }

  // Apply client-side name filter using global search query and filters
  const { query, filters } = useSearch();
  const navigate = useNavigate();
  const moviesFiltered = useMemo(() => {
    // If we're showing demo data (ids start with 'demo'), bypass the global search
    const isDemo = Array.isArray(movies) && movies.length > 0 && movies.every((m) => String(m.id).startsWith('demo'));
    // If demo, keep local behavior
    if (isDemo) return movies;

    // If name filter is active and a query exists, redirect user to /movies so search results are shown there
    const qRaw = (query || '').trim();
    if (filters && filters.name && qRaw) {
      // navigate to /movies which will render search results using SearchContext
      // Use a short timeout to avoid calling navigate during render of useMemo
      setTimeout(() => navigate('/movies'), 0);
      return movies;
    }
    const qLower = qRaw.toLowerCase();
    if (!filters || !filters.name) return movies;
    if (!qLower) return movies;
    return movies.filter((m) => (m.title || '').toLowerCase().includes(qLower));
  }, [movies, query, filters]);

  // Server-backed search disabled while disconnected from DB. Client-side filtering still applies.

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'transparent' }}>
      <div style={{ width: '720px', background: '#0f1417', color: '#f4f6f8', padding: 28, borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#fff' }}>Show Times</h1>
          <p style={{ margin: '6px 0 0', color: '#cbd5da' }}>Pick a movie and time to start your booking.</p>
        </header>

        {loading ? (
          <div style={{ color: '#cbd5da' }}>Loading shows…</div>
        ) : error ? (
          <div>
            <div style={{ color: '#ff6b6b' }}>Error: {error}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={retry} style={{ background: '#7a1f1f', color: '#fff', borderRadius: 6, padding: '8px 12px', border: 'none' }}>Retry</button>
            </div>
          </div>
        ) : (
          <div>
            {movies.length === 0 ? (
                <div style={{ color: '#cbd5da' }}>No shows available right now.</div>
              ) : (
                <ShowList movies={moviesFiltered} />
              )}
          </div>
        )}
      </div>
    </div>
  );
}
