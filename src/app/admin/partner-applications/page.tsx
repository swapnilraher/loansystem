"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Building,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Download,
  Send,
  ArrowLeft
} from "lucide-react";

export default function AdminPartnerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Modals
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [querySection, setQuerySection] = useState("KYC Documents");
  const [queryMessage, setQueryMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partner-applications?status=${filterStatus}`);
      const data = await res.json();
      if (res.ok && data.applications) {
        setApplications(data.applications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const handleApprove = async (app: any) => {
    if (!confirm(`Are you sure you want to APPROVE ${app.fullName} as an official Techstar Money DSA Partner?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id: app.applicationId,
          mobileNumber: app.mobileNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      alert(`Partner Approved Successfully!\nGenerated Partner DSA Code: ${data.dsaCode}`);
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.message || "Failed to approve partner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseQuery = async () => {
    if (!selectedApp || !queryMessage.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query",
          id: selectedApp.applicationId,
          mobileNumber: selectedApp.mobileNumber,
          querySection,
          queryMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to raise query");

      alert("Query raised successfully and partner notified.");
      setShowQueryModal(false);
      setQueryMessage("");
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          id: selectedApp.applicationId,
          mobileNumber: selectedApp.mobileNumber,
          reason: rejectReason,
        }),
      });

      if (!res.ok) throw new Error("Failed to reject application");

      alert("Application rejected.");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const term = searchTerm.toLowerCase();
    return (
      app.fullName?.toLowerCase().includes(term) ||
      app.applicationId?.toLowerCase().includes(term) ||
      app.mobileNumber?.includes(term) ||
      app.panNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 py-4 px-6 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
              T
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">Techstar Money CRM</span>
              <span className="block text-[10px] text-emerald-400 font-bold uppercase">DSA Partner Onboarding Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchApplications}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link href="/admin" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications Table List */}
        <div className={`${selectedApp ? "lg:col-span-6" : "lg:col-span-12"} space-y-4 transition-all duration-300`}>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, mobile, PAN, ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                { key: "all", label: "All" },
                { key: "under_review", label: "Under Review" },
                { key: "query_raised", label: "Query" },
                { key: "approved", label: "Approved" },
                { key: "rejected", label: "Rejected" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === f.key
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading Partner Applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No partner applications found matching criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 hover:bg-slate-700/40 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                      selectedApp?.id === app.id ? "bg-slate-700/60 border-l-4 border-emerald-500" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{app.fullName || app.contactPersonName}</span>
                        <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded">
                          {app.applicationId || app.mobileNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>📱 +91 {app.mobileNumber}</span>
                        <span>💳 {app.panNumber || "PAN Pending"}</span>
                        <span>🏢 {app.partnerType || "Individual"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {app.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : app.status === "query_raised" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Query
                        </span>
                      ) : app.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold rounded-full">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold rounded-full">
                          <Clock className="w-3 h-3" /> Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Application Detail Inspector */}
        {selectedApp && (
          <div className="lg:col-span-6 bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Detail Header */}
              <div className="flex justify-between items-start border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedApp.fullName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Application ID: {selectedApp.applicationId}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-xs text-slate-400 hover:text-white">
                  Close ✕
                </button>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-4 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
                {/* 1. Personal & Contact */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">1. Basic Details</h4>
                  <p><strong>Full Name:</strong> {selectedApp.fullName || "N/A"}</p>
                  <p><strong>Mobile:</strong> +91 {selectedApp.mobileNumber}</p>
                  <p><strong>Email:</strong> {selectedApp.email || "N/A"}</p>
                </div>

                {/* 2. Business & PAN */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">2. Business Structure & PAN</h4>
                  <p><strong>Partner Entity:</strong> {selectedApp.partnerType} {selectedApp.firmType ? `(${selectedApp.firmType})` : ""}</p>
                  <p><strong>PAN Number:</strong> <span className="font-mono font-bold text-white">{selectedApp.panNumber || "N/A"}</span></p>
                </div>

                {/* 3. Contact Person */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">3. Contact Person</h4>
                  <p><strong>Name:</strong> {selectedApp.contactPersonName || selectedApp.fullName || "N/A"}</p>
                  <p><strong>Designation:</strong> {selectedApp.designation || "N/A"}</p>
                  <p><strong>DOB:</strong> {selectedApp.dob || "N/A"} &nbsp;|&nbsp; <strong>Gender:</strong> {selectedApp.gender || "N/A"}</p>
                </div>

                {/* 4. Office Address */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">4. Office Address</h4>
                  <p>{selectedApp.addressLine1}{selectedApp.addressLine2 ? `, ${selectedApp.addressLine2}` : ""}</p>
                  <p>{selectedApp.area ? `${selectedApp.area}, ` : ""}{selectedApp.city}, {selectedApp.district}, {selectedApp.stateName} - {selectedApp.pinCode}</p>
                </div>

                {/* 5. GST */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">5. GST Details</h4>
                  <p><strong>Registered:</strong> {selectedApp.isGstRegistered || "No"}</p>
                  {selectedApp.gstin && <p><strong>GSTIN:</strong> <span className="font-mono font-bold">{selectedApp.gstin}</span></p>}
                </div>

                {/* 6. KYC Documents */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-400 text-sm mb-3">6. KYC Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                    {/* ── Aadhaar Front / Combined ── */}
                    <div className="p-3 bg-slate-800 rounded-lg text-xs space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Aadhaar
                        {selectedApp.documents?.aadhaarCombined
                          ? " (Both Sides — Combined)"
                          : " Front Side"}
                      </span>
                      <p className="font-semibold text-white truncate">
                        {selectedApp.documents?.aadhaarFrontDoc?.fileName ||
                          selectedApp.documents?.aadhaarDoc?.fileName ||
                          "—"}
                      </p>
                      {(() => {
                        const url =
                          selectedApp.documents?.aadhaarFrontDoc?.fileUrl ||
                          selectedApp.documents?.aadhaarFrontDoc?.base64Data ||
                          selectedApp.documents?.aadhaarDoc?.fileUrl ||
                          selectedApp.documents?.aadhaarDoc?.base64Data;
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-bold text-[11px] pt-0.5"
                          >
                            <Eye className="w-3 h-3" /> View / Download
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not uploaded</span>
                        );
                      })()}
                    </div>

                    {/* ── Aadhaar Back (only if not combined) ── */}
                    {!selectedApp.documents?.aadhaarCombined && (
                      <div className="p-3 bg-slate-800 rounded-lg text-xs space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Aadhaar Back Side</span>
                        <p className="font-semibold text-white truncate">
                          {selectedApp.documents?.aadhaarBackDoc?.fileName || "—"}
                        </p>
                        {(() => {
                          const url =
                            selectedApp.documents?.aadhaarBackDoc?.fileUrl ||
                            selectedApp.documents?.aadhaarBackDoc?.base64Data;
                          return url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-bold text-[11px] pt-0.5"
                            >
                              <Eye className="w-3 h-3" /> View / Download
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Not uploaded</span>
                          );
                        })()}
                      </div>
                    )}

                    {/* ── PAN Card ── */}
                    <div className="p-3 bg-slate-800 rounded-lg text-xs space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">PAN Card</span>
                      <p className="font-semibold text-white truncate">
                        {selectedApp.documents?.panDoc?.fileName || "—"}
                      </p>
                      {(() => {
                        const url =
                          selectedApp.documents?.panDoc?.fileUrl ||
                          selectedApp.documents?.panDoc?.base64Data;
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-bold text-[11px] pt-0.5"
                          >
                            <Eye className="w-3 h-3" /> View / Download
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not uploaded</span>
                        );
                      })()}
                    </div>

                  </div>
                </div>

                {/* 7. Bank Account */}
                <div className="bg-slate-900/60 p-4 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm mb-2">7. Bank Account & IFSC</h4>
                  <p><strong>Account Holder:</strong> {selectedApp.bankDetails?.accountHolderName || selectedApp.fullName || "N/A"}</p>
                  <p><strong>Bank & Branch:</strong> {selectedApp.bankDetails?.bankName || "N/A"} ({selectedApp.bankDetails?.branchName || "N/A"})</p>
                  <p><strong>Account No:</strong> <span className="font-mono font-bold">{selectedApp.bankDetails?.accountNumber || "N/A"}</span> ({selectedApp.bankDetails?.accountType || "Savings"})</p>
                  <p><strong>IFSC Code:</strong> <span className="font-mono font-bold text-emerald-400">{selectedApp.bankDetails?.ifsc || "N/A"}</span></p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-700 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowQueryModal(true)}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Raise Query
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedApp)}
                disabled={actionLoading}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Partner
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Raise Query Modal */}
      {showQueryModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold">Raise Query to Applicant</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Section *</label>
              <select
                value={querySection}
                onChange={(e) => setQuerySection(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Basic Details">1. Basic Details</option>
                <option value="Business Details">2. Business Details</option>
                <option value="PAN Details">2. PAN Details</option>
                <option value="Contact Person">3. Contact Person</option>
                <option value="Office Address">4. Office Address</option>
                <option value="GST Details">5. GST Details</option>
                <option value="KYC Documents">6. KYC Documents (Aadhaar/PAN)</option>
                <option value="Bank Account Details">7. Bank Account Details</option>
                <option value="General">Other / General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Query Message</label>
              <textarea
                rows={3}
                value={queryMessage}
                onChange={(e) => setQueryMessage(e.target.value)}
                placeholder="Explain what correction or re-upload is required..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowQueryModal(false)} className="py-2 px-4 bg-slate-800 text-xs font-bold rounded-xl">
                Cancel
              </button>
              <button onClick={handleRaiseQuery} className="py-2 px-5 bg-amber-600 hover:bg-amber-700 text-xs font-bold rounded-xl">
                Send Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold text-red-400">Reject Partner Application</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="py-2 px-4 bg-slate-800 text-xs font-bold rounded-xl">
                Cancel
              </button>
              <button onClick={handleReject} className="py-2 px-5 bg-red-600 hover:bg-red-700 text-xs font-bold rounded-xl">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
