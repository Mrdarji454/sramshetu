import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft,
  IndianRupee,
  Sparkles,
  Zap,
  Droplets,
  Wrench,
  Hammer,
  Paintbrush,
  Flame,
  AlertCircle
} from 'lucide-react';
import { catalogService } from '../../services/service.service';
import { bookingService } from '../../services/booking.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const iconMap = {
  Zap,
  Droplets,
  Hammer,
  Wrench,
  Paintbrush,
  Flame,
};

export function BookingWizardModal({ isOpen, onClose, initialService = null, onBookingCreated }) {
  const { user } = useAuth();

  // Wizard Step: 1 = Service, 2 = Location & Schedule, 3 = Cooperatives & Workers, 4 = Review & Escrow
  const [currentStep, setCurrentStep] = useState(initialService ? 2 : 1);

  // Data states
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(initialService);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suitableData, setSuitableData] = useState(null);
  const [isLoadingSuitable, setIsLoadingSuitable] = useState(false);

  // Form states
  const [locationData, setLocationData] = useState({
    street: 'Flat 402, Green Meadows',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    landmark: 'Near Kothrud Depot',
  });

  const [scheduleData, setScheduleData] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    timeSlot: 'Morning (09:00 AM - 12:00 PM)',
    startTime: '10:00',
    specialInstructions: 'Need inspection of distribution board tripping and concealed lines.',
  });

  const [selectedCooperativeId, setSelectedCooperativeId] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [useAutoAllocation, setUseAutoAllocation] = useState(true);

  // Booking result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load catalog on open
  useEffect(() => {
    if (isOpen) {
      catalogService.getServices().then((data) => {
        if (Array.isArray(data)) setServices(data);
      }).catch((e) => console.error('Failed to load services:', e));

      if (initialService) {
        setSelectedService(initialService);
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
      setCreatedBooking(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialService]);

  // Load suitable cooperatives & workers when moving to Step 3
  const loadSuitableCooperativesAndWorkers = async () => {
    setIsLoadingSuitable(true);
    setErrorMessage(null);
    try {
      const data = await bookingService.getSuitableCooperativesAndWorkers({
        serviceId: selectedService?._id || selectedService?.id,
        trade: selectedService?.trade || selectedService?.name,
        city: locationData.city,
        pincode: locationData.pincode,
      });
      setSuitableData(data);
      if (data.cooperatives?.length > 0 && !selectedCooperativeId) {
        setSelectedCooperativeId(data.cooperatives[0]._id || data.cooperatives[0].id);
      }
    } catch (err) {
      console.error('Error fetching suitable cooperatives:', err);
    } finally {
      setIsLoadingSuitable(false);
    }
  };

  const handleNextToStep3 = () => {
    if (!locationData.street || !locationData.city || !locationData.pincode) {
      setErrorMessage('Please fill in complete address details (street, city, pincode)');
      return;
    }
    setErrorMessage(null);
    loadSuitableCooperativesAndWorkers();
    setCurrentStep(3);
  };

  const handleCreateBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const startDateTime = new Date(`${scheduleData.date}T${scheduleData.startTime || '10:00'}:00`);

      const payload = {
        serviceId: selectedService?._id || selectedService?.id,
        serviceName: selectedService?.name || 'Skilled Artisan Service',
        trade: selectedService?.category || selectedService?.trade || selectedService?.name,
        location: {
          coordinates: [73.8058, 18.5074],
          serviceAddress: {
            street: locationData.street,
            city: locationData.city,
            state: locationData.state,
            pincode: locationData.pincode,
            landmark: locationData.landmark,
          },
        },
        scheduledTime: {
          start: startDateTime.toISOString(),
        },
        cooperativeId: useAutoAllocation ? null : selectedCooperativeId,
        workerId: useAutoAllocation ? null : selectedWorkerId,
        specialInstructions: scheduleData.specialInstructions,
        price: {
          floorRateAmount: selectedService?.estimatedPrice?.floorRate || 450,
          totalAmount: (selectedService?.estimatedPrice?.floorRate || 450) * 2,
        },
      };

      const result = await bookingService.createBooking(payload);
      setCreatedBooking(result);
      if (onBookingCreated) {
        onBookingCreated(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const categories = ['All', 'Electrical', 'Plumbing', 'Carpentry', 'Masonry', 'Painting', 'Appliance Repair'];

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCategory === 'All' || s.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch = !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || (s.tags || []).some((t) => t.toLowerCase().includes(serviceSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Step Indicator */}
        <div className="p-5 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gov" size="sm">Cooperative Service Booking</Badge>
              <span className="text-xs text-slate-400 font-bold">
                Step {currentStep} of 4
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              {currentStep === 1 && 'Select a Service Trade'}
              {currentStep === 2 && 'Service Address & Preferred Time'}
              {currentStep === 3 && 'Choose Suitable Cooperative or Worker'}
              {currentStep === 4 && 'Fair Wage Escrow Breakdown & Confirmation'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="px-5 sm:px-8 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
          <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-brand-saffron-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? 'bg-brand-saffron-500 text-white' : 'bg-slate-200'}`}>1</span>
            <span>Service</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-brand-saffron-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? 'bg-brand-saffron-500 text-white' : 'bg-slate-200'}`}>2</span>
            <span>Schedule & Location</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-brand-saffron-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 3 ? 'bg-brand-saffron-500 text-white' : 'bg-slate-200'}`}>3</span>
            <span>Cooperative / Worker</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-brand-saffron-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 4 ? 'bg-brand-saffron-500 text-white' : 'bg-slate-200'}`}>4</span>
            <span>Escrow & Confirm</span>
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Screen after Creation */}
          {createdBooking ? (
            <div className="text-center py-6 sm:py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-display">
                Service Booking Confirmed!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your service request for <strong className="text-slate-900">{createdBooking.serviceName}</strong> has been registered with status <Badge variant="saffron" size="sm">PENDING</Badge>.
              </p>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5 my-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-bold text-slate-900 font-mono">#{createdBooking.id || createdBooking._id?.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guaranteed Floor Wage:</span>
                  <span className="font-bold text-emerald-700">₹{createdBooking.price?.totalAmount || 900}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Commission Cut:</span>
                  <span className="font-bold text-emerald-700">₹0 (0% Middleman Cut)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification OTP:</span>
                  <span className="font-extrabold text-brand-saffron-600 font-mono text-sm">{createdBooking.qrVerification?.otpCode || '4921'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Date/Time:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(createdBooking.scheduledTime?.start).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Button variant="primary" size="md" onClick={onClose}>
                  Track in Customer Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: BROWSE SERVICES */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Search Bar & Category Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search electrical, plumbing, masonry, carpentry..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedCategory === cat
                            ? 'bg-brand-navy-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[46vh] overflow-y-auto pr-1">
                    {filteredServices.map((srv) => {
                      const IconCmp = iconMap[srv.icon] || Wrench;
                      const isSelected = selectedService?._id === srv._id || selectedService?.id === srv.id;

                      return (
                        <div
                          key={srv.id || srv._id}
                          onClick={() => setSelectedService(srv)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-brand-saffron-500 bg-brand-saffron-50/50 ring-2 ring-brand-saffron-200 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-9 h-9 rounded-xl bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center">
                                <IconCmp className="w-5 h-5" />
                              </div>
                              <Badge variant="saffron" size="sm">{srv.badge || 'Guild Certified'}</Badge>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">{srv.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{srv.description}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Statutory Floor:</span>
                            <span className="font-extrabold text-brand-navy-900">
                              ₹{srv.estimatedPrice?.floorRate || 450} / hr
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & PREFERRED SCHEDULE */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Selected service preview banner */}
                  <div className="p-4 rounded-2xl bg-brand-navy-50 border border-brand-navy-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-saffron-700 block">Selected Service</span>
                      <h4 className="text-base font-bold text-brand-navy-900">{selectedService?.name}</h4>
                      <p className="text-xs text-slate-500">Cooperative Floor Rate: ₹{selectedService?.estimatedPrice?.floorRate || 450} / hr</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-brand-saffron-700 hover:underline"
                    >
                      Change Trade
                    </button>
                  </div>

                  {/* Address inputs */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-saffron-600" />
                      <span>Service Location Details</span>
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">House / Flat / Street Address</label>
                        <input
                          type="text"
                          required
                          value={locationData.street}
                          onChange={(e) => setLocationData({ ...locationData, street: e.target.value })}
                          placeholder="e.g. Flat 402, Green Meadows, Kothrud"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                          <input
                            type="text"
                            required
                            value={locationData.city}
                            onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                            placeholder="e.g. Pune"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pincode</label>
                          <input
                            type="text"
                            required
                            value={locationData.pincode}
                            onChange={(e) => setLocationData({ ...locationData, pincode: e.target.value })}
                            placeholder="e.g. 411038"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Landmark (Optional)</label>
                          <input
                            type="text"
                            value={locationData.landmark}
                            onChange={(e) => setLocationData({ ...locationData, landmark: e.target.value })}
                            placeholder="e.g. Near City Pride"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule inputs */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-saffron-600" />
                      <span>Preferred Date & Arrival Slot</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Date</label>
                        <input
                          type="date"
                          required
                          value={scheduleData.date}
                          onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Arrival Time</label>
                        <input
                          type="time"
                          value={scheduleData.startTime}
                          onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Job Description & Specific Problem</label>
                      <textarea
                        rows={2}
                        value={scheduleData.specialInstructions}
                        onChange={(e) => setScheduleData({ ...scheduleData, specialInstructions: e.target.value })}
                        placeholder="Describe the issue, tools required, or urgent instructions for the artisan..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SEE SUITABLE COOPERATIVES & WORKERS */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Cooperatives & Artisans in {locationData.city}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Matching trades for <strong className="text-slate-800">{selectedService?.name}</strong>
                      </p>
                    </div>

                    {/* Auto allocate toggle */}
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => { setUseAutoAllocation(true); setSelectedWorkerId(null); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          useAutoAllocation
                            ? 'bg-white text-brand-navy-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-brand-saffron-600" />
                        <span>Fair AI Dispatch</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseAutoAllocation(false)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          !useAutoAllocation
                            ? 'bg-white text-brand-navy-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Manual Selection
                      </button>
                    </div>
                  </div>

                  {isLoadingSuitable ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <div className="w-8 h-8 border-2 border-brand-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Scanning cooperative federations and artisan rosters in {locationData.city}...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* AI Dispatch Banner when selected */}
                      {useAutoAllocation && (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Automated Proximity Dispatch Activated</p>
                            <p className="text-amber-800 mt-0.5 leading-relaxed">
                              Your work request will be automatically broadcast to the nearest registered society (<strong className="text-amber-950">{suitableData?.recommendedAllocation?.cooperativeName || 'Pune Shramik Vikas Sahakari'}</strong>). The guild dispatch manager will assign the highest-rated available artisan.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Cooperatives List */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Available Cooperative Societies ({suitableData?.cooperatives?.length || 0})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {suitableData?.cooperatives?.map((coop) => {
                            const isSelected = selectedCooperativeId === (coop._id || coop.id);
                            return (
                              <div
                                key={coop.id || coop._id}
                                onClick={() => {
                                  setSelectedCooperativeId(coop._id || coop.id);
                                  setUseAutoAllocation(false);
                                }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                  isSelected && !useAutoAllocation
                                    ? 'border-brand-saffron-500 bg-brand-saffron-50/40 ring-2 ring-brand-saffron-200'
                                    : 'border-slate-200 bg-white hover:bg-slate-50/80'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-brand-navy-900" />
                                    <span className="font-bold text-slate-900 text-xs">{coop.name}</span>
                                  </div>
                                  <Badge variant="verified" size="sm">{coop.verificationStatus?.toUpperCase()}</Badge>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Jurisdiction: {coop.district}, {coop.state} • Trust Score: <strong className="text-emerald-700">{coop.trustScore}%</strong>
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Available Artisans List */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Verified Available Artisans ({suitableData?.workers?.length || 0})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                          {suitableData?.workers?.map((w) => {
                            const isSelected = selectedWorkerId === (w._id || w.id || w.workerId);
                            return (
                              <div
                                key={w.workerId || w._id || w.id}
                                onClick={() => {
                                  setSelectedWorkerId(w._id || w.id || w.workerId);
                                  setSelectedCooperativeId(w.cooperativeId);
                                  setUseAutoAllocation(false);
                                }}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                  isSelected && !useAutoAllocation
                                    ? 'border-brand-saffron-500 bg-brand-saffron-50/40 ring-2 ring-brand-saffron-200'
                                    : 'border-slate-200 bg-white hover:bg-slate-50/80'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-900 text-xs">{w.name}</span>
                                  <span className="text-[11px] font-bold text-emerald-700">★ {w.rating}</span>
                                </div>
                                <p className="text-[11px] text-slate-500">{w.trade} • {w.experienceYears} yrs exp</p>
                                <div className="flex items-center justify-between text-[11px] text-slate-700 mt-2 pt-1 border-t border-slate-100">
                                  <span>Floor Rate: <strong>₹{w.dailyFloorRate} / day</strong></span>
                                  <Badge variant="saffron" size="sm">Available</Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: ESCROW & CONFIRMATION */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-brand-navy-900 text-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Booking Review</span>
                      <Badge variant="verified" size="sm">0% Platform Fee Guaranteed</Badge>
                    </div>
                    <h3 className="text-xl font-bold font-display">{selectedService?.name}</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Scheduled: {new Date(`${scheduleData.date}T${scheduleData.startTime}`).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Summary Breakdown Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">Service Location:</span>
                      <span className="font-semibold text-slate-900">{locationData.street}, {locationData.city} - {locationData.pincode}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">Assigned Cooperative:</span>
                      <span className="font-semibold text-slate-900">
                        {useAutoAllocation ? 'Auto-Dispatch Nearest Registered Guild' : 'Pune Shramik Vikas Sahakari'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">Statutory Floor Wage (2 hrs minimum):</span>
                      <span className="font-bold text-slate-900">
                        ₹{(selectedService?.estimatedPrice?.floorRate || 450) * 2}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">Platform Middleman Commission:</span>
                      <span className="font-extrabold text-emerald-700">₹0 (0% Middleman Deduction)</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-slate-900">
                      <span>Total Escrow Authorization:</span>
                      <span className="text-brand-saffron-700 text-base">
                        ₹{(selectedService?.estimatedPrice?.floorRate || 450) * 2}
                      </span>
                    </div>
                  </div>

                  {/* Escrow Guarantee Pill */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Escrow Protection & Direct DBT Guarantee</p>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Your payment is held in escrow and will only be disbursed after you physically scan the artisan's QR code or provide the OTP handshake upon satisfactory completion.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {!createdBooking && (
          <div className="p-4 sm:px-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Back
              </Button>
            ) : (
              <Button variant="outline" size="md" onClick={onClose}>
                Cancel
              </Button>
            )}

            {currentStep === 1 && (
              <Button
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                disabled={!selectedService}
                onClick={() => setCurrentStep(2)}
              >
                Continue to Address
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                onClick={handleNextToStep3}
              >
                Find Cooperatives
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                onClick={() => setCurrentStep(4)}
              >
                Review Escrow
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                variant="primary"
                size="md"
                loading={isSubmitting}
                icon={ShieldCheck}
                onClick={handleCreateBooking}
              >
                Authorize Escrow & Create Booking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingWizardModal;

