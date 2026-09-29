import { LocationMap } from "../../components/common/LocationMap";
import React, { useState, useEffect } from "react";
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
  AlertCircle,
  Navigation,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileText,
  HelpCircle,
  Star,
  Check,
} from "lucide-react";
import { catalogService } from "../../services/service.service";
import { bookingService } from "../../services/booking.service";
import { useBookingPayment, paymentStatusLabel } from "./useBookingPayment";
import { useAuth } from "../../context/AuthContext";
import {
  POPULAR_PROFESSIONS,
  detectTradeFromJobDescription,
} from "../../utils/tradeUtils";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { getUserCoordinates } from "../../utils/geo.utils";
import { profileService } from "../../services/profile.service";
import { getDefaultAddressForBooking } from "../../utils/address.utils";

const WORK_TYPES = [
  {
    id: "repair",
    label: "Repair & Troubleshooting",
    desc: "Fixing malfunctions, leaks, tripping, or defects",
  },
  {
    id: "installation",
    label: "New Installation",
    desc: "Setting up new fixtures, appliances, or lines",
  },
  {
    id: "inspection",
    label: "Inspection & Diagnosis",
    desc: "Safety audit, preventive check, or cost estimation",
  },
  {
    id: "emergency",
    label: "Emergency Breakdown",
    desc: "Urgent immediate attention required",
  },
  {
    id: "maintenance",
    label: "Routine Maintenance",
    desc: "Periodic servicing and tuning",
  },
  {
    id: "replacement",
    label: "Replacement & Upgrade",
    desc: "Replacing old equipment or fittings",
  },
];

const TIME_SLOTS = [
  {
    id: "morning",
    label: "Morning",
    time: "09:00 AM - 12:00 PM",
    defaultStart: "10:00",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    time: "12:00 PM - 04:00 PM",
    defaultStart: "14:00",
  },
  {
    id: "evening",
    label: "Evening",
    time: "04:00 PM - 08:00 PM",
    defaultStart: "17:00",
  },
];

export function BookingWizardModal({
  isOpen,
  onClose,
  initialService = null,
  onBookingCreated,
  onPaymentUpdated,
}) {
  const { user } = useAuth();

  // Step state (1: Job Details, 2: Location & GPS, 3: Allocation Path, 4: Wage & Confirmation)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Job Details & Photos
  const [selectedTrade, setSelectedTrade] = useState(
    "Electrical & Power Systems",
  );
  const [jobDescription, setJobDescription] = useState("");
  const [workType, setWorkType] = useState("Repair & Troubleshooting");
  const [photos, setPhotos] = useState([]); // Base64 or object URLs
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
  );
  const [selectedSlot, setSelectedSlot] = useState("morning");
  const [startTime, setStartTime] = useState("10:00");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethodPreference, setPaymentMethodPreference] = useState("ONLINE");

  // Step 2: Location & GPS
  const [locationData, setLocationData] = useState({
    street: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    landmark: "",
    coordinates: [0, 0], // [longitude, latitude]
  });
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Step 3: Allocation Choice (Direct Worker vs Cooperative Assignment)
  // 'direct_worker' | 'cooperative_assignment' | 'auto_fair'
  const [allocationPath, setAllocationPath] = useState(
    "cooperative_assignment",
  );
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [suitableData, setSuitableData] = useState(null);
  const [isLoadingSuitable, setIsLoadingSuitable] = useState(false);

  // Submission & Result States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const {
    paymentStatus,
    isPaying,
    paymentMessage,
    handlePayment,
    downloadInvoice,
    retryingVerification,
    paymentsEnabled,
  } = useBookingPayment({
    booking: createdBooking,
    customer: user,
    onBookingUpdated: setCreatedBooking,
    onPaymentUpdated,
  });

  // Initialize modal state when opened or initialService changes
  useEffect(() => {
    if (isOpen) {
      setCreatedBooking(null);
      setErrorMessage(null);
      setGpsError(null);
      setGpsSuccess(false);

      if (initialService) {
        // Trade & description
        const trade =
          initialService.trade ||
          initialService.category ||
          initialService.name ||
          "Electrical & Power Systems";
        setSelectedTrade(trade);

        const desc =
          initialService.description ||
          initialService.specialInstructions ||
          initialService.searchQuery ||
          "";
        setJobDescription(desc);
        setSpecialInstructions(desc);

        // Location prefill if known (never overwrite with Pune if provided)
        if (
          initialService.location ||
          initialService.pincode ||
          initialService.city
        ) {
          setLocationData((prev) => ({
            ...prev,
            street:
              initialService.location?.street ||
              initialService.street ||
              prev.street,
            city:
              initialService.location?.city || initialService.city || prev.city,
            state:
              initialService.location?.state ||
              initialService.state ||
              prev.state ||
              "Maharashtra",
            pincode:
              initialService.location?.pincode ||
              initialService.pincode ||
              prev.pincode,
            landmark:
              initialService.location?.landmark ||
              initialService.landmark ||
              prev.landmark,
            coordinates:
              Array.isArray(initialService.location?.coordinates) &&
              initialService.location.coordinates.length === 2
                ? initialService.location.coordinates
                : prev.coordinates,
          }));
        }

        // Direct Worker vs Cooperative Selection
        if (
          initialService.preferredWorkerId ||
          initialService.preferredWorker
        ) {
          setAllocationPath("direct_worker");
          setSelectedWorker(
            initialService.preferredWorker || {
              id: initialService.preferredWorkerId,
              _id: initialService.preferredWorkerId,
              name: initialService.preferredWorkerName || "Selected Artisan",
              trade: trade,
              rating: 4.9,
              dailyFloorRate: initialService.estimatedPrice?.floorRate
                ? initialService.estimatedPrice.floorRate * 2.5
                : 1200,
            },
          );
          if (
            initialService.preferredCooperativeId ||
            initialService.preferredCooperative
          ) {
            setSelectedCooperative(
              initialService.preferredCooperative || {
                id: initialService.preferredCooperativeId,
                _id: initialService.preferredCooperativeId,
                name:
                  initialService.preferredCooperativeName ||
                  "Pune Shramik Vikas Sahakari",
              },
            );
          }
        } else if (
          initialService.preferredCooperativeId ||
          initialService.preferredCooperative
        ) {
          setAllocationPath("cooperative_assignment");
          setSelectedWorker(null);
          setSelectedCooperative(
            initialService.preferredCooperative || {
              id: initialService.preferredCooperativeId,
              _id: initialService.preferredCooperativeId,
              name:
                initialService.preferredCooperativeName ||
                "Pune Shramik Vikas Sahakari",
            },
          );
        } else {
          setAllocationPath("cooperative_assignment");
        }
      } else {
        // Fresh booking starting from Step 1
        setSelectedTrade("Electrical & Power Systems");
        setJobDescription("");
        setSpecialInstructions("");
        setAllocationPath("cooperative_assignment");
        setLocationData({
          street: "",
          city: "",
          state: "",
          pincode: "",
          landmark: "",
          coordinates: [0, 0],
        });
      }

      setCurrentStep(1);
    }
  }, [isOpen, initialService]);

  useEffect(() => {
    if (
      !isOpen ||
      initialService?.location ||
      initialService?.pincode ||
      initialService?.city
    )
      return undefined;
    let active = true;
    profileService
      .getProfile()
      .then((profile) => {
        if (!active) return;
        const defaultAddress = getDefaultAddressForBooking(profile.addresses);
        if (!defaultAddress) return;
        setLocationData((current) =>
          current.street || current.city || current.pincode
            ? current
            : { ...current, ...defaultAddress },
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, initialService]);

  // Load suitable cooperatives & workers when entering Step 3
  const loadSuitableCooperativesAndWorkers = async () => {
    setIsLoadingSuitable(true);
    setErrorMessage(null);
    try {
      const data = await bookingService.getSuitableCooperativesAndWorkers({
        trade: selectedTrade,
        city: locationData.city || "Pune",
        pincode: locationData.pincode,
        latitude: locationData.coordinates.some((value) => value !== 0)
          ? locationData.coordinates[1]
          : undefined,
        longitude: locationData.coordinates.some((value) => value !== 0)
          ? locationData.coordinates[0]
          : undefined,
      });
      setSuitableData(data);

      if (
        allocationPath === "cooperative_assignment" &&
        !selectedCooperative &&
        data.cooperatives?.length > 0
      ) {
        setSelectedCooperative(data.cooperatives[0]);
      }
      if (
        allocationPath === "direct_worker" &&
        !selectedWorker &&
        data.workers?.length > 0
      ) {
        setSelectedWorker(data.workers[0]);
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Could not load available workers. Please retry.",
      );
    } finally {
      setIsLoadingSuitable(false);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.slice(0, 3).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPhotos((prev) => [...prev, uploadEvent.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle Device GPS Geolocation (Only on explicit button click)
  const handleUseCurrentLocation = async () => {
    setGpsError(null);
    setGpsSuccess(false);
    setIsLocatingGps(true);

    try {
      const loc = await getUserCoordinates();
      setLocationData((prev) => ({
        ...prev,
        coordinates: [loc.longitude, loc.latitude],
        street: loc.street || prev.street || "",
        city: loc.city || prev.city || "Pune",
        state: loc.state || prev.state || "Maharashtra",
        pincode: loc.pincode || prev.pincode || "",
        landmark: loc.name || prev.landmark || "GPS Location",
      }));
      setGpsSuccess(true);
    } catch (error) {
      setGpsError(
        error.message ||
          "Unable to retrieve your current location. Please enter your address manually.",
      );
    } finally {
      setIsLocatingGps(false);
    }
  };

  // Step 1 Validation -> Next to Step 2
  const handleNextToStep2 = () => {
    if (!jobDescription.trim()) {
      setErrorMessage(
        "Please provide a brief description of the required work.",
      );
      return;
    }
    if (!scheduleDate) {
      setErrorMessage("Please select a preferred service date.");
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  // Step 2 Validation -> Next to Step 3
  const handleNextToStep3 = () => {
    if (!locationData.street?.trim()) {
      setErrorMessage("Please enter house/flat/street address.");
      return;
    }
    if (!locationData.city?.trim()) {
      setErrorMessage("Please enter your city.");
      return;
    }
    setErrorMessage(null);
    loadSuitableCooperativesAndWorkers();
    setCurrentStep(3);
  };

  // Step 3 Validation -> Next to Step 4
  const handleNextToStep4 = () => {
    if (allocationPath === "direct_worker" && !selectedWorker) {
      setErrorMessage(
        "Please select an artisan for direct booking or switch to Cooperative Assignment.",
      );
      return;
    }
    if (allocationPath === "cooperative_assignment" && !selectedCooperative) {
      setErrorMessage(
        "Please select a cooperative society for guild assignment.",
      );
      return;
    }
    setErrorMessage(null);
    setCurrentStep(4);
  };

  // Step 4: Final Booking Submission
  const handleCreateBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const startDateTime = new Date(
        `${scheduleDate}T${startTime || "10:00"}:00`,
      );
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Invalid scheduled start date or time");
      }

      // Determine final allocation references
      const targetWorkerId =
        allocationPath === "direct_worker" && selectedWorker
          ? selectedWorker.id || selectedWorker._id || selectedWorker.workerId
          : null;

      const targetCoopId =
        selectedCooperative?.id ||
        selectedCooperative?._id ||
        selectedWorker?.cooperativeId ||
        (allocationPath !== "direct_worker"
          ? suitableData?.recommendedAllocation?.cooperativeId
          : null) ||
        null;

      const hourlyFloor = selectedWorker?.rates?.hourlyRate || 450;
      const totalFloor = hourlyFloor * 2; // 2 hour base reservation

      const payload = {
        serviceName: selectedTrade,
        trade: selectedTrade,
        description: jobDescription.trim(),
        workType,
        photos,
        location: {
          coordinates: locationData.coordinates || [0, 0],
          serviceAddress: {
            street: locationData.street.trim(),
            city: locationData.city.trim(),
            state: locationData.state?.trim() || "Maharashtra",
            pincode: locationData.pincode?.trim() || "",
            landmark: locationData.landmark?.trim() || "",
          },
        },
        scheduledTime: {
          start: startDateTime.toISOString(),
        },
        cooperativeId: targetCoopId,
        workerId: targetWorkerId,
        paymentMethodPreference,
        specialInstructions: (specialInstructions || jobDescription).trim(),
        price: {
          floorRateAmount: hourlyFloor,
          totalAmount: totalFloor,
        },
      };

      const result = await bookingService.createBooking(payload);
      setCreatedBooking(result);
      if (onBookingCreated) {
        onBookingCreated(result);
      }
    } catch (err) {
      console.error("Create booking failed:", err);
      setErrorMessage(
        err.message ||
          "Failed to submit service booking. Please verify details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gov" size="sm">
                Sovereign Service Dispatch
              </Badge>
              <span className="text-xs text-slate-400 font-bold">
                Step {currentStep} of 4
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              {currentStep === 1 && "1. Job Details & Preferred Schedule"}
              {currentStep === 2 && "2. Service Location & Address"}
              {currentStep === 3 && "3. Artisan & Cooperative Allocation"}
              {currentStep === 4 && "4. Statutory Floor Wage & Confirmation"}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isPaying}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-5 sm:px-8 py-2.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-500">
          <div
            className={`flex items-center gap-1.5 ${currentStep >= 1 ? "text-brand-saffron-700" : ""}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? "bg-brand-saffron-500 text-white" : "bg-slate-200"}`}
            >
              1
            </span>
            <span>Job Details</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div
            className={`flex items-center gap-1.5 ${currentStep >= 2 ? "text-brand-saffron-700" : ""}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? "bg-brand-saffron-500 text-white" : "bg-slate-200"}`}
            >
              2
            </span>
            <span>Location</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div
            className={`flex items-center gap-1.5 ${currentStep >= 3 ? "text-brand-saffron-700" : ""}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 3 ? "bg-brand-saffron-500 text-white" : "bg-slate-200"}`}
            >
              3
            </span>
            <span>Allocation</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <div
            className={`flex items-center gap-1.5 ${currentStep >= 4 ? "text-brand-saffron-700" : ""}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 4 ? "bg-brand-saffron-500 text-white" : "bg-slate-200"}`}
            >
              4
            </span>
            <span>Review & Submit</span>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Screen after Booking Registration */}
          {createdBooking ? (
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-display">
                Service Booking Submitted!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your service request for{" "}
                <strong className="text-slate-900">
                  {createdBooking.serviceName || selectedTrade}
                </strong>{" "}
                has been registered with status{" "}
                <Badge
                  variant={
                    createdBooking.status === "ASSIGNED" ? "saffron" : "default"
                  }
                  size="sm"
                >
                  {createdBooking.status || "PENDING"}
                </Badge>
                .
              </p>

              {/* Booking Details Summary */}
              <div className="max-w-md mx-auto p-4.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5 my-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    #{createdBooking.id || createdBooking._id?.slice(-8)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Allocation Path:</span>
                  <span className="font-bold text-slate-900">
                    {createdBooking.workerId || createdBooking.worker
                      ? "Direct Artisan Booking (Awaiting Worker Confirmation)"
                      : "Cooperative Society Assignment (Awaiting Guild Dispatch)"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Booking amount:</span>
                  <span className="font-bold text-slate-900">
                    ₹{createdBooking.price?.totalAmount ?? 0}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Payment State:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded border ${paymentStatus === "escrow_locked" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : paymentStatus === "released" ? "text-green-700 bg-green-50 border-green-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}
                  >
                    {paymentStatusLabel(
                      !paymentsEnabled &&
                        ["pending", "failed"].includes(paymentStatus)
                        ? "not_required"
                        : paymentStatus,
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-bold text-slate-900">{createdBooking.paymentMethodPreference === "CASH" ? "Cash on Delivery" : "Online Payment (Razorpay)"}</span>
                </div>

                {createdBooking.paymentProvider?.invoiceUrl && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Digital invoice:</span>
                    <a
                      className="font-bold text-brand-saffron-700 underline"
                      href="#invoice"
                      onClick={async (event) => {
                        event.preventDefault();
                        await downloadInvoice();
                      }}
                    >
                      Download PDF
                    </a>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500">Work verification:</span>
                  <span className="font-extrabold text-brand-saffron-600 font-mono text-sm">
                    Generate codes from booking tracking
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Date & Time:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(
                      createdBooking.scheduledTime?.start,
                    ).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {paymentMessage && (
                <p
                  role="status"
                  className="max-w-md mx-auto mb-3 text-xs text-slate-700"
                >
                  {paymentMessage}
                </p>
              )}

              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  disabled={isPaying}
                >
                  Track in Customer Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: JOB DETAILS & PREFERRED SCHEDULE */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Profession / Trade Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Select Service Profession / Trade
                    </label>
                    <select
                      value={selectedTrade}
                      onChange={(e) => setSelectedTrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                    >
                      {!POPULAR_PROFESSIONS.some(
                        (p) => p.tradeName === selectedTrade,
                      ) && (
                        <option value={selectedTrade}>{selectedTrade}</option>
                      )}
                      {POPULAR_PROFESSIONS.map((p) => (
                        <option key={p.id} value={p.tradeName}>
                          {p.tradeName} ({p.hindiName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Work Type Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Nature of Work / Requirement
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {WORK_TYPES.map((wt) => {
                        const isSelected = workType === wt.label;
                        return (
                          <button
                            key={wt.id}
                            type="button"
                            onClick={() => setWorkType(wt.label)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-brand-saffron-500 bg-brand-saffron-50/60 ring-2 ring-brand-saffron-200"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-bold text-xs text-slate-900 block">
                              {wt.label}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {wt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Job Description & Problem Details *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Describe the issue in detail (e.g. 'Main distribution board MCB tripping when AC is turned on', 'bathroom sink drain pipe is fractured')..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                    />
                  </div>

                  {/* Photo Attachments */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Upload Site / Equipment Photos (Optional)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-3.5 py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-saffron-500 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-700 transition-colors">
                        <Upload className="w-4 h-4 text-brand-saffron-600" />
                        <span>Add Photos (Max 3)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {photos.map((src, idx) => (
                        <div
                          key={idx}
                          className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden group"
                        >
                          <img
                            src={src}
                            alt="Uploaded site"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Date & Arrival Slot */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-saffron-600" />
                      <span>Preferred Date & Schedule</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Service Date *
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Arrival Slot (Morning / Afternoon / Evening)
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[
                            {
                              id: "morning",
                              label: "Morning",
                              defaultTime: "10:00",
                            },
                            {
                              id: "afternoon",
                              label: "Afternoon",
                              defaultTime: "14:00",
                            },
                            {
                              id: "evening",
                              label: "Evening",
                              defaultTime: "17:00",
                            },
                          ].map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot.id);
                                setStartTime(slot.defaultTime);
                              }}
                              className={`py-2 px-1 rounded-xl text-center border text-[11px] font-bold transition-all ${
                                selectedSlot === slot.id
                                  ? "border-brand-saffron-500 bg-brand-navy-900 text-white shadow-xs"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-saffron-600 flex-shrink-0" />
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Preferred Exact Time:
                          </label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Special Instructions & Access Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="e.g. Ring bell 402, ladder available on site, gate code 8820"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & GPS */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Service Location Address
                      </h4>
                      <p className="text-xs text-slate-500">
                        Provide exact address for proximity matching & dispatch
                      </p>
                    </div>

                    {/* Use Current Location Button */}
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocatingGps}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2 border border-blue-200 transition-colors"
                    >
                      <Navigation
                        className={`w-3.5 h-3.5 ${isLocatingGps ? "animate-spin" : ""}`}
                      />
                      <span>
                        {isLocatingGps
                          ? "Requesting GPS..."
                          : "Use my current location"}
                      </span>
                    </button>
                  </div>

                  {/* GPS Feedback Banners */}
                  {gpsSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        GPS coordinates acquired [
                        {locationData.coordinates[0].toFixed(4)},{" "}
                        {locationData.coordinates[1].toFixed(4)}]. Please
                        complete street & city details below.
                      </span>
                    </div>
                  )}

                  {gpsError && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{gpsError}</span>
                    </div>
                  )}

                  {/* Address Form Inputs */}
                  <div className="space-y-3.5">
                    <div className="mb-4 space-y-3">
                      <p className="text-sm text-slate-600">
                        Customer: {user?.name} / {user?.phone} /{" "}
                        {user?.email || "No email on file"}
                      </p>
                      <LocationMap
                        coordinates={locationData.coordinates}
                        onPick={(coordinates) =>
                          setLocationData((prev) => ({ ...prev, coordinates }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        House / Flat / Building / Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={locationData.street}
                        onChange={(e) =>
                          setLocationData({
                            ...locationData,
                            street: e.target.value,
                          })
                        }
                        placeholder="e.g. Flat 402, Green Meadows, Paud Road"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={locationData.city}
                          onChange={(e) =>
                            setLocationData({
                              ...locationData,
                              city: e.target.value,
                            })
                          }
                          placeholder="e.g. Pune, Mumbai, Delhi..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={locationData.pincode}
                          onChange={(e) =>
                            setLocationData({
                              ...locationData,
                              pincode: e.target.value,
                            })
                          }
                          placeholder="e.g. 411038"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={locationData.state}
                          onChange={(e) =>
                            setLocationData({
                              ...locationData,
                              state: e.target.value,
                            })
                          }
                          placeholder="e.g. Maharashtra"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Prominent Landmark / Access Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={locationData.landmark}
                        onChange={(e) =>
                          setLocationData({
                            ...locationData,
                            landmark: e.target.value,
                          })
                        }
                        placeholder="e.g. Opposite City Pride, near Kothrud Bus Depot"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ALLOCATION PATH CHOICE */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Choose Allocation Mode
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pick a verified artisan directly or request cooperative
                        assignment
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setAllocationPath("direct_worker")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        allocationPath === "direct_worker"
                          ? "border-brand-saffron-500 bg-brand-saffron-50/40 ring-2 ring-brand-saffron-200"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-brand-saffron-600" />
                          <span>Direct Artisan Selection</span>
                        </span>
                        <Badge
                          variant={
                            allocationPath === "direct_worker"
                              ? "saffron"
                              : "outline"
                          }
                          size="sm"
                        >
                          Direct Roster
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Book a specific artisan. Booking status becomes{" "}
                        <strong className="text-slate-800">ASSIGNED</strong> and
                        awaits the worker's acceptance.
                      </p>
                    </div>

                    <div
                      onClick={() =>
                        setAllocationPath("cooperative_assignment")
                      }
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        allocationPath === "cooperative_assignment"
                          ? "border-brand-saffron-500 bg-brand-saffron-50/40 ring-2 ring-brand-saffron-200"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>Cooperative Assignment</span>
                        </span>
                        <Badge
                          variant={
                            allocationPath === "cooperative_assignment"
                              ? "verified"
                              : "outline"
                          }
                          size="sm"
                        >
                          Guild Dispatch
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Route to a registered cooperative society. Status starts
                        as <strong className="text-slate-800">PENDING</strong>{" "}
                        awaiting guild dispatch.
                      </p>
                    </div>
                  </div>

                  {isLoadingSuitable ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      <div className="w-8 h-8 border-2 border-brand-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>
                        Loading available artisans and cooperatives in{" "}
                        {locationData.city || "your area"}...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Direct Worker Selection View */}
                      {allocationPath === "direct_worker" && (
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Select Verified Artisan from Roster:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                            {(
                              suitableData?.workers ||
                              (selectedWorker ? [selectedWorker] : [])
                            ).map((w) => {
                              const isSelected =
                                selectedWorker?.id === w.id ||
                                selectedWorker?._id === w._id ||
                                selectedWorker?.workerId === w.workerId;
                              return (
                                <div
                                  key={w.id || w._id || w.workerId}
                                  onClick={() => setSelectedWorker(w)}
                                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? "border-brand-saffron-500 bg-brand-saffron-50/50 ring-2 ring-brand-saffron-200"
                                      : "border-slate-200 bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-xs text-slate-900">
                                        {w.name}
                                      </span>
                                      <span className="text-[11px] font-bold text-amber-500">
                                        ★ {w.rating || "Not yet rated"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                      {w.trade || w.primaryTrade} •{" "}
                                      {w.experienceYears || 0} yrs exp
                                    </p>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-brand-navy-900">
                                      ₹
                                      {w.rates?.dailyFloorRate ||
                                        w.dailyFloorRate ||
                                        0}{" "}
                                      / day
                                    </span>
                                    <Badge variant="verified" size="sm">
                                      KYC Verified
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cooperative Assignment View */}
                      {allocationPath === "cooperative_assignment" && (
                        <div className="space-y-3">
                          {!suitableData?.cooperatives?.length && (
                            <p className="text-sm text-slate-500">
                              No matching cooperatives in this area. Choose
                              another service or location.
                            </p>
                          )}
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Select Sponsoring Cooperative Guild:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(
                              suitableData?.cooperatives ||
                              (selectedCooperative ? [selectedCooperative] : [])
                            ).map((c) => {
                              const isSelected =
                                selectedCooperative?.id === c.id ||
                                selectedCooperative?._id === c._id;
                              return (
                                <div
                                  key={c.id || c._id}
                                  onClick={() => setSelectedCooperative(c)}
                                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-200"
                                      : "border-slate-200 bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-slate-900">
                                      {c.name}
                                    </span>
                                    <Badge variant="gov" size="sm">
                                      {c.trustScore || 98}% Trust
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    Jurisdiction:{" "}
                                    {c.district || locationData.city || "Pune"}{" "}
                                    • {c.memberCount || 0} Artisans
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* STEP 4: STATUTORY FLOOR WAGE BREAKDOWN & CONFIRMATION */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  {/* Summary Top Banner */}
                  <div className="p-5 rounded-2xl bg-brand-navy-900 text-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-brand-saffron-300 uppercase tracking-wider">
                        Booking Summary & Statutory Floor Wage
                      </span>
                      <Badge variant="verified" size="sm">
                        0% Platform Cut
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold font-display">
                      {selectedTrade}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Scheduled for{" "}
                      {new Date(
                        `${scheduleDate}T${startTime}`,
                      ).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">Allocation Path:</span>
                      <span className="font-bold text-slate-900">
                        {allocationPath === "direct_worker" && selectedWorker
                          ? `Direct Booking: ${selectedWorker.name} (Awaits Worker Acceptance)`
                          : `Guild Assignment: ${selectedCooperative?.name || "Pune Shramik Vikas Sahakari"} (Awaits Guild Dispatch)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">Service Location:</span>
                      <span className="font-semibold text-slate-900">
                        {locationData.street}, {locationData.city}{" "}
                        {locationData.pincode && `- ${locationData.pincode}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">
                        Statutory Hourly Floor Rate:
                      </span>
                      <span className="font-bold text-slate-900">
                        ₹{selectedWorker?.rates?.hourlyRate || 450} / hr
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">
                        Minimum Reservation (2 Hours):
                      </span>
                      <span className="font-bold text-slate-900">
                        ₹{(selectedWorker?.rates?.hourlyRate || 450) * 2}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-slate-600">
                        Platform Commission:
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        ₹0 (0% Middleman Deduction)
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-slate-900">
                      <span>Estimated Payable Amount:</span>
                      <span className="text-brand-saffron-700 text-base">
                        ₹{(selectedWorker?.rates?.hourlyRate || 450) * 2}
                      </span>
                    </div>
                  </div>

                  <fieldset className="p-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">Payment Method</legend>
                    <label className="mr-6 inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="paymentMethod" value="ONLINE" checked={paymentMethodPreference === "ONLINE"} onChange={() => setPaymentMethodPreference("ONLINE")} />
                      Online Payment (Razorpay)
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="paymentMethod" value="CASH" checked={paymentMethodPreference === "CASH"} onChange={() => setPaymentMethodPreference("CASH")} />
                      Cash on Delivery
                    </label>
                  </fieldset>

                  {/* Real Payment State Notice */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Secure payment after booking</p>
                      <p className="text-amber-900 text-[11px] mt-0.5 leading-relaxed">
                        No payment is collected now. After the worker completes
                        the job and verifies the End-Work OTP, you can pay online
                        with Razorpay or choose Cash on Delivery. The invoice is
                        available after payment confirmation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Navigation Footer */}
        {!createdBooking && (
          <div className="p-4 sm:px-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="md"
                icon={ArrowLeft}
                onClick={() => {
                  setErrorMessage(null);
                  setCurrentStep((prev) => prev - 1);
                }}
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
                onClick={handleNextToStep2}
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
                Continue to Allocation
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                onClick={handleNextToStep4}
              >
                Review & Confirm
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
                Submit Service Booking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingWizardModal;
