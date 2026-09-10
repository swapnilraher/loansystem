"use client"

import React from "react"
import { Loader2 } from "lucide-react"

import { useOnboarding } from "../OnboardingContext"
import {
  Callout,
  Field,
  FieldGrid,
  Full,
  PrefixedInput,
  SelectInput,
  Section,
  StepHeading,
  StepNav,
  TextInput,
} from "../ui"

/**
 * Step 3 — where we reach you, and where you work from.
 *
 * PIN code is asked before the rest of the address on purpose: a valid one
 * fills in city, district and state, so the partner types six digits instead of
 * three fields, and the values we file with lenders come from India Post rather
 * than from a typo.
 */
export function Step3ContactAddress() {
  const {
    form,
    patch,
    fieldError,
    invalidField,
    saving,
    saveAndContinue,
    back,
    lookupPincode,
    pincodeLoading,
    pincodeAreas,
    pincodeNote,
  } = useOnboarding()

  const isFirm = form.partnerType === "Firm"

  return (
    <div className="space-y-5">
      <StepHeading
        eyebrow="Step 3 of 8"
        title="Contact & address"
        description="How our operations desk reaches you, and the address that goes on your partner agreement."
      />

      <Section
        title="Contact person"
        hint={isFirm ? "The person our desk will call about files and payouts." : "Pre-filled from step 1 — change it if you go by a different name."}
      >
        <FieldGrid>
          <Field id="ob-contactPersonName" label="Contact person name" required error={fieldError("ob-contactPersonName")}>
            <TextInput
              id="ob-contactPersonName"
              value={form.contactPersonName || (isFirm ? "" : form.fullName)}
              onChange={e => patch({ contactPersonName: e.target.value })}
              placeholder={isFirm ? "Authorised signatory's name" : form.fullName || "Your name"}
              autoComplete="name"
              invalid={invalidField === "ob-contactPersonName"}
            />
          </Field>

          <Field
            id="ob-alternateMobile"
            label="Alternate mobile"
            optional
            error={fieldError("ob-alternateMobile")}
            hint="Used only if your primary number is unreachable."
          >
            <PrefixedInput
              prefix="+91"
              id="ob-alternateMobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.alternateMobile}
              onChange={e => patch({ alternateMobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit mobile number"
              invalid={invalidField === "ob-alternateMobile"}
            />
          </Field>
        </FieldGrid>
      </Section>

      <Section title="Office address" hint="Where you operate from. This appears on your MOU.">
        <FieldGrid>
          <Field
            id="ob-pinCode"
            label="PIN code"
            required
            error={fieldError("ob-pinCode")}
            hint="City and state fill in automatically."
            aside={pincodeLoading ? <Loader2 size={13} className="animate-spin text-brand" /> : undefined}
          >
            <TextInput
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
              autoComplete="postal-code"
              className="admin-num"
              invalid={invalidField === "ob-pinCode"}
            />
          </Field>

          <Field id="ob-area" label="Area / locality" optional>
            {pincodeAreas.length > 1 ? (
              <SelectInput id="ob-area" value={form.area} onChange={e => patch({ area: e.target.value })}>
                <option value="">Select your locality</option>
                {pincodeAreas.map(area => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </SelectInput>
            ) : (
              <TextInput
                id="ob-area"
                value={form.area}
                onChange={e => patch({ area: e.target.value })}
                placeholder="Locality or landmark"
              />
            )}
          </Field>

          <Full>
            <Field id="ob-addressLine1" label="Address line 1" required error={fieldError("ob-addressLine1")}>
              <TextInput
                id="ob-addressLine1"
                value={form.addressLine1}
                onChange={e => patch({ addressLine1: e.target.value })}
                placeholder="Shop / office number, building, street"
                autoComplete="address-line1"
                invalid={invalidField === "ob-addressLine1"}
              />
            </Field>
          </Full>

          <Full>
            <Field id="ob-addressLine2" label="Address line 2" optional>
              <TextInput
                id="ob-addressLine2"
                value={form.addressLine2}
                onChange={e => patch({ addressLine2: e.target.value })}
                placeholder="Road, area"
                autoComplete="address-line2"
              />
            </Field>
          </Full>

          <Field id="ob-city" label="City" required error={fieldError("ob-city")}>
            <TextInput
              id="ob-city"
              value={form.city}
              onChange={e => patch({ city: e.target.value })}
              placeholder="Chhatrapati Sambhajinagar"
              autoComplete="address-level2"
              invalid={invalidField === "ob-city"}
            />
          </Field>

          <Field id="ob-district" label="District" optional>
            <TextInput id="ob-district" value={form.district} onChange={e => patch({ district: e.target.value })} />
          </Field>

          <Full>
            <Field id="ob-stateName" label="State" required error={fieldError("ob-stateName")}>
              <TextInput
                id="ob-stateName"
                value={form.stateName}
                onChange={e => patch({ stateName: e.target.value })}
                placeholder="Maharashtra"
                autoComplete="address-level1"
                invalid={invalidField === "ob-stateName"}
              />
            </Field>
          </Full>
        </FieldGrid>

        {pincodeNote && <Callout tone="warn">{pincodeNote}</Callout>}
      </Section>

      <StepNav onBack={back} onContinue={() => void saveAndContinue()} loading={saving} />
    </div>
  )
}
