import api from './api';

const bookingApi = {
  getMovies() {
    return api.get('/movies');
  },
  getShowsForMovie(movieId) {
    return api.get(`/movies/${movieId}/shows`);
  },
  getSeatMap(showId) {
    return api.get(`/shows/${showId}/seats`);
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