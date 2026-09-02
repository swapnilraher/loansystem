"use client"

import React from "react"
import { ShieldCheck } from "lucide-react"

export default function PartnerLoading() {
  return (
    <div className="partner-root relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-admin-bg px-6 text-center">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full bg-admin-accent/20 blur-3xl animate-blob motion-reduce:animate-none"
      />
      <span
        aria-hidden
        style={{ animationDelay: "2.5s" }}
        className="pointer-events-none absolute -bottom-28 -right-16 w-96 h-96 rounded-full bg-admin-accent/10 blur-3xl animate-blob motion-reduce:animate-none"
      />

      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            style={{ animationDuration: "18s", animationDirection: "reverse" }}
            className="absolute w-36 h-36 rounded-full border border-admin-border animate-spin motion-reduce:animate-none"
          />

          <span
            aria-hidden
            style={{
              animationDuration: "2.6s",
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--admin-accent) 300deg, transparent 356deg)",
              WebkitMaskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
              maskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            }}
            className="absolute w-28 h-28 rounded-full animate-spin motion-reduce:animate-none"
          />

          <span
            aria-hidden
            className="absolute w-20 h-20 rounded-full bg-admin-accent/25 blur-xl"
          />

          <span className="relative w-18 h-18 rounded-admin-lg overflow-hidden border border-admin-border bg-admin-surface shadow-admin-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.webp" alt="" className="w-full h-full object-cover" />
          </span>
        </div>

        <h1 className="admin-splash-sheen text-admin-2xl font-semibold tracking-tight mt-8">
          Techstar Money Solution
        </h1>
        <p className="text-admin-2xs font-medium uppercase tracking-[0.25em] text-admin-subtle mt-2">
          DSA Partner Portal
        </p>

        <span
          aria-hidden
          className="relative mt-7 h-0.5 w-44 overflow-hidden rounded-full bg-admin-border"
        >
          <span className="admin-splash-rail absolute inset-y-0 left-0 w-1/3 rounded-full bg-admin-accent" />
        </span>

        <p className="flex items-center gap-2 text-admin-sm font-medium text-admin-muted mt-5">
          <ShieldCheck size={15} className="text-admin-accent shrink-0" />
          Loading partner workspace…
        </p>
      </div>
    </div>
  )
}
