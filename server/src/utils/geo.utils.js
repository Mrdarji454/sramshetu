/**
 * Modular Geospatial Utility & Provider
 * 
 * Provides distance calculation, proximity filtering, and travel-time estimation.
 * Designed with a pluggable interface so the default spherical Haversine engine
 * can seamlessly be substituted with external mapping providers (OSRM, Google Distance Matrix, MapmyIndia)
 * in production without altering business logic.
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Standard GeoProvider Interface / Base Implementation
 * Default engine: High-precision Haversine Great-Circle spherical algorithm
 */
export class HaversineGeoProvider {
  /**
   * Calculate distance between two coordinates in kilometers using Haversine formula
   * @param {number} lat1 - Latitude of Point A
   * @param {number} lon1 - Longitude of Point A
   * @param {number} lat2 - Latitude of Point B
   * @param {number} lon2 - Longitude of Point B
   * @returns {number} Distance in kilometers (rounded to 2 decimal places)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const lat1Num = Number(lat1);
    const lon1Num = Number(lon1);
    const lat2Num = Number(lat2);
    const lon2Num = Number(lon2);

    if (isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
      return 999999;
    }

    // Identical point fast-path
    if (lat1Num === lat2Num && lon1Num === lon2Num) {
      return 0;
    }

    const dLat = this.toRadians(lat2Num - lat1Num);
    const dLon = this.toRadians(lon2Num - lon1Num);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1Num)) *
        Math.cos(this.toRadians(lat2Num)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Check if a target coordinate is within a given radius of a center coordinate
   */
  isWithinRadius(targetPoint, centerPoint, radiusKm) {
    const dist = this.calculateDistance(
      targetPoint.latitude || targetPoint.lat,
      targetPoint.longitude || targetPoint.lng || targetPoint.lon,
      centerPoint.latitude || centerPoint.lat,
      centerPoint.longitude || centerPoint.lng || centerPoint.lon
    );
    return dist <= radiusKm;
  }

  /**
   * Estimate urban transit time for an artisan
   * Assumes average two-wheeler city transit speed of 25 km/h + 5 min dispatch prep
   * @param {number} distanceKm 
   * @param {string} mode - 'two_wheeler' | 'transit' | 'walking'
   * @returns {number} Estimated minutes (minimum 5)
   */
  estimateTravelTime(distanceKm, mode = 'two_wheeler') {
    const km = Math.max(0, Number(distanceKm) || 0);
    let avgSpeedKmh = 25; // default two-wheeler in Indian urban hubs
    if (mode === 'walking') avgSpeedKmh = 4.5;
    if (mode === 'transit') avgSpeedKmh = 18;

    const transitMinutes = (km / avgSpeedKmh) * 60;
    const basePrepMinutes = 5;
    return Math.round(basePrepMinutes + transitMinutes);
  }

  /**
   * Helper: Convert degrees to radians
   */
  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }
}

// Active singleton instance (can be swapped via setGeoProvider)
let activeGeoProvider = new HaversineGeoProvider();

/**
 * Configure or substitute the active geospatial provider (e.g. for production OSRM or Google Maps)
 * @param {object} customProvider - Must implement calculateDistance, isWithinRadius, estimateTravelTime
 */
export function setGeoProvider(customProvider) {
  if (customProvider && typeof customProvider.calculateDistance === 'function') {
    activeGeoProvider = customProvider;
  }
}

/**
 * Get current active geospatial provider
 */
export function getGeoProvider() {
  return activeGeoProvider;
}

/**
 * Helper facade methods using the active provider
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  return activeGeoProvider.calculateDistance(lat1, lon1, lat2, lon2);
}

export function isWithinRadius(targetPoint, centerPoint, radiusKm) {
  return activeGeoProvider.isWithinRadius(targetPoint, centerPoint, radiusKm);
}

export function estimateTravelTime(distanceKm, mode) {
  return activeGeoProvider.estimateTravelTime(distanceKm, mode);
}

export function formatDistance(distanceKm) {
  const km = Number(distanceKm);
  if (isNaN(km)) return 'N/A';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

