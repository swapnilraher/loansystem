"use client"

import React from "react"
import { Landmark, Loader2 } from "lucide-react"

import { IFSC_RE } from "@/lib/onboarding-steps"

import { useOnboarding } from "../OnboardingContext"
import {
  Callout,
  ChoiceGroup,
  Field,
  FieldGrid,
  Full,
  Section,
  StepHeading,
  StepNav,
  TextInput,
  VerifyPill,
} from "../ui"

/**
 * Step 5 — the account commission is paid into.
 *
 * The account number is typed twice and cannot be pasted into the second field,
 * because this is the one place on the form where a single wrong digit means
 * money lands in a stranger's account and nobody notices until the partner asks
 * where their first payout went.
 */
export function Step5BankDetails() {
  const {
    form,
    patch,
    fieldError,
    invalidField,
    saving,
    saveAndContinue,
    back,
    lookupIfsc,
    ifscLoading,
    ifscValid,
    ifscNote,
    verifyBank,
    bankVerifying,
  } = useOnboarding()

  const canVerify =
    /^\d{6,20}$/.test(form.accountNumber.trim()) &&
    form.accountNumber.trim() === form.confirmAccountNumber.trim() &&
    IFSC_RE.test(form.ifsc.trim().toUpperCase())

  const score = form.bankMatchScore
  const weakMatch = form.bankVerified && typeof score === "number" && score < 70

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 5 of 8"
        title="Bank account"
        description="Where your commission lands. It must be an account in the name of the applicant on this form."
      />

      <Section
        title="Payout account"
        hint="Take these from a cheque leaf or your bank's passbook rather than from memory."
        action={form.bankVerified ? <VerifyPill state="verified" /> : undefined}
      >
        <FieldGrid>
          <Field
            id="ob-ifsc"
            label="IFSC code"
            required
            error={fieldError("ob-ifsc")}
            hint="Bank and branch fill in automatically."
            aside={ifscLoading ? <Loader2 size={13} className="animate-spin text-brand" /> : undefined}
          >
            <TextInput
              id="ob-ifsc"
              value={form.ifsc}
              onChange={e => {
                const clean = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11)
                patch({ ifsc: clean, bankVerified: false })
                if (clean.length === 11) void lookupIfsc(clean)
              }}
              placeholder="SBIN0001234"
              maxLength={11}
              className="admin-num uppercase"
              invalid={invalidField === "ob-ifsc"}
            />
          </Field>

          <div className="space-y-1.5">
            <ChoiceGroup
              label="Account type"
              value={form.accountType}
              options={["Savings", "Current"] as const}
              onChange={next => patch({ accountType: next })}
            />
            <div className="min-h-4" />
          </div>

          <Field
            id="ob-accountNumber"
            label="Account number"
            required
            error={fieldError("ob-accountNumber")}
            hint="Digits only, exactly as your bank shows it."
          >
            <TextInput
              id="ob-accountNumber"
              inputMode="numeric"
              value={form.accountNumber}
              onChange={e => patch({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 20), bankVerified: false })}
              placeholder="Account number"
              className="admin-num"
              autoComplete="off"
              invalid={invalidField === "ob-accountNumber"}
            />
          </Field>

          <Field
            id="ob-confirmAccountNumber"
            label="Confirm account number"
            required
            error={fieldError("ob-confirmAccountNumber")}
            hint="Type it again rather than pasting."
          >
            <TextInput
              id="ob-confirmAccountNumber"
              inputMode="numeric"
              value={form.confirmAccountNumber}
              onChange={e => patch({ confirmAccountNumber: e.target.value.replace(/\D/g, "").slice(0, 20) })}
              onPaste={e => e.preventDefault()}
              placeholder="Re-enter account number"
              className="admin-num"
              autoComplete="off"
              invalid={invalidField === "ob-confirmAccountNumber"}
            />
          </Field>

          <Field id="ob-bankName" label="Bank" hint="From the IFSC directory.">
            <TextInput id="ob-bankName" value={form.bankName} readOnly placeholder="Fills in from IFSC" />
          </Field>

          <Field id="ob-branchName" label="Branch" hint="From the IFSC directory.">
            <TextInput id="ob-branchName" value={form.branchName} readOnly placeholder="Fills in from IFSC" />
          </Field>

          <Full>
            <Field
              id="ob-accountHolderName"
              label="Account holder name"
              required
              error={fieldError("ob-accountHolderName")}
              hint="Exactly as your bank has it — this is replaced by the verified name if the check succeeds."
            >
              <TextInput
                id="ob-accountHolderName"
                value={form.accountHolderName}
                onChange={e => patch({ accountHolderName: e.target.value, bankVerified: false })}
                placeholder="Name on the account"
                invalid={invalidField === "ob-accountHolderName"}
              />
            </Field>
          </Full>
        </FieldGrid>

        {ifscNote && !ifscValid && <Callout tone="warn">{ifscNote}</Callout>}

        {!form.bankVerified ? (
          <div className="flex flex-col gap-2 rounded-admin border border-admin-border bg-admin-surface-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-admin-xs text-admin-muted">
              <Landmark size={15} className="mt-px shrink-0 text-brand" />
              <span>
                We can confirm this account with a zero-rupee test transfer and read back the name your bank has on file.
              </span>
            </div>
            <button
              type="button"
              onClick={() => void verifyBank()}
              disabled={!canVerify || bankVerifying}
              className="admin-focus inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-admin border border-brand bg-brand-soft px-4 text-admin-xs font-bold text-brand-soft-fg hover:bg-brand-ring disabled:opacity-50"
            >
              {bankVerifying && <Loader2 size={14} className="animate-spin" />}
              Verify account
            </button>
          </div>
        ) : weakMatch ? (
          <Callout tone="warn" title="The name on the account does not closely match your application">
            Your bank returned <strong>{form.accountHolderName}</strong>
            {typeof score === "number" ? ` (${score}% match)` : ""}. You can continue, but our desk will ask about the
            difference before approving payouts.
          </Callout>
        ) : (
          <Callout tone="success" title="Account verified">
            Your bank confirmed this account belongs to <strong>{form.accountHolderName}</strong>.
          </Callout>
        )}
      </Section>

      <StepNav onBack={back} onContinue={() => void saveAndContinue()} loading={saving} />
    </div>
  )
}
