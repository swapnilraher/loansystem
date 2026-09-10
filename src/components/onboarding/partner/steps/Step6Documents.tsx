"use client"

import React, { useState } from "react"

import ImageCropModal from "@/components/onboarding/ImageCropModal"

import { useOnboarding } from "../OnboardingContext"
import { docHref, type DocKey } from "../types"
import { Callout, CheckRow, Section, StepHeading, StepNav, UploadTile } from "../ui"

const DOC_LABELS: Record<DocKey, string> = {
  panDoc: "PAN card",
  aadhaarFrontDoc: "Aadhaar — front",
  aadhaarBackDoc: "Aadhaar — back",
  chequeDoc: "Cancelled cheque or passbook",
  gstDoc: "GST certificate",
}

/**
 * Step 6 — the files that go into the lender pack.
 *
 * Every slot is its own tile with its own state, so one failed upload never
 * takes the others with it and a partner on a slow connection can see exactly
 * which of five files is still missing.
 */
export function Step6Documents() {
  const {
    form,
    patch,
    saving,
    saveAndContinue,
    back,
    uploadDoc,
    removeDoc,
    retryUpload,
    uploadProgress,
    uploadFailed,
    uploadingDoc,
    setStepError,
  } = useOnboarding()

  /** Which slot the crop dialog is currently picking a file for. */
  const [picking, setPicking] = useState<DocKey | null>(null)

  const slot = (key: DocKey) => {
    const doc = form.documents[key]
    return {
      fileName: doc?.fileName,
      fileSize: doc?.sizeBytes,
      href: docHref(doc),
      progress: uploadProgress[key],
      failed: uploadFailed === key,
      uploading: uploadingDoc === key,
      onPick: (file: File) => void uploadDoc(key, file),
      onOpenPicker: () => setPicking(key),
      onRetry: () => retryUpload(key),
      onRemove: () => removeDoc(key),
      onReject: (reason: string) => setStepError(reason, "validation"),
      disabled: Boolean(uploadingDoc),
    }
  }

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 6 of 8"
        title="Document upload"
        description="Clear photos are fine — all four corners visible, nothing cropped, text readable."
      />

      <Section title="Identity proof" hint="Required. These are matched against the PAN and Aadhaar you entered in step 4.">
        <div className="grid gap-3 sm:grid-cols-2">
          <UploadTile id="ob-doc-panDoc" label={DOC_LABELS.panDoc} hint="Front of the card" required {...slot("panDoc")} />
          <UploadTile
            id="ob-doc-aadhaarFrontDoc"
            label={DOC_LABELS.aadhaarFrontDoc}
            hint="The side with your photo"
            required
            {...slot("aadhaarFrontDoc")}
          />
          {!form.aadhaarCombined && (
            <UploadTile
              id="ob-doc-aadhaarBackDoc"
              label={DOC_LABELS.aadhaarBackDoc}
              hint="The side with your address"
              required
              {...slot("aadhaarBackDoc")}
            />
          )}
        </div>

        <CheckRow
          id="ob-aadhaarCombined"
          checked={form.aadhaarCombined}
          onChange={next => {
            const documents = { ...form.documents }
            // Ticking the box points the back slot at the same file; unticking
            // empties it again so the step asks for the missing side rather
            // than silently accepting a front-only scan.
            if (next) documents.aadhaarBackDoc = documents.aadhaarFrontDoc
            else delete documents.aadhaarBackDoc
            patch({ aadhaarCombined: next, documents })
          }}
        >
          Both sides of my Aadhaar are on one file (a two-page PDF, or a single scan showing front and back).
        </CheckRow>
      </Section>

      <Section title="Supporting documents" hint="Not required to submit, but they save a round trip during review.">
        <div className="grid gap-3 sm:grid-cols-2">
          <UploadTile
            id="ob-doc-chequeDoc"
            label={DOC_LABELS.chequeDoc}
            hint="Confirms the payout account"
            {...slot("chequeDoc")}
          />
          {form.isGstRegistered === "Yes" && (
            <UploadTile
              id="ob-doc-gstDoc"
              label={DOC_LABELS.gstDoc}
              hint="Required because you declared GST registration"
              required
              {...slot("gstDoc")}
            />
          )}
        </div>
      </Section>

      <Callout tone="info" title="What happens to these">
        Documents are stored against your application only, shared with a lender when you submit a file, and never used
        for anything else. You can replace any of them until the application is submitted.
      </Callout>

      <StepNav onBack={back} onContinue={() => void saveAndContinue()} loading={saving} />

      <ImageCropModal
        isOpen={picking !== null}
        title={picking ? `Upload ${DOC_LABELS[picking]}` : "Upload document"}
        onClose={() => setPicking(null)}
        onReject={reason => setStepError(reason, "validation")}
        onConfirm={file => {
          const key = picking
          setPicking(null)
          if (key) void uploadDoc(key, file)
        }}
      />
    </div>
  )
}
