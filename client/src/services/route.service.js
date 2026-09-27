/**
 * Route Navigation Service
 * Uses OSRM (Open Source Routing Machine) for shortest route calculations
 * and estimated time of arrival (ETA) calculations
 */

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

export const routeService = {
  /**
   * Calculate shortest route between two coordinates
   * @param {[number, number]} origin - [longitude, latitude]
   * @param {[number, number]} destination - [longitude, latitude]
   * @returns {Promise<Object>} Route data with distance, duration, and geometry
   */
  async getRoute(origin, destination) {
    try {
      if (!origin || !destination) {
        throw new Error("Origin and destination coordinates are required");
      }

      const [originLng, originLat] = origin;
      const [destLng, destLat] = destination;

      // OSRM expects coordinates as lng,lat
      const coordinates = `${originLng},${originLat};${destLng},${destLat}`;

      const response = await fetch(
        `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&steps=true`
      );

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("No route found between the two locations");
      }

      const route = data.routes[0];

      return {
        success: true,
        distance: route.distance / 1000, // Convert to km
        duration: Math.ceil(route.duration / 60), // Convert to minutes
        geometry: route.geometry,
        steps: route.legs[0]?.steps || [],
        waypoints: data.waypoints,
      };
    } catch (error) {
      console.error("Error calculating route:", error);
      return {
        success: false,
        error: error.message,
        distance: null,
        duration: null,
      };
    }
  },

  /**
   * Calculate ETA (Estimated Time of Arrival)
   * @param {number} duration - Duration in minutes
   * @param {Date} departureTime - When the worker is departing
   * @returns {Object} ETA details with arrival time and formatted strings
   */
  calculateETA(duration, departureTime = new Date()) {
    const arrivalTime = new Date(
      departureTime.getTime() + duration * 60 * 1000
    );
    const now = new Date();
    const timeDiff = arrivalTime.getTime() - now.getTime();
    const minutesUntilArrival = Math.ceil(timeDiff / (1000 * 60));

    return {
      arrivalTime,
      minutesUntilArrival: Math.max(0, minutesUntilArrival),
      arrivalTimeFormatted: arrivalTime.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      arrivalDateFormatted: arrivalTime.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
      displayText: `ETA: ${Math.max(0, minutesUntilArrival)} min (${arrivalTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })})`,
    };
  },

  /**
   * Get multiple routes and choose the best one
   * @param {[number, number]} origin - [longitude, latitude]
   * @param {[number, number]} destination - [longitude, latitude]
   * @returns {Promise<Object>} Best route with alternatives
   */
  async getBestRoute(origin, destination) {
    try {
      if (!origin || !destination) {
        throw new Error("Origin and destination coordinates are required");
      }

      const [originLng, originLat] = origin;
      const [destLng, destLat] = destination;
      const coordinates = `${originLng},${originLat};${destLng},${destLat}`;

      const response = await fetch(
        `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson&alternatives=true&steps=true`
      );

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("No route found between the two locations");
      }

      const routes = data.routes.map((route) => ({
        distance: route.distance / 1000, // km
        duration: Math.ceil(route.duration / 60), // minutes
        geometry: route.geometry,
        steps: route.legs[0]?.steps || [],
      }));

      return {
        success: true,
        bestRoute: routes[0],
        alternatives: routes.slice(1),
        waypoints: data.waypoints,
      };
    } catch (error) {
      console.error("Error getting best route:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Useful for quick calculations without API calls
   * @param {[number, number]} coord1 - [longitude, latitude]
   * @param {[number, number]} coord2 - [longitude, latitude]
   * @returns {number} Distance in kilometers
   */
  calculateHaversineDistance(coord1, coord2) {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Format duration for display
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  },
};

export default routeService;
