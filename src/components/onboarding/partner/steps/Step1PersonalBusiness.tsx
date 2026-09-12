"use client"

import React from "react"
import { Building2, CheckCircle2, ChevronDown, Loader2, User } from "lucide-react"

import { GSTIN_RE, PINCODE_RE } from "@/lib/onboarding-steps"

import { useOnboarding } from "../OnboardingContext"
import { FIRM_TYPES } from "../types"
import {
  Callout,
  ChoiceGroup,
  Field,
  FieldGrid,
  Full,
  InlineAction,
  PrefixedInput,
  Section,
  SelectInput,
  StepHeading,
  StepNav,
  TextInput,
  VerifyPill,
} from "../ui"

const TURNOVER_RANGES = [
  "Up to ₹25 Lakhs / month",
  "₹25 Lakhs – ₹1 Crore / month",
  "₹1 Crore – ₹5 Crores / month",
  "₹5 Crores+ / month",
]

/**
 * Step 1 — Business & Personal Details.
 *
 * Implements the Cashfree Business Details layout tailored for DSA Loan Partner:
 * - Clean "Business Details" header & subtitle
 * - "Your Name"
 * - "Select your expected loan disbursement volume"
 * - Individual vs Firm selection with dropdown & office address
 */
export function Step1PersonalBusiness() {
  const {
    form,
    patch,
    fieldError,
    invalidField,
    saving,
    saveAndContinue,
    mobileNumber,
    verifyGst,
    gstVerifying,
    lookupPincode,
    pincodeLoading,
    pincodeAreas,
    pincodeNote,
  } = useOnboarding()

  const isFirm = form.partnerType === "Firm"
  const gstin = form.gstin.trim().toUpperCase()
  const gstFormatOk = GSTIN_RE.test(gstin)
  const details = form.gstDetails as Record<string, string> | null

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page Title ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Business Details
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          We need your business details to recommend lending solutions tailored to your partner profile.
        </p>
      </div>

      {/* ── Main Card 1: Name & Turnover ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        {/* Your Name */}
        <div className="space-y-1.5">
          <label htmlFor="ob-fullName" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Your Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="ob-fullName"
            type="text"
            value={form.fullName}
            onChange={e => patch({ fullName: e.target.value })}
            placeholder="e.g. Rahul Patil"
            autoComplete="name"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-fullName") && (
            <p className="text-xs text-rose-500">{fieldError("ob-fullName")}</p>
          )}
        </div>

        {/* Annual Turnover / Volume Dropdown */}
        <div className="space-y-1.5">
          <label htmlFor="turnover-range" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Select your expected loan disbursement volume
          </label>
          <div className="relative">
            <select
              id="turnover-range"
              defaultValue=""
              className="w-full h-11 sm:h-12 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none appearance-none transition-all cursor-pointer"
            >
              <option value="" disabled>Select turnover / volume range</option>
              {TURNOVER_RANGES.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="ob-email" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="ob-email"
            type="email"
            value={form.email}
            onChange={e => patch({ email: e.target.value })}
            placeholder="partner@example.com"
            autoComplete="email"
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-email") && (
            <p className="text-xs text-rose-500">{fieldError("ob-email")}</p>
          )}
          <p className="text-[11px] text-slate-400">Your partner ID and MOU agreement will be delivered here.</p>
        </div>
      </div>

      {/* ── Cashfree Card 2: Entity & Constitution ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Constitution &amp; Entity</h2>
          <p className="text-xs text-slate-400">Select how your business is legally structured.</p>
        </div>

        <ChoiceGroup
          label="Applying as"
          value={form.partnerType}
          options={["Individual", "Firm"] as const}
          onChange={next => patch({ partnerType: next })}
          descriptions={{
            Individual: "Sole DSA in your personal name",
            Firm: "Registered Company, LLP or Partnership",
          }}
        />

        {isFirm && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
            <div className="space-y-1.5">
              <label htmlFor="ob-firmType" className="block text-xs font-semibold text-slate-700">
                Firm Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="ob-firmType"
                  value={form.firmType || ""}
                  onChange={e => patch({ firmType: e.target.value as any })}
                  className="w-full h-11 sm:h-12 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Select Firm Type</option>
                  {FIRM_TYPES.map(ft => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ob-businessName" className="block text-xs sm:text-sm font-semibold text-slate-800">
                Registered Legal Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="ob-businessName"
                type="text"
                value={form.businessName}
                onChange={e => patch({ businessName: e.target.value })}
                placeholder="Apex Capital Advisors LLP"
                className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
              />
              {fieldError("ob-businessName") && (
                <p className="text-xs text-rose-500">{fieldError("ob-businessName")}</p>
              )}
            </div>
          </div>
        )}

        {/* Designation */}
        <div className="space-y-1.5">
          <label htmlFor="ob-designation" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Your Designation / Role <span className="text-rose-500">*</span>
          </label>
          <input
            id="ob-designation"
            type="text"
            value={form.designation}
            onChange={e => patch({ designation: e.target.value })}
            placeholder={isFirm ? "Managing Director / Partner" : "DSA Partner / Financial Consultant"}
            className="w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
          />
          {fieldError("ob-designation") && (
            <p className="text-xs text-rose-500">{fieldError("ob-designation")}</p>
          )}
        </div>

        {/* GST Registration */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <ChoiceGroup
            label="Is your business registered for GST?"
            value={form.isGstRegistered}
            options={["No", "Yes"] as const}
            onChange={next => patch({ isGstRegistered: next })}
            descriptions={{
              No: "I do not have a GSTIN (Exempt / Turnover under threshold)",
              Yes: "I have an active 15-character GST registration",
            }}
          />

          {form.isGstRegistered === "Yes" && (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label htmlFor="ob-gstin" className="text-xs sm:text-sm font-semibold text-slate-800">
                  GSTIN Number <span className="text-rose-500">*</span>
                </label>
                {form.gstValid && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  id="ob-gstin"
                  type="text"
                  maxLength={15}
                  value={form.gstin}
                  onChange={e => patch({ gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABAV8504E1ZJ"
                  className="flex-1 h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  disabled={gstVerifying || !gstFormatOk}
                  onClick={() => void verifyGst()}
                  className="h-11 sm:h-12 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors disabled:opacity-40"
                >
                  {gstVerifying ? <Loader2 size={14} className="animate-spin" /> : "Verify GST"}
                </button>
              </div>
              {fieldError("ob-gstin") && (
                <p className="text-xs text-rose-500">{fieldError("ob-gstin")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cashfree Card 3: Contact & Office Address ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Contact &amp; Office Address</h2>
          <p className="text-xs text-slate-400">Where you operate from. This address will be printed on your partner MOU.</p>
        </div>

        <FieldGrid>
          <Field id="ob-alternateMobile" label="Alternate Mobile" optional error={fieldError("ob-alternateMobile")}>
            <PrefixedInput
              prefix="+91"
              id="ob-alternateMobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.alternateMobile}
              onChange={e => patch({ alternateMobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit mobile number"
            />
          </Field>

          <Field
            id="ob-pinCode"
            label="PIN Code"
            required
            error={fieldError("ob-pinCode")}
            aside={pincodeLoading ? <Loader2 size={13} className="animate-spin text-indigo-600" /> : undefined}
          >
            <input
              id="ob-pinCode"
              inputMode="numeric"
              maxLength={6}
              value={form.pinCode}
              onChange={e => {
                const clean = e.target.value.replace(/\D/g, "").slice(0, 6)
                patch({ pinCode: clean })
                if (clean.length === 6) void lookupPincode(clean)
              }}
              placeholder="431001"
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </Field>

          <Field id="ob-area" label="Area / Locality" optional>
            {pincodeAreas.length > 1 ? (
              <select
                id="ob-area"
                value={form.area}
                onChange={e => patch({ area: e.target.value })}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                <option value="">Select locality</option>
                {pincodeAreas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            ) : (
              <input
                id="ob-area"
                type="text"
                value={form.area}
                onChange={e => patch({ area: e.target.value })}
                placeholder="Locality or landmark"
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            )}
          </Field>

          <Full>
            <Field id="ob-addressLine1" label="Address Line 1" required error={fieldError("ob-addressLine1")}>
              <input
                id="ob-addressLine1"
                type="text"
                value={form.addressLine1}
                onChange={e => patch({ addressLine1: e.target.value })}
                placeholder="Shop/Office number, building, street"
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </Field>
          </Full>

          <Field id="ob-city" label="City" required error={fieldError("ob-city")}>
            <input
              id="ob-city"
              type="text"
              value={form.city}
              onChange={e => patch({ city: e.target.value })}
              placeholder="City"
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </Field>

          <Field id="ob-stateName" label="State" required error={fieldError("ob-stateName")}>
            <input
              id="ob-stateName"
              type="text"
              value={form.stateName}
              onChange={e => patch({ stateName: e.target.value })}
              placeholder="State"
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </Field>
        </FieldGrid>

        {pincodeNote && <Callout tone="warn">{pincodeNote}</Callout>}
      </div>

      {/* ── Full Width Black Continue Button (matching screenshot 1) ── */}
      <StepNav onContinue={() => void saveAndContinue()} loading={saving} continueLabel="Continue" />
    </div>
  )
}
