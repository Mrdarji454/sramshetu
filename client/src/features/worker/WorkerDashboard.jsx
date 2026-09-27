import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import workerService from "../../services/worker.service";
import { bookingService } from "../../services/booking.service";
import { WorkerOnboardingWizard } from "./WorkerOnboardingWizard";
import { VerifiedDashboard } from "./VerifiedDashboard";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { JobProgressBar } from "../../components/dashboard/JobProgressBar";
import { NavigationMap } from "../../components/common/NavigationMap";
import { WorkerProfileModal } from "../../components/dashboard/WorkerProfileModal";
import {
  HardHat,
  QrCode,
  IndianRupee,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Power,
  Sparkles,
  PhoneCall,
  Edit3,
  AlertCircle,
  Truck,
  Wrench,
  XCircle,
  RefreshCw,
  Key,
  Check,
  X,
  MessageSquare,
  User,
} from "lucide-react";

export function WorkerDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'onboarding'
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [isProcessingId, setIsProcessingId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // OTP Verification Handshake Modal
  const [otpModalJob, setOtpModalJob] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState(null);

  // Service Completion Modal
  const [completionModalJob, setCompletionModalJob] = useState(null);
  const [completionNote, setCompletionNote] = useState("");

  // Zone Shift Offers
  const [zoneShiftOffers, setZoneShiftOffers] = useState([]);
  const [zoneShiftLoading, setZoneShiftLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [regData, profData, verData, jobsData, zoneShiftData] = await Promise.allSettled([
        workerService.getRegistrationStatus(),
        workerService.getProfile(),
        workerService.getVerificationStatus(),
        bookingService.getBookings({ role: "worker" }),
        workerService.getZoneShiftOffers(),
      ]);

      if (regData.status === "fulfilled" && regData.value) {
        const isWorkerVerified = Boolean(
          regData.value.isVerified ||
          regData.value.registrationStatus === "APPROVED" ||
          String(regData.value.verificationStatus || "").toLowerCase() ===
            "verified",
        );

        if (!isWorkerVerified) {
          const regStatus = regData.value.registrationStatus;
          if (
            regStatus === "PENDING_APPROVAL" ||
            regStatus === "PENDING_ADMIN_APPROVAL"
          ) {
            navigate("/registration-pending", { replace: true });
            return;
          }
          if (regStatus === "DRAFT") {
            navigate("/worker/onboarding", { replace: true });
            return;
          }
        }
      }

      if (profData.status === "fulfilled" && profData.value) {
        setProfile(profData.value);
        setIsAvailable(profData.value.availability?.status === "available");
      }

      if (verData.status === "fulfilled" && verData.value) {
        setVerification(verData.value);
      }

      if (jobsData.status === "fulfilled" && Array.isArray(jobsData.value)) {
        setAssignedJobs(jobsData.value);
      }

      if (zoneShiftData.status === "fulfilled") {
        const nextOffers = Array.isArray(zoneShiftData.value)
          ? zoneShiftData.value
          : Array.isArray(zoneShiftData.value?.offers)
            ? zoneShiftData.value.offers
            : [];
        setZoneShiftOffers(nextOffers);
      }
    } catch (err) {
      console.error("Error loading worker dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const handleToggleAvailability = async () => {
    const nextStatus = isAvailable ? "offline" : "available";
    setIsAvailable(!isAvailable);
    try {
      await workerService.updateAvailability({ status: nextStatus });
    } catch (err) {
      console.error("Failed to update availability:", err);
    }
  };

  // State machine actions
  const handleAcceptJob = async (job) => {
    const jobId = job.id || job._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.acceptBooking(jobId);
      setActionSuccessMsg(
        `Job #${jobId} accepted! Time slot confirmed with customer.`,
      );
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to accept job");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleRejectJob = async (job) => {
    const reason = window.prompt(
      "Please provide a reason for declining this assignment:",
    );
    if (!reason) return;

    const jobId = job.id || job._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.rejectBooking(jobId, reason);
      setActionSuccessMsg(
        `Job #${jobId} declined. Cooperative society has been notified to reassign.`,
      );
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to reject job");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleAdvanceStatus = async (
    job,
    targetStatus,
    successText,
    payload = {},
  ) => {
    const jobId = job.id || job._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.updateStatus(jobId, targetStatus, {
        note: `Worker updated progress to ${targetStatus}`,
        ...payload,
      });
      setActionSuccessMsg(successText || `Status updated to ${targetStatus}`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleOpenOtpModal = async (job) => {
    setIsProcessingId(job.id || job._id);
    try {
      if (job.status?.toUpperCase() === 'ON_THE_WAY') await bookingService.updateStatus(job.id || job._id, 'ARRIVED');
      setOtpModalJob({ ...job, status: 'ARRIVED' });
      setEnteredOtp("");
      setOtpError(null);
      loadData();
    } catch (error) { alert(error.message || 'Could not record arrival'); }
    finally { setIsProcessingId(null); }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpModalJob) return;

    const jobId = otpModalJob.id || otpModalJob._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.verifyOtp(jobId, "start", enteredOtp);
      setActionSuccessMsg(
        `Arrival verified! Service is now marked In Progress.`,
      );
      setOtpModalJob(null);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message || "Failed to verify arrival");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleOpenCompletionModal = (job) => {
    setCompletionModalJob(job);
    setCompletionNote("");
    setEnteredOtp("");
  };

  const handleCompleteServiceSubmit = async (e) => {
    e.preventDefault();
    if (!completionModalJob) return;

    const jobId = completionModalJob.id || completionModalJob._id;
    setIsProcessingId(jobId);
    try {
      await bookingService.verifyOtp(jobId, "end", enteredOtp);
      setActionSuccessMsg(
        `Work marked as completed! 100% direct escrow payout has been authorized.`,
      );
      setCompletionModalJob(null);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      alert(err.message || "Failed to complete job");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleSaveProfile = async (editData) => {
    setIsSavingProfile(true);
    try {
      // Call API to update worker profile
      const updatePayload = {
        location: {
          ...profile?.location,
          workingRadiusKm: editData.workingRadiusKm,
        },
        bio: editData.bio,
        phone: editData.phone,
        profileImage: editData.profileImage,
      };

      await workerService.updateProfile(updatePayload);
      updateUser?.({ profileImage: editData.profileImage });

      // Update local profile state
      setProfile((prev) => ({
        ...prev,
        ...updatePayload,
        location: updatePayload.location,
      }));

      return true;
    } catch (err) {
      throw new Error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleZoneShiftDecision = async (decision) => {
    try {
      setZoneShiftLoading(true);
      const result = await workerService.respondToZoneShift(decision);
      const nextOffer = result?.offer || zoneShiftOffers[0];
      setZoneShiftOffers((previous) =>
        previous.filter(
          (item) =>
            (item?._id || item?.id || item?.workerId) !==
            (nextOffer?._id || nextOffer?.id || nextOffer?.workerId),
        ),
      );
      setActionSuccessMsg(
        decision === "accept"
          ? "Zone shift accepted. Your service zone has been updated."
          : "Zone shift declined. You will remain in your current zone.",
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      setActionSuccessMsg(err.message || "Unable to update your zone shift.");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setZoneShiftLoading(false);
    }
  };

  const isVerified = Boolean(
    verification?.isVerified ||
    profile?.isVerified ||
    String(verification?.status || "").toLowerCase() === "verified" ||
    profile?.registrationStatus === "APPROVED" ||
    profile?.verificationStatus?.status === "verified",
  );
  const isRejected = Boolean(
    String(verification?.status || "").toLowerCase() === "rejected" ||
    profile?.registrationStatus === "REJECTED" ||
    profile?.verificationStatus?.status === "rejected",
  );

  // Calculate earnings
  const completedJobs = assignedJobs.filter(
    (j) => (j.status || "").toUpperCase() === "COMPLETED",
  );
  const activeJobs = assignedJobs.filter(
    (j) =>
      !["COMPLETED", "CANCELLED", "REJECTED"].includes(
        (j.status || "").toUpperCase(),
      ),
  );
  const totalEarned = completedJobs.reduce(
    (sum, j) => sum + (j.price?.totalAmount || j.escrowAmount || 900),
    0,
  );

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || profile?.name || "Shramik"}`}
      subtitle="Your work is backed by your cooperative guild. 100% direct payouts with zero platform deductions."
      roleBadge={isVerified ? "NSDC Verified Artisan" : "Verification Underway"}
    >
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top View Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-brand-navy-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>Daily Work Rota & Jobs</span>
            {activeJobs.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "overview"
                    ? "bg-brand-saffron-500 text-white"
                    : "bg-brand-saffron-100 text-brand-saffron-800"
                }`}
              >
                {activeJobs.length} Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("onboarding")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "onboarding"
                ? "bg-brand-navy-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {isVerified ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Edit3 className="w-3.5 h-3.5" />
            )}
            <span>
              {isVerified
                ? "Verified Profile & KYC"
                : "Onboarding Profile & KYC"}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isVerified
                  ? "bg-emerald-400"
                  : isRejected
                    ? "bg-red-400"
                    : "bg-amber-400"
              }`}
            />
          </button>
        </div>

        {/* Right Side: Profile Button + Status */}
        <div className="flex items-center gap-3">
          {/* Profile Button (Top Right) */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-saffron-50 to-amber-50 border border-brand-saffron-200 hover:border-brand-saffron-400 hover:shadow-md transition-all group"
            title="View and edit your profile"
          >
            <div className="w-8 h-8 rounded-full bg-brand-saffron-200 flex items-center justify-center group-hover:bg-brand-saffron-300 transition">
              <User className="w-4 h-4 text-brand-saffron-700" />
            </div>
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              Profile
            </span>
          </button>

          {/* Verification Status Pill */}
          {verification && (
            <Badge
              variant={
                isVerified ? "verified" : isRejected ? "outline" : "saffron"
              }
              size="md"
              dot
            >
              Status: {(verification.status || "PENDING").toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Verification Attention Banner */}
      {!isVerified && (
        <div
          className={`p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            isRejected
              ? "bg-red-50 text-red-900 border-red-200"
              : "bg-amber-50 text-amber-900 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${isRejected ? "bg-red-100" : "bg-amber-100"}`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {isRejected
                  ? "Application Review Needs Attention"
                  : "Artisan Verification In Progress"}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isRejected
                  ? `Registrar Note: ${verification?.rejectionReason || "Please update your documents."}`
                  : "Your Aadhaar e-KYC and technical certificates are being verified by your cooperative society registrar."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("onboarding")}
            className="whitespace-nowrap"
          >
            {isRejected ? "Update Documents" : "View Checklist"}
          </Button>
        </div>
      )}

      {/* Tab 1: Overview Dashboard */}
      {activeTab === "overview" && (
        <>
          {/* Large Green Verified Banner on Overview */}
          {isVerified && (
            <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0 border border-white/20">
                  <ShieldCheck className="w-7 h-7 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold font-display">
                      Your KYC has been approved.
                    </h3>
                    <Badge
                      variant="verified"
                      size="sm"
                      className="bg-emerald-500/30 text-emerald-100 border-emerald-400/40"
                    >
                      NSDC VERIFIED
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-100/90 mt-1">
                    Worker ID:{" "}
                    <strong className="font-mono text-white">
                      WRK-
                      {(profile?._id || profile?.id || "65F12345")
                        .toString()
                        .slice(-8)
                        .toUpperCase()}
                    </strong>{" "}
                    • Cooperative:{" "}
                    <strong className="text-white">
                      {profile?.cooperative?.name ||
                        profile?.cooperative ||
                        "Pune Shramik Vikas Sahakari"}
                    </strong>{" "}
                    • Approved on{" "}
                    {new Date(
                      verification?.verifiedAt ||
                        profile?.verificationStatus?.verifiedAt ||
                        Date.now(),
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("onboarding")}
                  className="bg-white text-emerald-950 border-white hover:bg-emerald-50 text-xs font-bold whitespace-nowrap shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 mr-1" />
                  View Credentials & ID
                </Button>
              </div>
            </div>
          )}

          {/* Availability Status Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-3 h-3 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    Dispatch Status:{" "}
                    {isAvailable
                      ? "Available for New Jobs"
                      : "Offline / On Break"}
                  </span>
                  <Badge
                    variant={isAvailable ? "verified" : "default"}
                    size="sm"
                  >
                    {isAvailable ? "In Active Rota" : "Standby"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI Fair Allocation Engine includes you in proximity dispatches
                  across a {profile?.location?.workingRadiusKm || 15} km radius.
                </p>
              </div>
            </div>

            <Button
              variant={isAvailable ? "outline" : "primary"}
              size="sm"
              icon={Power}
              onClick={handleToggleAvailability}
            >
              {isAvailable ? "Go Offline" : "Go Online"}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Settled Earnings
                </span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-display">
                ₹{(totalEarned || 11400).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">
                100% Credited to Bank (0% Platform Fee)
              </p>
            </Card>

            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Guaranteed Floor Wage
                </span>
                <ShieldCheck className="w-4 h-4 text-brand-saffron-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-display">
                ₹{profile?.rates?.dailyFloorRate || 1300} / day
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pune Shramik Vikas Sahakari Guild
              </p>
            </Card>

            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Guild Welfare Cover
                </span>
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-700 font-display">
                ₹5,00,000
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Family Medical & Tool Protection Pool
              </p>
            </Card>
          </div>

          {/* Assigned Jobs List & Status Steppers */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Your Assigned Work Rota
                </h3>
                <p className="text-xs text-slate-500">
                  Accept incoming tasks and advance status: ASSIGNED → ACCEPTED
                  → ON THE WAY → IN PROGRESS → COMPLETED
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                loading={isLoading}
                onClick={loadData}
              >
                Refresh
              </Button>
            </div>

            {assignedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <HardHat className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  No Jobs Currently Assigned
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Keep your dispatch status online. When your cooperative
                  society assigns a customer booking, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedJobs.map((job) => {
                  const jobId = job.id || job._id;
                  const status = (job.status || "ASSIGNED").toUpperCase();
                  const isProcessing = isProcessingId === jobId;
                  const isAssigned = status === "ASSIGNED";
                  const isAccepted = status === "ACCEPTED";
                  const isOnTheWay = ["ON_THE_WAY", "ARRIVED"].includes(status);
                  const isInProgress = status === "IN_PROGRESS";
                  const isCompleted = status === "COMPLETED";

                  return (
                    <div
                      key={jobId}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                        isAssigned
                          ? "border-brand-saffron-300 ring-2 ring-brand-saffron-100"
                          : isCompleted
                            ? "border-slate-200 bg-slate-50/40"
                            : "border-slate-200"
                      }`}
                    >
                      {/* Job Header */}
                      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              #{jobId?.slice(-6) || jobId}
                            </span>
                            <Badge
                              variant={
                                isCompleted
                                  ? "verified"
                                  : isAssigned
                                    ? "saffron"
                                    : isInProgress || isOnTheWay
                                      ? "saffron"
                                      : "default"
                              }
                              size="sm"
                            >
                              {status}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">
                            {job.serviceName || "Skilled Trade Service"}
                          </h4>
                          <span className="text-xs text-slate-500">
                            Trade:{" "}
                            <strong className="text-slate-700">
                              {job.trade || "General Artisan"}
                            </strong>
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-extrabold text-slate-900 block">
                            ₹{job.price?.totalAmount || job.escrowAmount || 900}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold block">
                            100% Direct Payout (0% Platform Fee)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <JobProgressBar status={status} />
                      </div>

                      {/* Job Details Grid */}
                      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2.5 text-slate-700">
                            <MapPin className="w-4 h-4 text-brand-saffron-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {job.location?.serviceAddress?.street}
                              </span>
                              <span className="text-slate-500">
                                {job.location?.serviceAddress?.city} -{" "}
                                {job.location?.serviceAddress?.pincode}
                                {job.location?.serviceAddress?.landmark &&
                                  ` (Near: ${job.location.serviceAddress.landmark})`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-slate-700">
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>
                              Scheduled Arrival:{" "}
                              <strong>
                                {new Date(
                                  job.scheduledTime?.start || Date.now(),
                                ).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </strong>
                            </span>
                          </div>

                          {job.specialInstructions && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 italic">
                              "{job.specialInstructions}"
                            </div>
                          )}
                        </div>

                        {/* Customer Contact & Status Actions */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Customer
                              </span>
                              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                                {job.customerName ||
                                  job.customer?.name ||
                                  "Customer"}
                              </span>
                            </div>

                            {(job.customerPhone || job.customer?.phone) && (
                              <a
                                href={`tel:${job.customerPhone || job.customer?.phone}`}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 font-bold font-mono text-xs"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-brand-saffron-600" />
                                <span>
                                  {job.customerPhone || job.customer?.phone}
                                </span>
                              </a>
                            )}
                          </div>

                          {/* ACTION BUTTONS BASED ON STATE */}
                          <div className="pt-2 border-t border-slate-200/80">
                            {/* PHASE 1: ASSIGNED -> Accept or Reject */}
                            {isAssigned && (
                              <div className="space-y-2">
                                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                                  ⚠️ Cooperative has assigned this order to you.
                                  Please accept to confirm your slot or decline
                                  to allow reassignment.
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    loading={isProcessing}
                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    icon={XCircle}
                                    onClick={() => handleRejectJob(job)}
                                  >
                                    Decline / Reject
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    loading={isProcessing}
                                    className="flex-1"
                                    icon={CheckCircle2}
                                    onClick={() => handleAcceptJob(job)}
                                  >
                                    Accept Assignment
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* PHASE 2: ACCEPTED -> Start Travel */}
                            {isAccepted && (
                              <div className="space-y-2">
                                <p className="text-[11px] text-slate-500">
                                  Assignment confirmed. When you start traveling
                                  to the customer site, tap below:
                                </p>
                                <Button
                                  variant="primary"
                                  size="md"
                                  loading={isProcessing}
                                  className="w-full"
                                  icon={Truck}
                                  onClick={() =>
                                    handleAdvanceStatus(
                                      job,
                                      "ON_THE_WAY",
                                      "Updated: You are now On The Way to the customer location!",
                                    )
                                  }
                                >
                                  Start Journey (On The Way)
                                </Button>
                              </div>
                            )}

                            {/* PHASE 3: ON_THE_WAY -> Start Work with OTP Handshake */}
                            {isOnTheWay && (
                              <div className="space-y-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-950 font-medium flex items-center justify-between">
                                  <span>
                                    📍 You are en-route. Upon doorstep arrival,
                                    ask customer for their 6-digit verification
                                    code.
                                  </span>
                                </div>

                                {/* Navigation Map with ETA - Compact Version */}
                                <div className="max-h-80 overflow-y-auto">
                                  <NavigationMap
                                    workerCoordinates={
                                      profile?.location?.coordinates || [
                                        72.8479, 19.076,
                                      ]
                                    }
                                    customerCoordinates={
                                      job.location?.coordinates ||
                                      job.location?.serviceAddress?.coordinates
                                    }
                                    workerName={profile?.name || "You"}
                                    customerName={
                                      job.customerName ||
                                      job.customer?.name ||
                                      "Customer"
                                    }
                                    interactive={true}
                                    showETA={true}
                                  />
                                </div>

                                <Button
                                  variant="primary"
                                  size="md"
                                  loading={isProcessing}
                                  className="w-full"
                                  icon={Key}
                                  onClick={() => handleOpenOtpModal(job)}
                                >
                                  Arrived at Site • Verify OTP & Start Work
                                </Button>
                              </div>
                            )}

                            {/* PHASE 4: IN_PROGRESS -> Complete Service */}
                            {isInProgress && (
                              <div className="space-y-2">
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 font-medium">
                                  ⚡ Service active & verified. When work is
                                  finished to customer satisfaction, submit
                                  completion note to release escrow payment.
                                </div>
                                <Button
                                  variant="primary"
                                  size="md"
                                  loading={isProcessing}
                                  className="w-full"
                                  icon={ShieldCheck}
                                  onClick={() => handleOpenCompletionModal(job)}
                                >
                                  Complete Service & Request DBT Escrow Release
                                </Button>
                              </div>
                            )}

                            {/* PHASE 5: COMPLETED */}
                            {isCompleted && (
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between font-semibold">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                  <span>
                                    Service Completed • ₹
                                    {job.price?.totalAmount || 900} Settled via
                                    DBT Escrow
                                  </span>
                                </div>
                                <Badge variant="verified" size="sm">
                                  Paid in Full
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Zone Shift Offers - Actionable Cards */}
          {zoneShiftOffers.length > 0 && (
            <div className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Zone shift</span>
                    <Badge variant="saffron" size="sm">{zoneShiftOffers[0]?.priority || "High priority"}</Badge>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">High demand in {zoneShiftOffers[0]?.suggestedZone || "your target area"}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    You are currently assigned to <strong>{zoneShiftOffers[0]?.currentZone || "your local zone"}</strong> and can be reassigned to <strong>{zoneShiftOffers[0]?.suggestedZone}</strong>.
                    {zoneShiftOffers[0]?.distanceKm ? ` Distance: ${zoneShiftOffers[0].distanceKm} km.` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleZoneShiftDecision("accept")}
                    disabled={zoneShiftLoading}
                  >
                    {zoneShiftLoading ? "Saving..." : "Accept"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoneShiftDecision("decline")}
                    disabled={zoneShiftLoading}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!zoneShiftOffers.length && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-2xl font-extrabold text-slate-900">Zone shift opportunity</h3>
              <p className="mt-2 text-sm text-slate-600">No active zone shift offers for your current skill set.</p>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Verified Dashboard or Onboarding Wizard */}
      {activeTab === "onboarding" &&
        (isVerified ? (
          <VerifiedDashboard
            profile={profile}
            verification={verification}
            onViewJobs={() => setActiveTab("overview")}
            onRefresh={loadData}
          />
        ) : (
          <WorkerOnboardingWizard
            onComplete={() => {
              loadData();
              setActiveTab("overview");
            }}
          />
        ))}

      {/* MODAL 1: OTP ARRIVAL VERIFICATION HANDSHAKE */}
      {otpModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-brand-saffron-600" />
                  <span>Doorstep Arrival Verification</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verify OTP with customer to confirm arrival & begin work
                </p>
              </div>
              <button
                onClick={() => setOtpModalJob(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">
                  {otpModalJob.customerName ||
                    otpModalJob.customer?.name ||
                    "Customer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Site Location:</span>
                <span className="font-medium text-slate-800">
                  {otpModalJob.location?.serviceAddress?.street},{" "}
                  {otpModalJob.location?.serviceAddress?.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-brand-navy-900">
                  {otpModalJob.serviceName}
                </span>
              </div>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Enter 6-Digit Customer OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="6-digit code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value);
                    setOtpError(null);
                  }}
                  className="w-full text-center text-2xl font-mono font-extrabold tracking-widest px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  Ask the customer for the 6-digit OTP shown on their ShramSetu
                  app
                </p>
                {otpError && (
                  <p className="text-xs text-red-600 font-bold mt-2 text-center bg-red-50 p-2 rounded-xl border border-red-200">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  type="button"
                  onClick={() => setOtpModalJob(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={
                    isProcessingId === (otpModalJob.id || otpModalJob._id)
                  }
                  className="flex-1"
                  icon={CheckCircle2}
                >
                  Confirm & Start Work
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WORK COMPLETION & ESCROW SETTLEMENT */}
      {completionModalJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Complete Service & Request Settlement</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Finalize job execution and trigger direct DBT payout
                </p>
              </div>
              <button
                onClick={() => setCompletionModalJob(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-800">Direct Payout Amount:</span>
                <span className="font-extrabold text-emerald-950 text-sm">
                  ₹{completionModalJob.price?.totalAmount || 900} (100%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700">
                0% platform deductions. 100% credited to your registered bank
                account / UPI via DBT.
              </p>
            </div>

            <form onSubmit={handleCompleteServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Completion Summary & Notes
                </label>
                <label className="block text-sm font-semibold mb-3">
                  Completion code
                  <input
                    aria-label="Completion OTP"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) =>
                      setEnteredOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="6-digit customer code"
                    className="mt-2 w-full rounded-xl border p-3 font-mono"
                  />
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Completed fault diagnostics, installed new circuit breaker, tested load balance to customer satisfaction."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  type="button"
                  onClick={() => setCompletionModalJob(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={
                    isProcessingId ===
                    (completionModalJob.id || completionModalJob._id)
                  }
                  className="flex-1"
                  icon={CheckCircle2}
                >
                  Submit & Release Escrow
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Profile Modal */}
      {showProfileModal && (
        <WorkerProfileModal
          profile={{
            name: profile?.name || user?.name || "Worker",
            phone: profile?.phone || user?.phone || "",
            email: profile?.email || user?.email || "",
            profession:
              profile?.profession ||
              profile?.experience?.primaryTrade ||
              "Skilled Artisan",
            ...profile,
          }}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
          isLoading={isSavingProfile}
        />
      )}
    </DashboardLayout>
  );
}

export default WorkerDashboard;
