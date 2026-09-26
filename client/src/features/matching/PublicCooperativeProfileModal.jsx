import { LocationMap } from '../../components/common/LocationMap';
import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  ShieldCheck,
  Award,
  Users,
  MapPin,
  Share2,
  Check,
  ArrowRight,
  FileCheck2,
  PhoneCall,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { apiClient } from "../../services/apiClient";

export function PublicCooperativeProfileModal({
  isOpen,
  onClose,
  cooperativeId,
  cooperativeData,
  onBookService,
}) {
  const [profile, setProfile] = useState(cooperativeData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    let active = true;

    setProfile(cooperativeData || null);
    if (cooperativeData) {
      setProfile(cooperativeData);
    }

    const id = cooperativeId || cooperativeData?.id || cooperativeData?._id;
    if (id) {
      setIsLoading(true);
      apiClient
        .get(`/cooperatives/public/${id}`)
        .then((res) => {
          if (!active) return;
          if (res.data) {
            setProfile(res.data);
          }
        })
        .catch((err) => {
          if (!active) return;
          setError(err.message || "Unable to load profile");
          console.warn("Could not fetch remote cooperative profile:", err);
          if (cooperativeData) setProfile(cooperativeData);
        })
        .finally(() => { if (active) setIsLoading(false); });
    }
    return () => { active = false; };
  }, [isOpen, cooperativeId, cooperativeData]);

  if (!isOpen) return null;

  const coop = profile || {};
  const coopName = coop.name || "Worker Cooperative Society";
  const regNumber =
    coop.registrationNumber || coop.regNumber || "MSCS/CR/2021/489";
  const trustScore = coop.trustScore || 98;
  const memberCount = coop.memberCount ?? coop.totalWorkers ?? 0;
  const district = coop.district || "Pune";
  const state = coop.state || "Maharashtra";
  const jurisdiction = coop.serviceArea?.pincodes || [];
  const serviceSectors = coop.serviceCategories || coop.serviceSectors || [];

  const handleCopyLink = () => {
    const id = coop.id || coop._id || cooperativeId;
    const url = `${window.location.origin}/user/dashboard?tab=match&viewCoop=${id}`;
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
          <Badge variant="gov" size="sm">
            Statutory Cooperative Society Profile
          </Badge>

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
              <span>{copied ? "Copied!" : "Share Society"}</span>
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
              <span>Loading cooperative guild records...</span>
            </div>
          ) : (
            <>
              {/* Society Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-navy-900 via-slate-900 to-indigo-950 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-200 flex-shrink-0">
                    {coop.logo ? <img src={coop.logo} alt={coopName} className="h-full w-full rounded-2xl object-cover" /> : <Building2 className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display">
                      {coopName}
                    </h3>
                    <p className="text-xs text-indigo-200 font-mono mt-0.5">
                      Reg. No: {regNumber}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {district}, {state} • {memberCount} Registered Artisans
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-200 block">
                    Customer Rating
                  </span>
                  <span className="text-xl font-extrabold text-emerald-400 font-display">
                    {coop.rating?.count ? Number(coop.rating.average).toFixed(1) : 'No reviews'}
                  </span>
                </div>
              </div>

              {/* Statutory Governance & Compliance Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Coop Audit
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {coop.verificationStatus === 'verified' ? 'Verified' : 'Pending verification'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Artisans Roster
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {memberCount} Members
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Award className="w-4 h-4 text-brand-saffron-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Commission Model
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    0% Cut (Direct DBT)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <FileCheck2 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">
                    Floor Wage Guarantee
                  </span>
                  <span className="text-xs font-bold text-purple-900">
                    100% Guaranteed
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600">{coop.description || 'No description provided.'}</p>
              <p className="text-sm">{coop.completedJobs || 0} completed jobs / {coop.serviceArea?.radiusKm || 25} km service area</p>
              <LocationMap kind="cooperative" coordinates={[coop.coordinates?.longitude, coop.coordinates?.latitude]} radiusKm={coop.serviceArea?.radiusKm} />
              <section><h4 className="font-bold mb-2">Workers</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(coop.workers || []).map(worker => <div key={worker.id} className="rounded-xl border p-3 text-sm"><strong>{worker.name}</strong><p>{worker.primaryTrade}</p><p>{worker.availability?.status}</p></div>)}</div>{!coop.workers?.length && <p className="text-sm text-slate-500">No workers listed yet.</p>}</section>
              {/* Service Sectors Covered */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Regulated Service Sectors Covered
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {serviceSectors.map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authorized Jurisdiction */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-brand-saffron-600" />
                  <span>Authorized Jurisdiction & Service Pincodes</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {Array.isArray(jurisdiction)
                    ? jurisdiction.join(" • ")
                    : jurisdiction}
                </p>
              </div>

              {/* Governance & Citizen Redressal */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2">
                <span className="font-bold block">
                  Cooperative Society Redressal & Oversight
                </span>
                <p className="text-indigo-900 text-[11px] leading-relaxed">
                  All service bookings executed through this cooperative society
                  are backed by the Maharashtra Cooperative Societies Act.
                  Artisans receive statutory floor wages with zero private
                  commission cuts. Customer escrows are released exclusively
                  upon OTP / QR handshake verification.
                </p>
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
            disabled={!coop.id && !coop._id}
            onClick={() => {
              onClose();
              if (onBookService) {
                onBookService(coop);
              }
            }}
          >
            Book via This Guild
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PublicCooperativeProfileModal;
