"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leadFormSchema, LeadFormData } from "@/lib/schemas"
import { maharashtraCities } from "@/lib/maharashtraCities"
import Confetti from "react-confetti"

/* ─────────────────────────────────────────────────────────────────────────────
   SCROLL-REVEAL HOOK
───────────────────────────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]")
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target) }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────────────────────── */
function Counter({ end, prefix = "", suffix = "", duration = 1800 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return; io.disconnect()
      let start = 0; const step = end / (duration / 16)
      const timer = setInterval(() => { start = Math.min(start + step, end); setCount(Math.floor(start)); if (start >= end) clearInterval(timer) }, 16)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [end, duration])
  return <span ref={ref}>{prefix}{count.toLocaleString("en-IN")}{suffix}</span>
}

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    /* ── RESET & FONTS ── */
    .pl-page { font-family: var(--font-inter), system-ui, sans-serif; color: #1a1a2e; }

    /* ── CSS TOKENS ── */
    .pl-page {
      --blue: #0066FF;
      --blue-dark: #0047CC;
      --blue-light: #EBF3FF;
      --green: #00B894;
      --green-light: #E8FBF7;
      --orange: #FF6B35;
      --yellow: #FFB800;
      --navy: #0A1628;
      --navy-mid: #12243F;
      --slate: #6B7280;
      --border: #E5E9EF;
      --white: #FFFFFF;
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
      --shadow-md: 0 8px 24px rgba(0,0,0,0.1);
      --shadow-lg: 0 16px 48px rgba(0,0,0,0.14);
      --shadow-blue: 0 8px 32px rgba(0,102,255,0.22);
      --radius-sm: 10px;
      --radius-md: 16px;
      --radius-lg: 24px;
      --radius-xl: 32px;
    }

    /* ── REVEAL ANIMATIONS ── */
    [data-reveal] { opacity: 0; transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); will-change: opacity,transform; }
    [data-reveal="left"]   { transform: translateX(-56px) }
    [data-reveal="right"]  { transform: translateX(56px) }
    [data-reveal="up"]     { transform: translateY(56px) }
    [data-reveal="zoom"]   { transform: scale(.88) }
    [data-reveal].is-visible { opacity:1 !important; transform:none !important }
    [data-delay="1"] { transition-delay:.1s } [data-delay="2"] { transition-delay:.2s }
    [data-delay="3"] { transition-delay:.3s } [data-delay="4"] { transition-delay:.4s }
    [data-delay="5"] { transition-delay:.5s } [data-delay="6"] { transition-delay:.6s }

    /* ── HERO ── */
    .pl-hero {
      background: #f8fafc;
      padding: 140px 0 50px;
      position: relative; overflow: hidden;
    }
    .pl-hero::before {
      content:''; position:absolute; top:-200px; right:-200px;
      width:700px; height:700px; border-radius:50%;
      background: radial-gradient(circle, rgba(0,102,255,.06) 0%, transparent 65%);
      pointer-events:none; filter: blur(40px);
    }
    .pl-hero::after {
      content:''; position:absolute; bottom:-150px; left:-100px;
      width:500px; height:500px; border-radius:50%;
      background: radial-gradient(circle, rgba(16,185,129,.06) 0%, transparent 65%);
      pointer-events:none; filter: blur(40px);
    }
    .hero-grid-bg {
      position:absolute; inset:0; pointer-events:none; opacity:.4;
      background-image: linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .hero-h1 { font-size:clamp(1.7rem,4vw,3.2rem); font-weight:900; line-height:1.1; color:#0A1628; letter-spacing:-.02em; }
    .hero-h1 .accent-blue { color:#0066FF; }
    .hero-h1 .accent-green { background:linear-gradient(90deg,#10B981,#059669); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .hero-pill {
      display:inline-flex; align-items:center; gap:6px;
      background:rgba(0,102,255,.06); backdrop-filter:blur(12px);
      border:1px solid rgba(0,102,255,.12); color:#0066FF;
      font-size:.75rem; font-weight:700; padding:5px 14px; border-radius:999px;
    }
    .hero-feat-row { display:flex; flex-direction:column; gap:8px; }
    .hero-feat {
      display:flex; align-items:center; gap:10px;
      background:rgba(255,255,255,.8); backdrop-filter:blur(8px);
      border:1px solid rgba(0,0,0,.05); border-radius:12px;
      padding:8px 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    .hero-feat-icon { font-size:1.2rem; flex-shrink:0; }
    .hero-feat-text { font-size:.84rem; font-weight:600; color:#334155; }

    /* ── FORM CARD ── */
    .form-card {
      background:#fff; border-radius:24px; overflow:hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,.22);
    }
    .form-header {
      background:linear-gradient(135deg,#0066FF,#0047CC);
      padding:20px 28px; color:#fff;
    }
    .form-header h4 { font-size:1.05rem; font-weight:800; margin:0 0 2px; }
    .form-header p { font-size:.72rem; opacity:.8; margin:0; }
    .form-progress { height:3px; background:rgba(255,255,255,.2); }
    .form-progress-fill { height:100%; background:#60AFFF; transition:width .4s ease; }
    .form-body { padding:24px 28px; }
    .fl-label { font-size:.78rem; font-weight:700; color:#374151; margin-bottom:6px; display:block; }
    .fl-input {
      width:100%; padding:10px 14px; border:1.5px solid #E5E9EF; border-radius:10px;
      font-size:.88rem; font-weight:500; color:#111827; outline:none;
      transition:border-color .2s, box-shadow .2s; background:#FAFBFC;
    }
    .fl-input:focus { border-color:#0066FF; box-shadow:0 0 0 3px rgba(0,102,255,.12); background:#fff; }
    .fl-input.has-err { border-color:#EF4444; }
    .fl-error { font-size:.7rem; color:#EF4444; margin-top:3px; }
    .btn-apply {
      width:100%; padding:13px; border:none; border-radius:12px; cursor:pointer;
      background:linear-gradient(135deg,#0066FF,#0047CC);
      color:#fff; font-size:.9rem; font-weight:800; letter-spacing:.03em;
      box-shadow:0 8px 24px rgba(0,102,255,.35);
      transition:transform .15s, box-shadow .15s;
    }
    .btn-apply:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,102,255,.45); }
    .btn-apply:disabled { opacity:.7; transform:none; cursor:not-allowed; }

    /* ── PARTNERS STRIP ── */
    .partners-strip { background:#fff; padding:20px 0; border-bottom:1px solid #F1F5F9; }
    .partner-logo {
      height:32px; width:auto; opacity:.55; filter:grayscale(1);
      transition:opacity .2s, filter .2s;
    }
    .partner-logo:hover { opacity:1; filter:grayscale(0); }

    /* ── STATS STRIP ── */
    .stats-strip { background:linear-gradient(135deg,#0A1628,#0D1F45); padding:56px 0; }
    .stat-card-dark {
      background:rgba(255,255,255,.06); backdrop-filter:blur(16px);
      border:1px solid rgba(255,255,255,.09); border-radius:20px;
      padding:28px 20px; text-align:center;
      transition:background .25s, transform .25s;
    }
    .stat-card-dark:hover { background:rgba(255,255,255,.1); transform:translateY(-4px); }
    .stat-num { font-size:2.1rem; font-weight:900; line-height:1.1; }
    .stat-label { color:#94A3B8; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em; margin-top:6px; }

    /* ── SECTION COMMON ── */
    .pl-section { padding:80px 0; }
    .pl-section-sm { padding:56px 0; }
    .pl-section-title { font-size:clamp(1.5rem,3vw,2.1rem); font-weight:900; color:#0A1628; letter-spacing:-.02em; }
    .pl-section-sub { color:#6B7280; font-size:.95rem; line-height:1.7; max-width:520px; margin:0 auto; }
    .section-chip {
      display:inline-flex; align-items:center; gap:6px;
      background:#EBF3FF; color:#0066FF; font-size:.7rem; font-weight:800;
      letter-spacing:.12em; text-transform:uppercase; padding:5px 16px;
      border-radius:999px; border:1px solid #BFD7FF; margin-bottom:14px;
    }

    /* ── FEATURE CARDS PREMIUM ── */
    .feat-card {
      position: relative;
      background: #fff;
      border: 1.5px solid #EFF2F7;
      border-radius: 24px;
      padding: 32px 26px 28px;
      height: 100%;
      overflow: hidden;
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .25s;
      cursor: default;
    }
    /* shine sweep on hover */
    .feat-card::before {
      content: '';
      position: absolute;
      top: 0; left: -80%;
      width: 60%; height: 100%;
      background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%);
      transform: skewX(-20deg);
      transition: left .55s ease;
      pointer-events: none;
      z-index: 1;
    }
    .feat-card:hover::before { left: 130%; }
    /* top accent line */
    .feat-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--feat-accent, #0066FF);
      opacity: 0;
      transition: opacity .3s;
      border-radius: 24px 24px 0 0;
    }
    .feat-card:hover { transform: translateY(-10px); border-color: transparent; }
    .feat-card:hover::after { opacity: 1; }
    .feat-card:hover { box-shadow: 0 24px 56px var(--feat-shadow, rgba(0,102,255,.16)); }
    /* number badge */
    .feat-num {
      position: absolute;
      top: 20px; right: 20px;
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #F1F5F9;
      color: #94A3B8;
      font-size: .65rem;
      font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      transition: background .3s, color .3s;
      z-index: 2;
    }
    .feat-card:hover .feat-num { background: var(--feat-accent, #0066FF); color: #fff; }
    /* icon box */
    .feat-icon-wrap {
      width: 64px; height: 64px;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.7rem;
      margin-bottom: 20px;
      position: relative;
      z-index: 2;
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .3s;
      background: var(--feat-bg, #EBF3FF);
    }
    .feat-card:hover .feat-icon-wrap {
      transform: scale(1.15) rotate(-8deg);
      box-shadow: 0 8px 24px var(--feat-shadow, rgba(0,102,255,.25));
    }
    .feat-title {
      font-size: 1.02rem; font-weight: 800; color: #0A1628; margin-bottom: 10px;
      position: relative; z-index: 2;
      transition: color .25s;
    }
    .feat-card:hover .feat-title { color: var(--feat-accent, #0066FF); }
    .feat-desc { font-size: .83rem; color: #6B7280; line-height: 1.7; position: relative; z-index: 2; }
    /* check pill at bottom */
    .feat-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--feat-bg, #EBF3FF);
      color: var(--feat-accent, #0066FF);
      font-size: .68rem; font-weight: 800;
      padding: 4px 12px; border-radius: 999px;
      margin-top: 16px;
      opacity: 0; transform: translateY(6px);
      transition: opacity .3s, transform .3s;
      position: relative; z-index: 2;
    }
    .feat-card:hover .feat-pill { opacity: 1; transform: translateY(0); }

    /* ── PURPOSE CARDS ── */
    .purpose-card {
      border-radius:18px; padding:22px 14px; text-align:center;
      border:1.5px solid transparent; cursor:pointer;
      transition:all .25s cubic-bezier(.22,1,.36,1);
    }
    .purpose-card:hover { transform:translateY(-8px); box-shadow:var(--shadow-md); border-color:currentColor; }
    .purpose-icon { font-size:2.4rem; margin-bottom:10px; }
    .purpose-label { font-size:.82rem; font-weight:700; color:#0A1628; }

    /* ── EMI CALCULATOR ── */
    .emi-card { background:#fff; border:1.5px solid var(--border); border-radius:24px; overflow:hidden; }
    .emi-card-header { background:#EBF3FF; padding:20px 28px; border-bottom:1.5px solid #D8E9FF; }
    .emi-card-header h5 { font-size:1rem; font-weight:800; color:#0A1628; margin:0; }
    .slider-label { font-size:.75rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.05em; }
    .slider-value { font-size:.92rem; font-weight:800; color:#0066FF; background:#EBF3FF; padding:4px 14px; border-radius:8px; }
    input[type=range].pl-range { accent-color:#0066FF; height:6px; width:100%; border-radius:999px; cursor:pointer; }
    .result-box { border-radius:16px; padding:18px 14px; text-align:center; }
    .result-box-label { font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; }
    .result-box-val { font-size:1rem; font-weight:900; }

    /* ── COMPARISON TABLE ── */
    .pl-table-wrap { border-radius:20px; overflow:hidden; box-shadow:var(--shadow-md); }
    .pl-table { width:100%; border-collapse:collapse; }
    .pl-table thead th { background:#0A1628; color:#fff; font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:14px 18px; white-space:nowrap; }
    .pl-table tbody td { padding:14px 18px; border-bottom:1px solid #F1F5F9; font-size:.88rem; vertical-align:middle; }
    .pl-table tbody tr { background:#fff; transition:background .15s; }
    .pl-table tbody tr:hover { background:#F8FBFF; }
    .pl-table tbody tr:last-child td { border-bottom:none; }
    .bank-chip { width:38px; height:38px; border-radius:10px; background:#EBF3FF; display:flex; align-items:center; justify-content:center; font-weight:900; color:#0066FF; font-size:.72rem; flex-shrink:0; }
    .rate-green { color:#00975B; font-weight:800; font-size:1rem; }
    .btn-apply-sm { background:#EBF3FF; color:#0066FF; font-weight:700; font-size:.76rem; padding:6px 14px; border-radius:8px; border:none; cursor:pointer; white-space:nowrap; transition:background .15s, color .15s; }
    .btn-apply-sm:hover { background:#0066FF; color:#fff; }

    /* ── ELIGIBILITY TABS ── */
    .elig-tabs { display:flex; gap:0; background:#F1F5F9; border-radius:12px; padding:4px; margin-bottom:24px; }
    .elig-tab { flex:1; padding:10px 16px; border:none; background:transparent; border-radius:10px; font-size:.82rem; font-weight:700; color:#6B7280; cursor:pointer; transition:all .2s; }
    .elig-tab.active { background:#0066FF; color:#fff; box-shadow:0 4px 12px rgba(0,102,255,.25); }
    .elig-item { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #F1F5F9; }
    .elig-item:last-child { border-bottom:none; }
    .elig-item-label { font-size:.88rem; color:#6B7280; }
    .elig-item-val { font-size:.88rem; font-weight:700; color:#0A1628; }

    /* ── DOC CARD ── */
    .doc-card { background:#fff; border:1.5px solid #EFF2F7; border-radius:16px; padding:20px 12px; text-align:center; transition:all .2s; cursor:pointer; }
    .doc-card:hover { border-color:#BFD7FF; box-shadow:0 8px 24px rgba(0,102,255,.1); transform:translateY(-4px); }
    .doc-icon { font-size:2rem; margin-bottom:8px; }
    .doc-label { font-size:.78rem; font-weight:700; color:#374151; }

    /* ── PROCESS STEPS ── */
    .step-track { display:flex; align-items:flex-start; gap:0; position:relative; }
    .step-dot {
      width:64px; height:64px; border-radius:50%; flex-shrink:0;
      background:#fff; border:3px solid #BFD7FF; display:flex; align-items:center; justify-content:center;
      font-size:1.7rem; position:relative; z-index:1;
      box-shadow:0 4px 16px rgba(0,102,255,.1);
      transition:all .25s;
    }
    .step-wrap:hover .step-dot { border-color:#0066FF; background:#EBF3FF; transform:scale(1.1); }
    .step-num { position:absolute; top:-6px; right:-6px; width:22px; height:22px; border-radius:50%; background:#0066FF; color:#fff; font-size:.62rem; font-weight:900; display:flex; align-items:center; justify-content:center; }
    .step-line { flex:1; height:2px; background:linear-gradient(90deg,#BFD7FF,#0066FF,#BFD7FF); margin-top:31px; }

    /* ── TESTIMONIALS ── */
    .testi-card { background:#fff; border:1.5px solid #EFF2F7; border-radius:20px; padding:28px; height:100%; transition:all .25s; }
    .testi-card:hover { border-color:#BFD7FF; box-shadow:var(--shadow-md); transform:translateY(-6px); }
    .testi-stars { color:#FFB800; font-size:1rem; letter-spacing:2px; }
    .testi-quote { font-size:.9rem; color:#374151; line-height:1.75; font-style:italic; margin:16px 0 24px; }
    .testi-avatar { width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:.85rem; color:#fff; flex-shrink:0; }
    .testi-name { font-size:.9rem; font-weight:800; color:#0A1628; }
    .testi-role { font-size:.68rem; font-weight:700; color:#94A3B8; text-transform:uppercase; letter-spacing:.08em; }
    .verified-badge { display:inline-flex; align-items:center; gap:3px; background:#E8FBF7; color:#00975B; font-size:.62rem; font-weight:800; padding:2px 8px; border-radius:999px; }

    /* ── FAQ ── */
    .faq-item { border:1.5px solid #EFF2F7; border-radius:14px; overflow:hidden; margin-bottom:10px; transition:border-color .2s; }
    .faq-item.open { border-color:#BFD7FF; }
    .faq-btn { width:100%; background:#fff; border:none; padding:18px 22px; text-align:left; font-size:.92rem; font-weight:700; color:#0A1628; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px; }
    .faq-btn:hover { background:#FAFBFF; }
    .faq-chevron { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .25s; }
    .faq-item .faq-chevron { background:#F1F5F9; color:#94A3B8; }
    .faq-item.open .faq-chevron { background:#0066FF; color:#fff; transform:rotate(180deg); }
    .faq-body { padding:0 22px 18px; color:#6B7280; font-size:.88rem; line-height:1.75; border-top:1px solid #EFF2F7; }

    /* ── CTA BANNER ── */
    .cta-banner { background:linear-gradient(135deg,#0A1628,#0D1F45); padding:80px 0; }
    .cta-inner { background:rgba(255,255,255,.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.08); border-radius:28px; padding:64px 40px; text-align:center; }
    .cta-h2 { font-size:clamp(1.8rem,4vw,2.8rem); font-weight:900; color:#fff; letter-spacing:-.02em; margin-bottom:16px; }
    .cta-sub { color:#94A3B8; font-size:1.05rem; max-width:460px; margin:0 auto 32px; line-height:1.7; }
    .btn-white { background:#fff; color:#0066FF; font-weight:800; font-size:.95rem; padding:14px 36px; border-radius:14px; border:none; cursor:pointer; box-shadow:0 8px 24px rgba(255,255,255,.15); transition:all .2s; }
    .btn-white:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(255,255,255,.25); }
    .btn-ghost { background:rgba(255,255,255,.08); color:#CBD5E1; font-weight:700; font-size:.95rem; padding:14px 36px; border-radius:14px; border:1px solid rgba(255,255,255,.18); cursor:pointer; transition:all .2s; }
    .btn-ghost:hover { background:rgba(255,255,255,.15); }

    /* ── CIBIL SCORE GAUGE ── */
    .cibil-card { background:#fff; border:1.5px solid #EFF2F7; border-radius:20px; padding:32px; text-align:center; }
    .gauge-wrap { position:relative; width:180px; height:90px; margin:0 auto 20px; }
    .gauge-arc { width:180px; height:90px; border-radius:90px 90px 0 0; overflow:hidden; position:relative; }
    .gauge-bg { position:absolute; inset:0; background:conic-gradient(from 180deg at 50% 100%, #EF4444 0deg, #FBBF24 60deg, #34D399 120deg, transparent 180deg); border-radius:inherit; }
    .gauge-mask { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:130px; height:65px; background:#fff; border-radius:65px 65px 0 0; }
    .gauge-score { font-size:1.8rem; font-weight:900; color:#0A1628; }
    .gauge-label { font-size:.75rem; font-weight:700; color:#00975B; text-transform:uppercase; letter-spacing:.08em; }

    /* ── MOBILE RESPONSIVE ── */
    @media (max-width:991.98px) {
      .pl-hero { padding:120px 0 56px; }
      .hero-h1 { font-size:clamp(1.7rem,5vw,2.4rem); }
      .form-card { margin-top:40px; }
      .pl-section { padding:56px 0; }
      .pl-section-sm { padding:40px 0; }
      .cta-inner { padding:40px 20px; }
      .step-line { display:none; }
    }
    @media (max-width:575.98px) {
      .pl-hero { padding:100px 0 48px; }
      .stat-num { font-size:1.6rem; }
      .stat-card-dark { padding:20px 12px; }
      .feat-card { padding:20px 18px; }
      .testi-card { padding:20px; }
      .emi-card-header, .form-body { padding:18px 20px; }
    }

    /* ── FLOATING CTA (Mobile sticky) ── */
    .mobile-sticky-apply { display:none; }
    @media (max-width:991.98px) {
      .mobile-sticky-apply {
        display:block; position:fixed; bottom:0; left:0; right:0; z-index:999;
        background:#fff; border-top:1px solid #E5E9EF; padding:12px 20px;
        box-shadow:0 -4px 24px rgba(0,0,0,.12);
      }
    }

    /* ── LOAN TYPE TABS ── */
    .loan-tab-strip { background:#fff; border-bottom:2px solid #EFF2F7; }
    .loan-tab { border:none; background:transparent; padding:14px 20px; font-size:.82rem; font-weight:700; color:#6B7280; cursor:pointer; border-bottom:2.5px solid transparent; transition:all .2s; white-space:nowrap; }
    .loan-tab.active { color:#0066FF; border-bottom-color:#0066FF; }

    /* ── BADGE ── */
    .green-badge { display:inline-flex; align-items:center; gap:4px; background:#E8FBF7; color:#00975B; font-size:.68rem; font-weight:800; padding:3px 10px; border-radius:999px; }
    .blue-badge { display:inline-flex; align-items:center; gap:4px; background:#EBF3FF; color:#0066FF; font-size:.68rem; font-weight:800; padding:3px 10px; border-radius:999px; }
    .tag { display:inline-flex; padding:3px 10px; border-radius:6px; font-size:.68rem; font-weight:700; }
    .tag-green { background:#E8FBF7; color:#00975B; }
    .tag-orange { background:#FFF3EB; color:#D45A1A; }

    /* ── TRUST ROW ── */
    .trust-row { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:28px; padding:20px 0; }
    .trust-item { display:flex; align-items:center; gap:8px; }
    .trust-item-icon { width:36px; height:36px; border-radius:10px; background:#EBF3FF; display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
    .trust-item-text { font-size:.8rem; font-weight:700; color:#374151; }

    /* ── OVERVIEW INFO CARD ── */
    .info-card-blue { background:linear-gradient(135deg,#0066FF,#0047CC); border-radius:20px; padding:28px; color:#fff; }
    .info-card-blue h5 { font-size:1.05rem; font-weight:800; margin-bottom:18px; }
    .info-point { display:flex; gap:10px; margin-bottom:14px; font-size:.87rem; line-height:1.55; }
    .info-point-dot { width:8px; height:8px; border-radius:50%; background:#93C5FD; margin-top:5px; flex-shrink:0; }

    /* ── COMPARE CARD ── */
    .compare-card { background:linear-gradient(135deg,#F8FBFF,#EBF3FF); border:1.5px solid #BFD7FF; border-radius:20px; padding:24px; }
    .compare-num { font-size:2.4rem; font-weight:900; color:#0A1628; line-height:1; }
    .compare-label { font-size:.7rem; font-weight:700; color:#6B7280; text-transform:uppercase; letter-spacing:.08em; }

    /* ── SCROLLBAR HIDE (carousel) ── */
    .scroll-x-hide { overflow-x:auto; scrollbar-width:none; }
    .scroll-x-hide::-webkit-scrollbar { display:none; }
  `}</style>
)

/* ─────────────────────────────────────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────────────────────────────────────── */
function HeroSection({ city }: { city?: string }) {
  const [step, setStep] = useState<1 | 3>(1)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const appId = useRef(`TS-${Math.floor(Math.random() * 90000) + 10000}`)
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<LeadFormData>({ resolver: zodResolver(leadFormSchema) })
  const vals = watch()

  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const citySearch = vals.city || ""
  const filteredCities = citySearch.length >= 3 
    ? maharashtraCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())) 
    : []

  useEffect(() => {
    try { 
      const s = localStorage.getItem("_pld"); 
      if (s) { 
        const p = JSON.parse(s); 
        Object.keys(p).forEach(k => setValue(k as any, p[k])) 
      } 
    } catch (_) {}
    if (city) {
      const cityFormatted = city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      setValue("city", cityFormatted);
    }
  }, [setValue, city])

  useEffect(() => {
    try { localStorage.setItem("_pld", JSON.stringify(vals)) } catch (_) {}
    const f = Object.values(vals).filter(v => v && v !== "").length
    setProgress((f / 6) * 100)
  }, [vals])

  const onSubmit = async (data: LeadFormData) => {
    setSubmitting(true)
    try {
      const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, source: "Website - Personal Loan (Premium)" }) })
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed") }
      localStorage.removeItem("_pld"); setStep(3)
    } catch (e: any) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <section className="pl-hero" id="personal-loan-form">
      <div className="hero-grid-bg" />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="row align-items-center g-5">

          {/* LEFT */}
          <div className="col-lg-7" data-reveal="left">
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="hero-pill">⭐ India's Most Trusted Loan Platform</span>
              <span className="hero-pill">🛡️ RBI Regulated Partners</span>
            </div>
            <h1 className="hero-h1 mb-3">
              Get Instant{" "}
              <span className="accent-blue">Personal Loan</span>
              {city && <span> in {city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>}
              <br />Up to <span className="accent-green">₹50 Lakhs</span>
            </h1>
            <p style={{ color: "#475569", fontSize: ".95rem", lineHeight: 1.6, maxWidth: 500, marginBottom: 24, fontWeight: 500 }}>
              Compare 50+ banks &amp; NBFCs, check eligibility in 2 minutes, get instant approval &amp; funds within 24 hours. Fully online — no branch visit needed.
            </p>

            <div className="hero-feat-row mb-3" style={{ maxWidth: 460 }}>
              {[
                { icon: "🏦", text: "100+ Lending Partners" },
                { icon: "⚡", text: "Disbursal in 24 Hours" },
                { icon: "🔒", text: "No Collateral Required" },
                { icon: "👤", text: "10 Lakh+ Happy Customers" },
              ].map(item => (
                <div key={item.text} className="hero-feat">
                  <span className="hero-feat-icon">{item.icon}</span>
                  <span className="hero-feat-text">{item.text}</span>
                  <span style={{ marginLeft: "auto", color: "#34D399", fontSize: ".8rem" }}>✓</span>
                </div>
              ))}
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <a href="#calculator" style={{ background: "linear-gradient(135deg, #0066FF 0%, #0047b3 100%)", color: "#fff", padding: "13px 28px", borderRadius: 12, fontWeight: 800, fontSize: ".88rem", textDecoration: "none", boxShadow: "0 8px 24px rgba(0,102,255,.35)", transition: "all .2s" }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                📊 EMI Calculator
              </a>
              <a href="#how-it-works" style={{ background: "#fff", color: "#334155", padding: "13px 28px", borderRadius: 12, fontWeight: 700, fontSize: ".88rem", textDecoration: "none", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,.03)", transition: "all .2s" }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                How It Works ↓
              </a>
            </div>
            
            <div className="d-flex flex-wrap gap-2 mt-2">
              <a href="tel:7020646007" style={{ background: "#fff", color: "#0A1628", padding: "13px 24px", borderRadius: 12, fontWeight: 800, fontSize: ".88rem", textDecoration: "none", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,.03)", display: "flex", alignItems: "center", gap: "8px", transition: "transform .2s" }} onMouseOver={e => {e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.06)'}} onMouseOut={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.03)'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: "#0066FF"}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> 
                CALL: 7020646007
              </a>
              <a href="https://wa.me/917020646007" target="_blank" rel="noopener noreferrer" style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff", padding: "13px 24px", borderRadius: 12, fontWeight: 800, fontSize: ".88rem", textDecoration: "none", boxShadow: "0 8px 24px rgba(37,211,102,.25)", display: "flex", alignItems: "center", gap: "8px", transition: "transform .2s" }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> 
                WHATSAPP
              </a>
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="col-lg-5" data-reveal="right">
            <div className="form-card">
              {step === 1 ? (
                <>
                  <div className="form-header">
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ fontSize: "1.6rem" }}>🛡️</span>
                      <div>
                        <h4>Get Free Loan Quotes →</h4>
                        <p>🔒 100% Secure &amp; Private • No CIBIL Impact</p>
                      </div>
                    </div>
                    <div className="form-progress mt-3">
                      <div className="form-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="form-body">
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="mb-3">
                        <label className="fl-label">Full Name</label>
                        <input className={`fl-input${errors.fullName ? " has-err" : ""}`} placeholder="Your Full Name" {...register("fullName")} />
                        {errors.fullName && <p className="fl-error">{errors.fullName.message}</p>}
                      </div>
                      <div className="mb-3">
                        <label className="fl-label">Mobile Number</label>
                        <input 
                          type="tel"
                          maxLength={10}
                          className={`fl-input${errors.mobileNumber ? " has-err" : ""}`} 
                          placeholder="10-digit mobile" 
                          {...register("mobileNumber", {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                            }
                          })} 
                        />
                        {errors.mobileNumber && <p className="fl-error">{errors.mobileNumber.message}</p>}
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <label className="fl-label">Monthly Income</label>
                          <input type="number" className={`fl-input${errors.monthlyIncome ? " has-err" : ""}`} placeholder="₹ Amount" {...register("monthlyIncome")} />
                        </div>
                        <div className="col-6">
                          <label className="fl-label">Employment</label>
                          <select className={`fl-input${errors.employmentType ? " has-err" : ""}`} {...register("employmentType")} style={{ appearance: "auto" }}>
                            <option value="">Select</option>
                            <option value="Salaried">Salaried</option>
                            <option value="Self-Employed">Self-Employed</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-4" style={{ position: "relative" }}>
                        <label className="fl-label">City</label>
                        <input 
                          className={`fl-input${errors.city ? " has-err" : ""}`} 
                          placeholder="Your city" 
                          {...register("city")} 
                          onFocus={() => setShowCityDropdown(true)}
                          onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                          autoComplete="off"
                        />
                        {showCityDropdown && filteredCities.length > 0 && (
                          <ul style={{
                            position: "absolute", top: "100%", left: 0, right: 0, 
                            background: "#fff", border: "1px solid #E5E9EF", 
                            borderRadius: 8, marginTop: 4, zIndex: 50, 
                            maxHeight: 200, overflowY: "auto", padding: 0, 
                            listStyle: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                          }}>
                            {filteredCities.map(c => (
                              <li 
                                key={c} 
                                style={{ padding: "10px 14px", cursor: "pointer", fontSize: ".88rem", borderBottom: "1px solid #F1F5F9", color: "#111827" }}
                                onMouseDown={() => { setValue("city", c, { shouldValidate: true }); setShowCityDropdown(false) }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FBFF")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                {c}
                              </li>
                            ))}
                          </ul>
                        )}
                        {errors.city && <p className="fl-error">{errors.city.message}</p>}
                      </div>
                      <button type="submit" className="btn-apply" disabled={submitting}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : "Get Free Loan Quotes →"}
                      </button>
                      <p style={{ fontSize: ".67rem", color: "#94A3B8", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
                        By submitting, you agree to our Terms &amp; Conditions and authorize us to contact you.
                      </p>
                    </form>

                    <div style={{ borderTop: "1px solid #F1F5F9", marginTop: 16, paddingTop: 14, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
                      {["🏦 50+ Banks", "✅ No Hidden Fees", "⚡ 24 Hr Disbursal"].map(b => (
                        <span key={b} style={{ fontSize: ".72rem", color: "#6B7280", fontWeight: 600 }}>{b}</span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: "48px 32px", textAlign: "center" }}>
                  <Confetti width={typeof window !== "undefined" ? window.innerWidth : 300} height={typeof window !== "undefined" ? window.innerHeight : 800} recycle={false} numberOfPieces={500} />
                  <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#E8FBF7,#D1FAE5)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>✅</div>
                  <h3 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#0A1628", marginBottom: 8 }}>Inquiry Submitted!</h3>
                  <p style={{ color: "#6B7280", marginBottom: 20 }}>Our loan expert will call you within <strong>15 minutes</strong>.</p>
                  <button onClick={() => setStep(1)} style={{ width: "100%", background: "#0066FF", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 800, cursor: "pointer", fontSize: ".9rem" }}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PARTNERS STRIP
───────────────────────────────────────────────────────────────────────────── */
function PartnersStrip() {
  const banks = ["HDFC Bank", "ICICI Bank", "Axis Bank", "SBI", "Kotak", "Bajaj Finserv", "IndusInd", "YES Bank", "IDFC First", "Tata Capital"]
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "18px 0" }}>
      <div className="container">
        <div className="d-flex align-items-center gap-3">
          <span style={{ fontSize: ".7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em", flexShrink: 0 }}>Partners:</span>
          <div className="scroll-x-hide d-flex gap-4 align-items-center">
            {banks.map(b => (
              <div key={b} style={{ background: "#F8FAFB", border: "1px solid #E5E9EF", borderRadius: 10, padding: "7px 16px", fontWeight: 800, fontSize: ".75rem", color: "#374151", flexShrink: 0, whiteSpace: "nowrap" }}>{b}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATS STRIP
───────────────────────────────────────────────────────────────────────────── */
function StatsStrip() {
  return (
    <section className="stats-strip">
      <div className="container">
        <div className="row g-4">
          {[
            { num: 10.5, suffix: "%", label: "Interest Rate Starting At", icon: "📉", color: "#60AFFF" },
            { num: 92, suffix: "%", label: "Approval Rate", icon: "✅", color: "#34D399" },
            { num: 50, prefix: "₹", suffix: " L", label: "Maximum Loan Amount", icon: "💰", color: "#FBBF24" },
            { num: 24, suffix: " Hrs", label: "Average Disbursal Time", icon: "⚡", color: "#A78BFA" },
          ].map((s, i) => (
            <div key={s.label} className="col-6 col-lg-3" data-reveal="up" data-delay={String(i + 1)}>
              <div className="stat-card-dark">
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>{s.icon}</div>
                <div className="stat-num" style={{ color: s.color }}>
                  <Counter end={s.num} prefix={s.prefix || ""} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   OVERVIEW SECTION
───────────────────────────────────────────────────────────────────────────── */
function OverviewSection() {
  const uses = [
    { icon: "🏥", text: "Medical Emergencies" }, { icon: "🏠", text: "Home Renovation" },
    { icon: "💍", text: "Wedding Expenses" }, { icon: "🎓", text: "Higher Education" },
    { icon: "✈️", text: "International Travel" }, { icon: "💼", text: "Business Needs" },
  ]
  return (
    <section className="pl-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="row g-5 align-items-start">
          <div className="col-lg-7" data-reveal="left">
            <span className="section-chip">📖 Overview</span>
            <h2 className="pl-section-title mb-4">What is a Personal Loan?</h2>
            <p style={{ color: "#6B7280", lineHeight: 1.8, marginBottom: 16, fontSize: ".95rem" }}>
              A Personal Loan is an <strong style={{ color: "#0A1628" }}>unsecured credit facility</strong> offered by banks and NBFCs without requiring any collateral. It's India's most flexible financial product — you can use the funds for any purpose.
            </p>
            <p style={{ color: "#6B7280", lineHeight: 1.8, marginBottom: 28, fontSize: ".95rem" }}>
              Repayment is structured as <strong style={{ color: "#0A1628" }}>fixed monthly EMIs</strong> over 12 to 84 months. Banks primarily evaluate your income stability, credit score, and employment type. A <strong style={{ color: "#0066FF" }}>CIBIL score of 720+</strong> unlocks the best interest rates.
            </p>

            <h5 style={{ fontWeight: 800, color: "#0A1628", marginBottom: 16, fontSize: ".92rem" }}>Popular Use Cases</h5>
            <div className="row g-3">
              {uses.map((u, i) => (
                <div key={u.text} className="col-12 col-sm-6" data-reveal="up" data-delay={String((i % 3) + 1)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#F8FBFF", border: "1.5px solid #EFF2F7", borderRadius: 12, transition: "all .2s", cursor: "default" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#BFD7FF"; (e.currentTarget as HTMLElement).style.background = "#EBF3FF" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#EFF2F7"; (e.currentTarget as HTMLElement).style.background = "#F8FBFF" }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{u.icon}</span>
                    <span style={{ fontWeight: 700, color: "#374151", fontSize: ".88rem" }}>{u.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-5" data-reveal="right">
            <div className="info-card-blue mb-4">
              <h5>🏆 Why Compare with Us?</h5>
              {[
                "Access to 100+ lending partners",
                "Unbiased comparison of interest rates",
                "End-to-end application support",
                "Zero hidden charges — ever",
                "100% paperless, digital process",
                "Dedicated loan expert assistance",
              ].map(item => (
                <div key={item} className="info-point">
                  <div className="info-point-dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="compare-card text-center" data-reveal="zoom" data-delay="2">
              <p style={{ fontSize: ".72rem", fontWeight: 800, color: "#0066FF", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Starting Interest Rate</p>
              <div className="compare-num">10.5%</div>
              <div className="compare-label mt-1">per annum onwards</div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="green-badge">✓ No Collateral</span>
                <span className="blue-badge">⚡ Instant Approval</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPARISON TABLE
───────────────────────────────────────────────────────────────────────────── */
function ComparisonTable() {
  const banks = [
    { name: "HDFC Bank", rate: "10.50%", max: "₹40 L", tenure: "60 mo", fee: "2.5%", tag: "Popular" },
    { name: "ICICI Bank", rate: "10.65%", max: "₹50 L", tenure: "72 mo", fee: "2.25%", tag: "Best Amount" },
    { name: "Axis Bank", rate: "10.49%", max: "₹40 L", tenure: "60 mo", fee: "2%", tag: "Lowest Rate" },
    { name: "Kotak Mahindra", rate: "10.99%", max: "₹40 L", tenure: "60 mo", fee: "2.5%", tag: "" },
    { name: "SBI", rate: "11.05%", max: "₹20 L", tenure: "84 mo", fee: "1.5%", tag: "Longest Tenure" },
    { name: "Bajaj Finserv", rate: "11.00%", max: "₹35 L", tenure: "84 mo", fee: "3.99%", tag: "" },
  ]
  return (
    <section className="pl-section" style={{ background: "#F8FAFB" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">🏦 Compare</span>
          <h2 className="pl-section-title">Bank-wise Personal Loan Rates</h2>
          <p className="pl-section-sub">Compare interest rates, loan amounts &amp; processing fees from top lenders.</p>
        </div>
        <div className="pl-table-wrap" data-reveal="up" data-delay="1">
          <div style={{ overflowX: "auto" }}>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Bank / NBFC</th>
                  <th>Interest Rate</th>
                  <th>Max Amount</th>
                  <th>Max Tenure</th>
                  <th>Processing Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {banks.map(b => (
                  <tr key={b.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="bank-chip">{b.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0A1628", fontSize: ".88rem" }}>{b.name}</div>
                          {b.tag && <span className="tag tag-green">{b.tag}</span>}
                        </div>
                      </div>
                    </td>
                    <td><span className="rate-green">{b.rate}</span> <span style={{ fontSize: ".72rem", color: "#94A3B8" }}>p.a.</span></td>
                    <td style={{ fontWeight: 700, color: "#0A1628" }}>{b.max}</td>
                    <td style={{ color: "#6B7280" }}>{b.tenure}</td>
                    <td style={{ color: "#6B7280" }}>{b.fee}</td>
                    <td><button className="btn-apply-sm" onClick={() => document.getElementById("personal-loan-form")?.scrollIntoView({ behavior: "smooth" })}>Apply →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: ".72rem", color: "#94A3B8" }}>
          *Indicative rates. Actual rates may vary based on profile. Last updated June 2025.
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMI CALCULATOR
───────────────────────────────────────────────────────────────────────────── */
function EMICalculator() {
  const [amt, setAmt] = useState(500000)
  const [rate, setRate] = useState(10.5)
  const [tenure, setTenure] = useState(5)
  const [tenureType, setTenureType] = useState<"years" | "months">("years")
  const mo = tenureType === "years" ? tenure * 12 : tenure
  const r = rate / 12 / 100
  const emi = r > 0 ? Math.round((amt * r * Math.pow(1 + r, mo)) / (Math.pow(1 + r, mo) - 1)) : Math.round(amt / mo)
  const total = emi * mo
  const interest = total - amt
  const pp = Math.max(2, Math.round((amt / total) * 100))
  const ip = 100 - pp
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 })

  const Slider = ({ label, value, min, max, step, onChange, display, marks }: any) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="slider-label">{label}</span>
        <span className="slider-value">{display}</span>
      </div>
      <input type="range" className="pl-range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "#94A3B8", marginTop: 4 }}>
        <span>{marks[0]}</span><span>{marks[1]}</span>
      </div>
    </div>
  )

  return (
    <section id="calculator" className="pl-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">📊 Calculator</span>
          <h2 className="pl-section-title">Personal Loan EMI Calculator</h2>
          <p className="pl-section-sub">Instantly calculate your EMI, total interest, and total payment.</p>
        </div>
        <div className="row g-4">
          <div className="col-lg-6" data-reveal="left">
            <div className="emi-card h-100">
              <div className="emi-card-header d-flex align-items-center gap-2">
                <span style={{ fontSize: "1.3rem" }}>🧮</span>
                <h5>Adjust Your Loan Parameters</h5>
              </div>
              <div style={{ padding: "28px" }}>
                <Slider label="Loan Amount" value={amt} min={50000} max={5000000} step={10000} onChange={setAmt} display={fmt(amt)} marks={["₹50K", "₹50L"]} />
                <Slider label="Interest Rate (% p.a.)" value={rate} min={8} max={36} step={0.1} onChange={setRate} display={`${rate.toFixed(1)}%`} marks={["8%", "36%"]} />
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="slider-label">Tenure</span>
                      <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 999, padding: 3 }}>
                        {(["years", "months"] as const).map(t => (
                          <button key={t} onClick={() => { setTenureType(t); setTenure(t === "years" ? 5 : 60) }}
                            style={{ border: "none", borderRadius: 999, padding: "4px 14px", fontSize: ".68rem", fontWeight: 800, background: tenureType === t ? "#0066FF" : "transparent", color: tenureType === t ? "#fff" : "#6B7280", cursor: "pointer", textTransform: "capitalize", transition: "all .2s" }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="slider-value">{tenure} {tenureType === "years" ? "Yr" : "Mo"}</span>
                  </div>
                  <input type="range" className="pl-range" min={1} max={tenureType === "years" ? 7 : 84} step={1} value={tenure} onChange={e => setTenure(Number(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "#94A3B8", marginTop: 4 }}><span>1</span><span>{tenureType === "years" ? "7 Yrs" : "84 Mo"}</span></div>
                </div>

                <div className="row g-3">
                  {[
                    { label: "Monthly EMI", val: fmt(emi), bg: "#EBF3FF", c: "#0066FF", tc: "#0A1628" },
                    { label: "Total Interest", val: fmt(interest), bg: "#FFF8EB", c: "#D97706", tc: "#0A1628" },
                    { label: "Total Payment", val: fmt(total), bg: "#0A1628", c: "#94A3B8", tc: "#fff" },
                  ].map(b => (
                    <div key={b.label} className="col-4">
                      <div className="result-box" style={{ background: b.bg }}>
                        <div className="result-box-label" style={{ color: b.c }}>{b.label}</div>
                        <div className="result-box-val" style={{ color: b.tc, fontSize: ".85rem" }}>{b.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6" data-reveal="right">
            <div className="emi-card h-100" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="emi-card-header w-100 text-center">
                <h5 style={{ textAlign: "center" }}>📊 Payment Breakup</h5>
              </div>
              <div style={{ padding: "32px 28px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Donut */}
                <div style={{ position: "relative", width: 200, height: 200, borderRadius: "50%", background: `conic-gradient(#0066FF 0% ${pp}%, #FFB800 ${pp}% 100%)`, marginBottom: 24, flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 132, height: 132, background: "#fff", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 8px rgba(0,0,0,.06)" }}>
                    <span style={{ fontSize: ".6rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Monthly</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0A1628" }}>{fmt(emi)}</span>
                    <span style={{ fontSize: ".6rem", color: "#94A3B8" }}>EMI</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 36, marginBottom: 28 }}>
                  {[{ c: "#0066FF", l: "Principal", v: `${pp}%` }, { c: "#FFB800", l: "Interest", v: `${ip}%` }].map(d => (
                    <div key={d.l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: d.c }} />
                      <div>
                        <div style={{ fontSize: ".65rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>{d.l}</div>
                        <div style={{ fontSize: ".9rem", fontWeight: 900, color: "#0A1628" }}>{d.v}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ width: "100%" }}>
                  {[
                    { l: "Principal Amount", v: fmt(amt), c: "#0066FF" },
                    { l: "Total Interest", v: fmt(interest), c: "#FFB800" },
                    { l: "Total Payable", v: fmt(total), c: "#00B894" },
                  ].map(row => (
                    <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: row.c }} />
                        <span style={{ fontSize: ".84rem", color: "#6B7280" }}>{row.l}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: "#0A1628", fontSize: ".88rem" }}>{row.v}</span>
                    </div>
                  ))}
                </div>

                <a href="#personal-loan-form" onClick={e => { e.preventDefault(); document.getElementById("personal-loan-form")?.scrollIntoView({ behavior: "smooth" }) }}
                  style={{ marginTop: 24, width: "100%", background: "linear-gradient(135deg,#0066FF,#0047CC)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 800, cursor: "pointer", fontSize: ".88rem", textDecoration: "none", display: "block", textAlign: "center", boxShadow: "0 8px 24px rgba(0,102,255,.3)" }}>
                  Apply for This Loan →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURES SECTION
───────────────────────────────────────────────────────────────────────────── */
function FeaturesSection() {
  const feats = [
    {
      icon: "🛡️", title: "No Collateral Needed", pill: "100% Unsecured",
      desc: "Personal loans are 100% unsecured. No need to pledge gold, property, or any other asset.",
      accent: "#0066FF", bg: "#EBF3FF", shadow: "rgba(0,102,255,.18)",
    },
    {
      icon: "⚡", title: "Funds in 24 Hours", pill: "Instant Disbursal",
      desc: "Post-approval, loan amount is credited directly to your bank account within 24 hours.",
      accent: "#F59E0B", bg: "#FFF8EB", shadow: "rgba(245,158,11,.18)",
    },
    {
      icon: "📅", title: "Flexible Repayment", pill: "12 – 84 Months",
      desc: "Choose your EMI tenure from 12 to 84 months. Longer tenure means a lower monthly EMI.",
      accent: "#8B5CF6", bg: "#F3EEFF", shadow: "rgba(139,92,246,.18)",
    },
    {
      icon: "📄", title: "Minimal Documents", pill: "4 Docs Only",
      desc: "Just PAN, Aadhaar, income proof & bank statement. Upload digitally in minutes.",
      accent: "#10B981", bg: "#E8FBF7", shadow: "rgba(16,185,129,.18)",
    },
    {
      icon: "📊", title: "Fixed Monthly EMI", pill: "Zero Surprises",
      desc: "Know exactly what you pay every month. No surprises, no variable payments, ever.",
      accent: "#EF4444", bg: "#FEF2F2", shadow: "rgba(239,68,68,.18)",
    },
    {
      icon: "🌐", title: "100% Online Process", pill: "No Branch Visit",
      desc: "Apply from your phone. No branch visits, no queues, no paperwork — ever.",
      accent: "#06B6D4", bg: "#ECFEFF", shadow: "rgba(6,182,212,.18)",
    },
    {
      icon: "🔄", title: "Balance Transfer", pill: "Save on Interest",
      desc: "Move your existing high-interest personal loan to a lender offering lower rates.",
      accent: "#F97316", bg: "#FFF4EE", shadow: "rgba(249,115,22,.18)",
    },
    {
      icon: "📈", title: "Top-up Available", pill: "Extra Funds",
      desc: "Already have a loan? Apply for additional funds on top of your existing personal loan.",
      accent: "#0066FF", bg: "#EBF3FF", shadow: "rgba(0,102,255,.18)",
    },
  ]

  return (
    <section
      id="features"
      className="pl-section"
      style={{
        padding: "80px 0",
        background: "linear-gradient(180deg, #F0F5FF 0%, #F8FAFB 100%)",
        position: "relative",
      }}
    >
      {/* decorative blobs */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="text-center mb-5">
          <span className="section-chip">✨ Features</span>
          <h2 className="pl-section-title">Why Choose a Personal Loan?</h2>
          <p className="pl-section-sub">8 powerful reasons why thousands of Indians trust us for their financial needs.</p>
        </div>

        <div className="row g-4">
          {feats.map((f, i) => (
            <div
              key={f.title}
              className="col-12 col-sm-6 col-lg-3"
            >
              <div className="feat-card" data-reveal="up" style={{
                "--feat-accent": f.accent,
                "--feat-bg": f.bg,
                "--feat-shadow": f.shadow,
              } as React.CSSProperties}
              >
                {/* Number badge */}
                <div className="feat-num">{String(i + 1).padStart(2, "0")}</div>

                {/* Icon box */}
                <div className="feat-icon-wrap">
                  <span>{f.icon}</span>
                </div>

                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>

                {/* Hover pill */}
                <div className="feat-pill">
                  <span>✓</span> {f.pill}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PURPOSE SECTION
───────────────────────────────────────────────────────────────────────────── */
function PurposeSection() {
  const ps = [
    { icon: "💍", label: "Wedding Expenses", bg: "#FDF2F8", border: "#F9A8D4" },
    { icon: "🏥", label: "Medical Emergency", bg: "#FEF2F2", border: "#FCA5A5" },
    { icon: "🏠", label: "Home Renovation", bg: "#EBF3FF", border: "#93C5FD" },
    { icon: "✈️", label: "Dream Vacation", bg: "#F0FDFA", border: "#5EEAD4" },
    { icon: "🎓", label: "Higher Education", bg: "#EEF2FF", border: "#A5B4FC" },
    { icon: "📱", label: "Gadget Purchase", bg: "#F8FAFC", border: "#CBD5E1" },
    { icon: "🏋️", label: "Fitness & Wellness", bg: "#FFF0F5", border: "#FCA5A5" },
    { icon: "💼", label: "Business Needs", bg: "#F0FDF4", border: "#86EFAC" },
  ]
  return (
    <section className="pl-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">🎯 Purpose</span>
          <h2 className="pl-section-title">What&apos;s Your Financial Goal?</h2>
          <p className="pl-section-sub">From emergencies to dreams — personal loans fund every life milestone.</p>
        </div>
        <div className="row g-3">
          {ps.map((p, i) => (
            <div key={p.label} className="col-6 col-sm-3"
              data-reveal={i < 4 ? "left" : "right"}
              data-delay={String((i % 4) + 1)}
            >
              <div className="purpose-card" style={{ background: p.bg, borderColor: p.border }}>
                <div className="purpose-icon">{p.icon}</div>
                <div className="purpose-label">{p.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ELIGIBILITY + CIBIL SECTION
───────────────────────────────────────────────────────────────────────────── */
function EligibilitySection() {
  const [tab, setTab] = useState<0 | 1>(0)
  const salaried = [
    { l: "Age", v: "21 – 60 years" }, { l: "Monthly Income", v: "₹15,000+ (metro: ₹25,000+)" },
    { l: "Employment", v: "Min. 1 year work experience" }, { l: "Credit Score", v: "720+ recommended" },
    { l: "Employer Type", v: "Private, Govt, MNC preferred" },
  ]
  const self = [
    { l: "Business Age", v: "Min. 3 years continuity" }, { l: "Annual Income", v: "ITR ₹5 Lakh+ p.a." },
    { l: "Age", v: "25 – 65 years" }, { l: "Bank Activity", v: "Consistent transactions" },
    { l: "Business Type", v: "Proprietorship, Partnership, Pvt Ltd" },
  ]
  const docs = [
    { icon: "🪪", label: "PAN Card" }, { icon: "📱", label: "Aadhaar Card" },
    { icon: "💼", label: "Salary Slips" }, { icon: "🏠", label: "Address Proof" },
    { icon: "🏦", label: "Bank Statements (6 months)" }, { icon: "📸", label: "Passport Photo" },
  ]
  return (
    <section className="pl-section" style={{ background: "#F8FAFB" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">✅ Eligibility</span>
          <h2 className="pl-section-title">Who Can Apply?</h2>
          <p className="pl-section-sub">Check if you qualify for an instant personal loan in under 2 minutes.</p>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-lg-6" data-reveal="left">
            <div style={{ background: "#fff", border: "1.5px solid #EFF2F7", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
                <div className="elig-tabs">
                  <button className={`elig-tab${tab === 0 ? " active" : ""}`} onClick={() => setTab(0)}>👔 Salaried</button>
                  <button className={`elig-tab${tab === 1 ? " active" : ""}`} onClick={() => setTab(1)}>💼 Self-Employed</button>
                </div>
              </div>
              <div style={{ padding: "8px 24px 24px" }}>
                {(tab === 0 ? salaried : self).map(item => (
                  <div key={item.l} className="elig-item">
                    <span className="elig-item-label">{item.l}</span>
                    <span className="elig-item-val">{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-6" data-reveal="right">
            {/* CIBIL Card */}
            <div className="cibil-card mb-4">
              <h6 style={{ fontWeight: 800, color: "#0A1628", marginBottom: 20, fontSize: ".92rem" }}>📊 Why CIBIL Score Matters</h6>
              <div className="gauge-wrap">
                <div className="gauge-arc">
                  <div className="gauge-bg" />
                  <div className="gauge-mask" />
                </div>
              </div>
              <div className="gauge-score">720+</div>
              <div className="gauge-label">Excellent Score</div>
              <div style={{ marginTop: 20 }}>
                {[
                  { range: "720+", label: "Excellent", desc: "Best rates & highest approval chance", color: "#00975B", bg: "#E8FBF7" },
                  { range: "700–749", label: "Good", desc: "Standard rates, likely approved", color: "#0066FF", bg: "#EBF3FF" },
                  { range: "650–699", label: "Fair", desc: "Limited options, higher rates", color: "#D97706", bg: "#FFF8EB" },
                  { range: "<650", label: "Poor", desc: "Difficult to get unsecured loan", color: "#DC2626", bg: "#FEF2F2" },
                ].map(s => (
                  <div key={s.range} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: s.bg, borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 800, color: s.color, fontSize: ".82rem" }}>{s.range}</span>
                      <span style={{ fontSize: ".72rem", color: "#6B7280", marginLeft: 8 }}>{s.desc}</span>
                    </div>
                    <span style={{ fontSize: ".7rem", fontWeight: 800, color: s.color }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h4 style={{ fontWeight: 900, textAlign: "center", color: "#0A1628", marginBottom: 24 }} data-reveal="up">Documents Required</h4>
        <div className="row g-3" data-reveal="up" data-delay="1">
          {docs.map((d, i) => (
            <div key={d.label} className="col-6 col-sm-4 col-lg-2">
              <div className="doc-card">
                <div className="doc-icon">{d.icon}</div>
                <div className="doc-label">{d.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROCESS SECTION
───────────────────────────────────────────────────────────────────────────── */
function ProcessSection() {
  const steps = [
    { icon: "📝", title: "Fill Form", desc: "Share basic details in 2 mins." },
    { icon: "✔️", title: "Eligibility Check", desc: "Instant results, no CIBIL hit." },
    { icon: "📤", title: "Upload Documents", desc: "Digital upload — 100% paperless." },
    { icon: "🔍", title: "Verification", desc: "Lender verifies details quickly." },
    { icon: "✅", title: "Approval", desc: "Get your final offer letter." },
    { icon: "💰", title: "Disbursement", desc: "Funds in your account in 24 hrs." },
  ]
  return (
    <section id="how-it-works" className="pl-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">🔄 How It Works</span>
          <h2 className="pl-section-title">Get Your Loan in 6 Easy Steps</h2>
          <p className="pl-section-sub">The entire process takes under 10 minutes — from application to approval.</p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 60 }}>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div key={s.title} className="col-6 col-lg-2" data-reveal="up" data-delay={String((i % 6) + 1)}>
                <div className="step-wrap text-center">
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="step-dot">{s.icon}</div>
                    <div className="step-num">{i + 1}</div>
                  </div>
                  {/* Connector line on desktop */}
                  <h6 style={{ fontWeight: 800, color: "#0A1628", fontSize: ".88rem", marginBottom: 6 }}>{s.title}</h6>
                  <p style={{ fontSize: ".75rem", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED POSTERS SECTION (1080x1350)
───────────────────────────────────────────────────────────────────────────── */
function AnimatedPostersSection() {
  const posters = [
    {
      imgSrc: "/img/instant-personal-loan-approval.webp",
      alt: "Apply for instant personal loan online with quick 2 hours approval - Techstar Money Solution",
      title: "Instant Approval in 2 Hours",
      desc: "Get fast approval on your personal loan application with our fully digital validation process.",
    },
    {
      imgSrc: "/img/low-interest-personal-loan-rates.webp",
      alt: "Check low interest personal loan rates starting at 10.49 percent - Techstar Money Solution",
      title: "Rates Starting at 10.49% p.a.",
      desc: "Get low interest rates from 50+ leading partner banks & NBFCs tailored to your income profile.",
    },
    {
      imgSrc: "/img/personal-loan-eligibility-documents.webp",
      alt: "Documents required for instant personal loan Aadhaar and PAN check - Techstar Money Solution",
      title: "100% Paperless Process",
      desc: "No physical documentation required. Just upload your PAN, Aadhaar, and bank statements online.",
    },
    {
      imgSrc: "/img/paperless-digital-loan-disbursal.webp",
      alt: "Enjoy paperless digital personal loan disbursal directly to bank account - Techstar Money Solution",
      title: "Swift 24-Hour Disbursal",
      desc: "Once approved, the loan amount is transferred directly to your bank account within 24 hours.",
    },
  ];

  return (
    <>
      <style>{`
        /* ── POSTERS CAROUSEL / GRID ── */
        .posters-section {
          padding: 60px 0;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          overflow: hidden;
        }
        .posters-container {
          max-width: 1560px;
          margin: 0 auto;
          padding: 0 15px;
        }
        .posters-slider-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          padding: 20px 5px 35px 5px;
        }
        
        @keyframes floatPoster {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        .poster-card-wrapper {
          width: 100%;
          min-width: 0;
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.03);
          border: none;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
          animation: floatPoster 6s ease-in-out infinite;
        }
        
        .poster-card-wrapper:nth-child(1) { animation-delay: 0s; }
        .poster-card-wrapper:nth-child(2) { animation-delay: 1.5s; }
        .poster-card-wrapper:nth-child(3) { animation-delay: 3s; }
        .poster-card-wrapper:nth-child(4) { animation-delay: 4.5s; }

        .poster-image-container {
          aspect-ratio: 1080 / 1350;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: #e2e8f0;
          position: relative;
        }
        .poster-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .poster-card-wrapper:hover {
          animation-play-state: paused;
          transform: translateY(-20px) scale(1.03);
          box-shadow: 0 30px 60px rgba(2, 132, 199, 0.15);
        }
        .poster-card-wrapper:hover .poster-image {
          transform: scale(1.08);
        }
        .poster-h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 10px;
          line-height: 1.4;
          margin-top: 20px;
          transition: color 0.3s ease;
        }
        .poster-card-wrapper:hover .poster-h3 {
          color: #0284c7;
        }
        .poster-desc {
          font-size: 0.95rem;
          color: #64748B;
          margin: 0;
          line-height: 1.6;
        }
        .seo-linking-box {
          background: #fff;
          border-radius: 20px;
          padding: 30px 40px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          margin-top: 50px;
        }
        .seo-linking-text {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.8;
          margin: 0;
        }
        .seo-link {
          color: #0284c7;
          text-decoration: none;
          font-weight: 700;
          border-bottom: 2px dashed rgba(2, 132, 199, 0.4);
          transition: color 0.2s, border-color 0.2s;
        }
        .seo-link:hover {
          color: #0369a1;
          border-bottom-style: solid;
          border-bottom-color: #0369a1;
        }
        @media (min-width: 640px) {
          .posters-slider-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
          }
        }
        @media (min-width: 992px) {
          .posters-section {
            padding: 100px 0;
          }
          .posters-container {
            padding: 0 40px;
          }
          .posters-slider-container {
            grid-template-columns: repeat(4, 1fr);
            gap: 32px;
            padding-bottom: 0;
          }
        }
      `}</style>

      <section id="loan-posters" className="posters-section">
        <div className="posters-container">
          <div className="text-center mb-5" data-reveal="up">
            <span className="section-chip">✨ Direct Benefits</span>
            <h2 className="pl-section-title">Instant Personal Loan Benefits & Features</h2>
            <p className="pl-section-sub">
              Explore why thousands of borrowers choose Techstar Money Solution for the best personal loan online.
            </p>
          </div>

          {/* Responsive Grid / Swiper */}
          <div className="posters-slider-container">
            {posters.map((p, idx) => (
              <div key={idx} className="poster-card-wrapper" data-reveal="up" data-delay={String(idx + 1)}>
                <div className="poster-image-container">
                  <img
                    src={p.imgSrc}
                    alt={p.alt}
                    className="poster-image"
                    width={1080}
                    height={1350}
                    loading="lazy"
                  />
                </div>
                <div className="poster-content text-center">
                  <h3 className="poster-h3">{p.title}</h3>
                  <p className="poster-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Internal Linking and SEO Content */}
          <div className="seo-linking-box mt-5 text-center" data-reveal="up">
            <p className="seo-linking-text">
              Looking for local personal loan services? We cover major cities including{" "}
              <a href="/personal-loan/maharashtra/mumbai-city" className="seo-link">Mumbai</a>,{" "}
              <a href="/personal-loan-pune" className="seo-link">Pune</a>, and{" "}
              <a href="/personal-loan/maharashtra/navi-mumbai" className="seo-link">Navi Mumbai</a>. 
              Need other financing options? Compare our low-interest <a href="/home-loan" className="seo-link">Home Loans</a> and{" "}
              <a href="/loan-against-property" className="seo-link">Loans Against Property</a> today.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPERT TIPS SECTION — STANDALONE PREMIUM
───────────────────────────────────────────────────────────────────────────── */
function ExpertTipsSection() {
  const tips = [
    { n: "01", icon: "📊", tip: "Maintain a CIBIL score of 720 or above before applying.",       highlight: "CIBIL 720+" },
    { n: "02", icon: "⚖️",  tip: "Keep your debt-to-income ratio below 40% for easy approval.",  highlight: "DTI < 40%" },
    { n: "03", icon: "🎯", tip: "Apply for a realistic loan amount based on your monthly income.", highlight: "Right Amount" },
    { n: "04", icon: "📁", tip: "Keep all KYC & income documents ready before you apply.",        highlight: "KYC Ready" },
    { n: "05", icon: "🚫", tip: "Avoid applying to multiple lenders simultaneously — it hurts your score.", highlight: "Single Apply" },
    { n: "06", icon: "🏦", tip: "Show consistent monthly income in your last 6 months' bank statements.", highlight: "Stable Income" },
  ]

  return (
    <>
      <style>{`
        /* ── EXPERT TIPS PREMIUM ── */
        .tips-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #0A1628 0%, #0D1F45 60%, #0A1628 100%);
          position: relative;
          overflow: hidden;
        }
        .tips-section::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(0,102,255,.18) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(251,191,36,.1) 0%, transparent 50%);
          pointer-events: none;
        }
        /* grid lines */
        .tips-section::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        .tips-header-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(251,191,36,.15);
          border: 1px solid rgba(251,191,36,.3);
          color: #FBD867;
          font-size: .72rem; font-weight: 800;
          letter-spacing: .12em; text-transform: uppercase;
          padding: 6px 20px; border-radius: 999px;
          margin-bottom: 16px;
        }
        .tips-heading {
          font-size: clamp(1.6rem, 3.5vw, 2.5rem);
          font-weight: 900;
          color: #fff;
          letter-spacing: -.02em;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .tips-heading span { color: #FBD867; }
        .tips-subtext {
          color: #94A3B8;
          font-size: .95rem;
          line-height: 1.7;
          max-width: 500px;
        }
        /* tip card */
        .tip-card {
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 20px;
          padding: 24px 22px;
          height: 100%;
          position: relative;
          overflow: hidden;
          transition: background .3s, border-color .3s, transform .35s cubic-bezier(.22,1,.36,1);
          cursor: default;
        }
        .tip-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(251,191,36,.08), transparent 60%);
          opacity: 0;
          transition: opacity .3s;
          pointer-events: none;
        }
        .tip-card:hover {
          background: rgba(255,255,255,.09);
          border-color: rgba(251,191,36,.35);
          transform: translateY(-8px);
        }
        .tip-card:hover::before { opacity: 1; }
        .tip-num-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 12px;
          background: rgba(251,191,36,.15);
          border: 1px solid rgba(251,191,36,.3);
          color: #FBD867;
          font-size: .8rem; font-weight: 900;
          margin-bottom: 14px;
          transition: background .3s;
          flex-shrink: 0;
        }
        .tip-card:hover .tip-num-badge {
          background: #FBD867;
          color: #0A1628;
        }
        .tip-icon {
          font-size: 1.4rem;
          margin-bottom: 10px;
          display: block;
          transition: transform .3s;
        }
        .tip-card:hover .tip-icon { transform: scale(1.2) rotate(-5deg); }
        .tip-highlight {
          font-size: .65rem; font-weight: 900;
          text-transform: uppercase; letter-spacing: .1em;
          color: #FBD867;
          margin-bottom: 8px;
        }
        .tip-text {
          font-size: .86rem; line-height: 1.65;
          color: rgba(255,255,255,.8);
        }
        /* promise banner */
        .promise-banner {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 20px;
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 56px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .promise-banner::before {
          content: '';
          position: absolute;
          left: -60px; top: -60px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251,191,36,.12), transparent 70%);
          pointer-events: none;
        }
        .promise-icon-wrap {
          width: 72px; height: 72px; border-radius: 20px;
          background: linear-gradient(135deg, #FBD867, #F59E0B);
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(251,191,36,.35);
          flex-shrink: 0;
          transition: transform .3s;
        }
        .promise-banner:hover .promise-icon-wrap { transform: scale(1.1) rotate(-6deg); }
        .promise-heading {
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          font-weight: 900; color: #fff;
          margin-bottom: 6px;
        }
        .promise-heading em { color: #FBD867; font-style: normal; }
        .promise-sub { font-size: .88rem; color: #94A3B8; line-height: 1.65; max-width: 480px; }
        .promise-badges { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .promise-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: .72rem; font-weight: 700;
          color: #CBD5E1;
        }
        .btn-promise {
          background: linear-gradient(135deg, #FBD867, #F59E0B);
          color: #0A1628; border: none;
          padding: 14px 32px; border-radius: 14px;
          font-size: .9rem; font-weight: 900;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 8px 24px rgba(251,191,36,.35);
          transition: transform .2s, box-shadow .2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-promise:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(251,191,36,.5);
          color: #0A1628;
        }
        @media (max-width: 575.98px) {
          .promise-banner { padding: 24px 20px; }
          .tip-card { padding: 20px 16px; }
        }
      `}</style>

      <section className="tips-section">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div className="row align-items-center g-5 mb-5">
            <div className="col-lg-6" data-reveal="left">
              <div className="tips-header-badge">💡 Expert Advice</div>
              <h2 className="tips-heading">
                Approval Tips That<br />
                <span>Actually Work</span>
              </h2>
              <p className="tips-subtext">
                आम्ही फक्त loan connect करत नाही — आम्ही तुमची काळजी घेतो.
                प्रत्येक customer ला market मधील <strong style={{ color: "#FBD867" }}>best possible offer</strong> मिळावी,
                यासाठी आम्ही झटतो.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                {["🏦 50+ Lenders Compared", "✅ Free Advisory", "⚡ Instant Matching"].map(b => (
                  <span key={b} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#CBD5E1", fontSize: ".72rem", fontWeight: 700, padding: "5px 14px", borderRadius: 999 }}>{b}</span>
                ))}
              </div>
            </div>
            <div className="col-lg-6" data-reveal="right">
              <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "28px 32px" }}>
                <p style={{ fontSize: ".72rem", fontWeight: 800, color: "#FBD867", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Our Promise to You</p>
                {[
                  { icon: "🎯", text: "We compare 50+ banks to find your lowest interest rate" },
                  { icon: "🔒", text: "Your personal data is never sold or shared" },
                  { icon: "💰", text: "Our service is completely free — zero advisory fees" },
                  { icon: "🤝", text: "Dedicated expert assigned to every application" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < 3 ? 16 : 0, paddingBottom: i < 3 ? 16 : 0, borderBottom: i < 3 ? "1px solid rgba(255,255,255,.07)" : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{p.icon}</div>
                    <p style={{ margin: 0, fontSize: ".88rem", color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tip Cards Grid */}
          <div className="row g-4">
            {tips.map((t, i) => (
              <div key={t.n} className="col-12 col-sm-6 col-lg-4"
                data-reveal={i % 3 === 0 ? "left" : i % 3 === 1 ? "up" : "right"}
                data-delay={String((i % 3) + 1)}
              >
                <div className="tip-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div className="tip-num-badge">{t.n}</div>
                    <span className="tip-icon">{t.icon}</span>
                    <span className="tip-highlight">{t.highlight}</span>
                  </div>
                  <p className="tip-text">{t.tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Promise Banner */}
          <div className="promise-banner" data-reveal="up" data-delay="2">
            <div className="promise-icon-wrap">🏆</div>
            <div style={{ flex: 1 }}>
              <div className="promise-heading">
                आम्ही काळजी घेतो — तुम्हाला <em>Market मधील Best Offer</em> देतो
              </div>
              <p className="promise-sub">
                Techstar Money Solution हे फक्त एक loan portal नाही — आम्ही तुमचे financial partners आहोत.
                50+ lenders मधून तुमच्यासाठी सर्वात कमी interest rate आणि best terms negotiate करतो.
              </p>
              <div className="promise-badges">
                {["✅ No Hidden Charges", "🔒 100% Transparent", "⭐ 4.8/5 Rating", "🎯 Best Rate Guaranteed"].map(b => (
                  <span key={b} className="promise-badge">{b}</span>
                ))}
              </div>
            </div>
            <a href="#personal-loan-form"
              className="btn-promise"
              onClick={(e) => { e.preventDefault(); document.getElementById("personal-loan-form")?.scrollIntoView({ behavior: "smooth" }) }}
            >
              Get My Best Offer →
            </a>
          </div>

        </div>
      </section>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────────────────────────────────────── */
function TestimonialsSection() {
  const tests = [
    { name: "Rahul Sharma", role: "Software Engineer, Pune", content: "Got the loan approved in just 18 hours! The team was extremely helpful throughout. Interest rate was 0.8% lower than what my bank offered. Saved ₹24,000 over the tenure!", rating: 5, av: "RS", color: "#0066FF" },
    { name: "Priya Patel", role: "Teacher, Aurangabad", content: "Applied for a personal loan on a Saturday evening and had the money in my account by Monday morning. The digital process was so smooth — no branch visits at all!", rating: 5, av: "PP", color: "#00B894" },
    { name: "Amit Varma", role: "Business Owner, Mumbai", content: "As a self-employed person, getting a loan is always tough. Techstar guided me through every step and helped me get approved with a good rate. Highly recommended!", rating: 5, av: "AV", color: "#8B5CF6" },
  ]
  return (
    <section className="pl-section" style={{ background: "#F8FAFB" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">⭐ Reviews</span>
          <h2 className="pl-section-title">Trusted by 10 Lakh+ Borrowers</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginTop: 20 }}>
            {[{ v: "4.8/5", l: "Google Rating" }, { v: "1M+", l: "App Downloads" }, { v: "10K+", l: "Daily Applications" }].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0A1628" }}>{s.v}</div>
                <div style={{ fontSize: ".68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".1em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="row g-4">
          {tests.map((t, i) => (
            <div key={t.name} className="col-lg-4"
              data-reveal={i === 0 ? "left" : i === 2 ? "right" : "up"}
              data-delay={String(i + 1)}
            >
              <div className="testi-card">
                <div className="testi-stars">{"★".repeat(t.rating)}</div>
                <p className="testi-quote">&ldquo;{t.content}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
                  <div className="testi-avatar" style={{ background: t.color }}>{t.av}</div>
                  <div>
                    <div className="testi-name">{t.name} <span className="verified-badge ms-1">✓ Verified</span></div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ SECTION
───────────────────────────────────────────────────────────────────────────── */
function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)
  const faqs = [
    { q: "What is the minimum CIBIL score required for a Personal Loan?", a: "A CIBIL score of 720 or above is considered ideal for getting the best interest rates. However, some lenders may approve loans for scores as low as 650, though at higher interest rates. Techstar Money Solution helps you find lenders best suited to your credit profile." },
    { q: "How quickly will I get the loan amount?", a: "With Techstar Money Solution, our digital lending partners often provide instant in-principle approval. Once all documents are verified online, funds are typically disbursed to your bank account within 24–48 hours." },
    { q: "Are there any hidden charges or fees?", a: "We believe in 100% transparency. Any processing fees (typically 1–3%), stamp duty, or insurance charges will be clearly disclosed in your loan agreement. Our advisory service is completely free — we never charge you for comparing or applying." },
    { q: "Can I prepay or foreclose my personal loan early?", a: "Yes! Most banks allow foreclosure or part-prepayment after 6–12 EMIs. Some lenders (especially NBFCs) offer zero prepayment charges. Charges vary by lender and are always disclosed upfront." },
    { q: "Do I need to visit a bank branch to apply?", a: "No branch visits required! The entire process — application, document upload, approval, and disbursal — happens 100% online. You can apply from your phone in under 10 minutes." },
    { q: "What happens if I miss an EMI payment?", a: "Missing an EMI can result in a late payment fee (usually ₹500–₹1000), increased interest for that month, and a negative impact on your CIBIL score. We recommend setting up auto-debit to ensure on-time payments." },
  ]
  return (
    <section id="faq" className="pl-section" style={{ background: "#fff" }}>
      <div className="container">
        <div className="text-center mb-5" data-reveal="up">
          <span className="section-chip">❓ FAQ</span>
          <h2 className="pl-section-title">Frequently Asked Questions</h2>
          <p className="pl-section-sub">Everything you need to know about personal loans — answered by our experts.</p>
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto" }} data-reveal="up" data-delay="1">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item${open === i ? " open" : ""}`}>
              <button className="faq-btn" onClick={() => setOpen(open === i ? null : i)}>
                <span>{faq.q}</span>
                <div className="faq-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>
              {open === i && (
                <div className="faq-body">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TRUST SECTION
───────────────────────────────────────────────────────────────────────────── */
function TrustSection() {
  const items = [
    { icon: "🔒", text: "256-bit SSL Encrypted" },
    { icon: "🏦", text: "RBI Regulated Partners" },
    { icon: "📋", text: "ISO 27001 Certified" },
    { icon: "🛡️", text: "Zero Data Sharing" },
    { icon: "⚡", text: "Real-time Processing" },
    { icon: "📞", text: "24/7 Expert Support" },
  ]
  return (
    <div style={{ background: "#F8FAFB", borderTop: "1px solid #EFF2F7", borderBottom: "1px solid #EFF2F7", padding: "32px 0" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: ".7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".12em" }}>Your Data is Always Safe With Us</span>
        </div>
        <div className="trust-row" data-reveal="up">
          {items.map(item => (
            <div key={item.text} className="trust-item">
              <div className="trust-item-icon">{item.icon}</div>
              <span className="trust-item-text">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CTA SECTION
───────────────────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="cta-banner">
      <div className="container">
        <div className="cta-inner" data-reveal="up">
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🚀</div>
          <h2 className="cta-h2">Ready to Get Your Personal Loan?</h2>
          <p className="cta-sub">Apply in 2 minutes. Get funds in 24 hours. Zero branch visits — 100% online.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <button className="btn-white" onClick={() => document.getElementById("personal-loan-form")?.scrollIntoView({ behavior: "smooth" })}>
              Apply Now — It&apos;s Free →
            </button>
            <a href="tel:+919876543210" className="btn-ghost" style={{ textDecoration: "none" }}>📞 Talk to Expert</a>
          </div>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[{ icon: "🏦", text: "50+ Bank Partners" }, { icon: "✅", text: "No CIBIL Impact" }, { icon: "⚡", text: "Instant Approval" }, { icon: "🔒", text: "SSL Secured" }].map(b => (
              <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{b.icon}</span>
                <span style={{ fontSize: ".8rem", color: "#94A3B8", fontWeight: 600 }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOBILE STICKY APPLY BUTTON
───────────────────────────────────────────────────────────────────────────── */
function MobileStickyApply() {
  return (
    <div className="mobile-sticky-apply">
      <button className="btn-apply" onClick={() => document.getElementById("personal-loan-form")?.scrollIntoView({ behavior: "smooth" })}>
        Apply for Personal Loan — Free →
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT EXPORT
───────────────────────────────────────────────────────────────────────────── */
export default function PersonalLoanPageContent({ city }: { city?: string }) {
  useScrollReveal()
  return (
    <div className="pl-page">
      <GlobalStyles />
      <HeroSection city={city} />
      <PartnersStrip />
      <StatsStrip />
      <OverviewSection />
      <ComparisonTable />
      <EMICalculator />
      <FeaturesSection />
      <PurposeSection />
      <EligibilitySection />
      <ProcessSection />
      <AnimatedPostersSection />
      <TestimonialsSection />
      <TrustSection />
      <FAQSection />
      <CTASection />
      <MobileStickyApply />
    </div>
  )
}
