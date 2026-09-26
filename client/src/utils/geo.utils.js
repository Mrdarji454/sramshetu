/**
 * Client-Side Geospatial Utilities & Locality Presets
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate great-circle distance between two points in kilometers (Haversine)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const lat1Num = Number(lat1);
  const lon1Num = Number(lon1);
  const lat2Num = Number(lat2);
  const lon2Num = Number(lon2);

  if (isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
    return 0;
  }

  if (lat1Num === lat2Num && lon1Num === lon2Num) return 0;

  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2Num - lat1Num);
  const dLon = toRad(lon2Num - lon1Num);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1Num)) *
    Math.cos(toRad(lat2Num)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = EARTH_RADIUS_KM * c;
  return Math.round(d * 10) / 10;
}

/**
 * Format distance in human-friendly format (meters or kilometers)
 */
export function formatDistance(distanceKm) {
  const km = Number(distanceKm);
  if (isNaN(km)) return 'N/A';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Standard testing and live locality presets in Pune / Maharashtra
 */
export const LOCALITY_PRESETS = [
  {
    name: 'Kothrud (Paud Road)',
    city: 'Pune',
    pincode: '411038',
    latitude: 18.5074,
    longitude: 73.8077,
    landmark: 'Near Kothrud Bus Depot',
  },
  {
    name: 'Deccan Gymkhana (FC Road)',
    city: 'Pune',
    pincode: '411004',
    latitude: 18.5167,
    longitude: 73.8415,
    landmark: 'Opposite Fergusson College',
  },
  {
    name: 'Shivajinagar (Agriculture College)',
    city: 'Pune',
    pincode: '411005',
    latitude: 18.5314,
    longitude: 73.8446,
    landmark: 'Near Shivajinagar Railway Station',
  },
  {
    name: 'Swargate & Sarasbaug',
    city: 'Pune',
    pincode: '411042',
    latitude: 18.5018,
    longitude: 73.8636,
    landmark: 'Swargate ST Stand',
  },
  {
    name: 'Viman Nagar (Symbiosis)',
    city: 'Pune',
    pincode: '411014',
    latitude: 18.5679,
    longitude: 73.9143,
    landmark: 'Near Phoenix Marketcity',
  },
  {
    name: 'Hadapsar (Magarpatta City)',
    city: 'Pune',
    pincode: '411028',
    latitude: 18.5089,
    longitude: 73.9259,
    landmark: 'Magarpatta South Gate',
  },
  {
    name: 'Aundh (Bremen Chowk)',
    city: 'Pune',
    pincode: '411007',
    latitude: 18.558,
    longitude: 73.807,
    landmark: 'Near D-Mart Aundh',
  },
  {
    name: 'Pimpri-Chinchwad (Bhakti Shakti)',
    city: 'Pune',
    pincode: '411018',
    latitude: 18.6279,
    longitude: 73.7997,
    landmark: 'Old Mumbai-Pune Highway',
  },
];

/**
 * Reverse geocode latitude/longitude coordinates into human-readable address
 */
export async function reverseGeocode(latitude, longitude) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
      const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Pune';
      const state = addr.state || 'Maharashtra';
      const pincode = addr.postcode || '';
      const displayName = road ? `${road}, ${city}` : (data.display_name?.split(',').slice(0, 3).join(',') || `${city}, ${state}`);
      return {
        street: road,
        city,
        state,
        pincode,
        displayName,
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding network error:', err);
  } finally { clearTimeout(timeout); }

  // Find closest preset locality if reverse geocode fails
  let closest = LOCALITY_PRESETS[0];
  let minDistance = Infinity;
  for (const p of LOCALITY_PRESETS) {
    const d = calculateDistance(latitude, longitude, p.latitude, p.longitude);
    if (d < minDistance) {
      minDistance = d;
      closest = p;
    }
  }

  if (minDistance > 5) return { street: '', city: '', state: '', pincode: '', displayName: `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})` };
  return {
    street: closest.landmark || '',
    city: closest.city || 'Pune',
    state: 'Maharashtra',
    pincode: closest.pincode || '411038',
    displayName: minDistance < 15 ? closest.name : `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
  };
}

/**
 * Obtain user's live device coordinates using HTML5 Geolocation API
 * Throws user-friendly error if permission denied or unavailable
 */
export function getUserCoordinates() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const secureContextRequired =
        typeof window !== 'undefined' && window.isSecureContext === false;
      return reject(
        new Error(
          secureContextRequired
            ? 'Location access requires a secure connection. Open this site using HTTPS or localhost.'
            : 'Geolocation is not supported by your browser.',
        ),
      );
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          resolve({
            latitude,
            longitude,
            source: 'gps',
            name: address?.displayName || `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            street: address?.street || '',
            city: address?.city || '',
            state: address?.state || '',
            pincode: address?.pincode || '',
          });
        } catch {
          resolve({
            latitude,
            longitude,
            source: 'gps',
            name: `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            city: 'Pune',
            state: 'Maharashtra',
          });
        }
      },
      (error) => {
        let errorMsg = 'Unable to retrieve location.';
        if (error.code === 1) {
          errorMsg = 'Location permission was denied. Allow location access for this site in your browser settings, then try again.';
        } else if (error.code === 2) {
          errorMsg = 'Location is currently unavailable on this device.';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out. Check that device location is enabled, then try again.';
        }
        reject(new Error(errorMsg));
      },
      { timeout: 20000, maximumAge: 60000, enableHighAccuracy: false }
    );
  });
}
