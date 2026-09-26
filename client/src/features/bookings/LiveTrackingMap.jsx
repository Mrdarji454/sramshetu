import React, { useEffect, useState } from 'react';
import { LocationMap, validCoordinates } from '../../components/common/LocationMap';

// Replace this adapter with a GPS subscription later; simulation never mutates booking state.
export function simulatedPosition(destination, elapsedSeconds) {
  const remaining = Math.max(0.05, 1 - elapsedSeconds / 600);
  return [destination[0] + 0.025 * remaining, destination[1] + 0.018 * remaining];
}
export function LiveTrackingMap({ booking }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    const timer = setInterval(() => setElapsed(value => value + 5), 5000);
    return () => clearInterval(timer);
  }, [booking._id || booking.id]);
  const destination = booking.customerLocation || booking.location?.coordinates;
  if (!validCoordinates(destination)) return <p className="my-4 text-sm text-slate-500">Tracking needs a confirmed location pin for this booking.</p>;
  const live = booking.workerLocation?.source === 'gps' && validCoordinates(booking.workerLocation?.coordinates);
  const position = live ? booking.workerLocation.coordinates : simulatedPosition(destination, elapsed);
  return <section className="my-5 space-y-2"><h4 className="font-bold text-slate-900">Artisan en route</h4><LocationMap coordinates={destination} workerCoordinates={position} /><p className="text-xs text-slate-500">{live ? 'GPS location' : `Simulated tracking · Estimated arrival: ${Math.max(1, Math.ceil((600 - elapsed) / 60))} min`} · Dashed line shows direction, not a road route.</p></section>;
}
