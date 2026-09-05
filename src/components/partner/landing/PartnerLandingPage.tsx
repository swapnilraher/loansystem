"use client"

import React from "react"
import Link from "next/link"

import { PartnerPortalHeader } from "@/components/layout/PartnerPortalShell"
import { cn } from "@/lib/utils"
import {
  ShieldCheck,
  ArrowRight,
  Phone,
  CheckCircle2,
  Building2,
  Users,
  Briefcase,
  FileText,
  Star,
  CreditCard,
  Home,
  TrendingUp,
  Layers,
  Percent,
  ChevronRight,
  Sparkles,
  MapPin,
  Headphones,
  LogIn,
  UserPlus,
  Zap,
  Lock,
  MessageCircle,
  Clock,
  Award,
  Wallet,
} from "lucide-react"

// ── Corporate Credentials ───────────────────────────────────────────────────
const BRAND = {
  name: "Techstar Money Solution",
  legalName: "TECHSTAR MONEY SOLUTION PRIVATE LIMITED",
  cin: "U66190MR2026PTC478675",
  rating: "5.0 ★ Google Reviews",
  category: "Loan Agency",
  locationShort: "Chhatrapati Sambhajinagar, Maharashtra",
  address:
    "Office No 18, Morya Pride, Mayur Park, Mhasoba Nagar, Harsul, Chhatrapati Sambhajinagar, Maharashtra 411008",
  phone: "095790 05645",
  phoneRaw: "09579005645",
  phoneIntl: "+919579005645",
  whatsappText: encodeURIComponent(
    "Hello Techstar Money Solution, I want to become a Loan DSA Partner. Please guide me with the onboarding process."
  ),
}

// ── JSON-LD Structured Data Schema (Homepage Only) ──────────────────────────
const SCHEMA_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FinancialService",
      "@id": "https://partner.techstarsolution.in/#financialservice",
      name: "Techstar Money Solution",
      legalName: "TECHSTAR MONEY SOLUTION PRIVATE LIMITED",
      url: "https://partner.techstarsolution.in/",
      logo: "https://partner.techstarsolution.in/img/logo.webp",
      image: "https://partner.techstarsolution.in/partners.png",
      description:
        "Techstar Money Solution Pvt. Ltd. is a trusted financial services company providing loan DSA partnerships across Personal Loan, Business Loan, Home Loan, Loan Against Property, Working Capital and Balance Transfer.",
      telephone: BRAND.phoneIntl,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Office No 18, Morya Pride, Mayur Park, Mhasoba Nagar, Harsul",
        addressLocality: "Chhatrapati Sambhajinagar",
        addressRegion: "Maharashtra",
        postalCode: "411008",
        addressCountry: "IN",
      },
      identifier: { "@type": "PropertyValue", name: "CIN", value: BRAND.cin },
    },
    {
      "@type": "Organization",
      "@id": "https://partner.techstarsolution.in/#organization",
      name: "Techstar Money Solution",
      legalName: "TECHSTAR MONEY SOLUTION PRIVATE LIMITED",
      url: "https://partner.techstarsolution.in/",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: BRAND.phoneIntl,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "hi", "mr"],
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Office No 18, Morya Pride, Mayur Park, Mhasoba Nagar, Harsul",
        addressLocality: "Chhatrapati Sambhajinagar",
        addressRegion: "Maharashtra",
        postalCode: "411008",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://partner.techstarsolution.in/#website",
      url: "https://partner.techstarsolution.in/",
      name: "Techstar Money Solution | Loan DSA Partner",
      publisher: { "@id": "https://partner.techstarsolution.in/#organization" },
    },
  ],
}

// ── Loan Products ───────────────────────────────────────────────────────────
const LOAN_PRODUCTS = [
  {
    id: "personal-loan",
    name: "Personal Loan",
    category: "Personal Loan DSA",
    desc: "Instant personal loan solutions for salaried & self-employed individuals with fast bank approvals.",
    icon: CreditCard,
    tone: "bg-brand-soft text-brand-soft-fg border-brand-line",
  },
  {
    id: "business-loan",
    name: "Business Loan",
    category: "Business Loan DSA",
    desc: "Collateral-free commercial credit tailored for MSME expansion, stock purchase, and growth.",
    icon: Briefcase,
    tone: "bg-tone-info text-tone-info-fg border-tone-info-bd",
  },
  {
    id: "home-loan",
    name: "Home Loan",
    category: "Home Loan DSA",
    desc: "Affordable housing finance from reputed PSU and private banks with minimal processing fees.",
    icon: Home,
    tone: "bg-tone-success text-tone-success-fg border-tone-success-bd",
  },
  {
    id: "lap",
    name: "Loan Against Property",
    category: "LAP DSA",
    desc: "High-ticket mortgage loans against residential, commercial, or industrial properties.",
    icon: Building2,
    tone: "bg-tone-warn text-tone-warn-fg border-tone-warn-bd",
  },
  {
    id: "working-capital",
    name: "Working Capital & CC/OD",
    category: "Working Capital DSA",
    desc: "Overdraft, cash credit lines, and machinery funding to keep daily business liquidity smooth.",
    icon: TrendingUp,
    tone: "bg-tone-violet text-tone-violet-fg border-tone-violet-bd",
  },
  {
    id: "balance-transfer",
    name: "Balance Transfer",
    category: "Balance Transfer DSA",
    desc: "Switch existing high-interest loans to lower ROI institutions to reduce monthly EMI drastically.",
    icon: Percent,
    tone: "bg-tone-cyan text-tone-cyan-fg border-tone-cyan-bd",
  },
]

// ── Partner Benefits ────────────────────────────────────────────────────────
const PARTNER_BENEFITS = [
  {
    title: "50+ Banks & NBFC Ties",
    desc: "Tie-ups with SBI, HDFC, ICICI, Axis, Bajaj Finserv, Tata Capital, and 45+ premier institutions.",
    icon: Building2,
  },
  {
    title: "Maximum Commission Payout",
    desc: "Earn the highest market payout slabs with fast, transparent direct bank transfers.",
    icon: Wallet,
  },
  {
    title: "Zero Registration Fee",
    desc: "100% free digital onboarding. No deposit, no hidden charges, no royalty cuts.",
    icon: Zap,
  },
  {
    title: "Dedicated Relationship Manager",
    desc: "Personal assistance for customer credit checks, document collection, and login sanctioning.",
    icon: Headphones,
  },
  {
    title: "Real-Time CRM Portal",
    desc: "Track every lead stage: login, credit check, valuation, sanction, and disbursal live.",
    icon: Sparkles,
  },
  {
    title: "Chhatrapati Sambhajinagar HQ",
    desc: "Direct local operational office support across Maharashtra for fast file resolution.",
    icon: MapPin,
  },
]

// ── Why Choose Us ───────────────────────────────────────────────────────────
const WHY_CHOOSE = [
  { title: "Wide Loan Range", desc: "Retail loans, commercial credit, mortgages, and balance transfers under one roof.", icon: Layers },
  { title: "Express 24-48 Hr Sanction", desc: "Fast documentation login system ensuring speedy bank approvals.", icon: Clock },
  { title: "Documentation Support", desc: "End-to-end guidance to prepare compliant file dossiers and avoid re-queries.", icon: FileText },
  { title: "Transparent Tracking", desc: "Zero hidden policies. Complete status visibility directly from your dashboard.", icon: ShieldCheck },
  { title: "MCA Registered Entity", desc: "Fully registered private limited company operating under Indian corporate laws.", icon: Lock },
  { title: "High DSA Growth", desc: "Proven system enabling connectors, tax consultants, and agents to earn consistent income.", icon: TrendingUp },
]

// ── Layout Rhythm ───────────────────────────────────────────────
/** One container width for every section, so the left edge never jumps. */
const SHELL = "mx-auto w-full max-w-7xl px-4 sm:px-6"
/** One vertical rhythm for every section. */
const SECTION = "py-12 md:py-16"

// ── Hero Data ───────────────────────────────────────────────────
const HERO_HIGHLIGHTS = [
  { icon: Building2, title: "50+ Banks & NBFCs", sub: "HDFC, SBI, ICICI, Bajaj", tone: "bg-brand-soft text-brand-soft-fg" },
  { icon: Wallet, title: "Highest Payout", sub: "Direct Bank Credit", tone: "bg-tone-success text-tone-success-fg" },
  { icon: Zap, title: "Zero Fee / Free", sub: "100% Free DSA Code", tone: "bg-tone-warn text-tone-warn-fg" },
  { icon: Sparkles, title: "Live CRM Portal", sub: "Track Customer Files", tone: "bg-tone-info text-tone-info-fg" },
]

const HERO_PRODUCT_CHIPS = [
  "💰 Personal Loan",
  "🏢 Business Loan",
  "🏠 Home Loan",
  "🏗️ LAP Mortgage",
  "🔄 Balance Transfer",
  "🚜 Working Capital",
]

const HERO_FORM_FIELDS = [
  { name: "name", label: "Full Name", type: "text", placeholder: "Please enter your name", maxLength: undefined as number | undefined },
  { name: "phone", label: "Contact Number", type: "tel", placeholder: "Please enter your contact number", maxLength: 10 },
  { name: "email", label: "Email", type: "email", placeholder: "Please enter your email", maxLength: undefined as number | undefined },
]

// ── Section Nav ─────────────────────────────────────────────────
const NAV_LINKS = [
  { href: "#about", label: "About Us" },
  { href: "#loan-products", label: "Loan Products" },
  { href: "#dsa-partnership", label: "DSA Benefits" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#contact", label: "Contact" },
]

const FOOTER_NAV = [
  { href: "#", label: "Home", internal: false },
  { href: "#about", label: "About Company", internal: false },
  { href: "#loan-products", label: "Loan Products", internal: false },
  { href: "#dsa-partnership", label: "DSA Benefits", internal: false },
  { href: "/onboarding", label: "Become a Partner", internal: true },
  { href: "/partner/login", label: "Partner Login", internal: true },
]

// ── Quick Actions ───────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: UserPlus, label: "Become a DSA", sub: "Free digital onboarding", href: "/onboarding", tone: "bg-brand-soft text-brand-soft-fg border-brand-line" },
  { icon: LogIn, label: "Partner Login", sub: "Access your dashboard", href: "/partner/login", tone: "bg-tone-neutral text-tone-neutral-fg border-tone-neutral-bd" },
  { icon: CreditCard, label: "Loan Products", sub: "View product slabs", href: "#loan-products", tone: "bg-tone-success text-tone-success-fg border-tone-success-bd" },
  { icon: Phone, label: "Call Office", sub: BRAND.phone, href: `tel:${BRAND.phoneRaw}`, tone: "bg-tone-warn text-tone-warn-fg border-tone-warn-bd" },
]

// ── About Points ────────────────────────────────────────────────
const ABOUT_POINTS = [
  { icon: CheckCircle2, title: "Direct Bank Codes", desc: "Access direct banking agreements with nationalized and private lenders." },
  { icon: FileText, title: "Document Verification", desc: "Expert operations desk helps sanitize client files for immediate approval." },
  { icon: Layers, title: "Multi-Loan Solutions", desc: "Offer retail loans, working capital, property mortgages, and machinery funding." },
  { icon: Users, title: "Customer-Centric", desc: "Match borrowers with lowest interest rates based on CIBIL and profile." },
  { icon: Headphones, title: "Direct Desk Support", desc: "Direct phone and WhatsApp assistance from experienced loan underwriters." },
]

/**
 * One heading pattern for every section: eyebrow pill, h2, optional lead.
 * Keeps the h1 -> h2 -> h3 hierarchy the page is indexed on intact.
 */
function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
      <span className="mb-3 inline-flex items-center rounded-full border border-brand-line bg-brand-soft px-3 py-1.5 text-admin-xs font-bold uppercase tracking-widest text-brand-soft-fg">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-extrabold tracking-tight text-admin-text md:text-3xl">
        {title}
      </h2>
      {children ? (
        <p className="mt-3 text-base font-medium leading-relaxed text-admin-muted">
          {children}
        </p>
      ) : null}
    </div>
  )
}

// ── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  { step: "01", title: "Online Registration", desc: "Enter your mobile number and basic business details in 2 minutes." },
  { step: "02", title: "Instant Verification", desc: "Quick Aadhaar & PAN verification to generate your authorized DSA Code." },
  { step: "03", title: "Submit Customer Leads", desc: "Upload client files directly via portal or share your custom referral link." },
  { step: "04", title: "Disbursal & Payout", desc: "Bank disburses the loan and commission gets credited directly to your bank account." },
]

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PartnerLandingPage() {
  return (
    <div className="partner-root min-h-dvh scroll-smooth bg-admin-bg font-sans text-admin-text motion-reduce:scroll-auto">
      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_DATA) }} />

      {/* ── TOP ANNOUNCEMENT STRIP ────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 border-b border-brand-strong bg-brand px-4 py-1.5 text-center text-admin-xs font-semibold text-brand-fg">
        <ShieldCheck size={14} className="hidden shrink-0 sm:block" />
        <span>
          <strong>TECHSTAR MONEY SOLUTION PRIVATE LIMITED</strong> · CIN: {BRAND.cin} · Chhatrapati Sambhajinagar
        </span>
      </div>

      {/* ── STICKY NAV — the portal's one header ──────────────────────────── */}
      <PartnerPortalHeader
        subtitle="Loan DSA Partner Portal"
        navLinks={NAV_LINKS}
        cta={{ href: "/onboarding", label: "Become a Partner" }}
      />

      {/* ── HIGH-IMPACT HERO SECTION (IMMEDIATE CLARITY FOR MOBILE & DESKTOP) ── */}
      <section className="relative overflow-hidden border-b border-admin-border bg-[linear-gradient(180deg,var(--brand-ring)_0%,var(--admin-surface)_100%)] pt-6 pb-10 md:pt-12 md:pb-16">
        {/* Decorative only: a soft brand glow so the hero is not a flat band. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,var(--brand-line)_0%,transparent_65%)] opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,var(--brand-ring)_0%,transparent_70%)]"
        />
        <div className={cn(SHELL, "relative z-[1]")}>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7">
              {/* Top Highlights Strip on Mobile & Desktop */}
              <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-fg shadow-admin-1">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Official Loan DSA Portal</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-tone-warn-bd bg-tone-warn px-3 py-1.5 text-xs font-bold text-tone-warn-fg shadow-admin-1">
                  <Star size={13} className="shrink-0 fill-current" />
                  <span>5.0 ★ Google Rating</span>
                </span>
                <span className="hidden items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-bold text-admin-muted shadow-admin-1 sm:inline-flex">
                  <ShieldCheck size={14} className="shrink-0 text-tone-success-fg" />
                  <span>CIN: {BRAND.cin}</span>
                </span>
              </div>

              {/* H1 Headline — Immediately tells users what this page is! */}
              <h1 className="mb-3 text-[clamp(1.75rem,4vw+0.5rem,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-admin-text md:mb-4">
                Become an Authorized <br className="hidden md:block" />
                <span className="bg-[linear-gradient(90deg,var(--brand-strong),var(--brand-bright))] bg-clip-text text-transparent">
                  Loan DSA Partner
                </span>
              </h1>

              {/* Regional & High-Converting Subheadline (Marathi + English) */}
              <div className="mb-4 flex items-center gap-2.5 rounded-admin border border-brand-line bg-brand-soft p-3 text-brand-soft-fg">
                <Award size={20} className="shrink-0" />
                <p className="m-0 text-sm font-bold leading-snug">
                  कमवा दरमहा ₹50,000+ पर्यंत कमिशन पेआउट · Earn Highest Commission Across 50+ Leading Banks &amp; NBFCs
                </p>
              </div>

              <p className="mb-5 hidden text-base font-medium leading-relaxed text-admin-muted sm:block md:mb-6">
                Join <strong className="font-bold text-admin-text">Techstar Money Solution Private Limited</strong> as an independent loan partner. Connect customers with Personal, Business, Home, LAP, and Working Capital loans in Chhatrapati Sambhajinagar and Maharashtra.
              </p>

              {/* ── 4-POINT INSTANT VALUE CARDS (2x2 GRID ON MOBILE) ── */}
              <ul className="mb-5 grid list-none grid-cols-2 gap-2.5 p-0 md:mb-6">
                {HERO_HIGHLIGHTS.map(({ icon: Icon, title, sub, tone }) => (
                  <li
                    key={title}
                    className="flex items-center gap-2.5 rounded-admin border border-admin-border bg-admin-surface p-2.5 shadow-admin-1 transition-all motion-reduce:transition-none hover:border-brand-ring hover:shadow-admin-2 motion-safe:hover:-translate-y-0.5"
                  >
                    <span className={cn("flex shrink-0 items-center justify-center rounded-admin-sm p-1.5", tone)}>
                      <Icon size={18} />
                    </span>
                    <span className="block min-w-0">
                      <span className="block text-sm font-extrabold leading-tight text-admin-text">{title}</span>
                      <span className="block truncate text-xs text-admin-subtle">{sub}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* ── BIG CALL TO ACTION BUTTONS (MOBILE FIRST) ── */}
              <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
                {/* Primary — the one action this page is asking for */}
                <Link
                  href="/onboarding"
                  className="admin-focus inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-admin bg-brand px-5 py-3 text-base font-extrabold text-brand-fg no-underline shadow-admin-2 transition-all motion-reduce:transition-none hover:bg-brand-hover hover:shadow-admin-3 motion-safe:hover:-translate-y-0.5"
                >
                  <span>🚀 Register as DSA Partner (फ्री नोंदणी)</span>
                  <ArrowRight size={18} className="shrink-0" />
                </Link>

                {/* Secondary — deliberately unfilled so the primary stays the only filled CTA */}
                <div className="flex gap-2.5">
                  <a
                    href={`https://wa.me/91${BRAND.phoneRaw}?text=${BRAND.whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-focus inline-flex min-h-[52px] flex-1 items-center justify-center gap-1.5 rounded-admin border border-tone-success-bd bg-tone-success px-4 py-3 whitespace-nowrap text-sm font-bold text-tone-success-fg no-underline transition-colors motion-reduce:transition-none hover:border-tone-success-fg"
                  >
                    <MessageCircle size={18} className="shrink-0" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${BRAND.phoneRaw}`}
                    className="admin-focus inline-flex min-h-[52px] flex-1 items-center justify-center gap-1.5 rounded-admin border border-admin-border bg-admin-surface px-4 py-3 whitespace-nowrap text-sm font-bold text-admin-muted no-underline transition-colors motion-reduce:transition-none hover:border-brand-ring hover:text-brand"
                  >
                    <Phone size={17} className="shrink-0" />
                    <span>Call Support</span>
                  </a>
                </div>
              </div>

              {/* Quick Loan Types Strip */}
              <div className="border-t border-admin-border pt-4">
                <p className="mb-2 text-admin-xs font-bold uppercase tracking-widest text-admin-subtle">
                  Products Available for DSA Sourcing:
                </p>
                <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                  {HERO_PRODUCT_CHIPS.map((p) => (
                    <li key={p}>
                      <span className="inline-flex items-center rounded-full border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-bold text-admin-muted shadow-admin-1">
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: High-Converting Callback Card */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-admin-lg border border-admin-border bg-admin-surface p-5 shadow-admin-3 md:p-6">
                <div className="mb-4">
                  <h2 className="mb-1 text-xl font-extrabold tracking-tight text-admin-text">
                    Grow Your Business with Techstar Money!
                  </h2>
                  <p className="m-0 text-sm text-admin-subtle">
                    Highest Commission Payouts. 50+ Banks. Real Results.
                  </p>
                </div>

                <div className="border-t border-admin-border pt-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const form = e.currentTarget
                      const phoneInput = form.elements.namedItem("phone") as HTMLInputElement
                      const clean = phoneInput?.value ? phoneInput.value.replace(/\D/g, "") : ""
                      window.location.href = clean ? `/onboarding?mobile=${clean}` : "/onboarding"
                    }}
                  >
                    {HERO_FORM_FIELDS.map(({ name, label, type, placeholder, maxLength }) => (
                      <div key={name} className="mb-3">
                        <label
                          htmlFor={`hero-${name}`}
                          className="mb-1 block text-xs font-bold text-admin-muted"
                        >
                          {label} <span className="text-tone-danger-fg">*</span>
                        </label>
                        <input
                          id={`hero-${name}`}
                          type={type}
                          name={name}
                          required
                          maxLength={maxLength}
                          placeholder={placeholder}
                          className="admin-focus block min-h-[44px] w-full rounded-admin-sm border border-admin-border bg-admin-surface px-3 py-2.5 text-sm text-admin-text transition-colors motion-reduce:transition-none placeholder:text-admin-subtle hover:border-brand-ring"
                        />
                      </div>
                    ))}

                    <button
                      type="submit"
                      className="admin-focus flex min-h-[48px] w-full items-center justify-center gap-2 rounded-admin bg-brand px-4 py-3 text-sm font-bold text-brand-fg shadow-admin-1 transition-colors motion-reduce:transition-none hover:bg-brand-hover"
                    >
                      <span>Request a Callback &amp; Register</span>
                      <ArrowRight size={15} className="shrink-0" />
                    </button>

                    <p className="m-0 pt-3 text-center text-xs text-admin-subtle">
                      🔒 100% Free DSA Registration • Verified Bank Payouts
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACTION CARDS ────────────────────────────────────────────── */}
      <section className="border-b border-admin-border bg-admin-surface py-6">
        <div className={SHELL}>
          <ul className="grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, sub, href, tone }) => {
              const Comp = href.startsWith("#") || href.startsWith("tel:") ? "a" : Link
              return (
                <li key={label}>
                  {/* @ts-expect-error polymorphic href */}
                  <Comp
                    href={href}
                    className="admin-focus flex h-full items-center gap-2.5 rounded-admin border border-admin-border bg-admin-surface p-3 no-underline shadow-admin-1 transition-all motion-reduce:transition-none hover:border-brand-ring hover:shadow-admin-2 motion-safe:hover:-translate-y-0.5"
                  >
                    <span className={cn("flex shrink-0 items-center justify-center rounded-admin-sm border p-2", tone)}>
                      <Icon size={18} />
                    </span>
                    <span className="block min-w-0">
                      <span className="block truncate text-sm font-bold text-admin-text">{label}</span>
                      <span className="block truncate text-xs text-admin-subtle">{sub}</span>
                    </span>
                  </Comp>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── ABOUT TECHSTAR MONEY SOLUTION ─────────────────────────────────── */}
      <section id="about" className={cn(SECTION, "scroll-mt-20", "border-b border-admin-border bg-admin-surface-2")}>
        <div className={SHELL}>
          <SectionHeading eyebrow="About Techstar Money Solution" title="India's Fastest Growing Loan DSA Network">
            <strong className="font-bold text-admin-text">TECHSTAR MONEY SOLUTION PRIVATE LIMITED</strong> (CIN: {BRAND.cin}) is a government-registered financial services entity headquartered at Morya Pride, Mayur Park, Harsul, Chhatrapati Sambhajinagar.
          </SectionHeading>

          <ul className="grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:grid-cols-5">
            {ABOUT_POINTS.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="rounded-admin border border-admin-border bg-admin-surface p-4 shadow-admin-1 transition-all motion-reduce:transition-none hover:border-brand-ring hover:shadow-admin-2 motion-safe:hover:-translate-y-0.5"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-admin-sm bg-brand-soft text-brand-soft-fg">
                  <Icon size={20} />
                </span>
                <h3 className="mb-1 text-base font-bold text-admin-text">{title}</h3>
                <p className="m-0 text-sm leading-relaxed text-admin-subtle">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── LOAN PRODUCTS CATALOG ────────────────────────────────────────── */}
      <section id="loan-products" className={cn(SECTION, "scroll-mt-20", "border-b border-admin-border bg-admin-surface")}>
        <div className={SHELL}>
          <SectionHeading eyebrow="Multi-Bank Loan Portfolio" title="Products You Can Disburse as a DSA">
            High commission slabs across all retail and commercial banking products.
          </SectionHeading>

          <ul className="grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {LOAN_PRODUCTS.map((p) => {
              const Icon = p.icon
              return (
                <li
                  key={p.id}
                  className="flex flex-col justify-between rounded-admin-lg border border-admin-border bg-admin-surface p-5 shadow-admin-1 transition-all motion-reduce:transition-none hover:border-brand-ring hover:shadow-admin-2 motion-safe:hover:-translate-y-1"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className={cn("flex items-center justify-center rounded-admin-sm border p-2.5", p.tone)}>
                        <Icon size={22} />
                      </span>
                      <span className="rounded-full border border-admin-border bg-admin-surface-2 px-2.5 py-1 text-admin-2xs font-bold uppercase tracking-wider text-admin-subtle">
                        Highest Payout
                      </span>
                    </div>
                    <p className="mb-1 text-admin-xs font-bold uppercase tracking-widest text-brand">
                      {p.category}
                    </p>
                    <h3 className="mb-2 text-lg font-extrabold tracking-tight text-admin-text">{p.name}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-admin-subtle">{p.desc}</p>
                  </div>
                  <div className="border-t border-admin-border pt-4">
                    <Link
                      href="/onboarding"
                      className="admin-focus flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-admin-sm border border-brand-line px-4 py-2 text-sm font-bold text-brand no-underline transition-colors motion-reduce:transition-none hover:bg-brand-soft"
                    >
                      <span>Start Sourcing This Loan</span>
                      <ChevronRight size={14} className="shrink-0" />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-8 text-center">
            <Link
              href="/onboarding"
              className="admin-focus inline-flex min-h-[52px] items-center justify-center gap-2 rounded-admin bg-brand px-6 py-3 text-base font-extrabold text-brand-fg no-underline shadow-admin-2 transition-colors motion-reduce:transition-none hover:bg-brand-hover"
            >
              <span>Get Access to All 50+ Loan Products Online</span>
              <ArrowRight size={18} className="shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DSA PARTNER BENEFITS ─────────────────────────────────────────── */}
      <section id="dsa-partnership" className={cn(SECTION, "scroll-mt-20", "border-b border-admin-border bg-admin-surface-2")}>
        <div className={SHELL}>
          <SectionHeading eyebrow="Why Partner With Us?" title="Direct Benefits for Loan Agents & Connectors">
            Whether you are an individual financial advisor, chartered accountant, tax practitioner, or loan broker — Techstar Money Solution accelerates your monthly earnings.
          </SectionHeading>

          <ul className="grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {PARTNER_BENEFITS.map((b) => {
              const BIcon = b.icon
              return (
                <li
                  key={b.title}
                  className="rounded-admin-lg border border-admin-border bg-admin-surface p-5 shadow-admin-1 transition-all motion-reduce:transition-none hover:border-brand-ring hover:shadow-admin-2 motion-safe:hover:-translate-y-0.5"
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-admin-sm bg-brand-soft text-brand-soft-fg">
                    <BIcon size={22} />
                  </span>
                  <h3 className="mb-1.5 text-base font-bold text-admin-text">{b.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-admin-subtle">{b.desc}</p>
                </li>
              )
            })}
          </ul>

          {/* Banner Box */}
          <div className="mt-8 flex flex-col gap-4 rounded-admin-lg border border-brand-line bg-brand-soft p-5 shadow-admin-1 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <h3 className="mb-1 text-lg font-extrabold tracking-tight text-brand-soft-fg">
                Ready to Start Earning with Techstar Money Solution?
              </h3>
              <p className="m-0 text-sm text-admin-muted">
                Instant digital registration with zero fees. Authorized partner code generated upon approval.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
              <Link
                href="/onboarding"
                className="admin-focus inline-flex min-h-[48px] items-center justify-center rounded-admin bg-brand px-5 py-3 text-sm font-extrabold text-brand-fg no-underline shadow-admin-2 transition-colors motion-reduce:transition-none hover:bg-brand-hover"
              >
                फ्री ऑनबोर्डिंग सुरू करा
              </Link>
              <Link
                href="/partner/login"
                className="admin-focus inline-flex min-h-[48px] items-center justify-center rounded-admin border border-admin-border bg-admin-surface px-5 py-3 text-sm font-bold text-admin-muted no-underline transition-colors motion-reduce:transition-none hover:border-brand-ring hover:text-brand"
              >
                Partner Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (4 SIMPLE STEPS) ────────────────────────────────── */}
      <section id="how-it-works" className={cn(SECTION, "scroll-mt-20", "border-b border-admin-border bg-admin-surface")}>
        <div className={SHELL}>
          <SectionHeading eyebrow="Simple 4-Step Process" title="How to Become a Loan DSA Partner">
            From online registration to your first commission payout — fully digital and assisted.
          </SectionHeading>

          <div className="relative">
            {/* The rail that turns four cards into one sequence. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[12.5%] top-[2.75rem] hidden h-px bg-[linear-gradient(90deg,transparent,var(--brand-line)_15%,var(--brand-line)_85%,transparent)] lg:block"
            />
            <ol className="relative grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, idx) => (
                <li
                  key={s.step}
                  className="relative flex flex-col rounded-admin-lg border border-admin-border bg-admin-surface p-5 text-center shadow-admin-1 transition-all motion-reduce:transition-none hover:border-brand-ring hover:shadow-admin-2 motion-safe:hover:-translate-y-1"
                >
                  <span className="admin-num mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-brand-fg shadow-admin-2 ring-4 ring-admin-surface">
                    {s.step}
                  </span>
                  <h3 className="mb-2 text-base font-bold text-admin-text">{s.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-admin-subtle">{s.desc}</p>
                  <span className="mt-auto inline-flex items-center justify-center self-center rounded-full border border-tone-success-bd bg-tone-success px-2.5 py-1 text-admin-2xs font-bold uppercase tracking-wider text-tone-success-fg">
                    Step {idx + 1}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── CONTACT & OFFICE CREDENTIALS ──────────────────────────────────── */}
      <section id="contact" className={cn(SECTION, "scroll-mt-20", "border-b border-admin-border bg-admin-surface-2")}>
        <div className={SHELL}>
          <SectionHeading eyebrow="Office & Support" title="Contact Our Operations Team">
            Reach out directly to our partner desk in Chhatrapati Sambhajinagar.
          </SectionHeading>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col justify-between rounded-admin-lg border border-admin-border bg-admin-surface p-5 shadow-admin-1">
              <div>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-admin-sm bg-brand-soft text-brand-soft-fg">
                  <Phone size={22} />
                </span>
                <h3 className="mb-1 text-lg font-extrabold tracking-tight text-admin-text">Direct Phone & WhatsApp</h3>
                <p className="mb-3 text-sm text-admin-subtle">Speak directly with our partner onboarding executive</p>
                <p className="admin-num mb-4 text-2xl font-extrabold text-admin-text">{BRAND.phone}</p>
              </div>
              <div className="flex gap-2.5">
                <a
                  href={`tel:${BRAND.phoneRaw}`}
                  className="admin-focus inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-admin bg-brand px-4 py-3 text-sm font-bold text-brand-fg no-underline shadow-admin-1 transition-colors motion-reduce:transition-none hover:bg-brand-hover"
                >
                  <Phone size={15} className="shrink-0" />
                  <span>Call Now</span>
                </a>
                <a
                  href={`https://wa.me/91${BRAND.phoneRaw}?text=${BRAND.whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-focus inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-admin border border-tone-success-bd bg-tone-success px-4 py-3 text-sm font-bold text-tone-success-fg no-underline transition-colors motion-reduce:transition-none hover:border-tone-success-fg"
                >
                  <MessageCircle size={15} className="shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-admin-lg border border-admin-border bg-admin-surface p-5 shadow-admin-1">
              <div>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-admin-sm bg-tone-info text-tone-info-fg">
                  <MapPin size={22} />
                </span>
                <h3 className="mb-1 text-lg font-extrabold tracking-tight text-admin-text">Registered Headquarters</h3>
                <p className="mb-2 text-sm text-admin-subtle">{BRAND.legalName}</p>
                <p className="mb-4 text-sm font-semibold leading-relaxed text-admin-muted">{BRAND.address}</p>
              </div>
              <p className="admin-num m-0 border-t border-admin-border pt-3 text-xs text-admin-subtle">
                CIN: <strong className="font-bold text-admin-muted">{BRAND.cin}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM FIXED ACTION BAR (FOR MOBILE VISITORS) ─────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-admin-border bg-admin-surface/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-admin-3 backdrop-blur-md md:hidden">
        <div className="flex gap-2">
          <Link
            href="/partner/login"
            className="admin-focus inline-flex min-h-[48px] w-[35%] items-center justify-center gap-1 rounded-admin border border-admin-border px-3 py-2 text-sm font-bold text-admin-muted no-underline transition-colors motion-reduce:transition-none hover:border-brand-ring hover:text-brand"
          >
            <LogIn size={15} className="shrink-0" />
            <span>Login</span>
          </Link>
          <Link
            href="/onboarding"
            className="admin-focus inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-admin bg-brand px-3 py-2 text-sm font-extrabold text-brand-fg no-underline shadow-admin-2 transition-colors motion-reduce:transition-none hover:bg-brand-hover"
          >
            <UserPlus size={16} className="shrink-0" />
            <span>फ्री DSA पार्टनर बना</span>
          </Link>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-brand-strong pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-10 text-brand-fg md:pb-10">
        <div className={SHELL}>
          <div className="grid grid-cols-2 gap-6 border-b border-brand-fg/20 pb-6 md:grid-cols-12">
            <div className="col-span-2 md:col-span-5">
              <div className="mb-2 flex items-center gap-2 text-base font-bold">
                <span className="rounded-admin-sm bg-brand-fg/15 px-2 py-1 text-sm font-extrabold">TSM</span>
                <span>{BRAND.name}</span>
              </div>
              <p className="mb-1 text-sm font-bold text-brand-fg/90">{BRAND.legalName}</p>
              <p className="admin-num mb-3 text-xs text-brand-fg/60">CIN: {BRAND.cin}</p>
              <p className="m-0 max-w-sm text-sm leading-relaxed text-brand-fg/70">
                A leading financial services company providing multi-product loan DSA partnerships across Maharashtra.
              </p>
            </div>

            <div className="md:col-span-3">
              <h2 className="mb-3 text-admin-xs font-bold uppercase tracking-widest text-brand-fg/60">
                Navigation
              </h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {FOOTER_NAV.map(({ href, label, internal }) => {
                  const Comp = internal ? Link : "a"
                  return (
                    <li key={label}>
                      {/* @ts-expect-error polymorphic href */}
                      <Comp
                        href={href}
                        className="admin-focus flex min-h-[44px] items-center text-sm text-brand-fg/70 no-underline transition-colors motion-reduce:transition-none hover:text-brand-fg"
                      >
                        {label}
                      </Comp>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="md:col-span-4">
              <h2 className="mb-3 text-admin-xs font-bold uppercase tracking-widest text-brand-fg/60">
                Contact Desk
              </h2>
              <div className="flex flex-col gap-3 text-sm text-brand-fg/70">
                <p className="m-0 flex items-start gap-2">
                  <Phone size={14} className="mt-1 shrink-0" />
                  <a
                    href={`tel:${BRAND.phoneRaw}`}
                    className="admin-touch admin-focus admin-num font-bold text-brand-fg no-underline"
                  >
                    {BRAND.phone}
                  </a>
                </p>
                <p className="m-0 flex items-start gap-2">
                  <MapPin size={14} className="mt-1 shrink-0" />
                  <span>{BRAND.address}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 pt-4 text-xs text-brand-fg/60 sm:flex-row">
            <p className="m-0">© {new Date().getFullYear()} Techstar Money Solution Private Limited. All Rights Reserved.</p>
            <p className="admin-num m-0">CIN: {BRAND.cin}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
