import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Partner Login | Techstar Money Solution",
  description: "Access your Techstar Money Solution partner account.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function PartnerLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
