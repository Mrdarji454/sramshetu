import apiClient from '../lib/apiClient';

export const bookingService = {
  async issueOtp(id, stage) { const response = await apiClient.post(`/bookings/${id}/${stage}-otp`); return response.data; },
  async verifyOtp(id, stage, code) { const response = await apiClient.post(`/bookings/${id}/verify-${stage}-otp`, { code }); return response.data; },
  async submitReview(data) { const response = await apiClient.post('/reviews', data); return response.data; },
  async getReview(id) { const response = await apiClient.get(`/reviews/booking/${id}`); return response.data; },
  /**
   * Create a new booking request (Customer)
   */
  async createBooking(bookingData) {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data || response;
  },

  /**
   * Discover suitable cooperatives and available artisans
   */
  async getSuitableCooperativesAndWorkers({ serviceId, trade, city, pincode, latitude, longitude } = {}) {
    const params = {};
    if (serviceId) params.serviceId = serviceId;
    if (trade) params.trade = trade;
    if (city) params.city = city;
    if (pincode) params.pincode = pincode;
    if (latitude != null) params.latitude = latitude;
    if (longitude != null) params.longitude = longitude;
    const response = await apiClient.get('/bookings/suitable', { params });
    return response.data || response;
  },

  /**
   * Get bookings list (scoped to authenticated user's role)
   */
  async getBookings({ status, search } = {}) {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await apiClient.get('/bookings', { params });
    return response.data || response;
  },

  /**
   * Get single booking details
   */
  async getBookingById(id) {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data || response;
  },

  /**
   * Cooperative assigns an available worker to a booking
   */
  async assignWorker(bookingId, workerId) {
    const response = await apiClient.patch(`/bookings/${bookingId}/assign`, { workerId });
    return response.data || response;
  },

  /**
   * Update booking status with state machine verification
   */
  async updateStatus(bookingId, status, payload = {}) {
    const response = await apiClient.patch(`/bookings/${bookingId}/status`, {
      status,
      ...payload,
    });
    return response.data || response;
  },

  /**
   * Worker accepts assignment
   */
  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/bookings/${bookingId}/accept`);
    return response.data || response;
  },

  /**
   * Worker rejects assignment
   */
  async rejectBooking(bookingId, reason) {
    const response = await apiClient.post(`/bookings/${bookingId}/reject`, { reason });
    return response.data || response;
  },
};

export default bookingService;

