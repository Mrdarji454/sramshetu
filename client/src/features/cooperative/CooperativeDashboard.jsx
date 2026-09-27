import React, { Suspense, lazy, useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import cooperativeService from "../../services/cooperative.service";
import { bookingService } from "../../services/booking.service";
import { CooperativeOnboardingWizard } from "./CooperativeOnboardingWizard";
const CooperativeOperationsCenter = lazy(() =>
  import("./CooperativeOperationsCenter").then((module) => ({
    default: module.CooperativeOperationsCenter,
  })),
);
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Activity,
  Building2,
  Users,
  HeartHandshake,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Settings,
  Trash2,
  PhoneCall,
  MapPin,
  Calendar,
  UserCheck,
  RefreshCw,
  X,
  Search,
  Sparkles,
  Wrench,
  Check,
} from "lucide-react";

export function CooperativeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Quick enroll modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollData, setEnrollData] = useState({
    name: "",
    phone: "",
    trade: "Electrical & Power Systems",
    dailyFloorRate: 1200,
  });

  // Assign Worker Modal
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [assignSelectedWorkerId, setAssignSelectedWorkerId] = useState("");
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [assignFilterMode, setAssignFilterMode] = useState("ALL"); // 'ALL' or 'MATCHING'
  const [isAssigning, setIsAssigning] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  /**
   * Evaluates how well an artisan matches the specific customer booking requirements
   */
  const getWorkerMatchInfo = (worker, booking) => {
    if (!worker || !booking)
      return { score: 0, isMatch: false, matchBadge: null, isAvailable: true };

    const reqTrade = String(booking.trade || booking.serviceName || "")
      .toLowerCase()
      .trim();
    const workerTrade = String(worker.primaryTrade || worker.trade || "")
      .toLowerCase()
      .trim();
    const subTrades = (worker.subTrades || []).map((t) =>
      String(t).toLowerCase(),
    );
    const skills = (worker.skills || []).map((s) =>
      typeof s === "string"
        ? s.toLowerCase()
        : String(s?.name || "").toLowerCase(),
    );
    const instructions = String(
      booking.specialInstructions || "",
    ).toLowerCase();

    let isExactTrade = false;
    let isSubTradeMatch = false;
    let isSkillMatch = false;

    if (reqTrade && workerTrade) {
      if (workerTrade.includes(reqTrade) || reqTrade.includes(workerTrade)) {
        isExactTrade = true;
      }
    }

    if (!isExactTrade && reqTrade) {
      const tokens = reqTrade.split(/[\s,&/]+/).filter((t) => t.length > 2);
      for (const token of tokens) {
        if (workerTrade.includes(token)) {
          isExactTrade = true;
          break;
        }
        if (subTrades.some((st) => st.includes(token))) {
          isSubTradeMatch = true;
        }
      }
    }

    if (instructions) {
      for (const sk of skills) {
        if (instructions.includes(sk)) {
          isSkillMatch = true;
          break;
        }
      }
    }

    const isAvailable =
      String(worker.status || "").toLowerCase() === "available";

    let score = 0;
    let matchBadge = null;

    if (isExactTrade) {
      score += 80;
      matchBadge = "Direct Trade Specialist";
    } else if (isSubTradeMatch) {
      score += 50;
      matchBadge = "Allied Trade Match";
    } else if (isSkillMatch) {
      score += 35;
      matchBadge = "Skill Match";
    }

    if (isAvailable) score += 20;
    if (Number(worker.rating) >= 4.9) score += 5;

    return {
      score,
      isMatch: isExactTrade || isSubTradeMatch || isSkillMatch,
      matchBadge,
      isAvailable,
    };
  };

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const [profData, verData, membersData, bookingsData] =
        await Promise.allSettled([
          cooperativeService.getProfile(),
          cooperativeService.getVerificationStatus(),
          cooperativeService.getMembers(),
          bookingService.getBookings({ role: "cooperative" }),
        ]);

      if (profData.status === "fulfilled" && profData.value) {
        setProfile(profData.value);
      }

      if (verData.status === "fulfilled" && verData.value) {
        setVerification(verData.value);
      }

      if (
        membersData.status === "fulfilled" &&
        Array.isArray(membersData.value)
      ) {
        setMembers(membersData.value);
      }

      if (
        bookingsData.status === "fulfilled" &&
        Array.isArray(bookingsData.value)
      ) {
        setBookings(bookingsData.value);
      }
    } catch (err) {
      console.error("Error loading cooperative dashboard:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const refreshTimer = setInterval(() => loadData({ silent: true }), 15000);
    return () => clearInterval(refreshTimer);
  }, []);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollData.name.trim()) return;

    try {
      const newMember = await cooperativeService.addMember(enrollData);
      setMembers((prev) => [newMember, ...prev]);
      setEnrollModalOpen(false);
      setEnrollData({
        name: "",
        phone: "",
        trade: "Electrical & Power Systems",
        dailyFloorRate: 1200,
      });
      setActionSuccessMsg(
        `Artisan ${newMember.name} successfully enrolled in guild roster!`,
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert("Failed to enroll member: " + err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this artisan from the guild roster?",
      )
    )
      return;
    try {
      await cooperativeService.removeMember(memberId);
      setMembers((prev) =>
        prev.filter((m) => m.id !== memberId && m._id !== memberId),
      );
    } catch (err) {
      alert("Failed to remove member: " + err.message);
    }
  };

  const handleOpenAssignModal = (booking) => {
    setAssignModalBooking(booking);
    setAssignSearchQuery("");
    setAssignFilterMode("ALL");

    // Rank and auto-select highest-scoring artisan for this job requirement
    if (members && members.length > 0) {
      const scored = members
        .map((m) => ({
          member: m,
          ...getWorkerMatchInfo(m, booking),
        }))
        .sort((a, b) => b.score - a.score);

      const bestCandidate = scored[0]?.member;
      if (bestCandidate) {
        setAssignSelectedWorkerId(bestCandidate.id || bestCandidate._id);
      }
    }
  };

  const handleConfirmAssignment = async (e) => {
    e.preventDefault();
    if (!assignModalBooking || !assignSelectedWorkerId) return;

    setIsAssigning(true);
    try {
      const bookingId = assignModalBooking.id || assignModalBooking._id;
      await bookingService.assignWorker(bookingId, assignSelectedWorkerId);

      const assignedWorker = members.find(
        (m) => String(m.id || m._id) === String(assignSelectedWorkerId),
      );
      const workerTrade =
        assignedWorker?.primaryTrade || assignedWorker?.trade || "Artisan";
      setActionSuccessMsg(
        `Job #${bookingId?.slice(-6) || bookingId} assigned to ${assignedWorker?.name || "Artisan"} (${workerTrade}). Relevant work requirement dispatched to artisan rota!`,
      );
      setAssignModalBooking(null);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      alert("Failed to assign worker: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt("Reason for cooperative cancellation:");
    if (!reason) return;

    try {
      const bookingId = booking.id || booking._id;
      await bookingService.updateStatus(bookingId, "CANCELLED", {
        note: reason,
      });
      setActionSuccessMsg(`Booking #${bookingId} marked as cancelled.`);
      loadData();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    }
  };

  const isVerified = verification?.status === "verified";
  const isRejected = verification?.status === "rejected";

  // Booking stats & filters
  const pendingBookings = bookings.filter(
    (b) =>
      (b.status || "").toUpperCase() === "PENDING" ||
      (b.status || "").toUpperCase() === "REJECTED",
  );
  const filteredBookings = bookings.filter((b) => {
    if (selectedStatusFilter === "ALL") return true;
    return (b.status || "").toUpperCase() === selectedStatusFilter;
  });

  return (
    <DashboardLayout
      title="Cooperative Operations Command Center"
      subtitle="Live worker availability, service dispatch, cooperative bookings, and performance."
      organization={{
        name: profile?.name,
        logo: profile?.metadata?.logo || profile?.logo,
      }}
      roleBadge={
        isVerified ? "State Cooperative Registered" : "Registration Pending"
      }
    >
      {/* Toast message */}
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

      <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-24">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 border-b border-slate-100 px-2 pb-3">
              <p className="truncate text-sm font-bold text-brand-navy-900">
                {profile?.name || user?.name || "Cooperative"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Operations navigation
              </p>
            </div>
            <nav
              aria-label="Cooperative operations"
              className="flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible"
            >
              {[
                ["dashboard", "Dashboard", Activity],
                ["dispatch", "Live Dispatch", MapPin],
                ["bookings", "Bookings", Calendar],
                ["workers", "Workers", Users],
                ["zones", "Zone Heat Map", MapPin],
                ["analytics", "Analytics", TrendingUp],
                ["payments", "Payments", HeartHandshake],
                ["profile", "Cooperative Profile", Building2],
                ["settings", "Settings", Settings],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-current={activeTab === id ? "page" : undefined}
                  onClick={() => setActiveTab(id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-xs font-semibold transition-colors lg:w-full ${activeTab === id ? "border-brand-navy-900 bg-brand-navy-900 text-white" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {id === "bookings" && pendingBookings.length > 0 && (
                    <span className="ml-auto rounded-full bg-brand-saffron-500 px-1.5 py-0.5 text-[10px] text-white">
                      {pendingBookings.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            {verification && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <Badge
                  variant={
                    isVerified ? "verified" : isRejected ? "outline" : "coop"
                  }
                  size="sm"
                  dot
                >
                  Registrar: {(verification.status || "PENDING").toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </aside>
        <main className="min-w-0">
          {/* Verification Attention Banner */}
          {!isVerified && (
            <div
              className={`p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                isRejected
                  ? "bg-red-50 text-red-900 border-red-200"
                  : "bg-indigo-50 text-indigo-900 border-indigo-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${isRejected ? "bg-red-100" : "bg-indigo-100"}`}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-xs font-bold">
                    {isRejected
                      ? "Cooperative Society Audit Requires Attention"
                      : "State Registrar Verification Underway"}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isRejected
                      ? `Registrar Remark: ${verification?.remarks || "Please inspect submitted bylaws."}`
                      : "Your society registration certificate and roster bylaws are being audited by the State Registrar of Cooperatives."}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("profile")}
                className="whitespace-nowrap"
              >
                {isRejected ? "Update Bylaws" : "View Audit Checklist"}
              </Button>
            </div>
          )}

          {[
            "dashboard",
            "dispatch",
            "zones",
            "analytics",
            "payments",
            "settings",
          ].includes(activeTab) && (
            <Suspense
              fallback={
                <div
                  className="grid min-h-80 place-items-center text-sm text-slate-500"
                  role="status"
                >
                  Loading operations data…
                </div>
              }
            >
              <CooperativeOperationsCenter
                view={activeTab}
                cooperative={profile}
                workers={members}
                bookings={bookings}
                isLoading={isLoading}
                onRefresh={loadData}
                onNavigate={setActiveTab}
                onOpenAssign={handleOpenAssignModal}
              />
            </Suspense>
          )}

          {/* Existing cooperative booking dispatch workflow */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              {/* Quick Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    "ALL",
                    "PENDING",
                    "ASSIGNED",
                    "ACCEPTED",
                    "ON_THE_WAY",
                    "IN_PROGRESS",
                    "COMPLETED",
                    "REJECTED",
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        selectedStatusFilter === st
                          ? "bg-brand-navy-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {st === "ALL" ? "All Bookings" : st}
                    </button>
                  ))}
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

              {/* Bookings Queue */}
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    No Booking Requests Found
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Customer bookings for your operational trade sectors will
                    appear here for artisan assignment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((b) => {
                    const bookingId = b.id || b._id;
                    const status = (b.status || "PENDING").toUpperCase();
                    const isPending = status === "PENDING";
                    const isRejectedWorker = status === "REJECTED";
                    const isAssigned = status === "ASSIGNED";
                    const isCompleted = status === "COMPLETED";

                    return (
                      <div
                        key={bookingId}
                        className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-sm ${
                          isRejectedWorker
                            ? "border-amber-300 bg-amber-50/20"
                            : isPending
                              ? "border-brand-saffron-300 bg-white ring-1 ring-brand-saffron-100"
                              : "border-slate-200"
                        }`}
                      >
                        {/* Top Row: Ref, Status, Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-400">
                                #{bookingId?.slice(-6) || bookingId}
                              </span>
                              <Badge
                                variant={
                                  isCompleted
                                    ? "verified"
                                    : isRejectedWorker
                                      ? "outline"
                                      : isPending
                                        ? "saffron"
                                        : "default"
                                }
                                size="sm"
                              >
                                {status}
                              </Badge>
                              <span className="text-xs text-slate-400 font-medium">
                                Created{" "}
                                {new Date(
                                  b.createdAt || Date.now(),
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mt-1">
                              {b.serviceName || "Skilled Trade Service"}
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              Trade:{" "}
                              <strong className="text-slate-700">
                                {b.trade || "General Artisan"}
                              </strong>
                            </span>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-base font-extrabold text-slate-900 block">
                              {b.price?.totalAmount ?? b.escrowAmount ?? "—"}
                            </span>
                            <span className="text-[11px] text-emerald-700 font-semibold block">
                              Floor Rate:{" "}
                              {b.price?.floorRateAmount == null
                                ? "Not recorded"
                                : `₹${b.price.floorRateAmount} / hr`}
                              (0% Platform Fee)
                            </span>
                          </div>
                        </div>

                        {/* Rejection Alert */}
                        {isRejectedWorker && (
                          <div className="my-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <span>
                                <strong>Artisan Declined:</strong>{" "}
                                {b.rejectionReason || "Schedule conflict"}.
                                Please reassign to another available artisan.
                              </span>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenAssignModal(b)}
                            >
                              Reassign Artisan
                            </Button>
                          </div>
                        )}

                        {/* Middle Section: Customer & Location Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Customer Information
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                              <span>
                                {b.customerName ||
                                  b.customer?.name ||
                                  "Customer"}
                              </span>
                              {(b.customerPhone || b.customer?.phone) && (
                                <a
                                  href={`tel:${b.customerPhone || b.customer?.phone}`}
                                  className="text-brand-saffron-700 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>
                                    {b.customerPhone || b.customer?.phone}
                                  </span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-start gap-1.5 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span>
                                {b.location?.serviceAddress?.street},{" "}
                                {b.location?.serviceAddress?.city} -{" "}
                                {b.location?.serviceAddress?.pincode}
                                {b.location?.serviceAddress?.landmark &&
                                  ` (Landmark: ${b.location.serviceAddress.landmark})`}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Scheduled Time & Notes
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>
                                {new Date(
                                  b.scheduledTime?.start || Date.now(),
                                ).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {b.specialInstructions && (
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 italic">
                                "{b.specialInstructions}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            {b.worker || b.workerName ? (
                              <div className="flex items-center gap-2 text-slate-700">
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span>
                                  Assigned Worker:{" "}
                                  <strong className="text-slate-900">
                                    {b.workerName || b.worker?.name}
                                  </strong>{" "}
                                  ({b.workerTrade || b.trade})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                                <Clock className="w-4 h-4" />
                                <span>
                                  Unassigned • Artisan dispatch required
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {(isPending || isRejectedWorker || isAssigned) && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={UserPlus}
                                onClick={() => handleOpenAssignModal(b)}
                              >
                                {isAssigned ? "Change Worker" : "Assign Worker"}
                              </Button>
                            )}

                            {!isCompleted && status !== "CANCELLED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleCancelBooking(b)}
                              >
                                Cancel Request
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Existing worker roster and enrollment workflow */}
          {activeTab === "workers" && (
            <>
              {/* Member Roster Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Guild Member Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live operational status and opportunity rotation metrics
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" icon={FileSpreadsheet}>
                      Export DBT Ledger
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={UserPlus}
                      onClick={() => setEnrollModalOpen(true)}
                    >
                      Enroll New Worker
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-4">Artisan Name</th>
                        <th className="p-4">Trade</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Daily Floor Rate</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((worker) => (
                        <tr
                          key={worker.id || worker._id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-brand-navy-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                              {worker.name?.charAt(0) || "W"}
                            </div>
                            <span>{worker.name}</span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {worker.trade}
                          </td>
                          <td className="p-4 text-slate-500 font-mono">
                            {worker.phone || "Not recorded"}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                worker.status === "available"
                                  ? "verified"
                                  : worker.status === "busy"
                                    ? "saffron"
                                    : "default"
                              }
                              size="sm"
                              dot
                            >
                              {worker.status || "Active"}
                            </Badge>
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {worker.dailyFloorRate == null
                              ? "Not recorded"
                              : `₹${worker.dailyFloorRate} / day`}
                          </td>
                          <td className="p-4 font-semibold text-slate-700">
                            {worker.rating == null
                              ? "Not rated"
                              : `★ ${Number(worker.rating).toFixed(1)}`}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(worker.id || worker._id)
                              }
                              className="p-1 rounded text-red-400 hover:text-red-700 hover:bg-red-50"
                              title="Remove artisan from roster"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: ONBOARDING WIZARD */}
          {activeTab === "profile" && (
            <CooperativeOnboardingWizard
              onComplete={() => {
                loadData();
                setActiveTab("dashboard");
              }}
            />
          )}
        </main>
      </div>

      {/* MODAL: ASSIGN ARTISAN ACCORDING TO JOB REQUIREMENTS */}
      {assignModalBooking &&
        (() => {
          const reqTrade =
            assignModalBooking.trade ||
            assignModalBooking.serviceName ||
            "General Service";

          // Compute match details for all members
          const scoredMembers = members.map((m) => ({
            member: m,
            ...getWorkerMatchInfo(m, assignModalBooking),
          }));

          // Filter based on search and mode
          const filteredMembers = scoredMembers
            .filter(({ member, isMatch }) => {
              if (assignFilterMode === "MATCHING" && !isMatch) return false;
              if (!assignSearchQuery.trim()) return true;
              const q = assignSearchQuery.toLowerCase();
              const name = (member.name || "").toLowerCase();
              const trade = (
                member.primaryTrade ||
                member.trade ||
                ""
              ).toLowerCase();
              const skills = (member.skills || [])
                .map((s) => (typeof s === "string" ? s.toLowerCase() : ""))
                .join(" ");
              return (
                name.includes(q) || trade.includes(q) || skills.includes(q)
              );
            })
            .sort((a, b) => b.score - a.score);

          const matchingCount = scoredMembers.filter((sm) => sm.isMatch).length;
          const selectedMatchInfo = scoredMembers.find(
            (sm) =>
              String(sm.member.id || sm.member._id) ===
              String(assignSelectedWorkerId),
          );

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Assign Worker to Booking
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #
                        {assignModalBooking.id?.slice(-6) ||
                          assignModalBooking._id?.slice(-6) ||
                          assignModalBooking.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Match job requirements with guild artisan trade
                      specializations
                    </p>
                  </div>
                  <button
                    onClick={() => setAssignModalBooking(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Job Requirement Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-navy-900 to-slate-900 text-white text-xs mb-4 space-y-2 shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                        Required Trade:
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold">
                        {reqTrade}
                      </span>
                    </div>
                    <div className="text-emerald-400 font-bold text-xs">
                      ₹
                      {assignModalBooking.price?.totalAmount ||
                        assignModalBooking.escrowAmount ||
                        900}{" "}
                      Floor Wage (0% Platform Fee)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-300 text-[11px] border-t border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">
                        {assignModalBooking.location?.serviceAddress?.street},{" "}
                        {assignModalBooking.location?.serviceAddress?.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>
                        {new Date(
                          assignModalBooking.scheduledTime?.start || Date.now(),
                        ).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {assignModalBooking.specialInstructions && (
                    <div className="text-[11px] bg-white/10 p-2 rounded-lg text-slate-200 italic">
                      "{assignModalBooking.specialInstructions}"
                    </div>
                  )}
                </div>

                {/* Search & Matching Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by artisan name or trade..."
                      value={assignSearchQuery}
                      onChange={(e) => setAssignSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-saffron-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setAssignFilterMode("ALL")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        assignFilterMode === "ALL"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      All ({members.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignFilterMode("MATCHING")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        assignFilterMode === "MATCHING"
                          ? "bg-brand-saffron-500 text-white shadow-sm"
                          : "text-brand-saffron-700 hover:text-brand-saffron-900"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Trade Matches ({matchingCount})</span>
                    </button>
                  </div>
                </div>

                {/* Artisan Selection Roster */}
                <form
                  onSubmit={handleConfirmAssignment}
                  className="flex-1 flex flex-col min-h-0 space-y-4"
                >
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-64">
                    {filteredMembers.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                        <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-600 font-semibold">
                          {members.length === 0
                            ? "No artisans currently in your guild roster."
                            : "No artisans found matching the current search or trade filter."}
                        </p>
                        {members.length === 0 && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setAssignModalBooking(null);
                              setEnrollModalOpen(true);
                            }}
                          >
                            Enroll an Artisan First
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredMembers.map(
                        ({
                          member: m,
                          isMatch,
                          matchBadge,
                          isAvailable,
                          score,
                        }) => {
                          const mId = m.id || m._id;
                          const isSelected =
                            String(assignSelectedWorkerId) === String(mId);

                          return (
                            <div
                              key={mId}
                              onClick={() => setAssignSelectedWorkerId(mId)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                isSelected
                                  ? "border-brand-saffron-500 bg-brand-saffron-50/60 ring-2 ring-brand-saffron-300 shadow-sm"
                                  : isMatch
                                    ? "border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40"
                                    : "border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Avatar / Selection Indicator */}
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-brand-saffron-500 text-white"
                                      : "bg-brand-navy-900 text-amber-400"
                                  }`}
                                >
                                  {isSelected ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                  ) : (
                                    m.name?.charAt(0) || "W"
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">
                                      {m.name}
                                    </span>
                                    {matchBadge && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        {matchBadge}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-slate-500 mt-0.5">
                                    <span className="font-medium text-slate-700">
                                      {m.primaryTrade || m.trade}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {m.phone || "Phone not recorded"}
                                    </span>
                                    {m.experienceYears && (
                                      <>
                                        <span>•</span>
                                        <span>{m.experienceYears} yrs exp</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 flex-shrink-0">
                                <span className="font-bold text-slate-900">
                                  {m.dailyFloorRate == null
                                    ? "Rate not recorded"
                                    : `₹${m.dailyFloorRate}/day`}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-500 font-bold text-[11px]">
                                    {m.rating == null
                                      ? "Not rated"
                                      : `★ ${Number(m.rating).toFixed(1)}`}
                                  </span>
                                  <Badge
                                    variant={
                                      isAvailable ? "verified" : "saffron"
                                    }
                                    size="sm"
                                  >
                                    {m.status || "Active"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )
                    )}
                  </div>

                  {/* Handover Summary & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {selectedMatchInfo && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-slate-700">
                            Assigning to:{" "}
                            <strong className="text-slate-900 font-bold">
                              {selectedMatchInfo.member.name}
                            </strong>{" "}
                            (
                            {selectedMatchInfo.member.primaryTrade ||
                              selectedMatchInfo.member.trade}
                            )
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Ready for Handover
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="md"
                        className="flex-1"
                        type="button"
                        onClick={() => setAssignModalBooking(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        type="submit"
                        disabled={
                          !assignSelectedWorkerId || members.length === 0
                        }
                        loading={isAssigning}
                        className="flex-1"
                        icon={UserCheck}
                      >
                        Confirm Assignment & Dispatch
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {/* MODAL: ENROLL NEW WORKER */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Enroll New Guild Artisan
              </h3>
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Artisan Full Name
                </label>
                <input
                  type="text"
                  required
                  value={enrollData.name}
                  onChange={(e) =>
                    setEnrollData({ ...enrollData, name: e.target.value })
                  }
                  placeholder="e.g. Dattatray Pawar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={enrollData.phone}
                  onChange={(e) =>
                    setEnrollData({ ...enrollData, phone: e.target.value })
                  }
                  placeholder="+91 98201 55667"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Trade / Specialization
                </label>
                <input
                  type="text"
                  required
                  value={enrollData.trade}
                  onChange={(e) =>
                    setEnrollData({ ...enrollData, trade: e.target.value })
                  }
                  placeholder="e.g. Master Electrician"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Guaranteed Floor Rate (₹ / day)
                </label>
                <input
                  type="number"
                  value={enrollData.dailyFloorRate}
                  onChange={(e) =>
                    setEnrollData({
                      ...enrollData,
                      dailyFloorRate: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setEnrollModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  className="flex-1"
                >
                  Enroll Artisan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CooperativeDashboard;
