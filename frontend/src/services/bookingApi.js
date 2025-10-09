import api from './api';

const bookingApi = {
  getMovies() {
    // accept optional params object: { q, page, size }
    // callers may pass query params to use server-side search/pagination
    const args = Array.from(arguments);
    const params = args[0] || undefined;
    return api.get('/movies', params ? { params } : undefined);
  },
  getShowsForMovie(movieId) {
    return api.get(`/movies/${movieId}/shows`);
  },
  getSeatMap(showId) {
    // accept optional params argument: getSeatMap(showId, { q, page, size })
    const args = Array.from(arguments);
    const params = args[1] || undefined;
    return api.get(`/shows/${showId}/seats`, params ? { params } : undefined);
  },
  reserveSeats(showId, body) {
    return api.post(`/shows/${showId}/reserve`, body);
  },
  createOrder(body) {
    return api.post('/orders', body);
  },
  confirmOrder(orderId) {
    return api.post(`/orders/${orderId}/confirm`);
  },
  getOrder(orderId) {
    return api.get(`/orders/${orderId}`);
  },
};

export default bookingApi;