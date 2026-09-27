import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ShieldCheck, 
  MapPin, 
  HardHat, 
  Sparkles, 
  Phone, 
  Building2, 
  Star,
  Activity,
  Layers,
  Flame,
  Radio,
  UserCheck,
  Clock
} from 'lucide-react';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

/**
 * Custom Live Operations Leaflet Map
 * Features:
 * - Real-time worker markers with 4 states: Available 🟢, On Job 🟡, Busy 🔴, Offline ⚪
 * - Customer booking request markers with pulse indicator
 * - Zone Heat Map with low (green), medium (yellow), high (red) activity overlays
 * - Interactive hover tooltips with district metrics
 * - Click-to-zoom into district zones
 * - Layer filtering (All, Available, On Job, Busy, Customer Requests, Heat Map)
 */
export function LiveDispatchMap({
  workers = [],
  customerRequests = [],
  zones = [],
  selectedBooking = null,
  selectedWorker = null,
  onSelectBooking,
  onSelectWorker,
  activeFilter = 'all',
  showHeatMap = false,
  className = 'h-[580px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const workerMarkersRef = useRef([]);
  const requestMarkersRef = useRef([]);
  const zoneLayersRef = useRef([]);

  // Default Center (Pune coordinates or centroid of workers)
  const defaultLat = 18.5204;
  const defaultLng = 73.8567;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 12,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • ShramSetu GeoCommand',
      maxZoom: 19,
    }).addTo(map);

    // Add Zoom Control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers and Zone Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers & zones
    workerMarkersRef.current.forEach((m) => m.remove());
    workerMarkersRef.current = [];

    requestMarkersRef.current.forEach((m) => m.remove());
    requestMarkersRef.current = [];

    zoneLayersRef.current.forEach((z) => z.remove());
    zoneLayersRef.current = [];

    const bounds = L.latLngBounds([]);

    // 1. Render Zone Heat Map if enabled
    if (showHeatMap || activeFilter === 'heatmap') {
      zones.forEach((zone) => {
        const color =
          zone.activityLevel === 'high'
            ? '#EF4444' // Red
            : zone.activityLevel === 'medium'
            ? '#F59E0B' // Yellow/Amber
            : '#10B981'; // Green

        const circle = L.circle([zone.latitude, zone.longitude], {
          radius: 3500,
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 6',
        }).addTo(map);

        // Interactive zone popup/tooltip
        const tooltipContent = `
          <div style="font-family: sans-serif; min-width: 170px; padding: 4px;">
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
              📍 ${escapeHtml(zone.name)}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: #64748B;">Active Workers:</span>
              <b style="color: #0F172A;">${zone.activeWorkers}</b>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: #64748B;">Available (Duty):</span>
              <b style="color: #10B981;">${zone.availableWorkers}</b>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
              <span style="color: #64748B;">Busy / On-Job:</span>
              <b style="color: #F59E0B;">${zone.busyWorkers}</b>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
              <span style="color: #64748B;">Ongoing Jobs:</span>
              <b style="color: #3B82F6;">${zone.ongoingJobs}</b>
            </div>
            <div style="font-size: 10px; color: ${color}; font-weight: bold; text-align: right; text-transform: uppercase;">
              Activity: ${escapeHtml(zone.activityLevel)}
            </div>
          </div>
        `;

        circle.bindTooltip(tooltipContent, { permanent: false, sticky: true, opacity: 0.95 });

        // Click on zone zooms into district
        circle.on('click', () => {
          map.setView([zone.latitude, zone.longitude], 14, { animate: true });
        });

        zoneLayersRef.current.push(circle);
      });
    }

    // 2. Render Workers
    const filteredWorkers = workers.filter((w) => {
      if (activeFilter === 'all' || activeFilter === 'heatmap') return true;
      if (activeFilter === 'available') return w.state === 'available';
      if (activeFilter === 'on_job') return w.state === 'on_job';
      if (activeFilter === 'busy') return w.state === 'busy';
      if (activeFilter === 'requests') return false;
      return true;
    });

    filteredWorkers.forEach((w) => {
      if (!w.latitude || !w.longitude) return;

      const isSelected = selectedWorker?.id === w.id;
      
      // Color badge based on state
      let badgeBg = '#10B981'; // Green
      let ringColor = 'rgba(16, 185, 129, 0.4)';
      let statusLabel = 'Available';

      if (w.state === 'on_job') {
        badgeBg = '#F59E0B'; // Amber
        ringColor = 'rgba(245, 158, 11, 0.4)';
        statusLabel = 'On Job';
      } else if (w.state === 'busy') {
        badgeBg = '#EF4444'; // Red
        ringColor = 'rgba(239, 68, 68, 0.4)';
        statusLabel = 'Busy';
      } else if (w.state === 'offline') {
        badgeBg = '#94A3B8'; // Slate/Grey
        ringColor = 'rgba(148, 163, 184, 0.3)';
        statusLabel = 'Offline';
      }

      const iconHtml = `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; inset: 0; background-color: ${ringColor}; border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            background: #FFFFFF;
            border: 2.5px solid ${badgeBg};
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.18);
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: transform 0.15s ease;
          ">
            <span style="font-size: 15px;">👷</span>
            <div style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: 10px;
              height: 10px;
              border-radius: 9999px;
              background-color: ${badgeBg};
              border: 1.5px solid white;
            "></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-worker-marker',
        html: iconHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([w.latitude, w.longitude], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 190px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 13px; color: #0F172A;">${escapeHtml(w.name)}</span>
            <span style="background: ${badgeBg}; color: white; font-size: 9px; font-weight: bold; padding: 1px 6px; border-radius: 9999px; text-transform: uppercase;">
              ${escapeHtml(statusLabel)}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 3px;">
            🔧 ${escapeHtml(w.profession)} • ${escapeHtml(w.cooperative)}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #0F172A; margin-top: 6px; border-top: 1px solid #F1F5F9; padding-top: 5px;">
            <span>⭐ <b>${w.rating}</b></span>
            <span>💼 <b>${w.jobsCompleted}</b> jobs</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] });

      marker.on('click', () => {
        if (onSelectWorker) onSelectWorker(w);
      });

      workerMarkersRef.current.push(marker);
      bounds.extend([w.latitude, w.longitude]);
    });

    // 3. Render Customer Requests
    if (activeFilter === 'all' || activeFilter === 'requests' || activeFilter === 'heatmap') {
      customerRequests.forEach((req) => {
        if (!req.latitude || !req.longitude) return;

        const isSelected = selectedBooking?.id === req.id;
        const isAssigned = ['assigned', 'accepted', 'on_the_way', 'in_progress'].includes(req.status);

        const iconHtml = `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="
              width: 28px;
              height: 28px;
              background: ${isAssigned ? '#2563EB' : '#EA580C'};
              border: 2.5px solid white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.25);
              color: white;
              font-weight: bold;
              font-size: 14px;
              transform: ${isSelected ? 'scale(1.25) rotate(-6deg)' : 'scale(1)'};
              transition: transform 0.15s ease;
            ">
              ⚡
            </div>
          </div>
        `;

        const requestIcon = L.divIcon({
          className: 'custom-request-marker',
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([req.latitude, req.longitude], { icon: requestIcon }).addTo(map);

        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 190px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 800; font-size: 13px; color: #0F172A;">${escapeHtml(req.bookingId)}</span>
              <span style="background: ${isAssigned ? '#DBEAFE' : '#FFEDD5'}; color: ${isAssigned ? '#1D4ED8' : '#C2410C'}; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; text-transform: uppercase;">
                ${escapeHtml(req.status)}
              </span>
            </div>
            <div style="font-size: 11px; font-weight: bold; color: #1E293B; margin-bottom: 3px;">
              ${escapeHtml(req.serviceName)}
            </div>
            <div style="font-size: 11px; color: #64748B;">
              👤 ${escapeHtml(req.customerName)} • 📍 ${escapeHtml(req.address)}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 6px; border-top: 1px solid #F1F5F9; padding-top: 5px;">
              <span style="color: #64748B;">Amount: <b style="color: #0F172A;">₹${req.amount}</b></span>
              <span style="color: #64748B;">ETA: <b style="color: #10B981;">${escapeHtml(req.eta)}</b></span>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] });

        marker.on('click', () => {
          if (onSelectBooking) onSelectBooking(req);
        });

        requestMarkersRef.current.push(marker);
        bounds.extend([req.latitude, req.longitude]);
      });
    }

    // Auto-fit bounds if markers exist
    if (bounds.isValid() && (workers.length > 0 || customerRequests.length > 0)) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [workers, customerRequests, zones, selectedBooking, selectedWorker, activeFilter, showHeatMap]);

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Floating Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
          Live Dispatch States
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
          <span>Available Worker</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
          <span>On Job / En Route</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
          <span>Busy / High Load</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
          <span className="w-2.5 h-2.5 rounded-md bg-orange-600 shadow-sm"></span>
          <span>Citizen Booking Request</span>
        </div>
      </div>
    </div>
  );
}

export default LiveDispatchMap;
