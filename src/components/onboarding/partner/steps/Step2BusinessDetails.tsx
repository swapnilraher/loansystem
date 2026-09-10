"use client"

import React from "react"

import { GSTIN_RE } from "@/lib/onboarding-steps"

import { useOnboarding } from "../OnboardingContext"
import { FIRM_TYPES } from "../types"
import {
  Callout,
  ChoiceGroup,
  Field,
  FieldGrid,
  Full,
  InlineAction,
  Section,
  StepHeading,
  StepNav,
  TextInput,
  VerifyPill,
} from "../ui"

/**
 * Step 2 — the business behind the application.
 *
 * Short for an individual on purpose: an individual DSA has a role and a GST
 * answer and nothing else, and padding the step out with fields that do not
 * apply would be worse than a step that takes twenty seconds.
 */
export function Step2BusinessDetails() {
  const { form, patch, fieldError, invalidField, saving, saveAndContinue, back, verifyGst, gstVerifying } =
    useOnboarding()

  const isFirm = form.partnerType === "Firm"
  const gstin = form.gstin.trim().toUpperCase()
  const gstFormatOk = GSTIN_RE.test(gstin)
  const details = form.gstDetails as Record<string, string> | null

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 2 of 8"
        title="Business details"
        description={
          isFirm
            ? "Your firm as it appears on its registration certificate, and its GST status."
            : "Your role and GST status. Two questions, and this step is done."
        }
      />

      {isFirm && (
        <Section title="Entity" hint="The name here must match your incorporation or registration certificate.">
          <ChoiceGroup
            label="Constitution"
            value={form.firmType}
            options={FIRM_TYPES}
            onChange={next => patch({ firmType: next })}
            columns={5}
          />
          <FieldGrid>
            <Full>
              <Field
                id="ob-businessName"
                label="Registered business name"
                required
                error={fieldError("ob-businessName")}
                hint="Trade name if you have one, otherwise the legal name."
              >
                <TextInput
                  id="ob-businessName"
                  value={form.businessName}
                  onChange={e => patch({ businessName: e.target.value })}
                  placeholder="Patil Financial Services LLP"
                  autoComplete="organization"
                  invalid={invalidField === "ob-businessName"}
                />
              </Field>
            </Full>
          </FieldGrid>
        </Section>
      )}

      <Section
        title="Your role"
        hint={isFirm ? "Who signs on behalf of the firm." : "Filled in for you — change it if it does not fit."}
      >
        <FieldGrid>
          <Full>
            <Field id="ob-designation" label="Designation" required error={fieldError("ob-designation")}>
              <TextInput
                id="ob-designation"
                value={form.designation}
                onChange={e => patch({ designation: e.target.value })}
                placeholder={isFirm ? "Director" : "Individual"}
                autoComplete="organization-title"
                invalid={invalidField === "ob-designation"}
              />
            </Field>
          </Full>
        </FieldGrid>
      </Section>

      <Section
        title="GST registration"
        hint="Registered partners can raise a tax invoice for their commission. It is not required to become a partner."
      >
        <ChoiceGroup
          label="Are you registered under GST?"
          value={form.isGstRegistered}
          options={["Yes", "No"] as const}
          onChange={next => patch({ isGstRegistered: next, gstValid: next === "Yes" ? form.gstValid : false })}
        />

        {form.isGstRegistered === "Yes" && (
          <FieldGrid>
            <Full>
              <Field
                id="ob-gstin"
                label="GSTIN"
                required
                error={fieldError("ob-gstin")}
                hint="15 characters, starting with your state code."
                aside={
                  form.gstValid ? (
                    <VerifyPill state="verified" />
                  ) : (
                    <InlineAction onClick={() => void verifyGst()} loading={gstVerifying} disabled={!gstFormatOk}>
                      Verify GSTIN
                    </InlineAction>
                  )
                }
              >
                <TextInput
                  id="ob-gstin"
                  value={form.gstin}
                  onChange={e => patch({ gstin: e.target.value.toUpperCase().slice(0, 15), gstValid: false, gstDetails: null })}
                  placeholder="27ABCDE1234F1Z5"
                  maxLength={15}
                  className="admin-num uppercase"
                  invalid={invalidField === "ob-gstin"}
                />
              </Field>
            </Full>
          </FieldGrid>
        )}

        {form.isGstRegistered === "Yes" && form.gstValid && details && (
          <Callout tone="success" title={details.tradeName || details.legalName || "GSTIN verified"}>
            <span className="block">{details.legalName}</span>
            {details.address && <span className="block opacity-90">{details.address}</span>}
            <span className="block opacity-90">
              {details.constitution}
              {details.status ? ` · ${details.status}` : ""}
            </span>
          </Callout>
        )}
      </Section>

      <StepNav onBack={back} onContinue={() => void saveAndContinue()} loading={saving} />
    </div>
  )
}
