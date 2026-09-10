"use client"

import React from "react"
import { Building2, User } from "lucide-react"

import { useOnboarding } from "../OnboardingContext"
import { ChoiceGroup, Callout, Field, FieldGrid, Full, Section, StepHeading, StepNav, TextInput } from "../ui"

/**
 * Step 1 — who is applying.
 *
 * Entity type comes first because it changes what every later step asks for: an
 * individual DSA never sees a firm name or a designation dropdown, and a firm
 * is asked for a contact person. Deciding it here keeps the branch in one place
 * instead of scattering "if Firm" across eight screens.
 */
export function Step1BasicInfo() {
  const { form, patch, fieldError, invalidField, saving, saveAndContinue, mobileNumber } = useOnboarding()
  const isFirm = form.partnerType === "Firm"

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 1 of 8"
        title="Basic information"
        description="Tell us who is applying. This is the name your partner agreement and commission payouts will carry."
      />

      <Section title="Applicant type" hint="You can change this later, but it decides what we ask for next.">
        <ChoiceGroup
          label="I am applying as"
          value={form.partnerType}
          options={["Individual", "Firm"] as const}
          onChange={next => patch({ partnerType: next })}
          descriptions={{
            Individual: "Sole DSA in your own name",
            Firm: "Proprietorship, LLP or company",
          }}
        />
        <div className="flex items-center gap-2 rounded-admin border border-admin-border bg-admin-surface-2 px-3 py-2 text-admin-2xs text-admin-muted">
          {isFirm ? <Building2 size={14} className="shrink-0 text-brand" /> : <User size={14} className="shrink-0 text-brand" />}
          <span>
            {isFirm
              ? "We will ask for your firm's registered name, GST status and an authorised contact person."
              : "We will ask for your PAN, Aadhaar and a bank account in your own name."}
          </span>
        </div>
      </Section>

      <Section title="Your details" hint="Exactly as printed on your PAN card — mismatches are the most common reason an application is held up.">
        <FieldGrid>
          <Full>
            <Field
              id="ob-fullName"
              label="Full name (as per PAN)"
              required
              error={fieldError("ob-fullName")}
              hint="Include middle names if your PAN card has them."
            >
              <TextInput
                id="ob-fullName"
                value={form.fullName}
                onChange={e => patch({ fullName: e.target.value })}
                placeholder="Rahul Sudhir Patil"
                autoComplete="name"
                invalid={invalidField === "ob-fullName"}
              />
            </Field>
          </Full>

          <Field
            id="ob-email"
            label="Email address"
            required
            hint="Your partner ID and agreement copy are sent here."
            error={fieldError("ob-email")}
          >
            <TextInput
              id="ob-email"
              type="email"
              value={form.email}
              onChange={e => patch({ email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
              invalid={invalidField === "ob-email"}
            />
          </Field>

          <Field id="ob-verifiedMobile" label="Mobile number" hint="Verified on WhatsApp. Change it from the header.">
            <TextInput id="ob-verifiedMobile" value={`+91 ${mobileNumber}`} readOnly className="admin-num" />
          </Field>

          <Full>
            <Field
              id="ob-referredByDsaCode"
              label="Referral code"
              optional
              hint="If an existing Techstar partner introduced you, enter their DSA code."
            >
              <TextInput
                id="ob-referredByDsaCode"
                value={form.referredByDsaCode}
                onChange={e => patch({ referredByDsaCode: e.target.value.toUpperCase() })}
                placeholder="TSM-DSA-XXXXXX"
                className="admin-num uppercase"
              />
            </Field>
          </Full>
        </FieldGrid>
      </Section>

      <Callout tone="info" title="Why we ask">
        Everything on this page is checked against your PAN during review. Getting the spelling right now is the
        difference between approval in a day and a call from our desk.
      </Callout>

      <StepNav onContinue={() => void saveAndContinue()} loading={saving} />
    </div>
  )
}
