"use client"

import React, { useEffect, useRef } from "react"
import Link from "next/link"
import { Loader2, Send } from "lucide-react"

import PartnerAgreementModal from "@/components/partner/PartnerAgreementModal"
import { PARTNER_ONBOARDING_STEPS, type PartnerStepId } from "@/lib/onboarding-steps"

import { useOnboarding } from "../OnboardingContext"

import { Callout, CheckRow, Fact, ReviewCard, Section, StepHeading } from "../ui"

/**
 * Step 7 — the last chance to change anything.
 *
 * Every card is the answers from one earlier step with an Edit link straight
 * back to it, so a wrong digit is three taps from fixed rather than a reason to
 * abandon. Submission is deliberately the only thing on this screen that is not
 * reversible, and it says so.
 */
export function Step7Review() {
  const {
    form,
    patch,
    mobileNumber,
    stepDone,
    goToStep,
    back,
    submitApplication,
    submitting,
    invalidField,
  } = useOnboarding()

  /*
   * An agreement can already be signed when this screen first opens — a partner
   * resuming a draft, or one whose previous application was reset while the
   * signature (which lives in its own `partner_agreements` collection) stayed
   * behind. PartnerAgreementModal discovers that on its own and renders the
   * executed banner, but it only fires `onSigned` for a signature made in front
   * of it, so without this the review screen showed "Executed & Recorded" and
   * then refused to submit for want of a signature.
   */
  const agreementSynced = useRef(false)
  useEffect(() => {
    if (agreementSynced.current || !mobileNumber || form.agreementSigned) return
    agreementSynced.current = true
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/partner/agreement/sign?mobile=${encodeURIComponent(mobileNumber)}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data?.exists || !data.agreement?.agreementSigned) return
        patch({
          agreementSigned: true,
          agreementPdfUrl: data.agreement.agreementDocumentUrl || null,
        })
      } catch (err) {
        // Non-fatal: the banner is driven by the modal's own lookup, and an
        // unsigned-looking form just asks for a signature that is cheap to give.
        console.warn("[onboarding] agreement status lookup failed", err)
      }
    })()
    return () => {
      cancelled = true
    }
    // `patch` is re-created every render, so the ref is what makes this run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileNumber, form.agreementSigned])

  const isFirm = form.partnerType === "Firm"
  const edit = (id: PartnerStepId) => () => goToStep(id)
  const title = (id: PartnerStepId) => `${id}. ${PARTNER_ONBOARDING_STEPS[id - 1].title}`
  const docName = (key: keyof typeof form.documents) => form.documents[key]?.fileName

  const ready = form.agreementSigned && form.declareTruth && form.declareTerms

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 7 of 8"
        title="Review & confirm"
        description="Check every line. Once you submit, the application locks for review and can only be changed by our desk."
      />

      <div className="space-y-3">
        <ReviewCard step={1} title={title(1)} onEdit={edit(1)} complete={stepDone[1]}>
          <Fact label="Applying as" value={form.partnerType} />
          <Fact label="Full name" value={form.fullName} />
          <Fact label="Email" value={form.email} />
          <Fact label="Mobile" value={`+91 ${mobileNumber}`} mono />
          {form.referredByDsaCode ? <Fact label="Referred by" value={form.referredByDsaCode} mono /> : null}
        </ReviewCard>

        <ReviewCard step={2} title={title(2)} onEdit={edit(2)} complete={stepDone[2]}>
          {isFirm ? <Fact label="Constitution" value={form.firmType} /> : null}
          {isFirm ? <Fact label="Business name" value={form.businessName} /> : null}
          <Fact label="Designation" value={form.designation} />
          <Fact label="GST registered" value={form.isGstRegistered} />
          {form.isGstRegistered === "Yes" ? (
            <Fact label="GSTIN" value={form.gstValid ? `${form.gstin} · verified` : form.gstin} mono />
          ) : null}
        </ReviewCard>

        <ReviewCard step={3} title={title(3)} onEdit={edit(3)} complete={stepDone[3]}>
          <Fact label="Contact person" value={form.contactPersonName || form.fullName} />
          {form.alternateMobile ? <Fact label="Alternate mobile" value={`+91 ${form.alternateMobile}`} mono /> : null}
          <Fact
            label="Address"
            value={[form.addressLine1, form.addressLine2, form.area].filter(Boolean).join(", ")}
          />
          <Fact label="City & state" value={[form.city, form.stateName].filter(Boolean).join(", ")} />
          <Fact label="PIN code" value={form.pinCode} mono />
        </ReviewCard>

        <ReviewCard step={4} title={title(4)} onEdit={edit(4)} complete={stepDone[4]}>
          <Fact label="PAN" value={form.panVerified ? `${form.panNumber} · verified` : form.panNumber} mono />
          <Fact label="Date of birth" value={form.dob} mono />
          <Fact label="Gender" value={form.gender} />
          <Fact
            label="Aadhaar"
            value={form.aadhaarVerified ? `Verified · ends ${form.aadhaarLast4}` : "Not verified"}
          />
        </ReviewCard>

        <ReviewCard step={5} title={title(5)} onEdit={edit(5)} complete={stepDone[5]}>
          <Fact label="Account holder" value={form.accountHolderName} />
          <Fact
            label="Account number"
            // Masked here on purpose: this screen is the one a partner is most
            // likely to be looking at with someone else in the room.
            value={form.accountNumber ? `••••••${form.accountNumber.slice(-4)}` : ""}
            mono
          />
          <Fact label="IFSC" value={form.ifsc} mono />
          <Fact label="Bank" value={[form.bankName, form.branchName].filter(Boolean).join(" — ")} />
          <Fact label="Type" value={`${form.accountType}${form.bankVerified ? " · verified" : ""}`} />
        </ReviewCard>

        <ReviewCard step={6} title={title(6)} onEdit={edit(6)} complete={stepDone[6]}>
          <Fact label="PAN card" value={docName("panDoc")} />
          <Fact label="Aadhaar front" value={docName("aadhaarFrontDoc")} />
          <Fact label="Aadhaar back" value={form.aadhaarCombined ? "Same file as front" : docName("aadhaarBackDoc")} />
          <Fact label="Cancelled cheque" value={docName("chequeDoc")} />
          {form.isGstRegistered === "Yes" ? <Fact label="GST certificate" value={docName("gstDoc")} /> : null}
        </ReviewCard>
      </div>

      <Section title="Partner agreement (MOU)" hint="Signed with a one-time code sent to your verified WhatsApp number.">
        <div id="ob-agreement" tabIndex={-1} className="admin-focus rounded-admin">
          <PartnerAgreementModal
            partnerData={{
              mobileNumber,
              email: form.email,
              fullName: form.fullName || form.contactPersonName,
              agreementSigned: form.agreementSigned,
            }}
            onSigned={() => patch({ agreementSigned: true })}
          />
        </div>
      </Section>

      <Section title="Declarations" hint="Both are required. They form part of the record we file.">
        <div id="ob-declarations" tabIndex={-1} className="admin-focus space-y-2.5 rounded-admin">
          <CheckRow id="ob-declareTruth" checked={form.declareTruth} onChange={next => patch({ declareTruth: next })}>
            I confirm that every detail and document in this application is true, complete and my own, and I understand
            that a false declaration can end my partnership and any commission owed under it.
          </CheckRow>
          <CheckRow id="ob-declareTerms" checked={form.declareTerms} onChange={next => patch({ declareTerms: next })}>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="font-bold underline underline-offset-2">
              partner terms and conditions
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" target="_blank" className="font-bold underline underline-offset-2">
              privacy policy
            </Link>
            , and I authorise Techstar Money Solution to verify my KYC and bank details with the relevant authorities.
          </CheckRow>
        </div>
        {invalidField === "ob-declarations" || invalidField === "ob-agreement" ? (
          <Callout tone="danger">
            {invalidField === "ob-agreement"
              ? "Sign the partner MOU above before submitting."
              : "Tick both confirmations above before submitting."}
          </Callout>
        ) : null}
      </Section>

      <div
        className={
          "sticky bottom-0 z-20 -mx-3.5 flex flex-col gap-3 border-t border-admin-border bg-admin-surface px-3.5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-admin-lg sm:border sm:px-4 sm:pb-3 sm:shadow-admin-1"
        }
      >
        <button
          type="button"
          onClick={back}
          className="admin-focus inline-flex h-11 items-center justify-center gap-1.5 rounded-admin border border-admin-border bg-admin-surface px-3.5 text-admin-xs font-bold text-admin-muted transition-colors hover:bg-admin-surface-2 hover:text-admin-text"
        >
          Back to documents
        </button>
        <button
          type="button"
          onClick={() => void submitApplication()}
          disabled={submitting}
          className="admin-focus inline-flex h-12 items-center justify-center gap-2 rounded-admin bg-brand px-6 text-admin-sm font-bold text-brand-fg shadow-admin-2 transition-all hover:bg-brand-hover disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </div>

      {!ready && (
        <p className="text-center text-admin-2xs text-admin-subtle">
          Still to do: sign the MOU and tick both declarations.
        </p>
      )}
    </div>
  )
}
