"use client"

/**
 * DSA partner onboarding.
 *
 * The whole flow is a client component: it is a multi-step form with a resumed
 * draft, live field verification and file uploads, so there is nothing here a
 * server render could usefully do first. The state lives in
 * `OnboardingProvider` and the eight steps live beside it — this file is only
 * the route.
 */

import { OnboardingProvider } from "@/components/onboarding/partner/OnboardingContext"
import { OnboardingShell } from "@/components/onboarding/partner/OnboardingShell"

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingShell />
    </OnboardingProvider>
  )
}
