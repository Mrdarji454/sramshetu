import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { matchingService } from '../../services/matching.service';
import { LOCALITY_PRESETS, getUserCoordinates } from '../../utils/geo.utils';
import { WorkerMatchingMap } from './WorkerMatchingMap';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const TRADE_CATEGORIES = [
  'All Trades',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Masonry',
  'Painting',
  'Welding',
];

export function WorkerMatcher({ onBookWorker }) {
  // Location states
  const [selectedLocality, setSelectedLocality] = useState(LOCALITY_PRESETS[0]);
  const [currentCoords, setCurrentCoords] = useState({
    latitude: LOCALITY_PRESETS[0].latitude,
    longitude: LOCALITY_PRESETS[0].longitude,
  });
  const [locationName, setLocationName] = useState(LOCALITY_PRESETS[0].name);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Filter states
  const [selectedTrade, setSelectedTrade] = useState('All Trades');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [maxRadiusKm, setMaxRadiusKm] = useState(25);
  const [sortBy, setSortBy] = useState('distance');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'

  // Data states
  const [workers, setWorkers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch matches whenever coordinates or search filters change
  const fetchNearbyMatches = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const tradeParam = selectedTrade === 'All Trades' ? '' : selectedTrade;
      const res = await matchingService.searchNearbyWorkers({
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        trade: tradeParam,
        availableOnly,
        maxRadiusKm,
        sortBy,
      });

      if (res) {
        setWorkers(res.workers || []);
        setCooperatives(res.cooperatives || []);
        if (res.workers?.length > 0 && !selectedWorkerId) {
          setSelectedWorkerId(res.workers[0].worker?.id || res.workers[0].worker?._id);
        }
      }
    } catch (err) {
      console.error('Error finding nearby workers:', err);
      setErrorMsg(err.message || 'Unable to query nearby artisans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyMatches();
  }, [currentCoords, selectedTrade, availableOnly, maxRadiusKm, sortBy]);

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
    try {
      const loc = await getUserCoordinates();
      setCurrentCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setLocationName(loc.source === 'gps' ? 'Live GPS Location' : loc.name);
    } catch (err) {
      console.error('GPS error:', err);
    } finally {
      setIsLocatingGps(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Location Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="gov" size="sm">GovTech Fair Dispatch</Badge>
              <span className="text-xs text-slate-400 font-semibold">• Direct Cooperative Sourcing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Find Nearby Artisans & Regulated Cooperatives
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Zero platform commissions, guaranteed floor wages, and verified skill credentials.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-brand-saffron-600" />
              <span>Map & Cards</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-blue-600" />
              <span>Map Focus</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Location & Presets Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-saffron-600" />
              <span>Location:</span>
            </span>

            {/* Quick Locality Presets Dropdown */}
            <select
              value={selectedLocality?.name || ''}
              onChange={(e) => {
                const found = LOCALITY_PRESETS.find((p) => p.name === e.target.value);
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
              <Navigation className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>{isLocatingGps ? 'Detecting...' : 'Use GPS'}</span>
            </button>
          </div>

          {/* Quick Radius Slider */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Max Radius:</span>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={maxRadiusKm}
              onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
              className="w-24 accent-brand-saffron-600 cursor-pointer"
            />
            <span className="font-bold text-brand-navy-900 font-mono w-12 text-right">
              {maxRadiusKm} km
            </span>
          </div>
        </div>

        {/* Trade Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {TRADE_CATEGORIES.map((cat) => {
            const isSelected = selectedTrade === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedTrade(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-brand-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-saffron-600 focus:ring-brand-saffron-500 border-slate-300"
              />
              <span>Available Now Only</span>
            </label>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-800 border-none p-0 focus:outline-none cursor-pointer"
              >
                <option value="distance">Nearest Distance</option>
                <option value="rating">Highest Rating</option>
                <option value="experience">Most Experience</option>
                <option value="score">Best Overall Match</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Found <strong className="text-slate-900">{workers.length}</strong> matching artisans &{' '}
            <strong className="text-slate-900">{cooperatives.length}</strong> societies
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Nearby Cooperatives Summary Banner */}
      {cooperatives.length > 0 && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-700" />
              <h3 className="text-sm font-bold text-indigo-950">
                Registered Worker Cooperatives in Your Service Area ({cooperatives.length})
              </h3>
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold">
              Regulated Floor Wages Guaranteed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cooperatives.map((c) => (
              <div
                key={c.id || c._id}
                className="p-3.5 rounded-2xl bg-white border border-indigo-200/80 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                    <Badge variant="verified" size="sm">
                      {c.trustScore}% Trust
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {c.distanceFormatted} away • {c.district}, {c.state} • {c.memberCount} Artisans
                  </p>
                </div>
                <Badge variant="gov" size="sm">
                  Jurisdiction
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area: Map & Ranked Worker Cards */}
      <div
        className={`grid gap-6 ${
          viewMode === 'split'
            ? 'grid-cols-1 lg:grid-cols-12'
            : viewMode === 'map'
            ? 'grid-cols-1'
            : 'grid-cols-1'
        }`}
      >
        {/* Leaflet Map Column */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-7' : 'w-full'}>
            <div className="sticky top-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive Geospatial Radius View</span>
                </span>
                <span className="text-[11px] text-slate-400">Click marker to inspect artisan</span>
              </div>

              <WorkerMatchingMap
                customerLocation={currentCoords}
                workers={workers}
                cooperatives={cooperatives}
                selectedWorkerId={selectedWorkerId}
                onSelectWorker={(id) => setSelectedWorkerId(id)}
                onSelectCooperative={() => {}}
                onBookWorker={(item) => {
                  if (onBookWorker) onBookWorker(item);
                }}
                searchRadiusKm={maxRadiusKm}
                className={`${
                  viewMode === 'map' ? 'h-[620px]' : 'h-[520px]'
                } w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200`}
              />
            </div>
          </div>
        )}

        {/* Worker Cards Column */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5' : 'w-full'}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-saffron-600" />
                <span>Ranked Artisans in {locationName}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {workers.length} results
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-2 border-brand-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold">Calculating distances & ranking suitable artisans...</p>
              </div>
            ) : workers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Matching Artisans in This Radius</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try expanding your search radius (e.g. 35-50 km) or clearing specific trade filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMaxRadiusKm(50);
                    setSelectedTrade('All Trades');
                    setAvailableOnly(false);
                  }}
                >
                  Expand Search Radius
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {workers.map((item) => {
                  const worker = item.worker;
                  const isSelected = selectedWorkerId === (worker.id || worker._id);

                  return (
                    <div
                      key={worker.id || worker._id}
                      onClick={() => setSelectedWorkerId(worker.id || worker._id)}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-saffron-500 bg-brand-saffron-50/20 ring-2 ring-brand-saffron-200 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {worker.name}
                            </h4>
                            {worker.isVerified && (
                              <Badge variant="verified" size="sm">
                                Verified
                              </Badge>
                            )}
                            {worker.nsdcCertified && (
                              <Badge variant="gov" size="sm">
                                NSDC
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-brand-navy-900 mt-0.5">
                            {worker.primaryTrade || worker.trade}
                          </p>
                        </div>

                        {/* Rating & Distance Badges */}
                        <div className="text-right flex flex-col items-end">
                          <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                            ★ {item.rating}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({item.ratingCount || 40})
                            </span>
                          </span>
                          <span className="text-xs font-bold text-blue-600 mt-0.5">
                            {item.distanceFormatted} away
                          </span>
                        </div>
                      </div>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap gap-1.5 my-3">
                        {item.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                        {item.skills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[10px]">
                            +{item.skills.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Cooperative & Rate Info */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Sponsoring Society</span>
                          <span className="font-bold text-slate-800">
                            {item.cooperative?.name || 'Pune Shramik Vikas Sahakari'}
                          </span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-[10px] text-slate-400 block">Guaranteed Floor</span>
                          <span className="font-black text-brand-navy-900 font-display">
                            ₹{worker.rates?.dailyFloorRate || 1100} / day
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>~{item.estimatedArrivalMin || 15} min transit</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={ArrowRight}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onBookWorker) onBookWorker(item);
                            }}
                          >
                            Book Artisan
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

