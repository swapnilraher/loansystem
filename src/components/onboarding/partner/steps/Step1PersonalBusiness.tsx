"use client"

import React, { useState } from "react"
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  User,
  X,
} from "lucide-react"

import { GSTIN_RE } from "@/lib/onboarding-steps"
import { cn } from "@/lib/utils"

import { useOnboarding } from "../OnboardingContext"
import { FIRM_TYPES, type FirmType } from "../types"
import {
  Callout,
  ChoiceGroup,
  Field,
  FieldGrid,
  Full,
  PrefixedInput,
  SectionCard,
  StepHeading,
  StepNav,
  TextInput,
} from "../ui"

const TURNOVER_RANGES = [
  "Up to ₹25 Lakhs / month",
  "₹25 Lakhs – ₹1 Crore / month",
  "₹1 Crore – ₹5 Crores / month",
  "₹5 Crores+ / month",
]

/**
 * Step 1 — Business Details.
 *
 * Implements the redesigned, fintech-styled partner onboarding Step 1:
 * - STEP 1 OF 3 eyebrow hierarchy
 * - Your Name, Expected loan disbursement volume, Email Address
 * - Applying as Individual vs Firm with modern selection cards
 * - Clean mobile bottom sheet / modal for Firm Type
 * - GST Yes/No selection cards with inline verification
 * - Contact & Office Address in clean 2-column desktop / 1-column mobile grid
 * - Sticky bottom CTA bar with safe-area padding
 */
export function Step1PersonalBusiness() {
  const {
    form,
    patch,
    fieldError,
    saving,
    saveAndContinue,
    verifyGst,
    gstVerifying,
    lookupPincode,
    pincodeLoading,
    pincodeAreas,
    pincodeNote,
  } = useOnboarding()

  const [firmTypeModalOpen, setFirmTypeModalOpen] = useState(false)

  const isFirm = form.partnerType === "Firm"
  const gstin = form.gstin.trim().toUpperCase()
  const gstFormatOk = GSTIN_RE.test(gstin)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page Heading ── */}
      <StepHeading
        eyebrow="Step 1 of 3"
        title="Business Details"
        description="Tell us about your business so we can recommend suitable lending solutions."
      />

      {/* ── CARD 1: Personal & Volume Details ── */}
      <SectionCard>
        {/* Your Name */}
        <Field id="ob-fullName" label="Your Name" required error={fieldError("ob-fullName")}>
          <TextInput
            id="ob-fullName"
            type="text"
            value={form.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
            placeholder="e.g. Rahul Patil"
            autoComplete="name"
            invalid={Boolean(fieldError("ob-fullName"))}
          />
        </Field>

        {/* Expected Loan Disbursement Volume */}
        <div className="space-y-1.5">
          <label htmlFor="turnover-range" className="block text-xs sm:text-sm font-semibold text-slate-800">
            Expected loan disbursement volume
          </label>
          <div className="relative">
            <select
              id="turnover-range"
              defaultValue=""
              className="w-full h-11 sm:h-12 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none appearance-none transition-all cursor-pointer"
            >
              <option value="" disabled>
                Select expected loan disbursement volume
              </option>
              {TURNOVER_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Email Address */}
        <Field
          id="ob-email"
          label="Email Address"
          required
          hint="Your partner ID and MOU agreement will be delivered here."
          error={fieldError("ob-email")}
        >
          <TextInput
            id="ob-email"
            type="email"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="partner@example.com"
            autoComplete="email"
            invalid={Boolean(fieldError("ob-email"))}
          />
        </Field>
      </SectionCard>

      {/* ── CARD 2: Constitution & Entity ── */}
      <SectionCard
        title="Constitution & Entity"
        hint="Select how your business is legally structured."
      >
        {/* Applying as Selection Cards */}
        <ChoiceGroup
          label="Applying as"
          value={form.partnerType}
          options={["Individual", "Firm"] as const}
          onChange={(next) => patch({ partnerType: next })}
          descriptions={{
            Individual: "Personal / individual DSA",
            Firm: "Registered business / company",
          }}
        />

        {/* Firm Type and Legal Business Name */}
        {isFirm && (
          <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
            {/* Firm Type Selection Trigger */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                Firm Type <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setFirmTypeModalOpen(true)}
                className="w-full h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-left flex items-center justify-between hover:border-slate-300 transition-all cursor-pointer"
              >
                <span className={cn(form.firmType ? "text-slate-900 font-semibold" : "text-slate-400")}>
                  {form.firmType || "Select Firm Type"}
                </span>
                <ChevronDown size={18} className="text-slate-400 shrink-0" />
              </button>
              {fieldError("ob-firmType") && (
                <p className="text-xs text-rose-500">{fieldError("ob-firmType")}</p>
              )}
            </div>

            {/* Legal Business Name */}
            <Field
              id="ob-businessName"
              label="Registered Legal Business Name"
              required
              error={fieldError("ob-businessName")}
            >
              <TextInput
                id="ob-businessName"
                type="text"
                value={form.businessName}
                onChange={(e) => patch({ businessName: e.target.value })}
                placeholder="e.g. Venkateshwara Agro Super Mall Pvt. Ltd."
                invalid={Boolean(fieldError("ob-businessName"))}
              />
            </Field>
          </div>
        )}

        {/* Designation */}
        <Field
          id="ob-designation"
          label="Your Designation / Role"
          required
          error={fieldError("ob-designation")}
        >
          <TextInput
            id="ob-designation"
            type="text"
            value={form.designation}
            onChange={(e) => patch({ designation: e.target.value })}
            placeholder={isFirm ? "Director / Managing Partner" : "DSA Partner / Financial Consultant"}
            invalid={Boolean(fieldError("ob-designation"))}
          />
        </Field>

        {/* GST Section */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <ChoiceGroup
            label="Is your business registered for GST?"
            value={form.isGstRegistered}
            options={["No", "Yes"] as const}
            onChange={(next) => patch({ isGstRegistered: next })}
            descriptions={{
              No: "I don't have an active GST registration",
              Yes: "I have an active GST registration",
            }}
          />

          {form.isGstRegistered === "Yes" && (
            <div className="space-y-2 pt-1 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label htmlFor="ob-gstin" className="text-xs sm:text-sm font-semibold text-slate-800">
                  GSTIN <span className="text-rose-500">*</span>
                </label>
                {form.gstValid && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={13} /> GST Verified
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  id="ob-gstin"
                  type="text"
                  maxLength={15}
                  value={form.gstin}
                  onChange={(e) => patch({ gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABAV8504E1ZJ"
                  className="flex-1 h-11 sm:h-12 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  disabled={gstVerifying || !gstFormatOk}
                  onClick={() => void verifyGst()}
                  className="h-11 sm:h-12 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {gstVerifying ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin text-indigo-600" /> Verifying…
                    </span>
                  ) : (
                    "Verify GST"
                  )}
                </button>
              </div>

              {fieldError("ob-gstin") && (
                <p className="text-xs text-rose-500">{fieldError("ob-gstin")}</p>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── CARD 3: Contact & Office Address ── */}
      <SectionCard
        title="Contact & Office Address"
        hint="Where you operate from. This address will be printed on your partner MOU."
      >
        <FieldGrid>
          <Field
            id="ob-alternateMobile"
            label="Alternate Mobile"
            optional
            error={fieldError("ob-alternateMobile")}
          >
            <PrefixedInput
              prefix="+91"
              id="ob-alternateMobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.alternateMobile}
              onChange={(e) =>
                patch({ alternateMobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              placeholder="10-digit mobile number"
            />
          </Field>

          <Field
            id="ob-pinCode"
            label="PIN Code"
            required
            error={fieldError("ob-pinCode")}
            aside={
              pincodeLoading ? (
                <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                  <Loader2 size={12} className="animate-spin" /> Looking up…
                </span>
              ) : undefined
            }
          >
            <input
              id="ob-pinCode"
              inputMode="numeric"
              maxLength={6}
              value={form.pinCode}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, "").slice(0, 6)
                patch({ pinCode: clean })
                if (clean.length === 6) void lookupPincode(clean)
              }}
              placeholder="431001"
              className="w-full h-11 sm:h-12 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
            />
          </Field>

          <Field id="ob-area" label="Area / Locality" optional>
            {pincodeAreas.length > 1 ? (
              <div className="relative">
                <select
                  id="ob-area"
                  value={form.area}
                  onChange={(e) => patch({ area: e.target.value })}
                  className="w-full h-11 sm:h-12 px-3.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="">Select locality</option>
                  {pincodeAreas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            ) : (
              <TextInput
                id="ob-area"
                type="text"
                value={form.area}
                onChange={(e) => patch({ area: e.target.value })}
                placeholder="Locality or landmark"
              />
            )}
          </Field>

          <Full>
            <Field
              id="ob-addressLine1"
              label="Address Line 1"
              required
              error={fieldError("ob-addressLine1")}
            >
              <TextInput
                id="ob-addressLine1"
                type="text"
                value={form.addressLine1}
                onChange={(e) => patch({ addressLine1: e.target.value })}
                placeholder="Shop/Office number, building name, street"
                invalid={Boolean(fieldError("ob-addressLine1"))}
              />
            </Field>
          </Full>

          <Field id="ob-city" label="City" required error={fieldError("ob-city")}>
            <TextInput
              id="ob-city"
              type="text"
              value={form.city}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder="City"
              invalid={Boolean(fieldError("ob-city"))}
            />
          </Field>

          <Field id="ob-stateName" label="State" required error={fieldError("ob-stateName")}>
            <TextInput
              id="ob-stateName"
              type="text"
              value={form.stateName}
              onChange={(e) => patch({ stateName: e.target.value })}
              placeholder="State"
              invalid={Boolean(fieldError("ob-stateName"))}
            />
          </Field>
        </FieldGrid>

        {pincodeNote && <Callout tone="warn">{pincodeNote}</Callout>}
      </SectionCard>

      {/* ── Firm Type Clean Bottom Sheet / Modal (Requirement 17) ── */}
      {firmTypeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-100 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Select Firm Type</h3>
              <button
                type="button"
                onClick={() => setFirmTypeModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {FIRM_TYPES.map((ft) => {
                const selected = form.firmType === ft
                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => {
                      patch({ firmType: ft })
                      setFirmTypeModalOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between py-3.5 px-2 text-left text-sm font-semibold transition-colors cursor-pointer",
                      selected
                        ? "text-indigo-600 bg-indigo-50/50 rounded-xl px-3"
                        : "text-slate-800 hover:bg-slate-50 rounded-xl px-3"
                    )}
                  >
                    <span>{ft}</span>
                    {selected ? (
                      <Check size={16} className="stroke-[2.5] text-indigo-600" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Mobile Action CTA Bar ── */}
      <StepNav
        onContinue={() => void saveAndContinue()}
        loading={saving}
        continueLabel="Continue"
      />
    </div>
  )
}
