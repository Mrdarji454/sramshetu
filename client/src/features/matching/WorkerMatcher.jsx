import { ServiceSearch } from './ServiceSearch';
import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Sparkles,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  Clock,
  Calendar,
  CheckCircle2,
  Compass,
  ArrowRight,
  Filter,
  UserCheck,
  RefreshCw,
  Eye,
  Layers,
  Map,
  ListFilter,
  Award,
  Star,
  ExternalLink,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Boxes,
  Paintbrush,
  Wind,
  Flame,
} from "lucide-react";
import { matchingService } from "../../services/matching.service";
import { LOCALITY_PRESETS, getUserCoordinates } from "../../utils/geo.utils";
import {
  POPULAR_PROFESSIONS,
  detectTradeFromJobDescription,
} from "../../utils/tradeUtils";
import { WorkerMatchingMap } from "./WorkerMatchingMap";
import { PublicWorkerProfileModal } from "./PublicWorkerProfileModal";
import { PublicCooperativeProfileModal } from "./PublicCooperativeProfileModal";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const PROFESSION_ICONS = {
  electrical: Zap,
  plumbing: Droplets,
  carpentry: Hammer,
  masonry: Boxes,
  painting: Paintbrush,
  hvac: Wind,
  welding: Flame,
};

export function WorkerMatcher({
  onBookWorker,
  initialTrade = "",
  initialDescription = "",
  initialPincode = "",
  initialViewWorkerId = null,
  initialViewCoopId = null,
}) {
  const requestSequence = useRef(0);
  const [visibleCount, setVisibleCount] = useState(4);
  // Location states
  const initialPreset =
    LOCALITY_PRESETS.find((p) => p.pincode === initialPincode) ||
    LOCALITY_PRESETS[0];
  const [selectedLocality, setSelectedLocality] = useState(initialPreset);
  const [currentCoords, setCurrentCoords] = useState({
    latitude: initialPreset.latitude,
    longitude: initialPreset.longitude,
  });
  const [locationName, setLocationName] = useState(initialPreset.name);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Search & Filter states
  const [selectedTrade, setSelectedTrade] = useState(
    initialTrade || "All Trades",
  );
  const [jobDescription, setJobDescription] = useState(
    initialDescription || "",
  );
  const [detectedTrade, setDetectedTrade] = useState(null);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [maxRadiusKm, setMaxRadiusKm] = useState(25);
  const [sortBy, setSortBy] = useState("score");
  const [viewMode, setViewMode] = useState("split"); // 'split' | 'map' | 'grid'

  // Data states
  const [workers, setWorkers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [matchingMeta, setMatchingMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Profile Modal states
  const [modalWorkerId, setModalWorkerId] = useState(initialViewWorkerId);
  const [modalWorkerData, setModalWorkerData] = useState(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(
    Boolean(initialViewWorkerId),
  );

  const [modalCoopId, setModalCoopId] = useState(initialViewCoopId);
  const [modalCoopData, setModalCoopData] = useState(null);
  const [isCoopModalOpen, setIsCoopModalOpen] = useState(
    Boolean(initialViewCoopId),
  );

  // Sync initial props
  useEffect(() => {
    setSelectedTrade(initialTrade || "All Trades");
    setJobDescription(initialDescription || "");
    if (initialDescription) {
      setJobDescription(initialDescription);
      const detected = detectTradeFromJobDescription(initialDescription);
      if (detected) setDetectedTrade(detected);
    }
    if (initialViewWorkerId) {
      setModalWorkerId(initialViewWorkerId);
      setIsWorkerModalOpen(true);
    }
    if (initialViewCoopId) {
      setModalCoopId(initialViewCoopId);
      setIsCoopModalOpen(true);
    }
  }, [
    initialTrade,
    initialDescription,
    initialViewWorkerId,
    initialViewCoopId,
  ]);

  // Handle free-text NLP description change
  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    setJobDescription(text);
    const detected = detectTradeFromJobDescription(text);
    setDetectedTrade(detected);
    if (detected && (selectedTrade === "All Trades" || !selectedTrade)) {
      setSelectedTrade(detected.tradeName);
    }
  };

  // Fetch matches whenever coordinates or search filters change
  const fetchNearbyMatches = async () => {
    const sequence = ++requestSequence.current;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const tradeParam =
        selectedTrade === "All Trades" ? "" : selectedTrade;

      const res = await matchingService.searchNearbyWorkers({
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        trade: tradeParam,
        query: jobDescription,
        availableOnly,
        maxRadiusKm,
        sortBy,
      });

      if (res && sequence === requestSequence.current) {
        setVisibleCount(4);
        setWorkers(res.workers || []);
        setCooperatives(res.cooperatives || []);
        setMatchingMeta(res.rankingEngine || null);
        if (res.workers?.length > 0 && !selectedWorkerId) {
          setSelectedWorkerId(
            res.workers[0].worker?.id || res.workers[0].worker?._id,
          );
        }
      }
    } catch (err) {
      console.error("Error finding nearby workers:", err);
      if (sequence !== requestSequence.current) return;
      setErrorMsg(
        err.message || "Unable to query nearby artisans. Please try again.",
      );
    } finally {
      if (sequence === requestSequence.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchNearbyMatches, 250);
    return () => { clearTimeout(timer); requestSequence.current += 1; };
  }, [currentCoords, selectedTrade, jobDescription, availableOnly, maxRadiusKm, sortBy]);

  // Handle Preset Locality Selection
  const handleSelectPreset = (preset) => {
    setSelectedLocality(preset);
    setLocationName(preset.name);
    setCurrentCoords({
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
  };

  // Handle Device GPS Geolocation
  const handleUseGps = async () => {
    setIsLocatingGps(true);
    setErrorMsg(null);
    try {
      const loc = await getUserCoordinates();
      setCurrentCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setLocationName(
        loc.name ||
          (loc.source === "gps" ? "Live GPS Location" : "Current Location"),
      );
    } catch (err) {
      console.error("GPS error:", err);
      setErrorMsg(
        err.message ||
          "Unable to retrieve device location. Please allow location access or select a locality.",
      );
    } finally {
      setIsLocatingGps(false);
    }
  };

  // Open worker profile modal
  const handleOpenWorkerProfile = (item) => {
    setModalWorkerData(item);
    setModalWorkerId(
      item.worker?.id || item.worker?._id || item.id || item._id,
    );
    setIsWorkerModalOpen(true);
  };

  // Open cooperative profile modal
  const handleOpenCoopProfile = (coop) => {
    setModalCoopData(coop);
    setModalCoopId(coop.id || coop._id);
    setIsCoopModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Search & Location Filtering Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gov" size="sm">
                Local service discovery
              </Badge>
              <span className="text-xs text-slate-400 font-semibold">
                • Find the right professional
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Find Nearby Artisans & Regulated Cooperatives
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Zero platform commissions, statutory floor wages, and Aadhaar &
              NSDC verified credentials.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600 self-start lg:self-auto">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === "split"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-brand-saffron-600" />
              <span>Split Map & Cards</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
              <span>4-Card Grid</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              <Map className="w-3.5 h-3.5 text-blue-600" />
              <span>Map Focus</span>
            </button>
          </div>
        </div>

        {/* Free-Text Job Description Search Input */}
        <div className="space-y-2">
          <ServiceSearch value={jobDescription} onChange={text => {
            setJobDescription(text);
            setSelectedTrade('All Trades');
            setDetectedTrade(detectTradeFromJobDescription(text));
          }} onSearch={() => { /* Debounced search runs as the value changes. */ }} />

          {/* Detected NLP Trade Indicator */}
          {detectedTrade && (
            <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>
                Mapped to trade:{" "}
                <strong className="text-amber-950 underline">
                  {detectedTrade.tradeName}
                </strong>{" "}
                ({detectedTrade.hindiName})
              </span>
            </div>
          )}
        </div>

        {/* Trade Category Filter Pills */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Filter by Skill / Trade:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => { setSelectedTrade("All Trades"); setJobDescription(""); setDetectedTrade(null); }}
              className={`px-3.5 py-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                selectedTrade === "All Trades"
                  ? "bg-brand-navy-900 text-white shadow-sm ring-2 ring-brand-navy-400"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200"
              }`}
            >
              All Trades
            </button>
            {POPULAR_PROFESSIONS.map((prof) => {
              const Icon = PROFESSION_ICONS[prof.id] || Wrench;
              const isSelected =
                selectedTrade === prof.tradeName || selectedTrade === prof.id;

              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => { setSelectedTrade(prof.tradeName); setJobDescription(""); setDetectedTrade(null); }}
                  className={`px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                    isSelected
                      ? "bg-brand-navy-900 text-white shadow-sm ring-2 ring-brand-navy-400"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950 border border-slate-200"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-brand-saffron-600"}`}
                  />
                  <span>{prof.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location, GPS & Sorting Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-saffron-600" />
              <span>Location:</span>
            </span>

            {/* Quick Locality Presets Dropdown */}
            <select
              value={selectedLocality?.name || ""}
              onChange={(e) => {
                const found = LOCALITY_PRESETS.find(
                  (p) => p.name === e.target.value,
                );
                if (found) handleSelectPreset(found);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
            >
              {LOCALITY_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.pincode})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLocatingGps}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200"
            >
              <Navigation
                className={`w-3.5 h-3.5 ${isLocatingGps ? "animate-spin" : ""}`}
              />
              <span>{isLocatingGps ? "Detecting..." : "Use GPS"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Radius Slider */}
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-500">Radius:</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                className="w-20 accent-brand-saffron-600 cursor-pointer"
              />
              <span className="font-bold text-brand-navy-900 font-mono w-10 text-right">
                {maxRadiusKm} km
              </span>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-brand-saffron-600 focus:ring-brand-saffron-500 border-slate-300"
              />
              <span>Available Now</span>
            </label>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-800 border-none p-0 focus:outline-none cursor-pointer"
              >
                <option value="score">Best Overall Match</option>
                <option value="distance">Nearest Distance</option>
                <option value="rating">Highest Rating</option>
                <option value="experience">Experience</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transparent Ranking Engine Badge */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {matchingMeta === "ai" ? "AI Smart Matching" : "Best matches near you"}
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Profession, skills, distance, availability and ratings
            </span>
          </div>

          <div className="text-slate-500 font-medium text-[11px]">
            Found <strong className="text-slate-900">{workers.length}</strong>{" "}
            matching artisans &{" "}
            <strong className="text-slate-900">{cooperatives.length}</strong>{" "}
            registered societies
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* 3. Main Content: Map & Ranked Worker Cards (4 per row on large screens) */}
      <div
        className={`grid gap-6 ${
          viewMode === "split"
            ? "grid-cols-1 lg:grid-cols-12"
            : viewMode === "map"
              ? "grid-cols-1"
              : "grid-cols-1"
        }`}
      >
        {/* Map Column */}
        {(viewMode === "split" || viewMode === "map") && (
          <div
            className={
              viewMode === "split" ? "lg:col-span-5 xl:col-span-5" : "w-full"
            }
          >
            <div className="sticky top-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Geospatial Proximity View</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Click pin to focus
                </span>
              </div>

              <WorkerMatchingMap
                customerLocation={currentCoords}
                workers={workers}
                cooperatives={cooperatives}
                selectedWorkerId={selectedWorkerId}
                onSelectWorker={(id) => {
                  setSelectedWorkerId(id);
                  const found = workers.find(
                    (w) => (w.worker?.id || w.worker?._id) === id,
                  );
                  if (found) handleOpenWorkerProfile(found);
                }}
                onSelectCooperative={(id) => {
                  const found = cooperatives.find(
                    (c) => (c.id || c._id) === id,
                  );
                  if (found) handleOpenCoopProfile(found);
                }}
                onBookWorker={(item) => {
                  if (onBookWorker) onBookWorker(item, jobDescription);
                }}
                searchRadiusKm={maxRadiusKm}
                className={`${
                  viewMode === "map" ? "h-[620px]" : "h-[540px]"
                } w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200`}
              />
            </div>
          </div>
        )}

        {/* Worker Cards Column / Grid */}
        {(viewMode === "split" || viewMode === "grid") && (
          <div
            className={
              viewMode === "split" ? "lg:col-span-7 xl:col-span-7" : "w-full"
            }
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-saffron-600" />
                <span>Recommended Workers in {locationName}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {workers.length} results
              </span>
            </div>

            {isLoading ? (
              <div role="status" aria-label="Loading workers" className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map(key => <div key={key} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 space-y-4"><div className="h-12 w-12 rounded-2xl bg-slate-200" /><div className="h-4 w-3/4 rounded bg-slate-200" /><div className="h-3 w-1/2 rounded bg-slate-100" /><div className="h-16 rounded-xl bg-slate-100" /></div>)}</div>
            ) : workers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No Matching Artisans in This Radius
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try expanding your search radius (e.g. 35-50 km) or clearing
                  specific trade filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMaxRadiusKm(50);
                    setSelectedTrade("All Trades");
                    setAvailableOnly(false);
                  }}
                >
                  Expand Search Radius
                </Button>
              </div>
            ) : (
              /* Four worker cards per row on large screens when in full grid mode, or responsive in split */
              <div
                className={`grid gap-4.5 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {workers.slice(0, visibleCount).map((item) => {
                  const worker = item.worker || {};
                  const isSelected =
                    selectedWorkerId === (worker.id || worker._id);
                  const isNew =
                    item.isNewWorker ||
                    (worker.jobsCompleted !== undefined &&
                      worker.jobsCompleted <= 5);

                  return (
                    <div
                      key={worker.id || worker._id || item.id}
                      onClick={() =>
                        setSelectedWorkerId(worker.id || worker._id)
                      }
                      className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-brand-saffron-500 bg-brand-saffron-50/20 ring-2 ring-brand-saffron-200 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        {/* Header: Avatar, Name, Verification, Fair Rotation Badge */}
                        <div className="flex items-start gap-3 mb-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWorkerProfile(item);
                            }}
                            className="w-12 h-12 rounded-2xl bg-brand-navy-900 text-white flex items-center justify-center font-bold text-base shadow-sm hover:scale-105 transition-transform flex-shrink-0"
                            title="Click to view full public profile"
                          >
                            {worker.avatar ? <img src={worker.avatar} alt={worker.name} className="h-full w-full rounded-2xl object-cover" /> : worker.name?.charAt(0) || "A"}
                          </button>

                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWorkerProfile(item);
                              }}
                              className="font-extrabold text-slate-900 text-sm hover:text-brand-saffron-700 hover:underline text-left truncate block w-full"
                            >
                              {worker.name}
                            </button>

                            <p className="text-xs font-semibold text-brand-navy-900 truncate">
                              {worker.primaryTrade || worker.trade}
                            </p>

                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {worker.isVerified !== false && (
                                <Badge variant="verified" size="sm">
                                  KYC Verified
                                </Badge>
                              )}
                              {isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  🌟 Rising Talent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rating, Distance & Transit */}
                        <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100 my-2.5">
                          <span className="font-extrabold text-amber-600 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {item.rating || 4.9}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({worker.jobsCompleted || 0} jobs)
                            </span>
                          </span>

                          <span className="font-bold text-blue-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            {item.distanceFormatted || "1.5 km"}
                          </span>

                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />~
                            {item.estimatedArrivalMin || 15}m
                          </span>
                        </div>

                        <p className="mb-3 text-xs text-slate-500">{worker.experienceYears || 0} years experience / {item.serviceRadius || 15} km service radius / {item.availability?.status || 'offline'}</p>
                        {/* Skills Badges */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(
                            item.skills || [
                              "Standard Tools",
                              "Safety Certified",
                            ]
                          )
                            .slice(0, 2)
                            .map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold"
                              >
                                {s}
                              </span>
                            ))}
                          {(item.skills || []).length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[10px]">
                              +{item.skills.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Floor Wage and Guild Sponsor */}
                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs mb-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Guaranteed Floor:
                            </span>
                            <span className="font-black text-brand-navy-900 font-display">
                              ₹{worker.rates?.dailyFloorRate || 1200} / day
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span
                              className="truncate max-w-[140px]"
                              title={item.cooperative?.name}
                            >
                              Guild:{" "}
                              {item.cooperative?.name || "Independent artisan"}
                            </span>
                            <span className="text-emerald-700 font-bold">
                              0% Cut
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions: View Profile & Book */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs py-1.5 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWorkerProfile(item);
                          }}
                        >
                          View Profile
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs py-1.5 px-2"
                          icon={ArrowRight}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBookWorker)
                              onBookWorker(item, jobDescription);
                          }}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {visibleCount < workers.length && <div className="text-center"><Button onClick={() => setVisibleCount(count => count + 4)}>Load More ({workers.length - visibleCount} remaining)</Button></div>}
      {/* 2. Regulated Cooperative Societies Section */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-600 text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950">
                Verified Cooperative Societies (
                {cooperatives.length})
              </h3>
              <p className="text-[11px] text-indigo-700 font-medium">
                Governed under State Cooperative Societies Act • 0% Middleman
                Cut Guaranteed
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-800 bg-white/80 px-2.5 py-1 rounded-xl border border-indigo-200 self-start sm:self-auto">
            Click society to inspect charter & jurisdiction
          </span>
        </div>

        {cooperatives.length === 0 ? (
          <div className="p-6 text-center text-indigo-900/60 bg-white/70 rounded-2xl border border-indigo-200 text-xs">
            No cooperatives found in this exact radius. Try expanding search
            radius to 30-50 km.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cooperatives.map((c) => (
              <div
                key={c.id || c._id}
                onClick={() => handleOpenCoopProfile(c)}
                className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="font-bold text-slate-900 text-xs truncate"
                      title={c.name}
                    >
                      {c.logo && <img src={c.logo} alt="" className="mb-2 h-10 w-10 rounded-xl object-cover" />}{c.name}
                    </span>
                    <Badge variant="verified" size="sm">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {c.distanceFormatted || "1.2 km"} away • {c.district},{" "}
                    {c.state}
                  </p>
                  <p className="text-xs text-slate-500">{c.serviceCategories?.join(', ')}</p>
                  <p className="text-xs text-amber-700">Rating: {c.rating?.count ? Number(c.rating.average).toFixed(1) : 'No reviews yet'}</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Roster:{" "}
                    <strong className="text-slate-800">
                      {c.memberCount || 0} Artisans
                    </strong>
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-700 font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View Profile
                  </span>
                  <button type="button" onClick={e => { e.stopPropagation(); onBookWorker?.({ cooperative: c }, jobDescription); }} className="font-bold text-orange-700">Book through Cooperative</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Shareable Profile Modals */}
      <PublicWorkerProfileModal
        isOpen={isWorkerModalOpen}
        workerId={modalWorkerId}
        workerData={modalWorkerData}
        onClose={() => {
          setIsWorkerModalOpen(false);
          setModalWorkerId(null);
          setModalWorkerData(null);
        }}
        onBookWorker={(item) => {
          if (onBookWorker) onBookWorker(item, jobDescription);
        }}
      />

      <PublicCooperativeProfileModal
        isOpen={isCoopModalOpen}
        cooperativeId={modalCoopId}
        cooperativeData={modalCoopData}
        onClose={() => {
          setIsCoopModalOpen(false);
          setModalCoopId(null);
          setModalCoopData(null);
        }}
        onBookService={(coop) => {
          if (onBookWorker) onBookWorker({ cooperative: coop }, jobDescription);
        }}
      />
    </div>
  );
}

export default WorkerMatcher;
