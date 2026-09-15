import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  HardHat,
  Search,
  Filter,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function AdminVerificationManager() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending'); // all, pending, cooperative, worker, verified, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Document Viewer Modal State
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Reject Remarks Modal State
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const loadRequests = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const data = await adminService.getVerifications();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load verification queue' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReviewAction = async (item, status, remarks = '') => {
    setActionInProgress(item.id);
    setFeedback(null);
    try {
      await adminService.reviewVerification({
        applicantType: item.applicantType,
        applicantId: item.applicantId,
        status,
        remarks,
      });

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, status, remarks: status === 'rejected' ? remarks : null }
            : r
        )
      );

      setFeedback({
        type: 'success',
        message: `${item.name} has been ${status === 'verified' ? 'Approved & Verified' : 'Rejected'} successfully!`,
      });

      if (rejectModalItem) {
        setRejectModalItem(null);
        setRejectRemarks('');
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update verification status' });
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    // Tab filter
    if (activeFilter === 'pending' && r.status !== 'pending') return false;
    if (activeFilter === 'verified' && r.status !== 'verified') return false;
    if (activeFilter === 'rejected' && r.status !== 'rejected') return false;
    if (activeFilter === 'cooperative' && r.applicantType !== 'cooperative') return false;
    if (activeFilter === 'worker' && r.applicantType !== 'worker') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name?.toLowerCase().includes(q);
      const matchState = r.state?.toLowerCase().includes(q);
      const matchDistrict = r.district?.toLowerCase().includes(q);
      const matchTrade = r.tradeOrServices?.toLowerCase().includes(q);
      const matchReg = r.registrationNumber?.toLowerCase().includes(q);
      return matchName || matchState || matchDistrict || matchTrade || matchReg;
    }

    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const verifiedCount = requests.filter((r) => r.status === 'verified').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header & Telemetry */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                MoSDE & Registrar Oversight
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-brand-navy-900 mt-1">
              Statutory Verification & Audit Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and certify cooperative societies and blue-collar artisan onboarding submissions
            </p>
          </div>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadRequests}>
            Refresh Queue
          </Button>
        </div>

        {/* Counter Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 uppercase">Pending Review</span>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5">{pendingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase">Verified Certified</span>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">{verifiedCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase">Total Applications</span>
            <div className="text-xl font-extrabold text-indigo-900 mt-0.5">{requests.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 uppercase">Actioned / Rejected</span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'all', label: 'All Requests' },
            { id: 'cooperative', label: 'Cooperatives' },
            { id: 'worker', label: 'Artisans' },
            { id: 'verified', label: 'Verified' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-brand-navy-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, state, trade, reg no..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Loading statutory verification requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No applications match current filter</h3>
          <p className="text-xs text-slate-500 mt-1">Try switching tabs or clearing your search term.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((item) => {
            const isCoop = item.applicantType === 'cooperative';
            const Icon = isCoop ? Building2 : HardHat;
            const isPending = item.status === 'pending';

            return (
              <Card
                key={item.id}
                className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left: Applicant Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${
                        isCoop ? 'bg-indigo-600' : 'bg-brand-saffron-500'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-extrabold text-slate-900 truncate">{item.name}</h3>
                        <Badge variant={isCoop ? 'coop' : 'saffron'} size="sm">
                          {isCoop ? 'Cooperative Society' : 'Artisan Worker'}
                        </Badge>
                        <Badge
                          variant={
                            item.status === 'verified'
                              ? 'verified'
                              : item.status === 'rejected'
                              ? 'outline'
                              : 'saffron'
                          }
                          size="sm"
                          dot
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 text-xs text-slate-600 mt-2 font-medium">
                        <div>
                          <span className="text-slate-400">Jurisdiction:</span> {item.district}, {item.state}
                        </div>
                        <div>
                          <span className="text-slate-400">Sector/Trade:</span> {item.tradeOrServices}
                        </div>
                        {item.registrationNumber && (
                          <div className="font-mono">
                            <span className="text-slate-400 font-sans">Reg No:</span> {item.registrationNumber}
                          </div>
                        )}
                        {item.phone && (
                          <div className="font-mono">
                            <span className="text-slate-400 font-sans">Contact:</span> {item.phone}
                          </div>
                        )}
                        {item.experienceYears !== undefined && (
                          <div>
                            <span className="text-slate-400">Experience:</span> {item.experienceYears} Years
                          </div>
                        )}
                        {item.cooperativeName && (
                          <div>
                            <span className="text-slate-400">Guild:</span> {item.cooperativeName}
                          </div>
                        )}
                      </div>

                      {/* Documents Section */}
                      {item.documents?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Submitted Verification Documents ({item.documents.length}):
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.documents.map((doc, dIdx) => (
                              <button
                                key={dIdx}
                                type="button"
                                onClick={() => setSelectedDoc(doc)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-medium text-slate-800 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                <span>{doc.docType || 'Document'}</span>
                                <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejection remarks if rejected */}
                      {item.remarks && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Registrar Audit Note:</span>
                            <span>{item.remarks}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Approval / Rejection Actions */}
                  <div className="flex items-center sm:flex-col lg:flex-row gap-2.5 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <Button
                      variant="emerald"
                      size="sm"
                      icon={CheckCircle2}
                      disabled={actionInProgress === item.id || item.status === 'verified'}
                      onClick={() => handleReviewAction(item, 'verified')}
                    >
                      {actionInProgress === item.id ? 'Processing...' : 'Approve & Certify'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      disabled={actionInProgress === item.id || item.status === 'rejected'}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-300"
                      onClick={() => {
                        setRejectModalItem(item);
                        setRejectRemarks('');
                      }}
                    >
                      Reject with Note
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">{selectedDoc.docType || 'Document'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedDoc.url}
                alt={selectedDoc.docType}
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">{selectedDoc.name || 'document_scan.jpg'}</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Remarks Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Specify Audit Rejection Reason</h3>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Explain what the applicant ({rejectModalItem.name}) needs to correct before re-applying.
            </p>

            <textarea
              rows={3}
              required
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Uploaded Aadhaar image is blurry. Please re-upload a clear government scan."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 mb-4"
            />

            <div className="flex gap-2">
              <Button variant="outline" size="md" className="flex-1" onClick={() => setRejectModalItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() =>
                  handleReviewAction(
                    rejectModalItem,
                    'rejected',
                    rejectRemarks || 'Application does not meet current registrar verification guidelines.'
                  )
                }
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVerificationManager;

