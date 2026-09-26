import apiClient from './apiClient';

export const otpService = {
  /**
   * Send OTP to phone number
   */
  async sendOtp(phone) {
    const response = await apiClient.post('/auth/otp/send', { phone });
    return response.data?.data || response.data;
  },

  /**
   * Verify entered OTP
   */
  async verifyOtp(phone, otp) {
    const response = await apiClient.post('/auth/otp/verify', { phone, otp });
    return response.data?.data || response.data;
  },
};

export default otpService;
