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
 * Obtain user's live device coordinates using HTML5 Geolocation API
 * Falls back gracefully to default Kothrud location if denied or unavailable
 */
export function getUserCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: LOCALITY_PRESETS[0].latitude,
        longitude: LOCALITY_PRESETS[0].longitude,
        source: 'fallback',
        name: LOCALITY_PRESETS[0].name,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
          name: 'Your GPS Location',
        });
      },
      () => {
        resolve({
          latitude: LOCALITY_PRESETS[0].latitude,
          longitude: LOCALITY_PRESETS[0].longitude,
          source: 'fallback',
          name: LOCALITY_PRESETS[0].name,
        });
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}

