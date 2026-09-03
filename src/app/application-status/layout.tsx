import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Application Status | Techstar Money Solution",
  description: "Check your partner application status.",
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

export default function ApplicationStatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
