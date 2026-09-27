import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  IndianRupee,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import {
  LocationMap,
  validCoordinates,
} from "../../components/common/LocationMap";
import { useAuth } from "../../context/AuthContext";
import { bookingService } from "../../services/booking.service";
import { pincodeService } from "../../services/pincode.service";
import workerService from "../../services/worker.service";

const sections = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "details", label: "Personal Details", icon: UserRound },
  { id: "skills", label: "Skills & Service Radius", icon: BriefcaseBusiness },
  { id: "documents", label: "Documents", icon: FileCheck2 },
  { id: "availability", label: "Availability", icon: Clock3 },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "security", label: "Security", icon: ShieldCheck },
];
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-saffron-500 focus:ring-2 focus:ring-brand-saffron-100";
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
const dateLabel = (
  value,
  options = { dateStyle: "medium", timeStyle: "short" },
) =>
  value ? new Date(value).toLocaleString("en-IN", options) : "Not scheduled";
const jobStatus = (job) => String(job?.status || "").toUpperCase();
const completed = (job) => jobStatus(job) === "COMPLETED";
const jobAmount = (job) =>
  Number(job?.price?.totalAmount ?? job?.escrowAmount ?? 0) || 0;
const initials = (name) =>
  String(name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const addressOf = (profile) =>
  profile?.address || profile?.location?.address || {};
const distanceKm = (first, second) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second[1] - first[1]);
  const longitudeDelta = radians(second[0] - first[0]);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(first[1])) *
      Math.cos(radians(second[1])) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

function Field({
  label,
  value,
  defaultValue,
  onChange,
  type = "text",
  required = false,
  readOnly = false,
  ...props
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <input
        className={fieldClass}
        type={type}
        {...(value !== undefined ? { value: value ?? "" } : { defaultValue })}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        {...props}
      />
    </label>
  );
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-brand-navy-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function normalizePayload(response) {
  return response?.worker || response?.profile || response?.data || response;
}

export function WorkerProfilePage() {
  const { updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [section, setSection] = useState(
    searchParams.get("section") || "overview",
  );
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [zoneShiftOffers, setZoneShiftOffers] = useState([]);
  const [zoneShiftDecisionLoading, setZoneShiftDecisionLoading] = useState(false);
  const [earningsRange, setEarningsRange] = useState("monthly");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [skillDraft, setSkillDraft] = useState({
    name: "",
    experienceYears: 0,
    serviceRadiusKm: 15,
  });
  const [lookingUpPin, setLookingUpPin] = useState(false);
  const zoneShiftOffer = zoneShiftOffers[0] || null;

  const loadPage = async () => {
    setLoading(true);
    setError("");
    const [profileResult, jobsResult, zoneShiftResult] =
      await Promise.allSettled([
        workerService.getProfile(),
        bookingService.getBookings({ role: "worker" }),
        workerService.getZoneShiftOffers(),
      ]);
    if (profileResult.status === "fulfilled")
      setProfile(normalizePayload(profileResult.value));
    else
      setError(profileResult.reason?.message || "Unable to load your profile.");
    setJobs(
      jobsResult.status === "fulfilled" && Array.isArray(jobsResult.value)
        ? jobsResult.value
        : [],
    );
    if (zoneShiftResult.status === "fulfilled") {
      const nextOffers = Array.isArray(zoneShiftResult.value)
        ? zoneShiftResult.value
        : Array.isArray(zoneShiftResult.value?.offers)
          ? zoneShiftResult.value.offers
          : [];
      setZoneShiftOffers(nextOffers);
    }
    if (profileResult.status === "fulfilled") {
      const worker = normalizePayload(profileResult.value);
      const workerId = worker?._id || worker?.id;
      if (workerId) {
        try {
          const publicProfile = await workerService.getPublicProfile(workerId);
          setReviews(publicProfile?.reviews || []);
        } catch {
          setReviews([]);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPage();
  }, []);
  useEffect(() => {
    const requested = searchParams.get("section");
    if (requested && sections.some((item) => item.id === requested))
      setSection(requested);
  }, [searchParams]);

  const openSection = (id) => {
    setSection(id);
    const params = new URLSearchParams(searchParams);
    params.set("section", id);
    setSearchParams(params);
  };
  const saveProfile = async (updates, success = "Profile updated.") => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = normalizePayload(
        await workerService.updateProfile(updates),
      );
      setProfile((previous) => ({ ...previous, ...updated, ...updates }));
      if (Object.hasOwn(updates, "profileImage")) {
        updateUser?.({ profileImage: updates.profileImage });
      }
      setNotice(success);
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleZoneShiftDecision = async (decision) => {
    setZoneShiftDecisionLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await workerService.respondToZoneShift(decision);
      const acceptedOffer = result?.offer || zoneShiftOffer;
      setZoneShiftOffers((previous) =>
        previous.filter(
          (item) =>
            (item?._id || item?.id || item?.workerId) !==
            (acceptedOffer?._id || acceptedOffer?.id || acceptedOffer?.workerId),
        ),
      );
      setNotice(
        decision === "accept"
          ? "Zone shift accepted. Your service zone has been updated."
          : "Zone shift declined. You will remain in your current zone.",
      );
    } catch (zoneShiftError) {
      setError(zoneShiftError.message || "Unable to update your zone shift." );
    } finally {
      setZoneShiftDecisionLoading(false);
    }
  };

  const bookings = useMemo(
    () =>
      [...jobs].sort(
        (a, b) =>
          new Date(a.scheduledTime?.start || a.createdAt || 0) -
          new Date(b.scheduledTime?.start || b.createdAt || 0),
      ),
    [jobs],
  );
  const doneJobs = useMemo(() => jobs.filter(completed), [jobs]);
  const activeJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          !["COMPLETED", "CANCELLED", "REJECTED"].includes(jobStatus(job)),
      ),
    [jobs],
  );
  const totalEarnings = useMemo(
    () => doneJobs.reduce((sum, job) => sum + jobAmount(job), 0),
    [doneJobs],
  );
  const rating = Number(profile?.rating?.average ?? profile?.rating ?? 0);
  const profileAddress = addressOf(profile);
  const workerId = String(profile?._id || profile?.id || profile?.user || "");
  const verified =
    profile?.verificationStatus?.status === "verified" ||
    profile?.registrationStatus === "APPROVED";
  const upcomingJobs = bookings.filter(
    (job) =>
      !["COMPLETED", "CANCELLED", "REJECTED"].includes(jobStatus(job)) &&
      new Date(job.scheduledTime?.start || 0) >=
        new Date(new Date().setHours(0, 0, 0, 0)),
  );
  const monthDays = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  ).getDate();
  const startOffset = (new Date(calendarMonth).getDay() + 6) % 7;
  const calendarCells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: monthDays }, (_, index) => index + 1),
  ];
  const eventsByDay = useMemo(
    () =>
      upcomingJobs.reduce((result, job) => {
        const date = new Date(job.scheduledTime?.start || 0);
        if (
          date.getMonth() === calendarMonth.getMonth() &&
          date.getFullYear() === calendarMonth.getFullYear()
        )
          result[date.getDate()] = (result[date.getDate()] || 0) + 1;
        return result;
      }, {}),
    [upcomingJobs, calendarMonth],
  );

  const chartData = useMemo(() => {
    const now = new Date();
    if (earningsRange === "weekly")
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        return {
          label: date.toLocaleDateString("en-IN", { weekday: "short" }),
          amount: doneJobs
            .filter(
              (job) =>
                new Date(
                  job.updatedAt || job.scheduledTime?.end || job.createdAt || 0,
                ).toDateString() === date.toDateString(),
            )
            .reduce((sum, job) => sum + jobAmount(job), 0),
        };
      });
    if (earningsRange === "yearly")
      return Array.from({ length: 5 }, (_, index) => {
        const year = now.getFullYear() - 4 + index;
        return {
          label: String(year),
          amount: doneJobs
            .filter(
              (job) =>
                new Date(
                  job.updatedAt || job.scheduledTime?.end || job.createdAt || 0,
                ).getFullYear() === year,
            )
            .reduce((sum, job) => sum + jobAmount(job), 0),
        };
      });
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        label: date.toLocaleDateString("en-IN", { month: "short" }),
        amount: doneJobs
          .filter((job) => {
            const completedAt = new Date(
              job.updatedAt || job.scheduledTime?.end || job.createdAt || 0,
            );
            return (
              completedAt.getMonth() === date.getMonth() &&
              completedAt.getFullYear() === date.getFullYear()
            );
          })
          .reduce((sum, job) => sum + jobAmount(job), 0),
      };
    });
  }, [doneJobs, earningsRange]);
  const maxChartValue = Math.max(1, ...chartData.map((item) => item.amount));
  const recentZones = useMemo(() => {
    const counts = new Map();
    doneJobs.forEach((job) => {
      const area =
        job.address?.district ||
        job.address?.city ||
        job.serviceAddress?.city ||
        job.location?.city ||
        "Area not recorded";
      counts.set(area, (counts.get(area) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [doneJobs]);
  const workerCoordinates = useMemo(() => {
    const point = profile?.location?.coordinates;
    if (Array.isArray(point) && point.length === 2) {
      const normalized = point.map(Number);
      if (validCoordinates(normalized)) return normalized;
    }
    const longitude = Number(
      profile?.location?.longitude ??
        profile?.longitude ??
        profile?.address?.longitude,
    );
    const latitude = Number(
      profile?.location?.latitude ??
        profile?.latitude ??
        profile?.address?.latitude,
    );
    const normalized = [longitude, latitude];
    return validCoordinates(normalized) ? normalized : null;
  }, [profile]);
  const serviceRadiusKm = Number(
    profile?.location?.workingRadiusKm ??
      profile?.serviceArea?.radiusKm ??
      profile?.serviceRadius ??
      15,
  );
  const customerLocations = useMemo(
    () =>
      activeJobs.flatMap((job) => {
        const candidates = [
          job.location?.coordinates,
          job.location?.serviceAddress?.coordinates,
          job.customerLocation,
          job.serviceAddress?.coordinates,
          job.address?.coordinates,
        ];
        const coordinates = candidates
          .find((point) => {
            const normalized = Array.isArray(point) ? point.map(Number) : null;
            return validCoordinates(normalized);
          })
          ?.map(Number);
        if (!coordinates) return [];
        const address =
          job.location?.serviceAddress ||
          job.serviceAddress ||
          job.address ||
          {};
        const customerName = job.customerName || job.customer?.name;
        const locality = address.city || address.district || address.pincode;
        const withinServiceRadius = workerCoordinates
          ? distanceKm(workerCoordinates, coordinates) <= serviceRadiusKm
          : false;
        return [
          {
            id: job.id || job._id,
            coordinates,
            withinServiceRadius,
            label:
              [customerName, job.serviceName || job.trade, locality]
                .filter(Boolean)
                .join(" · ") || "Active customer booking",
            service: job.serviceName || job.trade || "Service booking",
            locality: locality || "Location recorded",
            scheduledAt: job.scheduledTime?.start,
            status: job.status,
          },
        ];
      }),
    [activeJobs, workerCoordinates, serviceRadiusKm],
  );

  const handlePinLookup = async () => {
    setLookingUpPin(true);
    setError("");
    try {
      const detailsForm = document.querySelector("[data-worker-details]");
      const values = detailsForm ? new FormData(detailsForm) : null;
      const pincode = values ? values.get("pincode") : profileAddress.pincode;
      const result = await pincodeService.lookupPincode(pincode);
      const location = Array.isArray(result) ? result[0] : result;
      const district =
        location?.district ||
        location?.District ||
        location?.postOffice?.[0]?.district ||
        "";
      const state =
        location?.state ||
        location?.State ||
        location?.postOffice?.[0]?.state ||
        "";
      const city = values?.get("city") || profileAddress.city || district;
      if (detailsForm) {
        detailsForm.elements.namedItem("district").value = district;
        detailsForm.elements.namedItem("state").value = state;
        if (!values.get("city"))
          detailsForm.elements.namedItem("city").value = city;
      }
      await saveProfile(
        {
          address: {
            ...profileAddress,
            line1: values?.get("line1") || profileAddress.line1,
            pincode,
            district,
            state,
            city,
          },
        },
        "Address location filled from PIN code.",
      );
    } catch (lookupError) {
      setError(lookupError.message || "Could not find that PIN code.");
    } finally {
      setLookingUpPin(false);
    }
  };
  const handlePhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      saveProfile({ profileImage: reader.result }, "Profile photo updated.");
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  };
  const handleDocument = async (docType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Documents must be 5 MB or smaller.");
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      setError("Choose a PDF, JPG, JPEG, or PNG document.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setSaving(true);
      setError("");
      try {
        const documents = await workerService.uploadDocument({
          docType,
          url: reader.result,
          name: file.name,
        });
        const typedDocument = /aadhaar/i.test(docType)
          ? "aadhaar"
          : /address/i.test(docType)
            ? "addressProof"
            : /e.?shram/i.test(docType)
              ? "eshramCard"
              : null;
        setProfile((previous) => ({
          ...previous,
          verificationStatus: { ...previous?.verificationStatus, documents },
          documents: typedDocument
            ? {
                ...previous?.documents,
                [typedDocument]: {
                  url: reader.result,
                  name: file.name,
                  uploadedAt: new Date().toISOString(),
                },
              }
            : previous?.documents,
          ...(typedDocument === "eshramCard" ? { eshramProvided: true } : {}),
        }));
        setNotice(`${docType} uploaded for verification.`);
      } catch (uploadError) {
        setError(uploadError.message || "Document upload failed.");
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => setError("Could not read that document.");
    reader.readAsDataURL(file);
  };
  const addSkill = async (event) => {
    event.preventDefault();
    if (!skillDraft.name.trim()) return;
    const currentSkills = profile?.skills || [];
    await saveProfile(
      {
        skills: [
          ...currentSkills,
          {
            name: skillDraft.name.trim(),
            experienceYears: Number(skillDraft.experienceYears) || 0,
            serviceRadiusKm: Number(skillDraft.serviceRadiusKm) || 15,
            isPrimary: currentSkills.length === 0,
          },
        ],
      },
      "Skill added.",
    );
    setSkillDraft({ name: "", experienceYears: 0, serviceRadiusKm: 15 });
  };
  const saveAvailability = (event) => {
    event.preventDefault();
    workerService
      .updateAvailability({
        status: profile?.availability?.status,
        workingDays: profile?.availability?.workingDays,
        hours: profile?.availability?.hours,
      })
      .then((updated) => {
        setProfile((previous) => ({
          ...previous,
          ...normalizePayload(updated),
        }));
        setNotice("Availability saved.");
        setError("");
      })
      .catch((saveError) =>
        setError(saveError.message || "Unable to update availability."),
      );
  };
  const createWorkStatement = async () => {
    const generatedAt = new Date().toISOString();
    const statement = {
      type: "work-history-statement",
      fileName: `ShramSetu-work-statement-${generatedAt.slice(0, 10)}.html`,
      generatedAt,
      jobsCompleted: doneJobs.length,
      totalEarnings,
      workerId,
    };
    try {
      const rows = doneJobs
        .map(
          (job) =>
            `<tr><td>${escapeHtml(dateLabel(job.updatedAt || job.scheduledTime?.end || job.createdAt, { dateStyle: "medium" }))}</td><td>${escapeHtml(job.serviceName || job.trade || "Completed service")}</td><td>${money(jobAmount(job))}</td></tr>`,
        )
        .join("");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>ShramSetu Work Statement</title><style>body{font:15px Arial,sans-serif;color:#18212f;max-width:800px;margin:40px auto;padding:0 24px}h1{color:#9a4a08}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{text-align:left;padding:10px;border-bottom:1px solid #ddd}.muted{color:#64748b}</style></head><body><h1>ShramSetu Work History Statement</h1><p class="muted">Generated ${escapeHtml(dateLabel(generatedAt))} · Worker ID ${escapeHtml(workerId)}</p><h2>${escapeHtml(profile?.name || "Worker")}</h2><p>${escapeHtml(profile?.profession || profile?.experience?.primaryTrade || "Skilled worker")} · ${escapeHtml(profileAddress.city || profile?.location?.address?.city || "")}</p><p>Completed jobs: <strong>${doneJobs.length}</strong> · Recorded job value: <strong>${money(totalEarnings)}</strong></p><table><thead><tr><th>Date</th><th>Service</th><th>Recorded value</th></tr></thead><tbody>${rows}</tbody></table><p class="muted">This statement summarizes ShramSetu job records and is not a bank guarantee or proof of disbursed funds.</p></body></html>`;
      statement.content = html;
      const updated = normalizePayload(
        await workerService.updateProfile({
          generatedDocuments: [
            ...(profile?.generatedDocuments || []),
            statement,
          ],
        }),
      );
      setProfile((previous) => ({ ...previous, ...updated }));
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      link.download = statement.fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      setNotice("Work statement generated and added to your document record.");
      setError("");
    } catch (saveError) {
      setError(saveError.message || "Could not record the work statement.");
    }
  };

  const headerSubtitle =
    "Manage your worker details, service coverage, documents, and work record.";
  const documentEntries = [
    {
      type: "Aadhaar",
      entry:
        profile?.documents?.aadhaar ||
        profile?.verificationStatus?.documents?.find((doc) =>
          /aadhaar/i.test(doc.docType),
        ),
    },
    {
      type: "Address Proof",
      entry:
        profile?.documents?.addressProof ||
        profile?.verificationStatus?.documents?.find((doc) =>
          /address/i.test(doc.docType),
        ),
    },
    {
      type: "e-Shram Card",
      entry:
        profile?.documents?.eshramCard ||
        profile?.verificationStatus?.documents?.find((doc) =>
          /e.?shram/i.test(doc.docType),
        ),
      required: true,
    },
  ];

  return (
    <DashboardLayout
      title="Worker Profile"
      subtitle={headerSubtitle}
      roleBadge={verified ? "Verified Worker" : "Verification in progress"}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/worker/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy-800 hover:text-brand-saffron-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <span className="text-xs text-slate-500">Worker account</span>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}
      {loading ? (
        <div
          className="flex min-h-64 items-center justify-center"
          role="status"
          aria-label="Loading profile"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-saffron-500 border-t-transparent" />
        </div>
      ) : !profile ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Your profile could not be loaded.{" "}
          <button
            type="button"
            onClick={loadPage}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <section className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-navy-900 text-lg font-bold text-white">
                  {initials(profile.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-brand-navy-900">
                    {profile.name || "Worker"}
                  </h2>
                  <Badge
                    variant={verified ? "verified" : "outline"}
                    size="sm"
                    icon={verified ? BadgeCheck : undefined}
                  >
                    {verified ? "Verified" : "Verification pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {profile.profession ||
                    profile.experience?.primaryTrade ||
                    "Profession not set"}
                  {profile.cooperative?.name ||
                  typeof profile.cooperative === "string"
                    ? ` · ${profile.cooperative?.name || profile.cooperative}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-mono">
                    Worker ID{" "}
                    {workerId ? workerId.slice(-8).toUpperCase() : "Pending"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {rating ? rating.toFixed(1) : "New"} (
                    {profile.rating?.count || 0})
                  </span>
                  <span>
                    {profile.jobsCompleted ?? doneJobs.length} completed jobs
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Pencil}
              onClick={() => openSection("details")}
            >
              Edit Profile
            </Button>
          </section>

          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav
              aria-label="Profile sections"
              className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible"
            >
              {sections.map((item) => {
                const Icon = item.icon;
                const selected = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => openSection(item.id)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${selected ? "border-brand-navy-900 bg-brand-navy-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {selected && (
                      <ChevronRight className="ml-auto hidden h-4 w-4 lg:block" />
                    )}
                  </button>
                );
              })}
            </nav>

            <main
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              aria-live="polite"
            >
              {section === "overview" && (
                <section>
                  <SectionHeading
                    title="Your work at a glance"
                    description="Performance, upcoming work, and recent service areas."
                  />
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {[
                      [
                        Star,
                        "Rating",
                        rating ? rating.toFixed(1) : "New",
                        `${profile.rating?.count || 0} reviews`,
                      ],
                      [
                        BriefcaseBusiness,
                        "Completed jobs",
                        profile.jobsCompleted ?? doneJobs.length,
                        "Recorded on ShramSetu",
                      ],
                      [
                        CalendarDays,
                        "Active bookings",
                        activeJobs.length,
                        "Current assignments",
                      ],
                      [
                        IndianRupee,
                        "Recorded earnings",
                        money(totalEarnings),
                        "Completed job value",
                      ],
                    ].map(([Icon, label, value, note]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <Icon className="mb-3 h-4 w-4 text-brand-saffron-600" />
                        <p className="text-xs font-semibold text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-xl font-bold text-brand-navy-900">
                          {value}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{note}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-slate-900">
                          Work calendar
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Previous month"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() - 1,
                                  1,
                                ),
                              )
                            }
                            className="rounded-md border px-2 py-1 text-sm"
                          >
                            ‹
                          </button>
                          <span className="min-w-28 text-center text-sm font-semibold">
                            {calendarMonth.toLocaleDateString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            aria-label="Next month"
                            onClick={() =>
                              setCalendarMonth(
                                new Date(
                                  calendarMonth.getFullYear(),
                                  calendarMonth.getMonth() + 1,
                                  1,
                                ),
                              )
                            }
                            className="rounded-md border px-2 py-1 text-sm"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
                        {["M", "T", "W", "T", "F", "S", "S"].map(
                          (day, index) => (
                            <span
                              key={`${day}-${index}`}
                              className="py-1 font-semibold text-slate-400"
                            >
                              {day}
                            </span>
                          ),
                        )}
                        {calendarCells.map((day, index) => (
                          <span
                            key={`${day || "empty"}-${index}`}
                            className={`relative flex aspect-square items-center justify-center rounded-md text-sm ${day ? "text-slate-700" : ""} ${day === new Date().getDate() && calendarMonth.getMonth() === new Date().getMonth() ? "bg-brand-saffron-100 font-bold text-brand-saffron-900" : ""}`}
                          >
                            {day}
                            {day && eventsByDay[day] ? (
                              <i className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-saffron-600" />
                            ) : null}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Upcoming scheduled visits: {upcomingJobs.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="font-bold text-slate-900">
                        Next scheduled
                      </h3>
                      {upcomingJobs.slice(0, 3).length ? (
                        <div className="mt-3 divide-y divide-slate-100">
                          {upcomingJobs.slice(0, 3).map((job) => (
                            <div key={job.id || job._id} className="py-3">
                              <p className="text-sm font-semibold text-slate-800">
                                {job.serviceName ||
                                  job.trade ||
                                  "Service booking"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {dateLabel(job.scheduledTime?.start)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {job.address?.city ||
                                  job.serviceAddress?.city ||
                                  "Location pending"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No upcoming assignments.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">
                        Service zone & customer locations
                      </h3>
                      <MapPin className="h-4 w-4 text-brand-saffron-600" />
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(220px,.7fr)]">
                      <LocationMap
                        kind="worker"
                        coordinates={workerCoordinates}
                        radiusKm={serviceRadiusKm}
                        customerLocations={customerLocations}
                      />
                      <div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />{" "}
                            Within service radius
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <i className="h-2.5 w-2.5 rounded-full bg-amber-600" />{" "}
                            Outside service radius
                          </span>
                        </div>
                        <h4 className="mt-4 text-sm font-semibold text-slate-800">
                          Active customer bookings
                        </h4>
                        {customerLocations.length ? (
                          <div className="mt-2 divide-y divide-slate-100">
                            {customerLocations.map((location) => (
                              <div key={location.id} className="py-2.5">
                                <p className="text-sm font-medium text-slate-800">
                                  {location.service}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {location.locality} ·{" "}
                                  {location.withinServiceRadius
                                    ? "Within your zone"
                                    : "Outside your current radius"}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {dateLabel(location.scheduledAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            No active customer bookings with map coordinates.
                          </p>
                        )}
                      </div>
                    </div>
                    {recentZones.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recentZones.map(([zone, count]) => (
                          <span
                            key={zone}
                            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          >
                            {zone}{" "}
                            <strong className="ml-1 text-slate-900">
                              {count}
                            </strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Completed service locations will appear here.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {section === "details" && (
                <section>
                  <SectionHeading
                    title="Personal details"
                    description="Keep your worker identity and service location up to date."
                  />
                  <div className="mb-5 flex items-center gap-4 rounded-lg border border-slate-200 p-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-brand-saffron-100">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-lg font-bold text-brand-saffron-800">
                          {initials(profile.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Profile picture
                      </p>
                      <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-saffron-700">
                        <Camera className="h-4 w-4" /> Add or change photo
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) =>
                            handlePhoto(event.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <form
                    data-worker-details
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      saveProfile({
                        name: form.get("name"),
                        phone: form.get("phone"),
                        email: form.get("email"),
                        address: {
                          ...profileAddress,
                          line1: form.get("line1"),
                          pincode: form.get("pincode"),
                          district: form.get("district"),
                          state: form.get("state"),
                          city: form.get("city"),
                        },
                      });
                    }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        name="name"
                        defaultValue={profile.name}
                        required
                      />
                      <Field
                        label="Phone"
                        name="phone"
                        type="tel"
                        defaultValue={profile.phone}
                      />
                      <Field
                        label="Email"
                        name="email"
                        type="email"
                        defaultValue={profile.email || profile.user?.email}
                      />
                      <Field
                        label="Address"
                        name="line1"
                        defaultValue={
                          profileAddress.line1 || profileAddress.street
                        }
                      />
                    </div>
                    <div className="grid items-end gap-3 sm:grid-cols-2">
                      <Field
                        label="PIN code"
                        name="pincode"
                        defaultValue={profileAddress.pincode}
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={lookingUpPin}
                        onClick={handlePinLookup}
                      >
                        {lookingUpPin
                          ? "Looking up…"
                          : "Fill district and state"}
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        label="District"
                        name="district"
                        defaultValue={
                          profileAddress.district || profileAddress.city
                        }
                      />
                      <Field
                        label="City"
                        name="city"
                        defaultValue={
                          profileAddress.city || profileAddress.district
                        }
                      />
                      <Field
                        label="State"
                        name="state"
                        defaultValue={profileAddress.state}
                      />
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Current location
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {[
                          profileAddress.city,
                          profileAddress.district,
                          profileAddress.state,
                          profileAddress.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "Add your address to set your current location."}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Check}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save personal details"}
                    </Button>
                  </form>
                </section>
              )}

              {section === "skills" && (
                <section>
                  <SectionHeading
                    title="Skills & service radius"
                    description="Set experience and travel coverage for each trade you offer."
                  />
                  <div className="divide-y divide-slate-100 border-y border-slate-100">
                    {(profile.skills || []).map((skill, index) => (
                      <div
                        key={`${skill.name}-${index}`}
                        className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_130px_150px_auto] sm:items-end"
                      >
                        <Field label="Skill" value={skill.name} readOnly />
                        <Field
                          label="Experience (years)"
                          type="number"
                          min="0"
                          value={
                            skill.experienceYears ??
                            profile.experience?.years ??
                            0
                          }
                          onChange={(event) =>
                            setProfile((previous) => ({
                              ...previous,
                              skills: previous.skills.map(
                                (entry, entryIndex) =>
                                  entryIndex === index
                                    ? {
                                        ...entry,
                                        experienceYears: event.target.value,
                                      }
                                    : entry,
                              ),
                            }))
                          }
                        />
                        <Field
                          label="Service radius (km)"
                          type="number"
                          min="1"
                          max="100"
                          value={
                            skill.serviceRadiusKm ??
                            profile.location?.workingRadiusKm ??
                            15
                          }
                          onChange={(event) =>
                            setProfile((previous) => ({
                              ...previous,
                              skills: previous.skills.map(
                                (entry, entryIndex) =>
                                  entryIndex === index
                                    ? {
                                        ...entry,
                                        serviceRadiusKm: event.target.value,
                                      }
                                    : entry,
                              ),
                            }))
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            saveProfile(
                              { skills: profile.skills },
                              "Skill details saved.",
                            )
                          }
                        >
                          Save
                        </Button>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={addSkill}
                    className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_130px_150px_auto]"
                  >
                    <Field
                      label="Add custom skill"
                      value={skillDraft.name}
                      onChange={(event) =>
                        setSkillDraft((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Solar panel installation"
                    />
                    <Field
                      label="Experience (years)"
                      type="number"
                      min="0"
                      value={skillDraft.experienceYears}
                      onChange={(event) =>
                        setSkillDraft((previous) => ({
                          ...previous,
                          experienceYears: event.target.value,
                        }))
                      }
                    />
                    <Field
                      label="Radius (km)"
                      type="number"
                      min="1"
                      max="100"
                      value={skillDraft.serviceRadiusKm}
                      onChange={(event) =>
                        setSkillDraft((previous) => ({
                          ...previous,
                          serviceRadiusKm: event.target.value,
                        }))
                      }
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      icon={Plus}
                    >
                      Add skill
                    </Button>
                  </form>
                  <p className="mt-3 text-xs text-slate-500">
                    Default skills from your worker registration are kept.
                    Custom skills are saved to your worker profile.
                  </p>
                </section>
              )}

              {section === "documents" && (
                <section>
                  <SectionHeading
                    title="Verification documents"
                    description="Upload clear files for verification. e-Shram Card is required for worker verification."
                  />
                  <div className="divide-y divide-slate-100 border-y border-slate-100">
                    {documentEntries.map(({ type, entry, required }) => (
                      <div
                        key={type}
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 text-brand-saffron-600" />
                          <div>
                            <p className="font-semibold text-slate-800">
                              {type}
                              {required && (
                                <span className="ml-1 text-red-600">*</span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {entry?.name ||
                                (entry?.url
                                  ? "File uploaded"
                                  : "No document uploaded")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              entry?.verified ||
                              (type === "Aadhaar" &&
                                profile.verificationStatus?.aadhaarVerified)
                                ? "verified"
                                : "outline"
                            }
                            size="sm"
                          >
                            {entry?.verified ||
                            (type === "Aadhaar" &&
                              profile.verificationStatus?.aadhaarVerified)
                              ? "Verified"
                              : entry?.url
                                ? "Under review"
                                : "Required"}
                          </Badge>
                          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            {entry?.url ? "Replace" : "Upload"}
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,image/*"
                              className="sr-only"
                              onChange={(event) =>
                                handleDocument(type, event.target.files?.[0])
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Work history statement
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          A downloadable record of completed ShramSetu work and
                          recorded job values for loan applications.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={FileCheck2}
                        onClick={createWorkStatement}
                      >
                        Generate statement
                      </Button>
                    </div>
                    {profile.generatedDocuments?.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {profile.generatedDocuments
                          .slice()
                          .reverse()
                          .map((savedDocument, index) => (
                            <div
                              key={`${savedDocument.generatedAt}-${index}`}
                              className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-slate-600"
                            >
                              <span>
                                {savedDocument.fileName} ·{" "}
                                {dateLabel(savedDocument.generatedAt)}
                              </span>
                              {savedDocument.content && (
                                <button
                                  type="button"
                                  className="font-semibold text-brand-navy-900 underline"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = URL.createObjectURL(
                                      new Blob([savedDocument.content], {
                                        type: "text/html",
                                      }),
                                    );
                                    link.download = savedDocument.fileName;
                                    link.click();
                                    URL.revokeObjectURL(link.href);
                                  }}
                                >
                                  Download
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {section === "availability" && (
                <section>
                  <SectionHeading
                    title="Availability"
                    description="Control when customers and cooperatives can request your services."
                  />
                  <form onSubmit={saveAvailability} className="space-y-6">
                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Booking status
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Busy workers stay visible but are not matched to new
                          immediate jobs.
                        </p>
                      </div>
                      <div className="inline-flex rounded-lg border border-slate-200 p-1">
                        <button
                          type="button"
                          aria-pressed={
                            profile.availability?.status === "available"
                          }
                          onClick={() =>
                            setProfile((previous) => ({
                              ...previous,
                              availability: {
                                ...previous.availability,
                                status: "available",
                              },
                            }))
                          }
                          className={`rounded-md px-4 py-2 text-sm font-semibold ${profile.availability?.status === "available" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
                        >
                          Available
                        </button>
                        <button
                          type="button"
                          aria-pressed={
                            profile.availability?.status !== "available"
                          }
                          onClick={() =>
                            setProfile((previous) => ({
                              ...previous,
                              availability: {
                                ...previous.availability,
                                status: "busy",
                              },
                            }))
                          }
                          className={`rounded-md px-4 py-2 text-sm font-semibold ${profile.availability?.status !== "available" ? "bg-slate-700 text-white" : "text-slate-600"}`}
                        >
                          Busy
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Working hours start"
                        type="time"
                        value={profile.availability?.hours?.start || "09:00"}
                        onChange={(event) =>
                          setProfile((previous) => ({
                            ...previous,
                            availability: {
                              ...previous.availability,
                              hours: {
                                ...previous.availability?.hours,
                                start: event.target.value,
                              },
                            },
                          }))
                        }
                      />
                      <Field
                        label="Working hours end"
                        type="time"
                        value={profile.availability?.hours?.end || "18:00"}
                        onChange={(event) =>
                          setProfile((previous) => ({
                            ...previous,
                            availability: {
                              ...previous.availability,
                              hours: {
                                ...previous.availability?.hours,
                                end: event.target.value,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <fieldset>
                      <legend className="text-sm font-semibold text-slate-700">
                        Service days
                      </legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {days.map((day) => {
                          const selected = (
                            profile.availability?.workingDays || []
                          ).includes(day);
                          return (
                            <label
                              key={day}
                              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${selected ? "border-brand-saffron-400 bg-brand-saffron-50 text-brand-saffron-900" : "border-slate-200 text-slate-600"}`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selected}
                                onChange={() =>
                                  setProfile((previous) => {
                                    const existing =
                                      previous.availability?.workingDays || [];
                                    return {
                                      ...previous,
                                      availability: {
                                        ...previous.availability,
                                        workingDays: selected
                                          ? existing.filter(
                                              (item) => item !== day,
                                            )
                                          : [...existing, day],
                                      },
                                    };
                                  })
                                }
                              />
                              {day.slice(0, 3)}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Check}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save availability"}
                    </Button>
                  </form>
                </section>
              )}

              {section === "earnings" && (
                <section>
                  <SectionHeading
                    title="Earnings & work record"
                    description="Values are calculated from completed bookings recorded on ShramSetu."
                    action={
                      <div className="flex rounded-lg border border-slate-200 p-1">
                        {[
                          ["weekly", "Week"],
                          ["monthly", "Month"],
                          ["yearly", "Year"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={earningsRange === value}
                            onClick={() => setEarningsRange(value)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${earningsRange === value ? "bg-brand-navy-900 text-white" : "text-slate-600"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Recorded completed value
                      </p>
                      <p className="mt-1 text-xl font-bold text-brand-navy-900">
                        {money(totalEarnings)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Completed bookings
                      </p>
                      <p className="mt-1 text-xl font-bold text-brand-navy-900">
                        {doneJobs.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Recorded per job average
                      </p>
                      <p className="mt-1 text-xl font-bold text-brand-navy-900">
                        {money(
                          doneJobs.length ? totalEarnings / doneJobs.length : 0,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-lg border border-slate-200 p-4">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">
                        Completed job value
                      </h3>
                      <span className="text-xs text-slate-500">INR</span>
                    </div>
                    <div className="flex h-48 items-end gap-3 border-b border-slate-200 px-1">
                      {chartData.map((item) => (
                        <div
                          key={item.label}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        >
                          <span className="truncate text-[10px] text-slate-500">
                            {item.amount ? money(item.amount) : ""}
                          </span>
                          <div
                            title={`${item.label}: ${money(item.amount)}`}
                            className="w-full max-w-12 rounded-t bg-brand-saffron-500"
                            style={{
                              height: `${Math.max(item.amount ? 8 : 0, (item.amount / maxChartValue) * 100)}%`,
                            }}
                          />
                          <span className="pb-2 text-xs text-slate-500">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 overflow-x-auto">
                    <h3 className="mb-3 font-bold text-slate-900">
                      Completed work
                    </h3>
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase text-slate-500">
                          <th className="py-2">Service</th>
                          <th>Date</th>
                          <th>Work zone</th>
                          <th className="text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doneJobs.length ? (
                          doneJobs.map((job) => (
                            <tr
                              key={job.id || job._id}
                              className="border-b border-slate-100"
                            >
                              <td className="py-3 font-medium">
                                {job.serviceName ||
                                  job.trade ||
                                  "Completed service"}
                              </td>
                              <td>
                                {dateLabel(
                                  job.updatedAt ||
                                    job.scheduledTime?.end ||
                                    job.createdAt,
                                  { dateStyle: "medium" },
                                )}
                              </td>
                              <td>
                                {job.address?.city ||
                                  job.serviceAddress?.city ||
                                  "Not recorded"}
                              </td>
                              <td className="text-right font-semibold">
                                {money(jobAmount(job))}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="py-5 text-center text-slate-500"
                            >
                              No completed job records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {section === "reviews" && (
                <section>
                  <SectionHeading
                    title="Customer reviews"
                    description="Ratings and comments shared after completed jobs."
                  />
                  {reviews.length ? (
                    <div className="divide-y divide-slate-100 border-y border-slate-100">
                      {reviews.map((review, index) => (
                        <article
                          key={
                            review._id ||
                            review.id ||
                            `${review.createdAt}-${index}`
                          }
                          className="py-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                                {review.rating || "—"}
                              </span>
                              <span className="text-xs text-slate-500">
                                Customer review
                              </span>
                            </div>
                            <time className="text-xs text-slate-500">
                              {dateLabel(review.createdAt, {
                                dateStyle: "medium",
                              })}
                            </time>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {review.feedback ||
                              review.comment ||
                              "No written comment."}
                          </p>
                          {review.tags?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {review.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                      <Star className="mx-auto h-6 w-6 text-slate-400" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        No public reviews yet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Customer feedback will appear here after it is
                        submitted.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {section === "security" && (
                <section>
                  <SectionHeading
                    title="Security"
                    description="Your identity and document verification status."
                  />
                  <div className="divide-y divide-slate-100 border-y border-slate-100">
                    {[
                      [
                        "Worker verification",
                        profile.verificationStatus?.status ||
                          profile.registrationStatus ||
                          "pending",
                      ],
                      ["Phone", profile.phoneVerified ? "Verified" : "On file"],
                      [
                        "Email",
                        profile.emailVerified
                          ? "Verified"
                          : profile.email ||
                            profile.user?.email ||
                            "Not provided",
                      ],
                      [
                        "Aadhaar",
                        profile.verificationStatus?.aadhaarVerified
                          ? "Verified"
                          : "Verification pending",
                      ],
                      [
                        "e-Shram",
                        profile.eshramProvided ||
                        profile.documents?.eshramCard?.url
                          ? "On file"
                          : "Required",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {label}
                        </span>
                        <span className="text-sm font-semibold capitalize text-slate-900">
                          {String(value).replaceAll("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    Account password and login recovery are managed through your
                    ShramSetu sign-in. Contact your cooperative if you need to
                    correct a verified identity credential.
                  </div>
                </section>
              )}
            </main>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default WorkerProfilePage;
