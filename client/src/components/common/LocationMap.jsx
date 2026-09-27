import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const validCoordinates = (point) =>
  Array.isArray(point) &&
  point.length === 2 &&
  point.every(Number.isFinite) &&
  Math.abs(point[0]) <= 180 &&
  Math.abs(point[1]) <= 90 &&
  point.some((n) => n !== 0);
// All public component coordinates use GeoJSON ordering: [longitude, latitude].
export function LocationMap({
  coordinates,
  workerCoordinates,
  radiusKm,
  kind = "customer",
  customerLocations = [],
  onPick,
}) {
  const container = useRef(null);
  const map = useRef(null);
  const layers = useRef(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    if (!container.current) return;
    map.current = L.map(container.current, { scrollWheelZoom: false }).setView(
      [18.5204, 73.8567],
      12,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);
    layers.current = L.layerGroup().addTo(map.current);
    map.current.on("click", (e) =>
      pick.current?.([e.latlng.lng, e.latlng.lat]),
    );
    const resize = new ResizeObserver(() => map.current?.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layers.current.clearLayers();
    const points = [];
    const icon = (label, color) =>
      L.divIcon({
        html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:${color};color:white;border:3px solid white;box-shadow:0 2px 8px #0004;font-weight:bold">${label}</span>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    if (validCoordinates(coordinates)) {
      const destination = [coordinates[1], coordinates[0]];
      points.push(destination);
      L.marker(destination, {
        icon: icon(
          kind === "cooperative" ? "C" : kind === "worker" ? "W" : "H",
          "#ea580c",
        ),
      })
        .bindTooltip(
          kind === "customer"
            ? "Customer / destination"
            : kind === "worker"
              ? "Worker service area"
              : "Cooperative service area",
        )
        .addTo(layers.current);
      if (radiusKm) {
        const serviceRadius = L.circle(destination, {
          radius: radiusKm * 1000,
          color: "#ea580c",
          fillColor: "#f97316",
          fillOpacity: 0.08,
        }).addTo(layers.current);
        points.push(
          serviceRadius.getBounds().getSouthWest(),
          serviceRadius.getBounds().getNorthEast(),
        );
      }
    }
    if (validCoordinates(workerCoordinates)) {
      const worker = [workerCoordinates[1], workerCoordinates[0]];
      points.push(worker);
      L.marker(worker, { icon: icon("W", "#059669") })
        .bindTooltip("Worker location")
        .addTo(layers.current);
      if (validCoordinates(coordinates)) {
        const destination = [coordinates[1], coordinates[0]];
        L.polyline([worker, destination], {
          color: "#ea580c",
          dashArray: "6 6",
        }).addTo(layers.current);
      }
    }
    customerLocations.forEach((location, index) => {
      if (!validCoordinates(location.coordinates)) return;
      const customer = [location.coordinates[1], location.coordinates[0]];
      points.push(customer);
      const marker = L.circleMarker(customer, {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: location.withinServiceRadius ? "#059669" : "#d97706",
        fillOpacity: 1,
      }).addTo(layers.current);
      const tooltip = document.createElement("span");
      tooltip.textContent =
        location.label || `Active customer booking ${index + 1}`;
      marker.bindTooltip(tooltip);
    });
    if (points.length > 1) {
      map.current.fitBounds(L.latLngBounds(points), {
        padding: [36, 36],
        maxZoom: 14,
      });
    } else if (points.length === 1) {
      map.current.setView(points[0], radiusKm ? 12 : 15);
    }
  }, [
    coordinates?.[0],
    coordinates?.[1],
    workerCoordinates?.[0],
    workerCoordinates?.[1],
    radiusKm,
    kind,
    customerLocations,
  ]);
  return (
    <div>
      <div
        ref={container}
        className="relative z-0 h-64 w-full rounded-2xl border border-slate-200"
        aria-label={`${kind} location map`}
      />
      {onPick && (
        <p className="mt-2 text-xs text-slate-500">
          Click the map to set the service location. Check that the pin matches
          your address.
        </p>
      )}
    </div>
  );
}
