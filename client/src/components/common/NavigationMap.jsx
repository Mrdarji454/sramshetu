import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { routeService } from "../../services/route.service";
import { MapPin, Navigation, Clock, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/**
 * NavigationMap Component
 * Displays interactive map with shortest route from worker location to customer location
 * Includes ETA calculation similar to Google Maps
 */
export function NavigationMap({
  workerCoordinates = null, // [lng, lat]
  customerCoordinates = null, // [lng, lat]
  workerName = "Worker",
  customerName = "Customer",
  onRouteCalculated = () => {},
  showETA = true,
  interactive = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map centered on customer location or default
    const defaultCenter = customerCoordinates
      ? [customerCoordinates[1], customerCoordinates[0]]
      : [19.076, 72.8479]; // Default to Mumbai
    const defaultZoom = customerCoordinates ? 14 : 12;

    const map = L.map(mapContainerRef.current).setView(defaultCenter, defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Calculate and display route
  useEffect(() => {
    const calculateRoute = async () => {
      if (!workerCoordinates || !customerCoordinates) return;
      if (!mapInstanceRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Get route from OSRM
        const result = await routeService.getRoute(
          workerCoordinates,
          customerCoordinates
        );

        if (!result.success) {
          setError(result.error || "Failed to calculate route");
          setLoading(false);
          return;
        }

        setRouteData(result);

        // Calculate ETA
        const etaData = routeService.calculateETA(result.duration);
        setEta(etaData);

        // Callback
        onRouteCalculated({
          distance: result.distance,
          duration: result.duration,
          eta: etaData,
        });

        // Draw custom route polyline
        if (result.geometry && result.geometry.coordinates) {
          const coordinates = result.geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]); // Swap to lat,lng for Leaflet

          // Draw polyline
          const polyline = L.polyline(coordinates, {
            color: "#ff6b35", // Orange/saffron color
            weight: 4,
            opacity: 0.8,
            className: "route-line",
          }).addTo(mapInstanceRef.current);

          // Fit map to route
          const group = new L.FeatureGroup([polyline]);
          mapInstanceRef.current.fitBounds(group.getBounds(), {
            padding: [50, 50],
          });
        }

        // Add markers
        if (workerCoordinates) {
          L.circleMarker([workerCoordinates[1], workerCoordinates[0]], {
            radius: 8,
            fillColor: "#4CAF50",
            color: "#2E7D32",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
            title: workerName,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<strong>${workerName}</strong><br/>Current Location`);
        }

        if (customerCoordinates) {
          L.marker([customerCoordinates[1], customerCoordinates[0]], {
            title: customerName,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(
              `<strong>${customerName}</strong><br/>Destination<br/>` +
                (result.duration
                  ? `ETA: ${result.duration} min`
                  : "")
            );
        }
      } catch (err) {
        console.error("Route calculation error:", err);
        setError(err.message || "Failed to calculate route");
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [workerCoordinates, customerCoordinates, onRouteCalculated]);

  // Format distance display
  const distanceDisplay = routeData
    ? routeData.distance < 1
      ? `${(routeData.distance * 1000).toFixed(0)}m`
      : `${routeData.distance.toFixed(1)}km`
    : null;

  const durationDisplay = routeData
    ? routeService.formatDuration(routeData.duration)
    : null;

  return (
    <div className="w-full space-y-3">
      {/* Route Summary Card */}
      {routeData && (
        <div className="bg-gradient-to-r from-brand-saffron-50 to-amber-50 border border-brand-saffron-200 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-brand-saffron-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Shortest Route
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {distanceDisplay} • {durationDisplay}
                </p>
              </div>
            </div>
            {showETA && eta && (
              <div className="text-right">
                <p className="text-[11px] font-medium text-slate-600">
                  ETA
                </p>
                <p className="text-sm font-bold text-brand-saffron-700">
                  {eta.minutesUntilArrival} min
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {eta.arrivalTimeFormatted}
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-saffron-200/50">
            <div className="flex items-center gap-1.5 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-brand-saffron-600" />
              <span className="text-slate-700">
                <strong>{workerName}</strong> → <strong>{customerName}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
          Calculating shortest route...
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full rounded-xl border border-slate-200 shadow-md overflow-hidden bg-slate-100" style={{ minHeight: "250px", maxHeight: "350px", position: "relative", zIndex: 1 }}>
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ minHeight: "250px", maxHeight: "350px" }}
        />
      </div>

      {/* Route Details */}
      {routeData && !loading && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              Distance
            </p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {distanceDisplay}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              Duration
            </p>
            <p className="text-lg font-bold text-brand-saffron-600 mt-1">
              {durationDisplay}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              ETA
            </p>
            {eta && (
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {eta.minutesUntilArrival}m
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {interactive && routeData && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            icon={MapPin}
            onClick={() => {
              // Open in Google Maps
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${workerCoordinates[1]},${workerCoordinates[0]}&destination=${customerCoordinates[1]},${customerCoordinates[0]}&travelmode=driving`;
              window.open(mapsUrl, "_blank");
            }}
          >
            View in Google Maps
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={Navigation}
            onClick={() => {
              // Start navigation
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${workerCoordinates[1]},${workerCoordinates[0]}&destination=${customerCoordinates[1]},${customerCoordinates[0]}&travelmode=driving`;
              window.open(mapsUrl, "_blank");
            }}
          >
            Start Navigation
          </Button>
        </div>
      )}
    </div>
  );
}

export default NavigationMap;
