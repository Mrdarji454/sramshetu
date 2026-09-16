import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Custom Leaflet Map for Location-Based Worker Matching
 * Features OpenStreetMap tiles, custom HTML DivIcons, radius circle overlays,
 * and two-way interaction between map markers and worker cards.
 */
export function WorkerMatchingMap({
  customerLocation,
  workers = [],
  cooperatives = [],
  selectedWorkerId = null,
  onSelectWorker,
  onSelectCooperative,
  onBookWorker,
  searchRadiusKm = 25,
  className = "h-[500px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = customerLocation?.latitude || 18.5074;
    const initialLng = customerLocation?.longitude || 73.8077;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add high-resolution OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • ShramSetu GeoEngine',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers, Overlays and Bounds when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers & overlays
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    const custLat = customerLocation?.latitude || 18.5074;
    const custLng = customerLocation?.longitude || 73.8077;

    // 1. Search Radius Circle around Customer
    circleRef.current = L.circle([custLat, custLng], {
      radius: (searchRadiusKm || 25) * 1000,
      color: "#3B82F6",
      fillColor: "#60A5FA",
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: "5, 5",
    }).addTo(map);

    // 2. Customer Location Pin (Radar Pulse Icon)
    const customerIcon = L.divIcon({
      className: "custom-customer-marker",
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; background: rgba(37, 99, 235, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; background: #2563EB; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; background: #FFFFFF; border-radius: 50%;"></div>
          </div>
          <div style="position: absolute; bottom: -20px; white-space: nowrap; background: #1E293B; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            You
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const customerMarker = L.marker([custLat, custLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: inherit; font-size: 12px; padding: 4px;">
          <strong style="color: #1E293B; display: block; margin-bottom: 2px;">Your Service Address</strong>
          <span style="color: #64748B;">Radius: ${searchRadiusKm} km coverage</span>
        </div>`,
      );
    markersRef.current.push(customerMarker);

    // 3. Cooperative Guild Markers
    cooperatives.forEach((coop) => {
      const coopLat = coop.coordinates?.latitude || coop.latitude || 18.5204;
      const coopLng = coop.coordinates?.longitude || coop.longitude || 73.8436;

      const coopIcon = L.divIcon({
        className: "custom-coop-marker",
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 32px; height: 32px; background: #4F46E5; border: 2.5px solid #FFFFFF; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; transform: rotate(45deg);">
              <div style="transform: rotate(-45deg); color: #FFFFFF; font-size: 14px; font-weight: 800;">🏛️</div>
            </div>
            <div style="position: absolute; top: -6px; right: -6px; background: #10B981; color: white; font-size: 9px; font-weight: bold; padding: 1px 4px; border-radius: 10px; border: 1px solid white;">
              ${coop.trustScore ? `${Math.round(coop.trustScore)}%` : "Gov"}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const coopMarker = L.marker([coopLat, coopLng], { icon: coopIcon }).addTo(
        map,
      );

      const coopPopupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 180px; padding: 4px;">
          <div style="color: #4F46E5; font-size: 10px; font-weight: 700; text-transform: uppercase;">Registered Cooperative</div>
          <strong style="color: #0F172A; font-size: 13px; display: block; margin: 2px 0 4px 0;">${coop.name}</strong>
          <div style="color: #64748B; font-size: 11px;">
            Distance: <strong>${coop.distanceFormatted || "Nearby"}</strong> • Trust: <strong style="color: #059669;">${coop.trustScore || 96}%</strong>
          </div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #475569;">
            ${coop.district || "Pune"}, ${coop.state || "Maharashtra"}
          </div>
        </div>
      `;

      coopMarker.bindPopup(coopPopupHtml);
      coopMarker.on("click", () => {
        if (onSelectCooperative) onSelectCooperative(coop.id || coop._id);
      });

      markersRef.current.push(coopMarker);
    });

    // 4. Worker Artisan Markers
    workers.forEach((item) => {
      const worker = item.worker;
      const workerLat = item.coordinates?.latitude || 18.5204;
      const workerLng = item.coordinates?.longitude || 73.8567;
      const isSelected = selectedWorkerId === (worker.id || worker._id);

      // Icon color based on trade
      const tradeStr = (
        worker.primaryTrade ||
        worker.trade ||
        ""
      ).toLowerCase();
      let badgeEmoji = "⚡";
      let themeColor = "#D97706"; // saffron default
      if (tradeStr.includes("plumb")) {
        badgeEmoji = "💧";
        themeColor = "#0284C7";
      } else if (tradeStr.includes("carpent")) {
        badgeEmoji = "🪚";
        themeColor = "#B45309";
      } else if (tradeStr.includes("mason") || tradeStr.includes("construct")) {
        badgeEmoji = "🧱";
        themeColor = "#475569";
      } else if (tradeStr.includes("paint")) {
        badgeEmoji = "🎨";
        themeColor = "#7C3AED";
      }

      const workerIcon = L.divIcon({
        className: `custom-worker-marker ${isSelected ? "selected-marker" : ""}`,
        html: `
          <div style="position: relative; width: 42px; height: 46px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${isSelected ? "scale(1.2)" : "scale(1)"}; transition: all 0.2s ease;">
            <div style="width: 34px; height: 34px; background: ${isSelected ? "#EA580C" : themeColor}; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">
              ${badgeEmoji}
            </div>
            <div style="background: #0F172A; color: #F8FAFC; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 6px; margin-top: -6px; border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">
              ★ ${item.rating || 4.9}
            </div>
          </div>
        `,
        iconSize: [42, 46],
        iconAnchor: [21, 46],
        popupAnchor: [0, -42],
      });

      const workerMarker = L.marker([workerLat, workerLng], {
        icon: workerIcon,
      }).addTo(map);

      const workerPopupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: #EA580C; text-transform: uppercase;">
              ${item.distanceFormatted} away
            </span>
            <span style="background: #ECFDF5; color: #047857; font-size: 9px; font-weight: bold; padding: 1px 6px; border-radius: 10px;">
              ${item.availability?.status === "available" ? "Available Now" : "On Job"}
            </span>
          </div>

          <strong style="color: #0F172A; font-size: 14px; display: block;">${worker.name}</strong>
          <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">
            ${worker.primaryTrade || worker.trade} • ★ ${item.rating} (${item.ratingCount || 40})
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px; margin-bottom: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748B;">Guild:</span>
              <strong style="color: #1E293B;">${item.cooperative?.name || "Local Cooperative"}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Floor Rate:</span>
              <strong style="color: #0F172A;">₹${worker.rates?.dailyFloorRate || 1100} / day</strong>
            </div>
          </div>

          <button
            id="popup-book-btn-${worker.id || worker._id}"
            style="width: 100%; background: #0F172A; color: #FFFFFF; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s;"
          >
            Book Artisan Directly
          </button>
        </div>
      `;

      workerMarker.bindPopup(workerPopupHtml);

      // Handle popup open to wire Book button
      workerMarker.on("popupopen", () => {
        const btn = document.getElementById(
          `popup-book-btn-${worker.id || worker._id}`,
        );
        if (btn && onBookWorker) {
          btn.onclick = () => onBookWorker(item);
        }
      });

      workerMarker.on("click", () => {
        if (onSelectWorker) onSelectWorker(worker.id || worker._id);
      });

      if (isSelected) {
        setTimeout(() => workerMarker.openPopup(), 100);
      }

      markersRef.current.push(workerMarker);
    });

    // Fit map bounds to encompass all visible markers and customer
    const allCoords = [
      [custLat, custLng],
      ...workers
        .map((w) => [w.coordinates?.latitude, w.coordinates?.longitude])
        .filter(([lat, lng]) => lat && lng),
    ];

    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([custLat, custLng], 13);
    }
  }, [
    customerLocation,
    workers,
    cooperatives,
    selectedWorkerId,
    searchRadiusKm,
  ]);

  // Pan to selected worker when selectedWorkerId changes
  useEffect(() => {
    if (!selectedWorkerId || !mapInstanceRef.current) return;
    const target = workers.find(
      (w) => (w.worker?.id || w.worker?._id) === selectedWorkerId,
    );
    if (target?.coordinates?.latitude && target?.coordinates?.longitude) {
      mapInstanceRef.current.flyTo(
        [target.coordinates.latitude, target.coordinates.longitude],
        14,
        { duration: 0.8 },
      );
    }
  }, [selectedWorkerId, workers]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />

      {/* Overlay Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl px-3 py-2 text-[11px] shadow-md flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
          <span className="font-semibold text-slate-700">You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block transform rotate-45"></span>
          <span className="font-semibold text-slate-700">Cooperative Hub</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span className="font-semibold text-slate-700">Verified Artisan</span>
        </div>
      </div>
    </div>
  );
}
