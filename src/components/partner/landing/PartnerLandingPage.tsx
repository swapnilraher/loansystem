"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
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
  Menu,
  X,
  CreditCard,
  Home,
  TrendingUp,
  Layers,
  Percent,
  ChevronRight,
  Sparkles,
  MapPin,
  Check,
  Headphones,
  LogIn,
  UserPlus,
  Zap,
  Globe,
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
    color: "bg-primary-subtle text-primary border-primary",
  },
  {
    id: "business-loan",
    name: "Business Loan",
    category: "Business Loan DSA",
    desc: "Collateral-free commercial credit tailored for MSME expansion, stock purchase, and growth.",
    icon: Briefcase,
    color: "bg-info-subtle text-info-emphasis border-info",
  },
  {
    id: "home-loan",
    name: "Home Loan",
    category: "Home Loan DSA",
    desc: "Affordable housing finance from reputed PSU and private banks with minimal processing fees.",
    icon: Home,
    color: "bg-success-subtle text-success border-success",
  },
  {
    id: "lap",
    name: "Loan Against Property",
    category: "LAP DSA",
    desc: "High-ticket mortgage loans against residential, commercial, or industrial properties.",
    icon: Building2,
    color: "bg-warning-subtle text-warning-emphasis border-warning",
  },
  {
    id: "working-capital",
    name: "Working Capital & CC/OD",
    category: "Working Capital DSA",
    desc: "Overdraft, cash credit lines, and machinery funding to keep daily business liquidity smooth.",
    icon: TrendingUp,
    color: "bg-secondary-subtle text-secondary-emphasis border-secondary",
  },
  {
    id: "balance-transfer",
    name: "Balance Transfer",
    category: "Balance Transfer DSA",
    desc: "Switch existing high-interest loans to lower ROI institutions to reduce monthly EMI drastically.",
    icon: Percent,
    color: "bg-danger-subtle text-danger border-danger",
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

// ── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  { step: "01", title: "Online Registration", desc: "Enter your mobile number and basic business details in 2 minutes." },
  { step: "02", title: "Instant Verification", desc: "Quick Aadhaar & PAN verification to generate your authorized DSA Code." },
  { step: "03", title: "Submit Customer Leads", desc: "Upload client files directly via portal or share your custom referral link." },
  { step: "04", title: "Disbursal & Payout", desc: "Bank disburses the loan and commission gets credited directly to your bank account." },
]

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PartnerLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-vh-100 font-sans" style={{ background: "#F8FAFC", color: "#0F172A" }}>
      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_DATA) }} />

      {/* ── TOP ANNOUNCEMENT STRIP (Bootstrap alert / bar) ────────────────── */}
      <div className="bg-primary text-white py-1 px-3 text-center fs-7 fw-semibold border-bottom border-primary-subtle d-flex align-items-center justify-content-center gap-2">
        <ShieldCheck size={14} className="shrink-0" />
        <span>
          <strong>TECHSTAR MONEY SOLUTION PRIVATE LIMITED</strong> · CIN: {BRAND.cin} · Chhatrapati Sambhajinagar
        </span>
      </div>

      {/* ── STICKY NAV (Bootstrap navbar) ─────────────────────────────────── */}
      <header
        className="sticky-top transition-all duration-200"
        style={{
          background: scrolled ? "rgba(255,255,255,0.98)" : "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: scrolled ? "0 4px 20px rgba(15,23,42,0.06)" : "0 1px 3px rgba(0,0,0,0.02)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container-xl">
          <div className="d-flex align-items-center justify-content-between py-2 py-md-3">
            {/* Logo */}
            <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none text-dark">
              <div
                className="rounded-3 overflow-hidden bg-white border border-slate-200 d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: "42px", height: "42px" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/logo.webp"
                  alt="Techstar Money Solution DSA Logo"
                  className="w-100 h-100 object-contain p-1"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = "none"
                  }}
                />
              </div>
              <div>
                <div className="fw-bolder text-slate-900 lh-1" style={{ fontSize: "15px" }}>
                  Techstar Money Solution
                </div>
                <div className="text-uppercase text-primary fw-bold letter-spacing-1" style={{ fontSize: "10px" }}>
                  Loan DSA Partner Portal
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="d-none d-lg-flex align-items-center gap-4">
              {[
                "#about|About Us",
                "#loan-products|Loan Products",
                "#dsa-partnership|DSA Benefits",
                "#how-it-works|How It Works",
                "#contact|Contact",
              ].map((s) => {
                const [href, label] = s.split("|")
                return (
                  <a
                    key={href}
                    href={href}
                    className="text-decoration-none text-slate-600 fw-semibold fs-7 hover:text-primary transition-colors"
                  >
                    {label}
                  </a>
                )
              })}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="d-none d-sm-flex align-items-center gap-2">
              <a
                href={`https://wa.me/91${BRAND.phoneRaw}?text=${BRAND.whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 fw-bold px-3 py-2 text-decoration-none shadow-sm"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
              <Link
                href="/partner/login"
                className="btn btn-light btn-sm border border-slate-300 text-slate-700 fw-bold px-3 py-2 text-decoration-none shadow-sm"
              >
                <LogIn size={15} /> Partner Login
              </Link>
              <Link
                href="/onboarding"
                className="btn btn-primary btn-sm fw-bold px-3 py-2 text-decoration-none shadow-sm d-flex align-items-center gap-1.5"
              >
                <UserPlus size={15} />
                <span>Become a Partner</span>
              </Link>
            </div>

            {/* Mobile Actions in Header */}
            <div className="d-flex d-sm-none align-items-center gap-2">
              <Link
                href="/onboarding"
                className="btn btn-primary btn-sm fw-bold px-2.5 py-1.5 fs-7 text-decoration-none shadow-sm"
              >
                फ्री नोंदणी
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-light btn-sm border border-slate-200 p-1.5"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="d-lg-none bg-white border-top border-slate-200 p-3 shadow-lg">
            <div className="d-flex flex-column gap-2 mb-3">
              {[
                ["#about", "About Us"],
                ["#loan-products", "Loan Products"],
                ["#dsa-partnership", "DSA Partner Benefits"],
                ["#how-it-works", "How It Works"],
                ["#contact", "Contact Office"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 text-slate-700 fw-semibold text-decoration-none rounded-2 hover:bg-slate-100"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="row g-2 pt-2 border-top border-slate-100">
              <div className="col-6">
                <Link
                  href="/partner/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-light border border-slate-300 w-100 fw-bold fs-7 py-2"
                >
                  <LogIn size={14} /> Partner Login
                </Link>
              </div>
              <div className="col-6">
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary w-100 fw-bold fs-7 py-2"
                >
                  <UserPlus size={14} /> Free Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HIGH-IMPACT HERO SECTION (IMMEDIATE CLARITY FOR MOBILE & DESKTOP) ── */}
      <section
        style={{
          background: "linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)",
          borderBottom: "1px solid #E2E8F0",
        }}
        className="pt-3 pt-md-5 pb-4 pb-md-5 position-relative overflow-hidden"
      >
        <div className="container-xl position-relative z-1">
          <div className="row g-4 align-items-center">
            {/* Left Column: Core Value Proposition */}
            <div className="col-12 col-lg-7">
              {/* Top Highlights Strip on Mobile & Desktop */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2 mb-md-3">
                <span className="badge bg-primary px-3 py-2 rounded-pill fs-7 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm">
                  <Sparkles size={14} />
                  <span>Official Loan DSA Portal</span>
                </span>
                <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fs-7 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm">
                  <Star size={13} className="fill-current text-dark" />
                  <span>5.0 ★ Google Rating</span>
                </span>
                <span className="badge bg-white text-slate-700 border border-slate-300 px-3 py-2 rounded-pill fs-7 fw-bold d-none d-sm-inline-flex align-items-center gap-1">
                  <ShieldCheck size={14} className="text-success" />
                  <span>CIN: {BRAND.cin}</span>
                </span>
              </div>

              {/* H1 Headline — Immediately tells users what this page is! */}
              <h1 className="fw-black text-slate-900 tracking-tight mb-2 mb-md-3 lh-sm" style={{ fontSize: "clamp(1.75rem, 4vw + 0.5rem, 3.25rem)" }}>
                Become an Authorized <br className="d-none d-md-block" />
                <span className="text-primary">Loan DSA Partner</span>
              </h1>

              {/* Regional & High-Converting Subheadline (Marathi + English) */}
              <div className="alert alert-primary bg-primary-subtle border-primary-subtle text-primary-emphasis p-2 p-md-3 rounded-3 mb-3 d-flex align-items-center gap-2">
                <Award size={20} className="shrink-0 text-primary" />
                <div className="fw-bold fs-7 lh-sm">
                  कमवा दरमहा ₹50,000+ पर्यंत कमिशन पेआउट · Earn Highest Commission Across 50+ Leading Banks & NBFCs
                </div>
              </div>

              <p className="text-slate-600 fs-6 fw-medium mb-3 mb-md-4 lh-base d-none d-sm-block">
                Join <strong>Techstar Money Solution Private Limited</strong> as an independent loan partner. Connect customers with Personal, Business, Home, LAP, and Working Capital loans in Chhatrapati Sambhajinagar and Maharashtra.
              </p>

              {/* ── 4-POINT INSTANT VALUE CARDS (2x2 GRID ON MOBILE) ── */}
              <div className="row g-2 mb-3 mb-md-4">
                <div className="col-6">
                  <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-3 p-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-2 bg-primary-subtle text-primary p-1.5 d-flex align-items-center justify-content-center">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className="fw-black text-slate-900 fs-7 lh-1">50+ Banks & NBFCs</div>
                        <div className="text-slate-500 fs-8">HDFC, SBI, ICICI, Bajaj</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-3 p-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-2 bg-success-subtle text-success p-1.5 d-flex align-items-center justify-content-center">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <div className="fw-black text-slate-900 fs-7 lh-1">Highest Payout</div>
                        <div className="text-slate-500 fs-8">Direct Bank Credit</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-3 p-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-2 bg-warning-subtle text-warning-emphasis p-1.5 d-flex align-items-center justify-content-center">
                        <Zap size={18} />
                      </div>
                      <div>
                        <div className="fw-black text-slate-900 fs-7 lh-1">Zero Fee / Free</div>
                        <div className="text-slate-500 fs-8">100% Free DSA Code</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-3 p-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-2 bg-info-subtle text-info-emphasis p-1.5 d-flex align-items-center justify-content-center">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div className="fw-black text-slate-900 fs-7 lh-1">Live CRM Portal</div>
                        <div className="text-slate-500 fs-8">Track Customer Files</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BIG CALL TO ACTION BUTTONS (MOBILE FIRST) ── */}
              <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <Link
                  href="/onboarding"
                  className="btn btn-primary btn-lg fw-black px-4 py-3 rounded-3 shadow d-flex align-items-center justify-content-center gap-2 text-decoration-none fs-6"
                >
                  <span>🚀 Register as DSA Partner (फ्री नोंदणी)</span>
                  <ArrowRight size={18} />
                </Link>

                <div className="d-flex gap-2">
                  <a
                    href={`https://wa.me/91${BRAND.phoneRaw}?text=${BRAND.whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success btn-lg fw-bold px-3 py-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-1.5 text-decoration-none flex-grow-1 fs-7"
                  >
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${BRAND.phoneRaw}`}
                    className="btn btn-outline-secondary btn-lg fw-bold px-3 py-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-1.5 text-decoration-none flex-grow-1 fs-7"
                  >
                    <Phone size={17} />
                    <span>Call Support</span>
                  </a>
                </div>
              </div>

              {/* Quick Loan Types Strip */}
              <div className="pt-2 border-top border-slate-200">
                <div className="fs-8 fw-bold text-slate-500 text-uppercase letter-spacing-1 mb-1.5">
                  Products Available for DSA Sourcing:
                </div>
                <div className="d-flex flex-wrap gap-1.5">
                  {[
                    "💰 Personal Loan",
                    "🏢 Business Loan",
                    "🏠 Home Loan",
                    "🏗️ LAP Mortgage",
                    "🔄 Balance Transfer",
                    "🚜 Working Capital",
                  ].map((p) => (
                    <span key={p} className="badge bg-light text-dark border border-secondary-subtle fw-bold fs-7 py-2 px-2.5 shadow-sm">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: High-Converting Callback Card (matching user's screenshot) */}
            <div className="col-12 col-lg-5">
              <div className="card border border-slate-200 bg-white shadow-lg rounded-4 overflow-hidden p-4 p-md-4">
                <div className="mb-3">
                  <h2 className="fw-black text-slate-900 fs-5 mb-1">
                    Grow Your Business with Techstar Money!
                  </h2>
                  <p className="text-slate-500 fs-7 mb-0">
                    Highest Commission Payouts. 50+ Banks. Real Results.
                  </p>
                </div>

                <div className="border-top border-slate-100 pt-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const form = e.currentTarget
                      const phoneInput = form.elements.namedItem("phone") as HTMLInputElement
                      const clean = phoneInput?.value ? phoneInput.value.replace(/\D/g, "") : ""
                      window.location.href = clean ? `/onboarding?mobile=${clean}` : "/onboarding"
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label text-slate-700 fw-bold fs-8 mb-1">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Please enter your name"
                        className="form-control rounded-3 border-slate-300 fs-7 py-2 shadow-none"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-slate-700 fw-bold fs-8 mb-1">
                        Contact Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        maxLength={10}
                        placeholder="Please enter your contact number"
                        className="form-control rounded-3 border-slate-300 fs-7 py-2 shadow-none"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-slate-700 fw-bold fs-8 mb-1">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="Please enter your email"
                        className="form-control rounded-3 border-slate-300 fs-7 py-2 shadow-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn w-100 fw-bold py-2.5 rounded-3 text-white shadow-sm d-flex align-items-center justify-center gap-2 fs-7"
                      style={{ backgroundColor: "#0F4C81", borderColor: "#0F4C81" }}
                    >
                      <span>Request a Callback &amp; Register</span>
                      <ArrowRight size={15} />
                    </button>

                    <div className="text-center text-slate-400 fs-8 pt-2">
                      🔒 100% Free DSA Registration • Verified Bank Payouts
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACTION CARDS (BOOTSTRAP ROW) ────────────────────────────── */}
      <section className="py-4 bg-white border-bottom border-slate-200">
        <div className="container-xl">
          <div className="row g-2 g-md-3">
            {[
              { icon: UserPlus, label: "Become a DSA", sub: "Free digital onboarding", href: "/onboarding", color: "bg-primary-subtle text-primary border-primary" },
              { icon: LogIn, label: "Partner Login", sub: "Access your dashboard", href: "/partner/login", color: "bg-secondary-subtle text-secondary-emphasis border-secondary" },
              { icon: CreditCard, label: "Loan Products", sub: "View product slabs", href: "#loan-products", color: "bg-success-subtle text-success border-success" },
              { icon: Phone, label: "Call Office", sub: BRAND.phone, href: `tel:${BRAND.phoneRaw}`, color: "bg-warning-subtle text-warning-emphasis border-warning" },
            ].map(({ icon: Icon, label, sub, href, color }) => {
              const Comp = href.startsWith("#") || href.startsWith("tel:") ? "a" : Link
              return (
                <div key={label} className="col-6 col-lg-3">
                  {/* @ts-expect-error polymorphic */}
                  <Comp
                    href={href}
                    className="card h-100 border border-slate-200 text-decoration-none shadow-sm hover:shadow-md transition-all p-3 rounded-3"
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-center shrink-0 ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-bold text-slate-900 fs-7 text-truncate">{label}</div>
                        <div className="text-slate-500 fs-8 text-truncate">{sub}</div>
                      </div>
                    </div>
                  </Comp>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ABOUT TECHSTAR MONEY SOLUTION ─────────────────────────────────── */}
      <section id="about" className="py-5 bg-light border-bottom border-slate-200">
        <div className="container-xl">
          <div className="text-center max-w-3xl mx-auto mb-4 mb-md-5">
            <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill fw-bold text-uppercase fs-8 mb-2">
              About Techstar Money Solution
            </span>
            <h2 className="fw-black text-slate-900 fs-2 tracking-tight">
              India&apos;s Fastest Growing Loan DSA Network
            </h2>
            <p className="text-slate-600 fs-6 fw-medium mt-2">
              <strong>TECHSTAR MONEY SOLUTION PRIVATE LIMITED</strong> (CIN: {BRAND.cin}) is a government-registered financial services entity headquartered at Morya Pride, Mayur Park, Harsul, Chhatrapati Sambhajinagar.
            </p>
          </div>

          <div className="row g-3">
            {[
              { icon: CheckCircle2, title: "Direct Bank Codes", desc: "Access direct banking agreements with nationalized and private lenders." },
              { icon: FileText, title: "Document Verification", desc: "Expert operations desk helps sanitize client files for immediate approval." },
              { icon: Layers, title: "Multi-Loan Solutions", desc: "Offer retail loans, working capital, property mortgages, and machinery funding." },
              { icon: Users, title: "Customer-Centric", desc: "Match borrowers with lowest interest rates based on CIBIL and profile." },
              { icon: Headphones, title: "Direct Desk Support", desc: "Direct phone and WhatsApp assistance from experienced loan underwriters." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="col-12 col-md-6 col-lg">
                <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-3 p-3 text-start">
                  <div className="rounded-3 bg-primary-subtle text-primary p-2 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: "38px", height: "38px" }}>
                    <Icon size={20} />
                  </div>
                  <h3 className="fw-bold fs-6 text-slate-900 mb-1">{title}</h3>
                  <p className="text-slate-500 fs-7 mb-0 lh-base">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOAN PRODUCTS CATALOG ────────────────────────────────────────── */}
      <section id="loan-products" className="py-5 bg-white border-bottom border-slate-200">
        <div className="container-xl">
          <div className="text-center max-w-3xl mx-auto mb-4 mb-md-5">
            <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill fw-bold text-uppercase fs-8 mb-2">
              Multi-Bank Loan Portfolio
            </span>
            <h2 className="fw-black text-slate-900 fs-2 tracking-tight">
              Products You Can Disburse as a DSA
            </h2>
            <p className="text-slate-600 fs-6 fw-medium mt-2">
              High commission slabs across all retail and commercial banking products.
            </p>
          </div>

          <div className="row g-3 g-md-4">
            {LOAN_PRODUCTS.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all rounded-4 p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className={`p-2.5 rounded-3 border d-flex align-items-center justify-content-center ${p.color}`}>
                          <Icon size={22} />
                        </div>
                        <span className="badge bg-light text-slate-600 border border-slate-200 fs-8 fw-bold">
                          Highest Payout
                        </span>
                      </div>
                      <div className="fs-8 fw-bold text-primary text-uppercase letter-spacing-1 mb-1">
                        {p.category}
                      </div>
                      <h3 className="fw-bold fs-5 text-slate-900 mb-2">{p.name}</h3>
                      <p className="text-slate-500 fs-7 lh-base mb-3">{p.desc}</p>
                    </div>
                    <div className="pt-3 border-top border-slate-100">
                      <Link
                        href="/onboarding"
                        className="btn btn-outline-primary btn-sm w-100 fw-bold text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                      >
                        <span>Start Sourcing This Loan</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/onboarding"
              className="btn btn-primary btn-lg fw-bold px-4 py-2.5 rounded-3 shadow text-decoration-none d-inline-flex align-items-center gap-2"
            >
              <span>Get Access to All 50+ Loan Products Online</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DSA PARTNER BENEFITS ─────────────────────────────────────────── */}
      <section id="dsa-partnership" className="py-5 bg-light border-bottom border-slate-200">
        <div className="container-xl">
          <div className="text-center max-w-3xl mx-auto mb-4 mb-md-5">
            <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill fw-bold text-uppercase fs-8 mb-2">
              Why Partner With Us?
            </span>
            <h2 className="fw-black text-slate-900 fs-2 tracking-tight">
              Direct Benefits for Loan Agents & Connectors
            </h2>
            <p className="text-slate-600 fs-6 fw-medium mt-2">
              Whether you are an individual financial advisor, chartered accountant, tax practitioner, or loan broker — Techstar Money Solution accelerates your monthly earnings.
            </p>
          </div>

          <div className="row g-3 g-md-4">
            {PARTNER_BENEFITS.map((b) => {
              const BIcon = b.icon
              return (
                <div key={b.title} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-4 p-4">
                    <div className="rounded-3 bg-primary-subtle text-primary p-2.5 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "45px", height: "45px" }}>
                      <BIcon size={22} />
                    </div>
                    <h3 className="fw-bold fs-6 text-slate-900 mb-1.5">{b.title}</h3>
                    <p className="text-slate-500 fs-7 lh-base mb-0">{b.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Banner Box */}
          <div className="card border border-primary-subtle bg-primary-subtle rounded-4 p-4 mt-4 shadow-sm">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h3 className="fw-black text-primary-emphasis fs-5 mb-1">
                  Ready to Start Earning with Techstar Money Solution?
                </h3>
                <p className="text-slate-700 fs-7 mb-0">
                  Instant digital registration with zero fees. Authorized partner code generated upon approval.
                </p>
              </div>
              <div className="d-flex gap-2 shrink-0">
                <Link
                  href="/onboarding"
                  className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 text-decoration-none shadow"
                >
                  फ्री ऑनबोर्डिंग सुरू करा
                </Link>
                <Link
                  href="/partner/login"
                  className="btn btn-light border border-slate-300 fw-bold px-3 py-2.5 rounded-3 text-decoration-none"
                >
                  Partner Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (4 SIMPLE STEPS) ────────────────────────────────── */}
      <section id="how-it-works" className="py-5 bg-white border-bottom border-slate-200">
        <div className="container-xl">
          <div className="text-center max-w-3xl mx-auto mb-4 mb-md-5">
            <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill fw-bold text-uppercase fs-8 mb-2">
              Simple 4-Step Process
            </span>
            <h2 className="fw-black text-slate-900 fs-2 tracking-tight">
              How to Become a Loan DSA Partner
            </h2>
            <p className="text-slate-600 fs-6 fw-medium mt-2">
              From online registration to your first commission payout — fully digital and assisted.
            </p>
          </div>

          <div className="row g-3">
            {STEPS.map((s, idx) => (
              <div key={s.step} className="col-12 col-sm-6 col-lg-3">
                <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-4 p-4 text-center position-relative">
                  <div
                    className="rounded-circle bg-primary text-white fw-black fs-5 d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                    style={{ width: "50px", height: "50px" }}
                  >
                    {s.step}
                  </div>
                  <h3 className="fw-bold fs-6 text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-500 fs-7 lh-base mb-3">{s.desc}</p>
                  <div className="mt-auto">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-8 fw-bold">
                      Step {idx + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT & OFFICE CREDENTIALS ──────────────────────────────────── */}
      <section id="contact" className="py-5 bg-light border-bottom border-slate-200">
        <div className="container-xl">
          <div className="text-center max-w-3xl mx-auto mb-4 mb-md-5">
            <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill fw-bold text-uppercase fs-8 mb-2">
              Office & Support
            </span>
            <h2 className="fw-black text-slate-900 fs-2 tracking-tight">
              Contact Our Operations Team
            </h2>
            <p className="text-slate-600 fs-6 fw-medium mt-2">
              Reach out directly to our partner desk in Chhatrapati Sambhajinagar.
            </p>
          </div>

          <div className="row g-3 max-w-4xl mx-auto">
            <div className="col-12 col-md-6">
              <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="rounded-3 bg-primary-subtle text-primary p-2.5 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "45px", height: "45px" }}>
                    <Phone size={22} />
                  </div>
                  <h3 className="fw-bold fs-5 text-slate-900 mb-1">Direct Phone & WhatsApp</h3>
                  <p className="text-slate-500 fs-7 mb-3">Speak directly with our partner onboarding executive</p>
                  <div className="fw-black text-slate-900 fs-4 mb-3 font-monospace">{BRAND.phone}</div>
                </div>
                <div className="d-flex gap-2">
                  <a
                    href={`tel:${BRAND.phoneRaw}`}
                    className="btn btn-primary flex-grow-1 fw-bold fs-7 py-2.5 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <Phone size={15} />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={`https://wa.me/91${BRAND.phoneRaw}?text=${BRAND.whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success flex-grow-1 fw-bold fs-7 py-2.5 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="card h-100 border border-slate-200 bg-white shadow-sm rounded-4 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="rounded-3 bg-secondary-subtle text-secondary-emphasis p-2.5 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "45px", height: "45px" }}>
                    <MapPin size={22} />
                  </div>
                  <h3 className="fw-bold fs-5 text-slate-900 mb-1">Registered Headquarters</h3>
                  <p className="text-slate-500 fs-7 mb-2">{BRAND.legalName}</p>
                  <p className="text-slate-700 fs-7 fw-semibold lh-base mb-3">{BRAND.address}</p>
                </div>
                <div className="pt-2 border-top border-slate-100 fs-8 text-slate-500 font-monospace">
                  CIN: <strong>{BRAND.cin}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM FIXED ACTION BAR (FOR MOBILE VISITORS) ─────────────────── */}
      <div className="d-block d-md-none fixed-bottom bg-white border-top border-slate-200 p-2 shadow-lg z-40">
        <div className="d-flex gap-2">
          <Link
            href="/partner/login"
            className="btn btn-light border border-slate-300 fw-bold fs-7 py-2.5 text-slate-700 text-decoration-none d-flex align-items-center justify-content-center gap-1"
            style={{ width: "35%" }}
          >
            <LogIn size={15} />
            <span>Login</span>
          </Link>
          <Link
            href="/onboarding"
            className="btn btn-primary fw-bold fs-7 py-2.5 text-white text-decoration-none d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 shadow"
          >
            <UserPlus size={16} />
            <span>फ्री DSA पार्टनर बना</span>
          </Link>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-dark text-slate-400 py-5 pb-5 mb-5 mb-md-0">
        <div className="container-xl">
          <div className="row g-4 pb-4 border-bottom border-slate-800">
            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2 text-white fw-bold fs-6 mb-2">
                <div className="rounded-2 bg-primary text-white fw-black px-2 py-1 fs-7">TSM</div>
                <span>{BRAND.name}</span>
              </div>
              <p className="text-slate-300 fs-7 fw-bold mb-1">{BRAND.legalName}</p>
              <p className="text-slate-500 fs-8 font-monospace mb-2">CIN: {BRAND.cin}</p>
              <p className="text-slate-400 fs-7 lh-base mb-0 max-w-sm">
                A leading financial services company providing multi-product loan DSA partnerships across Maharashtra.
              </p>
            </div>

            <div className="col-6 col-md-3">
              <div className="fw-bold text-white fs-7 text-uppercase letter-spacing-1 mb-2">Navigation</div>
              <ul className="list-unstyled fs-7 mb-0 d-flex flex-column gap-1.5">
                <li><a href="#" className="text-slate-400 text-decoration-none hover:text-white">Home</a></li>
                <li><a href="#about" className="text-slate-400 text-decoration-none hover:text-white">About Company</a></li>
                <li><a href="#loan-products" className="text-slate-400 text-decoration-none hover:text-white">Loan Products</a></li>
                <li><a href="#dsa-partnership" className="text-slate-400 text-decoration-none hover:text-white">DSA Benefits</a></li>
                <li><Link href="/onboarding" className="text-slate-400 text-decoration-none hover:text-white">Become a Partner</Link></li>
                <li><Link href="/partner/login" className="text-slate-400 text-decoration-none hover:text-white">Partner Login</Link></li>
              </ul>
            </div>

            <div className="col-6 col-md-4">
              <div className="fw-bold text-white fs-7 text-uppercase letter-spacing-1 mb-2">Contact Desk</div>
              <div className="fs-7 text-slate-400 d-flex flex-column gap-2">
                <div>
                  <Phone size={14} className="text-primary me-1" />
                  <a href={`tel:${BRAND.phoneRaw}`} className="text-slate-300 fw-bold text-decoration-none">{BRAND.phone}</a>
                </div>
                <div>
                  <MapPin size={14} className="text-primary me-1" />
                  <span>{BRAND.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 d-flex flex-column flex-sm-row align-items-center justify-content-between fs-8 text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} Techstar Money Solution Private Limited. All Rights Reserved.</div>
            <div className="font-monospace">CIN: {BRAND.cin}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
