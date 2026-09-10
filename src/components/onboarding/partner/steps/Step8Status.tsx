"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { useOnboarding } from "../OnboardingContext"
import { Callout, Section, StepHeading } from "../ui"

/**
 * Step 8 — what happens now.
 *
 * Not a form: the application has left the partner's hands and the only useful
 * things left are the reference number, an honest account of where it is, and a
 * way to reach a human. The three outcomes get three different screens because
 * "under review", "approved" and "not approved" have three different next
 * actions, and one screen with a swapped colour would bury that.
 */
export function Step8Status() {
  const { applicationId, mobileNumber, outcome, application, refreshStatus, refreshingStatus, resetMobile } =
    useOnboarding()

  const [copied, setCopied] = useState(false)

  const look = {
    under_review: {
      Icon: ShieldCheck,
      tone: "border-tone-info-bd bg-tone-info text-tone-info-fg",
      badge: "Submitted & locked",
      BadgeIcon: Lock,
      heading: "Your application is under review",
      marathi: "तुमचा DSA Partner अर्ज यशस्वीरित्या सबमिट झालेला असून तो सुरक्षिततेसाठी लॉक करण्यात आला आहे.",
      note: "Our partner operations desk is checking your KYC and bank details. Most applications are decided within one working day, and every update arrives on WhatsApp.",
    },
    approved: {
      Icon: CheckCircle2,
      tone: "border-tone-success-bd bg-tone-success text-tone-success-fg",
      badge: "Approved",
      BadgeIcon: CheckCircle2,
      heading: "You are a Techstar Money partner",
      marathi: "तुमचा DSA Partner अर्ज मंजूर झाला आहे. आता तुम्ही partner portal मध्ये लॉगिन करू शकता.",
      note: "Sign in to the partner portal to start submitting files and tracking your commission.",
    },
    rejected: {
      Icon: AlertTriangle,
      tone: "border-tone-danger-bd bg-tone-danger text-tone-danger-fg",
      badge: "Not approved",
      BadgeIcon: AlertTriangle,
      heading: "This application was not approved",
      marathi: "तुमचा अर्ज सध्या मंजूर होऊ शकला नाही. कृपया आमच्या partner desk शी संपर्क साधा.",
      note: "Our desk can tell you exactly what fell short and whether you can reapply.",
    },
  }[outcome]

  const stages = [
    { label: "Application submitted", done: true },
    { label: "KYC & document check", done: outcome !== "under_review" },
    { label: "Bank account verification", done: outcome === "approved" },
    { label: "Partner account activated", done: outcome === "approved" },
  ]

  const timeline: { title?: string; description?: string; timestamp?: string }[] = Array.isArray(application?.timeline)
    ? application!.timeline
    : []

  const copyId = () => {
    if (!applicationId) return
    void navigator.clipboard.writeText(applicationId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      <StepHeading eyebrow="Step 8 of 8" title="Approval status" description="Where your application has got to." />

      <section className="space-y-4 rounded-admin-lg border border-admin-border bg-admin-surface p-5 text-center shadow-admin-2 sm:p-7">
        <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full border", look.tone)}>
          <look.Icon size={32} />
        </div>

        <div className="space-y-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-admin-2xs font-bold uppercase tracking-widest",
              look.tone
            )}
          >
            <look.BadgeIcon size={12} /> {look.badge}
          </span>
          <h2 className="text-admin-2xl font-black tracking-tight text-admin-text">{look.heading}</h2>
          <p className="mx-auto max-w-xl text-admin-sm font-semibold text-admin-text">{look.marathi}</p>
          <p className="mx-auto max-w-xl text-admin-xs leading-relaxed text-admin-muted">{look.note}</p>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-admin-lg border border-admin-border bg-admin-surface-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="block text-admin-2xs font-bold uppercase tracking-wide text-admin-subtle">
              Application reference
            </span>
            <span className="admin-num block truncate font-mono text-admin-xl font-black text-admin-text">
              {applicationId || "—"}
            </span>
            <span className="admin-num block text-admin-2xs text-admin-muted">
              Updates go to WhatsApp +91 {mobileNumber}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={copyId}
              className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin border border-admin-border-strong bg-admin-surface px-3.5 text-admin-xs font-bold text-admin-text hover:bg-admin-surface-2"
            >
              <Check size={14} className={cn("transition-opacity", copied ? "opacity-100" : "hidden")} />
              <Copy size={14} className={cn(copied && "hidden")} />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={refreshingStatus}
              className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin border border-admin-border-strong bg-admin-surface px-3.5 text-admin-xs font-bold text-admin-text hover:bg-admin-surface-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(refreshingStatus && "animate-spin")} />
              Refresh
            </button>
            {outcome === "rejected" ? (
              <a
                href="tel:09579005645"
                className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin bg-brand px-4 text-admin-xs font-bold text-brand-fg hover:bg-brand-hover"
              >
                <Phone size={14} /> Call partner desk
              </a>
            ) : (
              <Link
                href={outcome === "approved" ? "/partner/login" : `/application-status?id=${applicationId ?? ""}`}
                className="admin-focus inline-flex h-10 items-center gap-1.5 rounded-admin bg-brand px-4 text-admin-xs font-bold text-brand-fg hover:bg-brand-hover"
              >
                {outcome === "approved" ? "Go to partner login" : "Track live"} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <Section title="What happens next" hint="Each stage is confirmed on WhatsApp as it completes.">
        <ol className="relative space-y-0.5">
          {stages.map((stage, index) => (
            <li key={stage.label} className="relative flex items-start gap-3 py-1.5">
              {index < stages.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[13px] top-9 h-[calc(100%-1.5rem)] w-px",
                    stage.done ? "bg-tone-success-bd" : "bg-admin-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "admin-num relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-admin-2xs font-bold",
                  stage.done
                    ? "border-tone-success-bd bg-tone-success text-tone-success-fg"
                    : "border-admin-border bg-admin-surface text-admin-subtle"
                )}
              >
                {stage.done ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  "pt-1 text-admin-xs font-semibold",
                  stage.done ? "text-admin-text" : "text-admin-subtle"
                )}
              >
                {stage.label}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {timeline.length > 0 && (
        <Section title="Activity" hint="Everything recorded against this application so far.">
          <ul className="space-y-2.5">
            {timeline
              .slice()
              .reverse()
              .map((entry, index) => (
                <li key={`${entry.timestamp ?? index}`} className="rounded-admin border border-admin-border bg-admin-surface-2 px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-admin-xs font-bold text-admin-text">{entry.title || "Update"}</span>
                    {entry.timestamp && (
                      <span className="admin-num shrink-0 text-admin-2xs text-admin-subtle">
                        {new Date(entry.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                  {entry.description && <p className="mt-0.5 text-admin-2xs text-admin-muted">{entry.description}</p>}
                </li>
              ))}
          </ul>
        </Section>
      )}

      {outcome === "under_review" && (
        <Callout tone="info" title="Nothing more to do">
          You do not need to keep this page open. We message you on WhatsApp the moment a decision is made, and you can
          come back to the tracker any time with your reference number.
        </Callout>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border pt-4">
        <button
          type="button"
          onClick={resetMobile}
          className="admin-focus text-admin-xs font-bold text-admin-muted hover:text-admin-text"
        >
          ← Onboard another account
        </button>
        <a
          href={`https://wa.me/919579005645?text=${encodeURIComponent(
            `Hello Techstar Money, my DSA application ID is ${applicationId ?? ""}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-focus inline-flex items-center gap-1.5 text-admin-xs font-bold text-tone-success-fg hover:brightness-95"
        >
          <MessageSquare size={14} /> WhatsApp support
        </a>
      </div>
    </div>
  )
}
