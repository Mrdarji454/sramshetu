import axios from 'axios';
import { config } from '../config/env.js';

// Fast in-memory cache to reduce network calls
const pincodeCache = new Map();

// Built-in Indian Postal Circle Prefix Mapping as immediate fallback when external service is offline
const PINCODE_PREFIX_MAP = {
  '11': { state: 'Delhi', district: 'New Delhi' },
  '12': { state: 'Haryana', district: 'Gurugram' },
  '13': { state: 'Haryana', district: 'Ambala' },
  '14': { state: 'Punjab', district: 'Ludhiana' },
  '15': { state: 'Punjab', district: 'Bathinda' },
  '16': { state: 'Punjab & Chandigarh', district: 'Chandigarh' },
  '17': { state: 'Himachal Pradesh', district: 'Shimla' },
  '18': { state: 'Jammu & Kashmir', district: 'Jammu' },
  '19': { state: 'Jammu & Kashmir', district: 'Srinagar' },
  '20': { state: 'Uttar Pradesh', district: 'Ghaziabad' },
  '21': { state: 'Uttar Pradesh', district: 'Allahabad' },
  '22': { state: 'Uttar Pradesh', district: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', district: 'Varanasi' },
  '24': { state: 'Uttarakhand', district: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', district: 'Meerut' },
  '26': { state: 'Uttarakhand', district: 'Nainital' },
  '27': { state: 'Uttar Pradesh', district: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', district: 'Agra' },
  '30': { state: 'Rajasthan', district: 'Jaipur' },
  '31': { state: 'Rajasthan', district: 'Udaipur' },
  '32': { state: 'Rajasthan', district: 'Kota' },
  '33': { state: 'Rajasthan', district: 'Bikaner' },
  '34': { state: 'Rajasthan', district: 'Jodhpur' },
  '36': { state: 'Gujarat', district: 'Rajkot' },
  '37': { state: 'Gujarat', district: 'Kutch' },
  '38': { state: 'Gujarat', district: 'Ahmedabad' },
  '39': { state: 'Gujarat', district: 'Surat' },
  '40': { state: 'Maharashtra & Goa', district: 'Mumbai' },
  '41': { state: 'Maharashtra', district: 'Pune' },
  '42': { state: 'Maharashtra', district: 'Nashik' },
  '43': { state: 'Maharashtra', district: 'Aurangabad' },
  '44': { state: 'Maharashtra', district: 'Nagpur' },
  '45': { state: 'Madhya Pradesh', district: 'Indore' },
  '46': { state: 'Madhya Pradesh', district: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', district: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', district: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', district: 'Raipur' },
  '50': { state: 'Telangana', district: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', district: 'Tirupati' },
  '52': { state: 'Andhra Pradesh', district: 'Vijayawada' },
  '53': { state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  '56': { state: 'Karnataka', district: 'Bengaluru' },
  '57': { state: 'Karnataka', district: 'Mangaluru' },
  '58': { state: 'Karnataka', district: 'Hubballi' },
  '59': { state: 'Karnataka', district: 'Belagavi' },
  '60': { state: 'Tamil Nadu', district: 'Chennai' },
  '61': { state: 'Tamil Nadu', district: 'Thanjavur' },
  '62': { state: 'Tamil Nadu', district: 'Madurai' },
  '63': { state: 'Tamil Nadu', district: 'Vellore' },
  '64': { state: 'Tamil Nadu', district: 'Coimbatore' },
  '67': { state: 'Kerala', district: 'Kozhikode' },
  '68': { state: 'Kerala', district: 'Ernakulam' },
  '69': { state: 'Kerala', district: 'Thiruvananthapuram' },
  '70': { state: 'West Bengal', district: 'Kolkata' },
  '71': { state: 'West Bengal', district: 'Howrah' },
  '72': { state: 'West Bengal', district: 'Medinipur' },
  '73': { state: 'West Bengal', district: 'Siliguri' },
  '74': { state: 'West Bengal', district: 'North 24 Parganas' },
  '75': { state: 'Odisha', district: 'Bhubaneswar' },
  '76': { state: 'Odisha', district: 'Cuttack' },
  '77': { state: 'Odisha', district: 'Rourkela' },
  '78': { state: 'Assam', district: 'Guwahati' },
  '79': { state: 'North East', district: 'Shillong' },
  '80': { state: 'Bihar', district: 'Patna' },
  '81': { state: 'Bihar', district: 'Bhagalpur' },
  '82': { state: 'Bihar', district: 'Gaya' },
  '83': { state: 'Jharkhand', district: 'Ranchi' },
  '84': { state: 'Bihar', district: 'Muzaffarpur' },
  '85': { state: 'Bihar', district: 'Purnia' },
};

export class PincodeService {
  /**
   * Lookup Indian 6-digit postal pincode details (State, District, City)
   */
  static async lookup(pincode) {
    const cleanPin = String(pincode || '').trim();

    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      throw new Error('Invalid 6-digit Indian PIN code format. It must be a 6-digit number starting with 1-9.');
    }

    if (pincodeCache.has(cleanPin)) {
      return pincodeCache.get(cleanPin);
    }

    const apiUrl = config.pincodeApiUrl || 'https://api.postalpincode.in/pincode';

    // 1. Query Indian Postal Pincode API
    try {
      const response = await axios.get(`${apiUrl}/${cleanPin}`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ShramSetu-Digital-Marketplace/1.0',
        },
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const item = response.data[0];

        // Explicit error or no records found from Indian Postal API
        if (item.Status === 'Error' || !Array.isArray(item.PostOffice) || item.PostOffice.length === 0) {
          throw new Error(`Invalid or non-existent PIN code (${cleanPin}). Please check and try again.`);
        }

        const postOffices = item.PostOffice;
        const primaryPO = postOffices[0];

        const state = primaryPO.State || '';
        const district = primaryPO.District || '';
        const city = (primaryPO.Block && primaryPO.Block !== 'NA' ? primaryPO.Block : null) ||
                     primaryPO.District ||
                     primaryPO.Name ||
                     '';
        const localities = [...new Set(postOffices.map((po) => po.Name).filter(Boolean))];

        const result = {
          pincode: cleanPin,
          state,
          district,
          city,
          localities,
          country: 'India',
        };

        pincodeCache.set(cleanPin, result);
        return result;
      }
    } catch (apiErr) {
      // If the API explicitly told us the PIN is invalid, rethrow that error immediately
      if (apiErr.message && apiErr.message.includes('Invalid or non-existent PIN code')) {
        throw apiErr;
      }
      // On network failure or timeout, attempt fallback using verified prefix mapping
    }

    // 2. Offline fallback using PIN prefix (only if prefix is recognized)
    const prefix = cleanPin.substring(0, 2);
    const fallback = PINCODE_PREFIX_MAP[prefix];

    if (fallback) {
      const result = {
        pincode: cleanPin,
        state: fallback.state,
        district: fallback.district,
        city: fallback.district,
        localities: [],
        country: 'India',
        isOfflineEstimate: true,
      };

      pincodeCache.set(cleanPin, result);
      return result;
    }

    throw new Error(`Invalid or unrecognized PIN code (${cleanPin}). Please verify your postal code.`);
  }

  /**
   * Reverse Geocode (lat, lng) to Address and PIN code components
   */
  static async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Valid latitude (-90 to 90) and longitude (-180 to 180) coordinates are required');
    }

    const nominatimUrl = config.nominatimApiUrl || 'https://nominatim.openstreetmap.org/reverse';

    // 1. Primary: OpenStreetMap Nominatim reverse geocoding
    try {
      const response = await axios.get(nominatimUrl, {
        params: {
          format: 'json',
          lat,
          lon: lng,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'ShramSetu-Digital-Marketplace/1.0 (contact@shramsetu.in)',
          'Accept-Language': 'en',
        },
        timeout: 5000,
      });

      if (response.data && response.data.address) {
        const addr = response.data.address;
        const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
        const state = addr.state || '';
        const district = addr.state_district || addr.county || addr.city_district || addr.city || '';
        const city = addr.city || addr.town || addr.village || addr.suburb || district || '';
        const displayName = response.data.display_name || '';

        return {
          latitude: lat,
          longitude: lng,
          pincode,
          state,
          district,
          city,
          line1: displayName,
          addressLine1: displayName,
          addressLine: displayName,
          country: addr.country || 'India',
        };
      }
    } catch {
      // Fall through to secondary reverse geocoding
    }

    // 2. Secondary fallback: BigDataCloud client reverse geocode API
    try {
      const bdcRes = await axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
        params: {
          latitude: lat,
          longitude: lng,
          localityLanguage: 'en',
        },
        timeout: 4000,
      });

      if (bdcRes.data) {
        const d = bdcRes.data;
        const pincode = d.postcode ? String(d.postcode).replace(/\D/g, '').slice(0, 6) : '';
        const state = d.principalSubdivision || '';
        const city = d.city || d.locality || '';
        const district = d.locality || d.city || '';
        const line1 = [d.locality, d.city, d.principalSubdivision].filter(Boolean).join(', ');

        return {
          latitude: lat,
          longitude: lng,
          pincode,
          state,
          district,
          city,
          line1,
          addressLine1: line1,
          addressLine: line1,
          country: d.countryName || 'India',
        };
      }
    } catch {
      // Both providers unreachable
    }

    // Graceful fallback with coordinates preserved so existing form values are not corrupted
    return {
      latitude: lat,
      longitude: lng,
      pincode: '',
      state: '',
      district: '',
      city: '',
      line1: '',
      addressLine1: '',
      addressLine: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      country: 'India',
    };
  }
}

