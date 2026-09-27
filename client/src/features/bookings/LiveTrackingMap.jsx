import React, { useEffect, useState } from 'react';
import { LocationMap, validCoordinates } from '../../components/common/LocationMap';
import { routeService } from '../../services/route.service';
import { Navigation, Clock, MapPin } from 'lucide-react';

// Replace this adapter with a GPS subscription later; simulation never mutates booking state.
export function simulatedPosition(destination, elapsedSeconds) {
  const remaining = Math.max(0.05, 1 - elapsedSeconds / 600);
  return [destination[0] + 0.025 * remaining, destination[1] + 0.018 * remaining];
}

export function LiveTrackingMap({ booking }) {
  const [elapsed, setElapsed] = useState(0);
  const [routeData, setRouteData] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(false);

  // Timer for elapsed time
  useEffect(() => {
    setElapsed(0);
    const timer = setInterval(() => setElapsed(value => value + 5), 5000);
    return () => clearInterval(timer);
  }, [booking._id || booking.id]);

  // Calculate route and ETA
  useEffect(() => {
    const calculateRoute = async () => {
      const workerCoords = booking.workerLocation?.coordinates;
      const destination = booking.customerLocation || booking.location?.coordinates;

      if (!validCoordinates(workerCoords) || !validCoordinates(destination)) {
        return;
      }

      setLoading(true);
      try {
        const result = await routeService.getRoute(workerCoords, destination);
        if (result.success) {
          setRouteData(result);
          const etaData = routeService.calculateETA(result.duration);
          setEta(etaData);
        }
      } catch (err) {
        console.error('Route calculation error:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();
  }, [booking]);

  const destination = booking.customerLocation || booking.location?.coordinates;
  if (!validCoordinates(destination)) {
    return (
      <p className="my-4 text-sm text-slate-500">
        Tracking needs a confirmed location pin for this booking.
      </p>
    );
  }

  const live = booking.workerLocation?.source === 'gps' && validCoordinates(booking.workerLocation?.coordinates);
  const position = live ? booking.workerLocation.coordinates : simulatedPosition(destination, elapsed);
  const distanceDisplay = routeData
    ? routeData.distance < 1
      ? `${(routeData.distance * 1000).toFixed(0)}m`
      : `${routeData.distance.toFixed(1)}km`
    : null;
  const durationDisplay = routeData
    ? routeService.formatDuration(routeData.duration)
    : null;

  return (
    <section className="my-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-brand-saffron-600" />
          Artisan en route
        </h4>
        {eta && (
          <div className="text-right">
            <div className="text-xs font-bold text-brand-saffron-700">
              ETA: {eta.minutesUntilArrival} min
            </div>
            <div className="text-[11px] text-slate-500">
              {eta.arrivalTimeFormatted}
            </div>
          </div>
        )}
      </div>

      {/* Route Summary */}
      {routeData && (
        <div className="bg-gradient-to-r from-brand-saffron-50 to-amber-50 border border-brand-saffron-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-brand-saffron-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-600">Shortest Route</p>
              <p className="text-sm font-bold text-slate-900">{distanceDisplay} • {durationDisplay}</p>
            </div>
          </div>
          <Clock className="w-4 h-4 text-brand-saffron-600 flex-shrink-0" />
        </div>
      )}

      {/* Map */}
      <LocationMap coordinates={destination} workerCoordinates={position} />

      {/* Status Text */}
      <p className="text-xs text-slate-500">
        {live ? 'GPS location' : `Simulated tracking · ${routeData ? `${routeData.duration} min ETA` : 'Estimated arrival: ' + Math.max(1, Math.ceil((600 - elapsed) / 60)) + ' min'}`} · Dashed line shows direction, not a road route.
      </p>
    </section>
  );
}
