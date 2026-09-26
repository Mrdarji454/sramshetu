import apiClient from './apiClient';

export const pincodeService = {
  /**
   * Lookup Indian 6-digit postal pincode details
   */
  async lookupPincode(pincode) {
    const clean = String(pincode || '').trim();
    if (!clean || !/^[1-9][0-9]{5}$/.test(clean)) {
      throw new Error('Please enter a valid 6-digit Indian postal PIN code');
    }
    const response = await apiClient.get(`/pincode/${clean}`);
    // Support { success: true, data: { ... } } or raw object
    const payload = response?.data !== undefined ? response.data : response;
    return payload?.data !== undefined ? payload.data : payload;
  },

  /**
   * Reverse Geocode (Latitude & Longitude -> Address components)
   */
  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Valid numeric latitude and longitude coordinates are required');
    }
    const response = await apiClient.get('/pincode/reverse-geocode', {
      params: { lat, lng },
    });
    const payload = response?.data !== undefined ? response.data : response;
    return payload?.data !== undefined ? payload.data : payload;
  },
};

export default pincodeService;
