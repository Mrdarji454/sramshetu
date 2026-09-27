import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  PhoneCall,
  RefreshCw,
  Route,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { bookingService } from "../../services/booking.service";
import { paymentStatusLabel } from "../../utils/paymentStatus";
import { routeService } from "../../services/route.service";

const TERMINAL = new Set(["COMPLETED", "CANCELLED", "REJECTED"]);
const ONGOING = new Set(["ASSIGNED", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"]);
const STATUS_STYLES = {
  available: { label: "Available", color: "#16a34a" },
  en_route: { label: "En Route", color: "#eab308" },
  working: { label: "Working", color: "#f97316" },
  busy: { label: "Busy", color: "#f97316" },
  offline: { label: "Offline", color: "#94a3b8" },
};
const CHART_COLORS = [
  "#ea580c",
  "#0f766e",
  "#d97706",
  "#2563eb",
  "#64748b",
  "#16a34a",
];
const money = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(value) || 0);
const number = (value) => Number(value || 0);
const statusOf = (booking) => String(booking?.status || "").toUpperCase();
const isTerminal = (booking) => TERMINAL.has(statusOf(booking));
const coordsValid = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  coords.every((value) => Number.isFinite(Number(value))) &&
  Math.abs(Number(coords[0])) <= 180 &&
  Math.abs(Number(coords[1])) <= 90 &&
  coords.some((value) => Number(value) !== 0);
const coordinatesOf = (record) => {
  const candidates = [
    record?.coordinates,
    record?.liveLocation?.coordinates,
    record?.location?.coordinates,
    record?.location?.serviceAddress?.coordinates,
    record?.customerLocation,
    Number.isFinite(Number(record?.address?.longitude)) &&
    Number.isFinite(Number(record?.address?.latitude))
      ? [Number(record.address.longitude), Number(record.address.latitude)]
      : null,
  ];
  const point = candidates.find(coordsValid);
  return point ? point.map(Number) : null;
};
const workerKeys = (worker) =>
  [worker?.id, worker?._id, worker?.userId, worker?.user?._id, worker?.user]
    .filter(Boolean)
    .map((value) => String(value?._id || value?.id || value));
const bookingWorkerKeys = (booking) =>
  [booking?.worker, booking?.workerId]
    .filter(Boolean)
    .map((value) => String(value?._id || value?.id || value));
const dateAt = (value) => (value ? new Date(value) : null);
const sameDay = (first, second) =>
  first &&
  second &&
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();
const getAddress = (booking) =>
  booking?.location?.serviceAddress ||
  booking?.serviceAddress ||
  booking?.address ||
  {};
const workerInitials = (name) =>
  String(name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function bookingsForWorker(worker, bookings) {
  const keys = workerKeys(worker);
  return bookings.filter((booking) => {
    const bookingKeys = bookingWorkerKeys(booking);
    if (keys.some((key) => bookingKeys.includes(key))) return true;
    return Boolean(worker.name && booking.workerName === worker.name);
  });
}

function timelineEvents(booking) {
  const events = booking?.timelineEvents || booking?.statusHistory || [];
  return events.map((event) => ({
    status: String(event.status || "").toUpperCase(),
    at: event.timestamp || event.createdAt || null,
    note: event.note || "",
  }));
}

function bookingResponseMinutes(booking) {
  const accepted = timelineEvents(booking).find((event) =>
    ["ACCEPTED", "WORKER_ACCEPTED"].includes(event.status),
  );
  const created = dateAt(booking.createdAt);
  const acceptedAt = dateAt(accepted?.at);
  if (!created || !acceptedAt || acceptedAt < created) return null;
  return (acceptedAt - created) / 60000;
}

function workerOperationalStatus(worker, jobs) {
  const running = jobs.find((job) => ONGOING.has(statusOf(job)));
  if (running) {
    if (statusOf(running) === "ON_THE_WAY") return "en_route";
    if (statusOf(running) === "IN_PROGRESS") return "working";
    return "busy";
  }
  const availability = String(
    worker.status || worker.availability?.status || "offline",
  ).toLowerCase();
  if (availability === "available") return "available";
  if (availability === "busy") return "busy";
  return "offline";
}

function distanceKm(first, second) {
  if (!coordsValid(first) || !coordsValid(second)) return null;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second[1] - first[1]);
  const longitudeDelta = radians(second[0] - first[0]);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(first[1])) *
      Math.cos(radians(second[1])) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function readableTime(value) {
  if (!value) return "Not reported";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not reported";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function metricCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-md ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-brand-navy-900">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ChartPanel({ title, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-slate-200 bg-white p-4 ${className}`}
    >
      <h3 className="mb-4 text-sm font-bold text-brand-navy-900">{title}</h3>
      {children}
    </section>
  );
}

function CooperativeMap({
  workers,
  bookings,
  cooperative,
  view,
  zones,
  onSelectWorker,
  onSelectBooking,
  onSelectZone,
  selectedZone,
}) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map = null;
    let observer = null;
    const initializeMap = async () => {
      if (!mapElement.current) return;
      window.L = L;
      await Promise.all([
        import("leaflet.markercluster"),
        import("leaflet.heat"),
      ]);
      if (cancelled || !mapElement.current) return;
      const center = coordinatesOf(cooperative) || [78.9629, 22.5937];
      map = L.map(mapElement.current, { scrollWheelZoom: false }).setView(
        [center[1], center[0]],
        6,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layersRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      observer = new ResizeObserver(() => map?.invalidateSize());
      observer.observe(mapElement.current);
    };
    initializeMap();
    return () => {
      cancelled = true;
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const root = layersRef.current;
    if (!mapReady || !map || !root) return;
    root.clearLayers();
    const fitPoints = [];
    const popup = (title, lines) => {
      const wrapper = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = title;
      wrapper.appendChild(heading);
      lines.filter(Boolean).forEach((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        wrapper.appendChild(paragraph);
      });
      return wrapper;
    };

    if (view === "zones") {
      const heatPoints = zones
        .filter((zone) => zone.coordinates)
        .map((zone) => [
          zone.coordinates[1],
          zone.coordinates[0],
          Math.max(0.15, zone.workers.length / Math.max(1, workers.length)),
        ]);
      if (heatPoints.length && typeof L.heatLayer === "function") {
        L.heatLayer(heatPoints, {
          radius: 34,
          blur: 24,
          maxZoom: 14,
          gradient: { 0.15: "#16a34a", 0.52: "#eab308", 1: "#dc2626" },
        }).addTo(root);
      }
      zones.forEach((zone) => {
        if (!zone.coordinates) return;
        const selected = selectedZone?.id === zone.id;
        const marker = L.circleMarker(
          [zone.coordinates[1], zone.coordinates[0]],
          {
            radius: selected ? 13 : 9,
            color: selected ? "#0f172a" : "#fff",
            weight: selected ? 3 : 2,
            fillColor: zone.intensityColor,
            fillOpacity: 0.72,
          },
        ).addTo(root);
        marker.bindTooltip(zone.name);
        marker.on("click", () => onSelectZone(zone));
        fitPoints.push([zone.coordinates[1], zone.coordinates[0]]);
      });
    } else {
      const cluster = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 48,
        showCoverageOnHover: false,
      });
      workers.forEach((worker) => {
        const coordinates = coordinatesOf(worker);
        if (!coordinates) return;
        const state = workerOperationalStatus(
          worker,
          bookingsForWorker(worker, bookings),
        );
        const style = STATUS_STYLES[state] || STATUS_STYLES.offline;
        const marker = L.marker([coordinates[1], coordinates[0]], {
          icon: L.divIcon({
            className: "coop-worker-marker-wrap",
            html: `<span style="display:grid;place-items:center;width:34px;height:34px;border:3px solid white;border-radius:50%;background:${style.color};color:#fff;font-size:10px;font-weight:800;box-shadow:0 2px 8px #0004">${workerInitials(worker.name)}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        });
        marker.bindPopup(
          popup(worker.name || "Worker", [
            worker.profession || worker.primaryTrade || worker.trade,
            style.label,
            `Last update: ${readableTime(worker.lastUpdated)}`,
          ]),
        );
        marker.on("click", () => onSelectWorker(worker));
        cluster.addLayer(marker);
        fitPoints.push([coordinates[1], coordinates[0]]);
      });
      bookings
        .filter((booking) => !isTerminal(booking))
        .forEach((booking) => {
          const coordinates = coordinatesOf(booking);
          if (!coordinates) return;
          const marker = L.circleMarker([coordinates[1], coordinates[0]], {
            radius: 8,
            color: "#fff",
            weight: 2,
            fillColor: "#ea580c",
            fillOpacity: 1,
          });
          marker.bindPopup(
            popup(booking.serviceName || booking.trade || "Customer request", [
              booking.customerName || booking.customer?.name || "Customer",
              getAddress(booking).city || getAddress(booking).district,
              statusOf(booking),
            ]),
          );
          marker.on("click", () => onSelectBooking(booking));
          cluster.addLayer(marker);
          fitPoints.push([coordinates[1], coordinates[0]]);
        });
      root.addLayer(cluster);
      const center = coordinatesOf(cooperative);
      if (center) {
        const radius = Number(cooperative?.serviceArea?.radiusKm || 0);
        if (radius > 0) {
          L.circle([center[1], center[0]], {
            radius: radius * 1000,
            color: "#ea580c",
            fillColor: "#fb923c",
            fillOpacity: 0.04,
            weight: 1,
          }).addTo(root);
        }
        fitPoints.push([center[1], center[0]]);
      }
    }
    if (fitPoints.length > 1)
      map.fitBounds(fitPoints, { padding: [32, 32], maxZoom: 14 });
    else if (fitPoints.length === 1) map.setView(fitPoints[0], 12);
  }, [
    mapReady,
    workers,
    bookings,
    cooperative,
    view,
    zones,
    onSelectWorker,
    onSelectBooking,
    onSelectZone,
    selectedZone,
  ]);

  return (
    <div
      ref={mapElement}
      className="h-[380px] w-full rounded-md bg-slate-100 sm:h-[460px]"
      aria-label={
        view === "zones"
          ? "Cooperative zone heat map"
          : "Live worker dispatch map"
      }
    />
  );
}

export function CooperativeOperationsCenter({
  view = "dashboard",
  cooperative,
  workers = [],
  bookings = [],
  isLoading = false,
  onRefresh,
  onNavigate,
  onOpenAssign,
}) {
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const selectedBooking = useMemo(
    () =>
      bookings.find(
        (booking) => String(booking.id || booking._id) === selectedBookingId,
      ) ||
      bookings.find((booking) => !isTerminal(booking)) ||
      bookings[0] ||
      null,
    [bookings, selectedBookingId],
  );
  const activeBookings = useMemo(
    () => bookings.filter((booking) => ONGOING.has(statusOf(booking))),
    [bookings],
  );
  const cooperativeCoordinates = coordinatesOf(cooperative);

  const workerRows = useMemo(
    () =>
      workers.map((worker) => {
        const jobs = bookingsForWorker(worker, bookings);
        const currentJob =
          jobs.find((job) => ONGOING.has(statusOf(job))) || null;
        return {
          ...worker,
          jobs,
          currentJob,
          operationalStatus: workerOperationalStatus(worker, jobs),
          coordinates: coordinatesOf(worker),
          distanceKm: distanceKm(coordinatesOf(worker), cooperativeCoordinates),
        };
      }),
    [
      workers,
      bookings,
      cooperativeCoordinates?.[0],
      cooperativeCoordinates?.[1],
    ],
  );
  const activeWorkers = workerRows.filter(
    (worker) =>
      worker.isActive !== false && worker.operationalStatus !== "offline",
  );
  const availableWorkers = workerRows.filter(
    (worker) => worker.operationalStatus === "available",
  );
  const onJobWorkers = workerRows.filter((worker) => worker.currentJob != null);
  const pendingBookings = bookings.filter((booking) =>
    ["PENDING", "REJECTED"].includes(statusOf(booking)),
  );
  const todayBookings = bookings.filter((booking) =>
    sameDay(
      dateAt(booking.scheduledTime?.start || booking.createdAt),
      new Date(),
    ),
  );
  const completedBookings = bookings.filter(
    (booking) => statusOf(booking) === "COMPLETED",
  );
  const paidBookings = bookings.filter(
    (booking) =>
      String(booking.paymentStatus || "").toLowerCase() === "released",
  );
  const revenue = paidBookings.reduce(
    (sum, booking) =>
      sum + number(booking.price?.totalAmount ?? booking.escrowAmount),
    0,
  );
  const ratedWorkers = workerRows.filter(
    (worker) => worker.rating != null && Number.isFinite(Number(worker.rating)),
  );
  const averageRating = ratedWorkers.length
    ? ratedWorkers.reduce((sum, worker) => sum + number(worker.rating), 0) /
      ratedWorkers.length
    : null;

  const responseMinutes = useMemo(
    () => bookings.map(bookingResponseMinutes).filter((value) => value != null),
    [bookings],
  );
  const averageResponse = responseMinutes.length
    ? responseMinutes.reduce((sum, value) => sum + value, 0) /
      responseMinutes.length
    : null;

  const weekStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  }, []);
  const workerUtilization = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return workerRows.map((worker) => {
      const availability = worker.availability || {};
      const workDays = availability.workingDays || [];
      const startParts = String(availability.hours?.start || "")
        .split(":")
        .map(Number);
      const endParts = String(availability.hours?.end || "")
        .split(":")
        .map(Number);
      const shiftMinutes =
        startParts.length === 2 && endParts.length === 2
          ? endParts[0] * 60 +
            endParts[1] -
            (startParts[0] * 60 + startParts[1])
          : 0;
      const capacityMinutes = workDays.length * Math.max(0, shiftMinutes);
      const bookedMinutes = worker.jobs.reduce((sum, booking) => {
        const start = dateAt(booking.scheduledTime?.start);
        const scheduledEnd = dateAt(booking.scheduledTime?.end);
        const completedEvent = timelineEvents(booking).find(
          (event) => event.status === "COMPLETED",
        );
        const end = scheduledEnd || dateAt(completedEvent?.at);
        if (
          !start ||
          !end ||
          start < weekStart ||
          start >= weekEnd ||
          end <= start
        )
          return sum;
        return sum + (end - start) / 60000;
      }, 0);
      return {
        id: worker.id,
        name: worker.name,
        trade:
          worker.profession ||
          worker.primaryTrade ||
          worker.trade ||
          "Unspecified",
        completedJobs: worker.jobs.filter(
          (job) => statusOf(job) === "COMPLETED",
        ).length,
        rating: Number.isFinite(Number(worker.rating))
          ? Number(worker.rating)
          : null,
        response: (() => {
          const durations = worker.jobs
            .map(bookingResponseMinutes)
            .filter((value) => value != null);
          return durations.length
            ? durations.reduce((sum, value) => sum + value, 0) /
                durations.length
            : null;
        })(),
        earnings: worker.jobs
          .filter(
            (job) =>
              String(job.paymentStatus || "").toLowerCase() === "released",
          )
          .reduce(
            (sum, job) =>
              sum + number(job.price?.totalAmount ?? job.escrowAmount),
            0,
          ),
        utilization:
          capacityMinutes > 0
            ? Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100))
            : null,
      };
    });
  }, [workerRows, weekStart]);
  const aggregateUtilization = useMemo(() => {
    const measurable = workerUtilization.filter(
      (worker) => worker.utilization != null,
    );
    return measurable.length
      ? Math.round(
          measurable.reduce((sum, worker) => sum + worker.utilization, 0) /
            measurable.length,
        )
      : null;
  }, [workerUtilization]);

  const dailyBookings = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return {
          day: date.toLocaleDateString("en-IN", { weekday: "short" }),
          bookings: bookings.filter((booking) =>
            sameDay(dateAt(booking.createdAt), date),
          ).length,
        };
      }),
    [bookings],
  );
  const weeklyRevenue = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return {
          day: date.toLocaleDateString("en-IN", { weekday: "short" }),
          revenue: paidBookings
            .filter((booking) => {
              const paidDate = dateAt(booking.updatedAt || booking.createdAt);
              return sameDay(paidDate, date);
            })
            .reduce(
              (sum, booking) =>
                sum +
                number(booking.price?.totalAmount ?? booking.escrowAmount),
              0,
            ),
        };
      }),
    [paidBookings],
  );
  const jobsByDistrict = useMemo(() => {
    const counts = new Map();
    bookings.forEach((booking) => {
      const address = getAddress(booking);
      const district = address.district || address.city || "Unspecified";
      counts.set(district, (counts.get(district) || 0) + 1);
    });
    return [...counts]
      .map(([district, jobs]) => ({ district, jobs }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 8);
  }, [bookings]);
  const jobsByProfession = useMemo(() => {
    const counts = new Map();
    bookings.forEach((booking) => {
      const trade = booking.trade || booking.serviceName || "Unspecified";
      counts.set(trade, (counts.get(trade) || 0) + 1);
    });
    return [...counts]
      .map(([profession, jobs]) => ({ profession, jobs }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 8);
  }, [bookings]);
  const workerStateCounts = [
    { name: "Active / on job", value: onJobWorkers.length },
    { name: "Idle / available", value: availableWorkers.length },
    {
      name: "Offline",
      value: Math.max(0, workerRows.length - activeWorkers.length),
    },
  ];

  const zones = useMemo(() => {
    const groups = new Map();
    workerRows.forEach((worker) => {
      const coordinates = worker.coordinates;
      const district =
        worker.address?.district ||
        worker.address?.city ||
        worker.location?.address?.district ||
        worker.location?.address?.city ||
        "District unavailable";
      const id = coordinates
        ? `gps:${(Math.round(coordinates[0] * 100) / 100).toFixed(2)}:${(Math.round(coordinates[1] * 100) / 100).toFixed(2)}`
        : `district:${district.toLowerCase()}`;
      const group = groups.get(id) || {
        id,
        name: coordinates ? `${district} zone` : district,
        coordinates: null,
        coordinateTotals: [0, 0],
        workers: [],
      };
      if (coordinates) {
        group.coordinateTotals[0] += coordinates[0];
        group.coordinateTotals[1] += coordinates[1];
      }
      group.workers.push(worker);
      groups.set(id, group);
    });
    const grouped = [...groups.values()].map((group) => {
      if (group.workers.some((worker) => worker.coordinates)) {
        const located = group.workers.filter((worker) => worker.coordinates);
        group.coordinates = [
          group.coordinateTotals[0] / located.length,
          group.coordinateTotals[1] / located.length,
        ];
      }
      const keys = new Set(group.workers.flatMap(workerKeys));
      const jobs = bookings.filter((booking) =>
        bookingWorkerKeys(booking).some((key) => keys.has(key)),
      );
      const responseTimes = jobs
        .map(bookingResponseMinutes)
        .filter((value) => value != null);
      const active = group.workers.filter(
        (worker) => worker.operationalStatus !== "offline",
      ).length;
      const available = group.workers.filter(
        (worker) => worker.operationalStatus === "available",
      ).length;
      const busy = group.workers.filter((worker) =>
        ["en_route", "working", "busy"].includes(worker.operationalStatus),
      ).length;
      const count = group.workers.length;
      const intensityColor =
        count / Math.max(1, workers.length) >= 0.66
          ? "#dc2626"
          : count / Math.max(1, workers.length) >= 0.33
            ? "#eab308"
            : "#16a34a";
      return {
        ...group,
        active,
        available,
        busy,
        ongoingJobs: jobs.filter((job) => ONGOING.has(statusOf(job))).length,
        averageResponse: responseTimes.length
          ? responseTimes.reduce((sum, value) => sum + value, 0) /
            responseTimes.length
          : null,
        intensityColor,
      };
    });
    return grouped.sort((a, b) => b.workers.length - a.workers.length);
  }, [workerRows, bookings, workers.length]);
  const activeZone =
    zones.find((zone) => zone.id === selectedZone?.id) || zones[0] || null;

  useEffect(() => {
    if (!selectedBooking) {
      setRouteSummary(null);
      return undefined;
    }
    setSelectedBookingId(String(selectedBooking.id || selectedBooking._id));
    const workerKeysForBooking = new Set(bookingWorkerKeys(selectedBooking));
    const assignedWorker = workers.find((worker) =>
      workerKeys(worker).some((key) => workerKeysForBooking.has(key)),
    );
    const from = coordinatesOf(assignedWorker);
    const to = coordinatesOf(selectedBooking);
    let cancelled = false;
    if (!from || !to) {
      setRouteSummary(null);
      return undefined;
    }
    routeService.getRoute(from, to).then((route) => {
      if (!cancelled && route.success)
        setRouteSummary({
          distance: route.distance,
          etaMinutes: route.duration,
        });
      if (!cancelled && !route.success) setRouteSummary(null);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedBooking, workers]);

  const statCards = [
    {
      label: "Total workers",
      value: workerRows.length,
      detail: "Linked to this cooperative",
      icon: Users,
      tone: "bg-orange-50 text-orange-700",
    },
    {
      label: "Active workers",
      value: activeWorkers.length,
      detail: "Not currently offline",
      icon: Activity,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Workers on job",
      value: onJobWorkers.length,
      detail: "Assigned, en route, or working",
      icon: BriefcaseBusiness,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Available workers",
      value: availableWorkers.length,
      detail: "Ready for dispatch",
      icon: CheckCircle2,
      tone: "bg-green-50 text-green-700",
    },
    {
      label: "Today's bookings",
      value: todayBookings.length,
      detail: "Scheduled for today",
      icon: CalendarDays,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending bookings",
      value: pendingBookings.length,
      detail: "Awaiting worker assignment",
      icon: Clock3,
      tone: "bg-rose-50 text-rose-700",
    },
  ];

  const latestUpdate = workers
    .map((worker) => dateAt(worker.lastUpdated))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];
  const mapView = view === "zones" ? "zones" : "dispatch";
  const showMap = ["dashboard", "dispatch", "zones"].includes(view);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {cooperative?.metadata?.logo || cooperative?.logo ? (
            <img
              src={cooperative.metadata?.logo || cooperative.logo}
              alt=""
              className="h-11 w-11 rounded-md border border-slate-200 object-cover"
            />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-md bg-brand-navy-900 text-orange-300">
              <Users className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-navy-900">
              {cooperative?.name || "Cooperative Operations"}
            </p>
            <p className="text-xs text-slate-500">
              {cooperative?.location?.district ||
                cooperative?.serviceArea?.district ||
                "District not recorded"}{" "}
              · Live operations
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">
            Updated {readableTime(latestUpdate)}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isLoading}
            onClick={onRefresh}
          >
            Refresh live data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => (
          <div key={stat.label}>{metricCard(stat)}</div>
        ))}
      </div>

      {view === "dashboard" && (
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.85fr)]">
          <ChartPanel title="Live dispatch map" className="overflow-hidden">
            <CooperativeMap
              workers={workerRows}
              bookings={bookings}
              cooperative={cooperative}
              view="dispatch"
              zones={zones}
              onSelectWorker={setSelectedWorker}
              onSelectBooking={(booking) =>
                setSelectedBookingId(String(booking.id || booking._id))
              }
              onSelectZone={setSelectedZone}
              selectedZone={activeZone}
            />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
              {Object.entries(STATUS_STYLES).map(([key, style]) => (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <i
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  {style.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-sm bg-orange-600" />
                Customer request
              </span>
            </div>
          </ChartPanel>
          <OperationsPanel
            booking={selectedBooking}
            bookings={bookings}
            workerRows={workerRows}
            routeSummary={routeSummary}
            onSelectBooking={(booking) =>
              setSelectedBookingId(String(booking.id || booking._id))
            }
          />
        </div>
      )}

      {view === "dispatch" && (
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,.8fr)]">
          <ChartPanel title="Live dispatch map">
            <CooperativeMap
              workers={workerRows}
              bookings={bookings}
              cooperative={cooperative}
              view="dispatch"
              zones={zones}
              onSelectWorker={setSelectedWorker}
              onSelectBooking={(booking) =>
                setSelectedBookingId(String(booking.id || booking._id))
              }
              onSelectZone={setSelectedZone}
              selectedZone={activeZone}
            />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
              {Object.entries(STATUS_STYLES).map(([key, style]) => (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <i
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  {style.label}
                </span>
              ))}
            </div>
          </ChartPanel>
          <OperationsPanel
            booking={selectedBooking}
            bookings={bookings}
            workerRows={workerRows}
            routeSummary={routeSummary}
            onSelectBooking={(booking) =>
              setSelectedBookingId(String(booking.id || booking._id))
            }
          />
        </div>
      )}

      {view === "zones" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]">
          <ChartPanel title="Worker activity heat map">
            <CooperativeMap
              workers={workerRows}
              bookings={bookings}
              cooperative={cooperative}
              view="zones"
              zones={zones}
              onSelectWorker={setSelectedWorker}
              onSelectBooking={() => {}}
              onSelectZone={setSelectedZone}
              selectedZone={activeZone}
            />
            <div className="mt-3 flex gap-4 text-xs text-slate-600">
              <span className="text-emerald-700">Low activity</span>
              <span className="text-amber-700">Medium activity</span>
              <span className="text-red-700">High activity</span>
            </div>
          </ChartPanel>
          <ChartPanel title="Selected zone">
            {zones.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    aria-pressed={activeZone?.id === zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${activeZone?.id === zone.id ? "border-brand-navy-900 bg-brand-navy-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {zone.name}{" "}
                    <span className="opacity-70">({zone.workers.length})</span>
                  </button>
                ))}
              </div>
            )}
            {activeZone ? (
              <>
                <h3 className="text-lg font-bold text-brand-navy-900">
                  {activeZone.name}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["Active workers", activeZone.active],
                    ["Available", activeZone.available],
                    ["Busy", activeZone.busy],
                    ["Ongoing jobs", activeZone.ongoingJobs],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Average response time:{" "}
                  <strong>
                    {activeZone.averageResponse == null
                      ? "Not recorded"
                      : `${Math.round(activeZone.averageResponse)} min`}
                  </strong>
                </p>
                <div className="mt-4 space-y-2">
                  {activeZone.workers.map((worker) => (
                    <button
                      key={worker.id}
                      type="button"
                      onClick={() => setSelectedWorker(worker)}
                      className="flex w-full items-center gap-3 rounded-md border border-slate-200 p-2 text-left hover:bg-slate-50"
                    >
                      <WorkerAvatar worker={worker} />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-slate-800">
                          {worker.name}
                        </strong>
                        <span className="block truncate text-xs text-slate-500">
                          {worker.profession ||
                            worker.trade ||
                            "Trade not recorded"}
                        </span>
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: (
                            STATUS_STYLES[worker.operationalStatus] ||
                            STATUS_STYLES.offline
                          ).color,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                No worker zones are available yet.
              </p>
            )}
          </ChartPanel>
        </div>
      )}

      {view === "analytics" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel title="Jobs by district">
            <BarChartPanel
              data={jobsByDistrict}
              dataKey="jobs"
              xKey="district"
            />
          </ChartPanel>
          <ChartPanel title="Jobs by profession">
            <BarChartPanel
              data={jobsByProfession}
              dataKey="jobs"
              xKey="profession"
            />
          </ChartPanel>
          <ChartPanel title="Daily bookings">
            <LineChartPanel
              data={dailyBookings}
              dataKey="bookings"
              xKey="day"
              color="#ea580c"
            />
          </ChartPanel>
          <ChartPanel title="Weekly revenue">
            <LineChartPanel
              data={weeklyRevenue}
              dataKey="revenue"
              xKey="day"
              color="#0f766e"
              currency
            />
          </ChartPanel>
          <ChartPanel title="Active vs idle workers">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workerStateCounts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {workerStateCounts.map((item, index) => (
                      <Cell key={item.name} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>
          <ChartPanel title="Worker utilization">
            <BarChartPanel
              data={workerUtilization
                .filter((worker) => worker.utilization != null)
                .map((worker) => ({
                  name: worker.name,
                  utilization: worker.utilization,
                }))}
              dataKey="utilization"
              xKey="name"
              unit="%"
            />
          </ChartPanel>
        </div>
      )}

      {view === "payments" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [
                "Released",
                paidBookings.reduce(
                  (sum, booking) =>
                    sum +
                    number(booking.price?.totalAmount ?? booking.escrowAmount),
                  0,
                ),
              ],
              [
                "Held / escrow",
                bookings
                  .filter((booking) =>
                    ["held", "escrow_locked"].includes(
                      String(booking.paymentStatus || "").toLowerCase(),
                    ),
                  )
                  .reduce(
                    (sum, booking) =>
                      sum +
                      number(
                        booking.price?.totalAmount ?? booking.escrowAmount,
                      ),
                    0,
                  ),
              ],
              [
                "Pending",
                bookings
                  .filter(
                    (booking) =>
                      String(booking.paymentStatus || "").toLowerCase() ===
                      "pending",
                  )
                  .reduce(
                    (sum, booking) =>
                      sum +
                      number(
                        booking.price?.totalAmount ?? booking.escrowAmount,
                      ),
                    0,
                  ),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="text-xs text-slate-500">{label} booking value</p>
                <p className="mt-2 text-xl font-bold text-brand-navy-900">
                  {money(value)}
                </p>
              </div>
            ))}
          </div>
          <ChartPanel title="Cooperative booking ledger">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="py-3">Booking</th>
                    <th>Customer</th>
                    <th>Worker</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th className="text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length ? (
                    bookings.map((booking) => (
                      <tr
                        key={booking.id || booking._id}
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 font-mono text-xs">
                          #{String(booking.id || booking._id).slice(-8)}
                        </td>
                        <td>
                          {booking.customerName ||
                            booking.customer?.name ||
                            "Customer"}
                        </td>
                        <td>
                          {booking.workerName ||
                            booking.worker?.name ||
                            "Unassigned"}
                        </td>
                        <td>{statusOf(booking)}</td>
                        <td className="capitalize">
                          <div>{paymentStatusLabel(booking.paymentStatus)}</div>
                          {booking.paymentProvider?.transactionId && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {booking.paymentProvider.transactionId}
                            </div>
                          )}
                          {booking.refundStatus &&
                            booking.refundStatus !== "not_applicable" && (
                              <div className="text-[10px] text-amber-700">
                                Refund: {booking.refundStatus.replaceAll("_", " ")}
                              </div>
                            )}
                          {booking.paymentProvider?.invoiceUrl && (
                            <button
                              type="button"
                              className="text-[10px] text-brand-navy-900 underline"
                              onClick={() =>
                                bookingService.downloadInvoice(
                                  booking.id || booking._id,
                                ).catch(error => alert(error.message))
                              }
                            >
                              Invoice
                            </button>
                          )}
                        </td>
                        <td className="text-right font-semibold">
                          {money(
                            booking.price?.totalAmount ?? booking.escrowAmount,
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-8 text-center text-slate-500"
                      >
                        No cooperative bookings recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartPanel>
        </div>
      )}

      {view === "settings" && (
        <SettingsPanel cooperative={cooperative} onNavigate={onNavigate} />
      )}

      {(view === "dashboard" || view === "dispatch") && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
          <ChartPanel title="Live worker roster">
            {workerRows.length ? (
              <div className="divide-y divide-slate-100">
                {workerRows.map((worker) => {
                  const style =
                    STATUS_STYLES[worker.operationalStatus] ||
                    STATUS_STYLES.offline;
                  const record = workerUtilization.find(
                    (entry) => entry.id === worker.id,
                  );
                  return (
                    <div
                      key={worker.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedWorker(worker)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <WorkerAvatar worker={worker} />
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-sm text-slate-900">
                            {worker.name || "Worker"}
                          </strong>
                          <span className="block truncate text-xs text-slate-500">
                            {worker.profession ||
                              worker.primaryTrade ||
                              worker.trade ||
                              "Profession not recorded"}
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-slate-600">
                            Current job:{" "}
                            {worker.currentJob?.serviceName ||
                              worker.currentJob?.trade ||
                              "None"}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-400">
                            {worker.distanceKm == null
                              ? worker.address?.district ||
                                worker.address?.city ||
                                "GPS unavailable"
                              : `${worker.distanceKm.toFixed(1)} km from cooperative`}{" "}
                            · Updated {readableTime(worker.lastUpdated)}
                          </span>
                        </span>
                      </button>
                      <div className="flex items-center gap-3 sm:w-44 sm:justify-end">
                        <Badge
                          variant={
                            worker.operationalStatus === "available"
                              ? "verified"
                              : worker.operationalStatus === "offline"
                                ? "outline"
                                : "saffron"
                          }
                          size="sm"
                          dot
                        >
                          {style.label}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {record?.utilization == null
                            ? "—"
                            : `${record.utilization}%`}
                        </span>
                        {worker.phone && (
                          <a
                            href={`tel:${worker.phone}`}
                            aria-label={`Contact ${worker.name}`}
                            className="rounded-md border border-slate-200 p-1.5 text-brand-navy-900 hover:bg-slate-50"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="w-full sm:hidden">
                        <Progress value={record?.utilization} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="No linked workers are available in the cooperative roster." />
            )}
          </ChartPanel>
          <ChartPanel title="Worker performance">
            <div className="space-y-4">
              {workerUtilization.slice(0, 6).map((worker) => (
                <div key={worker.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {worker.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {worker.completedJobs} completed ·{" "}
                      {worker.rating == null
                        ? "No rating"
                        : `★ ${worker.rating.toFixed(1)}`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={worker.utilization} />
                    <span className="w-10 text-right text-xs font-semibold text-slate-600">
                      {worker.utilization == null
                        ? "—"
                        : `${worker.utilization}%`}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Response{" "}
                    {worker.response == null
                      ? "not recorded"
                      : `${Math.round(worker.response)} min`}{" "}
                    · Earnings {money(worker.earnings)}
                  </p>
                </div>
              ))}
            </div>
          </ChartPanel>
        </div>
      )}

      {view === "dashboard" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel title="Daily bookings">
            <LineChartPanel
              data={dailyBookings}
              dataKey="bookings"
              xKey="day"
              color="#ea580c"
            />
          </ChartPanel>
          <ChartPanel title="Weekly revenue">
            <LineChartPanel
              data={weeklyRevenue}
              dataKey="revenue"
              xKey="day"
              color="#0f766e"
              currency
            />
          </ChartPanel>
        </div>
      )}

      {(view === "dashboard" || view === "dispatch") && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4">
          <Button
            variant="primary"
            size="sm"
            icon={BriefcaseBusiness}
            onClick={() =>
              pendingBookings[0]
                ? onOpenAssign?.(pendingBookings[0])
                : onNavigate?.("bookings")
            }
          >
            Assign worker
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Clock3}
            onClick={() => onNavigate?.("bookings")}
          >
            View pending jobs ({pendingBookings.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Users}
            onClick={() => onNavigate?.("workers")}
          >
            Workers
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isLoading}
            onClick={onRefresh}
          >
            Refresh live data
          </Button>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {activeBookings.length} active operations ·{" "}
        {averageRating
          ? `Average worker rating ${averageRating.toFixed(1)}`
          : "No ratings recorded"}{" "}
        ·{" "}
        {aggregateUtilization == null
          ? "Worker utilization unavailable"
          : `Utilization ${aggregateUtilization}%`}
      </div>

      {selectedWorker && (
        <WorkerProfileDialog
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
        />
      )}
    </div>
  );
}

function OperationsPanel({
  booking,
  bookings,
  workerRows,
  routeSummary,
  onSelectBooking,
}) {
  if (!booking)
    return (
      <ChartPanel title="Live operations">
        <EmptyState text="No cooperative bookings are recorded yet." />
      </ChartPanel>
    );
  const id = String(booking.id || booking._id);
  const timeline = [
    ["Request received", ["PENDING", "CONFIRMED"]],
    ["Worker assigned", ["ASSIGNED"]],
    ["Worker accepted", ["ACCEPTED"]],
    ["En route", ["ON_THE_WAY"]],
    ["Work in progress", ["IN_PROGRESS"]],
    ["Completed", ["COMPLETED"]],
  ];
  const events = timelineEvents(booking);
  const worker = workerRows.find((member) =>
    bookingWorkerKeys(booking).some((key) => workerKeys(member).includes(key)),
  );
  const latestStatus = statusOf(booking);
  return (
    <ChartPanel title="Live operations">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">
            Booking #{id.slice(-8)}
          </p>
          <h3 className="mt-1 text-base font-bold text-brand-navy-900">
            {booking.serviceName || booking.trade || "Service request"}
          </h3>
        </div>
        <Badge
          variant={latestStatus === "COMPLETED" ? "verified" : "saffron"}
          size="sm"
        >
          {latestStatus}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-sm">
        <div>
          <span className="block text-[11px] text-slate-500">Customer</span>
          <strong>
            {booking.customerName || booking.customer?.name || "Customer"}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] text-slate-500">Worker</span>
          <strong>{worker?.name || booking.workerName || "Unassigned"}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-slate-500">Distance</span>
          <strong>
            {routeSummary
              ? `${routeSummary.distance.toFixed(1)} km`
              : "GPS unavailable"}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] text-slate-500">ETA</span>
          <strong>
            {routeSummary
              ? `${routeSummary.etaMinutes} min`
              : "Route unavailable"}
          </strong>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Status timeline
        </h4>
        <ol className="space-y-2">
          {timeline.map(([label, statuses]) => {
            const event = events.find((entry) =>
              statuses.includes(entry.status),
            );
            const complete = Boolean(event) || statuses.includes(latestStatus);
            return (
              <li key={label} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                >
                  {complete && <CheckCircle2 className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 text-xs text-slate-700">
                  {label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {event?.at
                    ? readableTime(event.at)
                    : complete
                      ? "Current"
                      : "—"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold text-slate-600">
          Select another active booking
        </p>
        <div className="flex flex-wrap gap-1.5">
          {bookings
            .filter((item) => !isTerminal(item))
            .slice(0, 5)
            .map((item) => (
              <button
                key={item.id || item._id}
                type="button"
                onClick={() => onSelectBooking(item)}
                className={`rounded-md border px-2 py-1 text-[10px] font-mono ${(item.id || item._id) === id ? "border-orange-300 bg-orange-50 text-orange-900" : "border-slate-200 text-slate-600"}`}
              >
                #{String(item.id || item._id).slice(-6)}
              </button>
            ))}
        </div>
      </div>
    </ChartPanel>
  );
}

function WorkerAvatar({ worker }) {
  return worker.profileImage ? (
    <img
      src={worker.profileImage}
      alt=""
      className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover"
    />
  ) : (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-navy-900 text-xs font-bold text-orange-300">
      {workerInitials(worker.name)}
    </span>
  );
}

function Progress({ value }) {
  return (
    <div className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-brand-saffron-500"
        style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }}
      />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
      {text}
    </p>
  );
}

function BarChartPanel({ data, dataKey, xKey, unit = "" }) {
  if (!data.length)
    return <EmptyState text="No records available for this chart." />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => [`${value}${unit}`, dataKey]} />
          <Bar dataKey={dataKey} fill="#ea580c" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineChartPanel({ data, dataKey, xKey, color, currency = false }) {
  if (!data.length)
    return <EmptyState text="No records available for this chart." />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value) => [currency ? money(value) : value, dataKey]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SettingsPanel({ cooperative, onNavigate }) {
  return (
    <ChartPanel title="Cooperative settings">
      <div className="divide-y divide-slate-100">
        {[
          ["Cooperative", cooperative?.name],
          [
            "District",
            cooperative?.location?.district ||
              cooperative?.serviceArea?.district,
          ],
          [
            "State",
            cooperative?.location?.state ||
              cooperative?.registrationDetails?.state,
          ],
          [
            "Service radius",
            cooperative?.serviceArea?.radiusKm
              ? `${cooperative.serviceArea.radiusKm} km`
              : null,
          ],
          [
            "Registration number",
            cooperative?.registrationDetails?.registrationNumber,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex flex-wrap justify-between gap-2 py-3 text-sm"
          >
            <span className="text-slate-500">{label}</span>
            <strong className="text-slate-800">
              {value || "Not recorded"}
            </strong>
          </div>
        ))}
      </div>
      <Button
        className="mt-4"
        variant="outline"
        size="sm"
        onClick={() => onNavigate?.("profile")}
      >
        Edit cooperative profile
      </Button>
    </ChartPanel>
  );
}

function WorkerProfileDialog({ worker, onClose }) {
  const status =
    STATUS_STYLES[worker.operationalStatus] || STATUS_STYLES.offline;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="worker-profile-title"
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <WorkerAvatar worker={worker} />
            <div>
              <h2
                id="worker-profile-title"
                className="font-bold text-brand-navy-900"
              >
                {worker.name}
              </h2>
              <p className="text-xs text-slate-500">
                {worker.profession ||
                  worker.primaryTrade ||
                  worker.trade ||
                  "Profession not recorded"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close worker profile"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <Badge
              variant={
                worker.operationalStatus === "available"
                  ? "verified"
                  : "saffron"
              }
              size="sm"
            >
              {status.label}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Phone</span>
            <a
              href={worker.phone ? `tel:${worker.phone}` : undefined}
              className="font-medium text-slate-800"
            >
              {worker.phone || "Not recorded"}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Rating</span>
            <strong>
              {worker.rating == null
                ? "Not rated"
                : `★ ${Number(worker.rating).toFixed(1)}`}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Completed jobs</span>
            <strong>{worker.jobsCompleted ?? 0}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last updated</span>
            <strong className="text-right text-xs">
              {readableTime(worker.lastUpdated)}
            </strong>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-500">Skills</p>
            <p className="mt-1 text-slate-700">
              {worker.skills?.length
                ? worker.skills.join(", ")
                : "No skills recorded"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CooperativeOperationsCenter;
