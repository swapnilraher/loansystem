"use client"

import React, { useState } from "react"
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react"

import { AADHAAR_RE, PAN_RE } from "@/lib/onboarding-steps"

import { useOnboarding } from "../OnboardingContext"
import { dobBounds } from "../net"
import {
  Callout,
  ChoiceGroup,
  Field,
  FieldGrid,
  Full,
  InlineAction,
  Section,
  SelectInput,
  StepHeading,
  StepNav,
  TextInput,
  VerifyPill,
} from "../ui"

/**
 * Step 4 — proving the person is who they say they are.
 *
 * PAN is mandatory: it is the identifier the whole partner record is keyed to
 * downstream, and a duplicate PAN is a hard stop. Aadhaar is offered rather
 * than demanded — a partner who prefers not to run an OTP check here can still
 * finish by uploading their card in step 6, and forcing the check would strand
 * anyone whose Aadhaar-linked mobile is not the one in their hand.
 */
export function Step4Kyc() {
  const {
    form,
    patch,
    fieldError,
    invalidField,
    saving,
    saveAndContinue,
    back,
    verifyPan,
    panVerifying,
    panNote,
    aadhaarOtpSent,
    aadhaarSending,
    aadhaarVerifying,
    sendAadhaarOtp,
    verifyAadhaarOtp,
    cancelAadhaarOtp,
    startDigilocker,
    digilockerLoading,
  } = useOnboarding()

  const [aadhaarNumber, setAadhaarNumber] = useState("")
  const [aadhaarOtp, setAadhaarOtp] = useState("")
  const { min, max } = dobBounds()

  const panFormatOk = PAN_RE.test(form.panNumber.trim().toUpperCase())

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 4 of 8"
        title="KYC verification"
        description="A PAN and a date of birth we can check, plus an optional Aadhaar confirmation that speeds up approval."
      />

      <Section
        title="PAN"
        hint="Checked against the income-tax department, and against every other partner on our books."
      >
        <FieldGrid>
          <Field
            id="ob-panNumber"
            label="PAN number"
            required
            error={fieldError("ob-panNumber")}
            hint="Five letters, four digits, one letter."
            aside={
              form.panVerified ? (
                <VerifyPill state="verified" />
              ) : (
                <InlineAction onClick={() => void verifyPan()} loading={panVerifying} disabled={!panFormatOk}>
                  Verify PAN
                </InlineAction>
              )
            }
          >
            <TextInput
              id="ob-panNumber"
              value={form.panNumber}
              onChange={e => patch({ panNumber: e.target.value.toUpperCase().slice(0, 10), panVerified: false })}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="admin-num uppercase"
              invalid={invalidField === "ob-panNumber"}
            />
          </Field>

          <Field
            id="ob-dob"
            label="Date of birth"
            required
            error={fieldError("ob-dob")}
            hint="A DSA partner must be between 18 and 80."
          >
            <TextInput
              id="ob-dob"
              type="date"
              min={min}
              max={max}
              value={form.dob}
              onChange={e => patch({ dob: e.target.value, panVerified: false })}
              autoComplete="bday"
              invalid={invalidField === "ob-dob"}
            />
          </Field>

          <Full>
            <Field id="ob-gender" label="Gender" required>
              <SelectInput id="ob-gender" value={form.gender} onChange={e => patch({ gender: e.target.value as typeof form.gender })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </SelectInput>
            </Field>
          </Full>
        </FieldGrid>

        {panNote && <Callout tone={form.panVerified ? "success" : "warn"}>{panNote}</Callout>}
      </Section>

      <Section
        title="Aadhaar"
        hint="Optional, but a verified Aadhaar usually turns a two-day review into a same-day one."
        action={form.aadhaarVerified ? <VerifyPill state="verified" /> : undefined}
      >
        {form.aadhaarVerified ? (
          <Callout tone="success" title="Aadhaar verified">
            Confirmed for the card ending <strong className="admin-num">{form.aadhaarLast4}</strong>
            {form.aadhaarName ? ` in the name of ${form.aadhaarName}` : ""}. We store only these last four digits.
          </Callout>
        ) : (
          <>
            <ChoiceGroup
              label="How would you like to verify?"
              value={form.docUploadMethod}
              options={["manual", "digilocker"] as const}
              onChange={next => patch({ docUploadMethod: next })}
              descriptions={{
                manual: "Aadhaar OTP, here on this page",
                digilocker: "Pull documents from DigiLocker",
              }}
            />

            {form.docUploadMethod === "digilocker" ? (
              <div className="space-y-3">
                <Callout tone="info" title="You will leave this page briefly">
                  DigiLocker signs you in with your own credentials and hands us the issued copies of your Aadhaar and
                  PAN. You come straight back here afterwards.
                </Callout>
                <button
                  type="button"
                  onClick={() => void startDigilocker()}
                  disabled={digilockerLoading}
                  className="admin-focus flex h-11 w-full items-center justify-center gap-2 rounded-admin border border-brand bg-brand-soft text-admin-sm font-bold text-brand-soft-fg transition-colors hover:bg-brand-ring disabled:opacity-50 sm:w-auto sm:px-5"
                >
                  {digilockerLoading ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
                  Continue with DigiLocker
                </button>
              </div>
            ) : !aadhaarOtpSent ? (
              <FieldGrid>
                <Full>
                  <Field
                    id="ob-aadhaarNumber"
                    label="Aadhaar number"
                    optional
                    error={fieldError("ob-aadhaarNumber")}
                    hint="We send a one-time code to the mobile linked with it. Only the last four digits are ever stored."
                    aside={
                      <InlineAction
                        onClick={() => void sendAadhaarOtp(aadhaarNumber)}
                        loading={aadhaarSending}
                        disabled={!AADHAAR_RE.test(aadhaarNumber.replace(/\D/g, ""))}
                      >
                        Send OTP
                      </InlineAction>
                    }
                  >
                    <TextInput
                      id="ob-aadhaarNumber"
                      inputMode="numeric"
                      maxLength={14}
                      value={aadhaarNumber}
                      onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      placeholder="12-digit Aadhaar number"
                      className="admin-num"
                      invalid={invalidField === "ob-aadhaarNumber"}
                    />
                  </Field>
                </Full>
              </FieldGrid>
            ) : (
              <FieldGrid>
                <Full>
                  <Field
                    id="ob-aadhaarOtp"
                    label="Aadhaar OTP"
                    hint="Sent to the mobile number registered with your Aadhaar."
                    aside={
                      <InlineAction onClick={cancelAadhaarOtp} disabled={aadhaarVerifying}>
                        Use a different number
                      </InlineAction>
                    }
                  >
                    <div className="flex gap-2">
                      <TextInput
                        id="ob-aadhaarOtp"
                        inputMode="numeric"
                        maxLength={6}
                        value={aadhaarOtp}
                        onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit code"
                        className="admin-num"
                      />
                      <button
                        type="button"
                        onClick={() => void verifyAadhaarOtp(aadhaarOtp)}
                        disabled={aadhaarVerifying || aadhaarOtp.length < 6}
                        className="admin-focus inline-flex h-11 shrink-0 items-center gap-1.5 rounded-admin bg-brand px-4 text-admin-xs font-bold text-brand-fg hover:bg-brand-hover disabled:opacity-50"
                      >
                        {aadhaarVerifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Verify
                      </button>
                    </div>
                  </Field>
                </Full>
              </FieldGrid>
            )}
          </>
        )}
      </Section>

      <StepNav onBack={back} onContinue={() => void saveAndContinue()} loading={saving} />
    </div>
  )
}
