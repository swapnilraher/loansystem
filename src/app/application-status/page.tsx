"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { PartnerPortalHeader, PartnerPortalFooter } from "@/components/layout/PartnerPortalShell";
import PartnerAgreementModal from "@/components/partner/PartnerAgreementModal";

export default function ApplicationStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700">Loading Tracker...</span>
          </div>
        </div>
      }
    >
      <ApplicationStatusContent />
    </Suspense>
  );
}

function ApplicationStatusContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const initialMobile = searchParams.get("mobile") || "";

  const [applicationId, setApplicationId] = useState(initialId);
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appDetails, setAppDetails] = useState<any>(null);

  const fetchStatus = async (id?: string, mobile?: string) => {
    const queryId = id !== undefined ? id : applicationId;
    const queryMobile = mobile !== undefined ? mobile : mobileNumber;

    if (!queryId && !queryMobile) return;

    setLoading(true);
    setError(null);

    try {
      const url = queryId
        ? `/api/onboarding/status?id=${encodeURIComponent(queryId)}`
        : `/api/onboarding/status?mobile=${encodeURIComponent(queryMobile)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Application not found");
      }

      setAppDetails(data.application);
    } catch (err: any) {
      setError(err.message || "Unable to find application");
      setAppDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchStatus(initialId, undefined);
    } else if (initialMobile) {
      fetchStatus(undefined, initialMobile);
    }
  }, [initialId, initialMobile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus();
  };

  return (
    <div className="partner-root min-h-screen bg-admin-bg flex flex-col">
      <PartnerPortalHeader subtitle="Application Tracker" rightLinkLabel="Partner Login" rightLinkHref="/partner/login" />

      {/* Main Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="bg-admin-surface rounded-admin-lg shadow-admin-2 border border-admin-border p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-admin-xl font-bold text-admin-text">Track DSA Partner Application</h1>
            <p className="text-admin-muted text-admin-xs mt-1">Enter your Application ID or registered mobile number to check status.</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <input
                type="text"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="Application ID (e.g. TSM-DSA-2026-104829)"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track Status
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Application Status Card */}
          {appDetails && (
            <div className="space-y-6 pt-4 border-t border-slate-100 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Application ID</span>
                    <span className="font-mono font-bold text-slate-900 text-lg">{appDetails.applicationId}</span>
                  </div>

                  <div>
                    {appDetails.status === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approved
                      </span>
                    ) : appDetails.status === "query_raised" ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Action Required (Query Raised)
                      </span>
                    ) : appDetails.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-100 text-red-800 font-bold text-xs rounded-full">
                        <XCircle className="w-4 h-4 text-red-600" /> Application Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                        <Clock className="w-4 h-4 text-blue-600" /> Under Review
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block font-medium">Applicant Name</span>
                    <span className="font-semibold text-slate-800">{appDetails.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Category</span>
                    <span className="font-semibold text-slate-800">{appDetails.partnerType} {appDetails.firmType ? `(${appDetails.firmType})` : ""}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Submitted Date</span>
                    <span className="font-semibold text-slate-800">
                      {appDetails.submittedAt ? new Date(appDetails.submittedAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Partner Agreement MOU Modal for Approved Application */}
              {appDetails.status === "approved" && (
                <div className="animate-fadeIn">
                  <PartnerAgreementModal
                    partnerData={{
                      mobileNumber: appDetails.mobileNumber,
                      email: appDetails.email,
                      fullName: appDetails.fullName || appDetails.contactPersonName,
                      dsaCode: appDetails.dsaCode,
                      agreementSigned: appDetails.agreementSigned || false,
                      agreementSignedAt: appDetails.agreementSignedAt,
                    }}
                    onSigned={() => fetchStatus()}
                  />
                </div>
              )}

              {/* Admin Query Box if Query Raised */}
              {(appDetails.status === "query_raised" || (appDetails.queries && appDetails.queries.length > 0)) && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Action Required – Admin Query Raised</span>
                  </div>
                  <div className="space-y-2">
                    {(appDetails.queries || []).map((q: any, i: number) => (
                      <div key={i} className="p-3 bg-white border border-amber-200 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-amber-800">
                          <span>Section: {q.section}</span>
                          <span className="text-[10px] text-slate-400">{q.raisedAt ? new Date(q.raisedAt).toLocaleDateString() : ""}</span>
                        </div>
                        <p className="text-slate-700 font-medium">{q.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Link
                      href={`/onboarding`}
                      className="inline-flex items-center gap-2 py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      Update Application & Resolve Query &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* Timeline Tracker */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3">Application Progress Timeline</h3>
                <div className="space-y-3">
                  {(appDetails.timeline || [
                    { title: "Mobile WhatsApp Verified", timestamp: appDetails.submittedAt },
                    { title: "KYC Documents Uploaded", timestamp: appDetails.submittedAt },
                    { title: "Application Submitted", timestamp: appDetails.submittedAt },
                    { title: "Under Admin Review", timestamp: appDetails.submittedAt },
                  ]).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 text-xs items-start">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.title}</p>
                        {item.timestamp && (
                          <p className="text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <PartnerPortalFooter />
    </div>
  );
}
