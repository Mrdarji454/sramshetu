import { LocationMap } from '../../components/common/LocationMap';
import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Award,
  Building2,
  Star,
  MapPin,
  Calendar,
  Share2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Sparkles,
  ArrowRight,
  UserCheck,
  Check,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { apiClient } from "../../services/apiClient";

export function PublicWorkerProfileModal({
  isOpen,
  onClose,
  workerId,
  workerData,
  onBookWorker,
}) {
  const [profile, setProfile] = useState(workerData?.worker || workerData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    let active = true;

    setReviews([]);
    setProfile(workerData?.worker || workerData || null);
    if (workerData) {
      setProfile(workerData.worker || workerData);
    }

    const id =
      workerId ||
      workerData?.worker?.id ||
      workerData?.worker?._id ||
      workerData?.id ||
      workerData?._id;
    if (id) {
      setIsLoading(true);
      apiClient
        .get(`/workers/public/${id}`)
        .then((res) => {
          if (!active) return;
          if (res.data) {
            setProfile(res.data.worker || res.data);
            if (res.data.reviews) {
              setReviews(res.data.reviews);
            }
          }
        })
        .catch((err) => {
          if (!active) return;
          setError(err.message || "Unable to load profile");
          console.warn("Could not fetch remote public profile:", err);
          if (workerData) setProfile(workerData.worker || workerData);
        })
        .finally(() => { if (active) setIsLoading(false); });
    }
    return () => { active = false; };
  }, [isOpen, workerId, workerData]);

  if (!isOpen) return null;

  const artisan = profile || {};
  const artisanName = artisan.name || "Artisan Profile";
  const trade =
    artisan.primaryTrade || artisan.trade || "Skilled Technical Specialist";
  const rating = Number(artisan.rating?.average ?? artisan.rating ?? 0).toFixed(1);
  const ratingCount = artisan.ratingCount || artisan.reviewsCount || 0;
  const jobsCompleted = artisan.jobsCompleted || 0;
  const experienceYears =
    artisan.experienceYears || 0;
  const floorRate = artisan.rates?.dailyFloorRate || 1200;
  const hourlyRate = artisan.rates?.hourlyRate || Math.round(floorRate / 8);
  const skills = artisan.skills || [trade];
  const cooperativeName =
    artisan.cooperative?.name || "Independent artisan";
  const serviceArea =
    artisan.serviceArea?.pincodes?.join(", ") || "Not specified";
  const isNew = jobsCompleted <= 5 || artisan.isNewWorker;

  const handleCopyLink = () => {
    const id = artisan.id || artisan._id || workerId;
    const url = `${window.location.origin}/user/dashboard?tab=match&viewWorker=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:px-7 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Badge variant="gov" size="sm">
              {artisan.isVerified ? "Verified profile" : "Worker profile"}
            </Badge>
            {isNew && (
              <Badge variant="saffron" size="sm">
                🌟 Rising Talent
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy shareable link"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{copied ? "Copied!" : "Share Profile"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {isLoading && !profile ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-brand-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Fetching authenticated public credentials...</span>
            </div>
          ) : (
            <>
              {/* Profile Card Hero */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-brand-navy-900 to-slate-900 text-white shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-brand-saffron-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  {artisan.avatar ? <img src={artisan.avatar} alt={artisanName} className="h-full w-full object-cover rounded-2xl" /> : artisanName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold font-display">
                      {artisanName}
                    </h3>
                    <Badge variant={artisan.isVerified ? "verified" : "outline"} size="sm">
                      {artisan.isVerified ? "KYC Verified" : "Verification pending"}
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-saffron-200 font-semibold mt-0.5">
                    {trade}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {rating} ({ratingCount} reviews)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {experienceYears} Yrs Experience
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">
                      {jobsCompleted} Jobs Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Public Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Identity Status
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Aadhaar e-KYC
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Award className="w-4 h-4 text-brand-saffron-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Certification
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    NSDC L-4
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Building2 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Cooperative Society
                  </span>
                  <span
                    className="text-xs font-bold text-slate-900 truncate block"
                    title={cooperativeName}
                  >
                    {cooperativeName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <IndianRupee className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Platform Fee
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    0% Cut (Direct DBT)
                  </span>
                </div>
              </div>

              {/* Floor Wages & Rates Breakdown */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Statutory Fair Wage Floor (Zero Private Commission)
                  </span>
                  <Badge variant="gov" size="sm">
                    Govt. Notified
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-[11px] text-slate-500 block">
                      Standard Hourly Rate
                    </span>
                    <span className="text-base font-extrabold text-brand-navy-900 font-display">
                      ₹{hourlyRate}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        / hr
                      </span>
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-[11px] text-slate-500 block">
                      Guaranteed Daily Floor
                    </span>
                    <span className="text-base font-extrabold text-brand-navy-900 font-display">
                      ₹{floorRate}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        / 8-hr day
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills & Specializations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Verified Skills & Core Tooling
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/70"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-600">{artisan.bio}</p>
              <p className="text-sm">Availability: {artisan.availability?.status || 'Not specified'} / Service radius: {artisan.serviceRadius || 15} km</p>
              <LocationMap kind="worker" coordinates={[artisan.coordinates?.longitude, artisan.coordinates?.latitude]} radiusKm={artisan.serviceRadius} />
              {/* Service Jurisdiction */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-saffron-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Service Coverage Pincodes:
                  </span>
                  <span>{serviceArea}</span>
                </div>
              </div>

              {/* Customer Reviews & Feedback */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Customer Ratings & Verified Feedback (
                  {reviews.length})
                </h4>
                {!reviews.length && <p className="text-sm text-slate-500">No reviews yet.</p>}
                <div className="space-y-2.5">
                  {reviews.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          {r.author || r.customerName || "Verified Customer"}
                        </span>
                        <span className="font-bold text-amber-500">
                          ★ {r.rating || 5}.0
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {r.comment || r.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:px-7 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            disabled={!artisan.id && !artisan._id}
            onClick={() => {
              onClose();
              if (onBookWorker) {
                onBookWorker({
                  worker: artisan,
                  cooperative: artisan.cooperative,
                });
              }
            }}
          >
            Book This Artisan
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PublicWorkerProfileModal;
