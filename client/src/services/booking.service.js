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

  async createPaymentOrder(bookingId) {
    const response = await apiClient.post(`/payments/${bookingId}/create-order`, {}, { timeout: 45000 });
    return response.data || response;
  },

  async verifyPayment(bookingId, payload) {
    const response = await apiClient.post(`/payments/${bookingId}/verify-payment`, payload, { timeout: 45000 });
    return response.data || response;
  },

  async getPaymentStatus(bookingId) {
    const response = await apiClient.get(`/payments/${bookingId}/payment-status`, { timeout: 45000 });
    return response.data || response;
  },

  async downloadInvoice(bookingId) {
    const response = await apiClient.get(`/payments/${bookingId}/invoice`, { responseType: 'blob' });
    const blob = response.data || response;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ShramSetu-${String(bookingId).slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

