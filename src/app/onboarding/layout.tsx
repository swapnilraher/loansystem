import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DSA Partner Onboarding | Techstar Money Solution",
  description: "Become a certified DSA Loan Partner with Techstar Money Solution. Instant digital onboarding, access to 50+ banks, and 24-hour disbursal payouts.",
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
