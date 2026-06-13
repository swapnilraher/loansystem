"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Menu, Phone, X, Home, User, Briefcase, Calculator, LayoutDashboard, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"
import { useTheme } from "@/context/ThemeContext"
import { Moon, Sun, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { GoogleOneTap } from "@/components/auth/GoogleOneTap"
import { WhatsAppLogin } from "@/components/auth/WhatsAppLogin"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, profile, logout } = useAuth()
  const router = useRouter()

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "true") {
        setIsWhatsAppOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Auto-open modal if profile is incomplete
  useEffect(() => {
    if (user && profile) {
      const isComplete = profile.panName && profile.city && (profile.email || profile.mobile);
      if (!isComplete) {
        setIsWhatsAppOpen(true);
      }
    }
  }, [user, profile]);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Personal Loan", href: "/personal-loan", icon: User },
    { name: "Home Loan", href: "/home-loan", icon: Home },
    { name: "Become DSA Partner", href: "/become-dsa-partner", icon: Briefcase },
    { name: "My Account", href: "/dashboard", icon: LayoutDashboard },
  ]

  return (
    <>
      {/* Dynamic Scroll Progress Bar */}
      <motion.div 
        className="fixed-top h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-600 z-[999] origin-left"
        style={{ scaleX }}
      />
      <header className={`fixed-top w-full z-50 transition-all duration-300 ${scrolled
        ? "py-2 bg-white dark:bg-slate-900 border-bottom border-slate-100 dark:border-slate-800 shadow-sm"
        : "py-3 bg-white/70 dark:bg-slate-950/70 border-bottom border-transparent backdrop-blur-md"
        }`}>
        <div className="container-fluid px-md-5 px-3">
          <div className="d-flex align-items-center justify-content-between">
            {/* Logo Brand */}
            <a href="/" className="d-flex align-items-center gap-2 text-decoration-none group">
              <div className={`bg-paytm-blue d-flex align-items-center justify-content-center text-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${scrolled ? "w-8 h-8" : "w-9 h-9"
                }`}>
                <img src="/img/logo.jpeg" alt="Techstar Money Solution Logo" className="w-100 h-100 object-cover" />
              </div>
              <span className={`font-black tracking-tight italic group-hover:text-primary transition-all duration-300 ${scrolled ? "fs-6" : "fs-5"
                } ${theme === "dark" ? "text-white" : "text-paytm-navy"}`}>
                Techstar Money Solution
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="d-none d-lg-flex align-items-center gap-4">
              {navLinks.slice(0, 4).map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`text-xs text-uppercase font-black tracking-wider py-1 text-decoration-none transition-colors hover:text-paytm-blue ${theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                >
                  {item.name}
                </a>
              ))}

              {/* Locations Dropdown */}
              <div className="position-relative group py-1">
                <button
                  className={`text-xs text-uppercase font-black tracking-wider bg-transparent border-0 d-flex align-items-center gap-1 transition-colors hover:text-paytm-blue ${theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                >
                  Locations
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className="position-absolute top-100 start-50 translate-middle-x pt-2 w-80 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-lg p-4 max-h-[400px] overflow-y-auto pr-1">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-start">Pune</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold text-start">
                        <a href="/personal-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Personal Loan</a>
                        <a href="/business-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Business Loan</a>
                        <a href="/home-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Home Loan</a>
                        <a href="/loan-against-property-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Property Loan</a>
                        <a href="/loan-agent-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Loan Agent</a>
                        <a href="/dsa-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">DSA Loan</a>
                      </div>
                    </div>
                    <div className="border-t border-slate-150/50 dark:border-slate-800 pt-3 mt-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-start">Chhatrapati Sambhajianagar</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold text-start">
                        <a href="/personal-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Personal Loan</a>
                        <a href="/business-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Business Loan</a>
                        <a href="/home-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Home Loan</a>
                        <a href="/loan-against-property-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Property Loan</a>
                        <a href="/loan-agent-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Loan Agent</a>
                        <a href="/dsa-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">DSA Loan</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Right CTAs / Login */}
            <div className="d-flex align-items-center gap-3">
              <a href="tel:9579005645" className={`d-none d-xl-flex align-items-center gap-2 text-decoration-none font-bold hover:text-paytm-blue transition-all group ${theme === "dark" ? "text-white" : "text-paytm-navy"
                }`}>
                <div className="w-8 h-8 rounded-circle bg-light dark:bg-slate-800 d-flex align-items-center justify-content-center text-paytm-blue group-hover:bg-paytm-blue group-hover:text-white transition-all">
                  <Phone size={14} />
                </div>
                <span className="text-xs">9579005645</span>
              </a>

              <button 
                onClick={() => router.push("#check-eligibility")} 
                className="d-none d-xl-inline-flex btn btn-paytm btn-sm py-2 px-4 shadow-sm"
              >
                Apply Now
              </button>

              {user ? (
                <div className="d-flex align-items-center gap-2 bg-light dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <a href="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none hover:opacity-85">
                    <div className="w-8 h-8 rounded-circle bg-paytm-blue d-flex align-items-center justify-content-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-100 h-100 object-cover" />
                      ) : (
                        <User size={16} className="text-white" />
                      )}
                    </div>
                    <div className="d-none d-lg-block text-start leading-none">
                      <p className="text-[8px] text-uppercase font-black text-slate-400 m-0 mb-0.5">Welcome</p>
                      <p className="text-xs font-black dark:text-white m-0 leading-none">{user.displayName?.split(" ")[0] || "Member"}</p>
                    </div>
                  </a>
                  <button
                    onClick={() => logout()}
                    className="btn btn-link p-1 text-slate-400 hover:text-danger border-start border-slate-200 dark:border-slate-700 ms-1"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsWhatsAppOpen(true)}
                  className="d-none d-sm-flex btn btn-outline-secondary btn-sm rounded-pill py-2 px-3 d-flex align-items-center gap-1.5 font-bold"
                >
                  <MessageSquare size={16} className="text-success" />
                  <span>Login</span>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn btn-light dark:btn-slate-800 p-2 rounded-xl text-secondary dark:text-white"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setIsOpen(true)}
                className="d-lg-none btn btn-light border border-slate-100 p-2 rounded-xl text-secondary"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <GoogleOneTap />
      <WhatsAppLogin isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)} />

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm shadow-2xl z-[70] p-8 flex flex-col justify-between overflow-y-auto border-l border-slate-100/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
            >
              <div>
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white overflow-hidden">
                      <img src="/img/logo.jpeg" alt="TechStar Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className={`font-black text-xl italic ${theme === "dark" ? "text-white" : "text-secondary"}`}>Techstar Money Solution</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <X size={24} className={theme === "dark" ? "text-white" : "text-secondary"} />
                  </button>
                </div>

                <div className="space-y-6">
                  {navLinks.map((link) => {
                    const handleMobileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                      setIsOpen(false);
                      if (link.name === "My Account" && !user) {
                        e.preventDefault();
                        setIsWhatsAppOpen(true);
                      }
                    };
                    return (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={handleMobileClick}
                        className={`flex items-center gap-4 text-lg font-bold transition-colors p-4 rounded-2xl group ${theme === "dark" ? "text-slate-300 hover:bg-slate-800" : "text-secondary hover:bg-blue-50"
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === "dark" ? "bg-slate-800 group-hover:bg-primary group-hover:text-white" : "bg-slate-50 group-hover:bg-primary group-hover:text-white"
                          }`}>
                          <link.icon size={20} />
                        </div>
                        {link.name}
                      </a>
                    );
                  })}
                </div>

                {/* Mobile Locations Section */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-4">Locations Covered</p>
                  <div className="space-y-4">
                    {/* Pune */}
                    <div className="px-4">
                      <p className="text-xs font-black text-secondary dark:text-white mb-2">Pune</p>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <a href="/personal-loan-pune" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Personal Loan</a>
                        <a href="/business-loan-pune" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Business Loan</a>
                        <a href="/home-loan-pune" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Home Loan</a>
                        <a href="/loan-against-property-pune" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Property Loan</a>
                        <a href="/loan-agent-pune" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Loan Agent</a>
                        <a href="/dsa-loan-pune" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">DSA Loan</a>
                      </div>
                    </div>
                    {/* Chhatrapati Sambhajianagar */}
                    <div className="px-4">
                      <p className="text-xs font-black text-secondary dark:text-white mb-2">Chhatrapati Sambhajianagar</p>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <a href="/personal-loan-chhatrapati-sambhajianagar" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Personal Loan</a>
                        <a href="/business-loan-chhatrapati-sambhajianagar" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Business Loan</a>
                        <a href="/home-loan-chhatrapati-sambhajianagar" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Home Loan</a>
                        <a href="/loan-against-property-chhatrapati-sambhajianagar" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Property Loan</a>
                        <a href="/loan-agent-chhatrapati-sambhajianagar" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Loan Agent</a>
                        <a href="/dsa-loan-chhatrapati-sambhajianagar" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">DSA Loan</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                {user ? (
                  <div className={`p-6 rounded-3xl border border-dashed flex items-center gap-4 ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                    }`}>
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Logged in as</p>
                      <p className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-secondary"}`}>{user.displayName || "Member"}</p>
                      <button onClick={() => logout()} className="text-red-500 text-xs font-bold uppercase tracking-widest mt-1">Logout</button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => { setIsWhatsAppOpen(true); setIsOpen(false); }}
                    className="w-full h-16 rounded-full text-lg shadow-xl shadow-blue-100 flex gap-3"
                  >
                    <MessageSquare size={20} />
                    Login with WhatsApp
                  </Button>
                )}
                <div className={`p-6 rounded-3xl border border-dashed ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}>
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Call Expert</p>
                  <a href="tel:9579005645" className={`text-xl font-black flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-secondary"
                    }`}>
                    <Phone size={20} className="text-primary" /> 9579005645
                  </a>
                </div>
                <Button size="lg" className="w-full h-16 rounded-full text-lg shadow-xl shadow-blue-100">Apply Now</Button>
              </div>
            </motion.div>

          </>
        )}
      </AnimatePresence>
    </>
  )
}



export function Footer() {
  return (
    <footer className="bg-[#090d16] text-slate-400 pt-16 pb-12 border-t border-slate-900/60 relative overflow-hidden">
      {/* Footer background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-paytm-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-md-5 px-3 position-relative z-10">
        
        {/* Disclaimer Section */}
        <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-[2rem] mb-12 text-[11px] leading-relaxed text-slate-400 shadow-inner">
          <strong className="text-white font-extrabold">Disclaimer:</strong> Techstar Money Solution is a registered Direct Selling Agent (DSA) and is not a direct lender. All loan products, interest slabs, processing charges, and approval mandates are directly offered by our matched partner banks and RBI-registered NBFCs. Final approvals and disbursements are subject to credit profile checks and documentation verification by respective institutions.
        </div>

        <div className="row g-5 mb-12">
          {/* Brand Info */}
          <div className="col-lg-4 col-md-6 text-start space-y-6">
            <div>
              <a href="/" className="d-flex align-items-center gap-2.5 text-white text-decoration-none group">
                <div className="w-10 h-10 bg-paytm-blue rounded-xl d-flex align-items-center justify-content-center overflow-hidden shadow-sm">
                  <img src="/img/logo.jpeg" alt="TechStar Logo" className="w-100 h-100 object-cover" />
                </div>
                <span className="fs-5 font-black tracking-tight italic text-white group-hover:text-primary transition-colors">
                  Techstar Money Solution
                </span>
              </a>
              <p className="text-xs font-medium leading-relaxed text-slate-400 mt-4 max-w-sm">
                Empowering millions of Indian borrowers with transparent, hassle-free, and expert-assisted digital financial solutions.
              </p>
            </div>
            
            <div className="space-y-3 pt-1">
              <a href="tel:9579005645" className="text-slate-300 text-decoration-none hover:text-primary transition-all d-flex align-items-center gap-3 text-xs font-black group">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 d-flex align-items-center justify-content-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                  <Phone size={12} />
                </div>
                +91 9579005645
              </a>
              <a href="mailto:support@techstarsolution.in" className="text-slate-300 text-decoration-none hover:text-primary transition-all d-flex align-items-center gap-3 text-xs font-black group">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 d-flex align-items-center justify-content-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                support@techstarsolution.in
              </a>
              <div className="text-slate-300 d-flex align-items-center gap-3 text-xs font-black group">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 d-flex align-items-center justify-content-center">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                Sadashiv Peth, Pune, MH
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div className="col-lg-2 col-md-3 col-6 text-start">
            <h5 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Products</h5>
            <ul className="list-unstyled space-y-2.5 text-xs font-bold">
              {[
                { name: "Home", href: "/" },
                { name: "Personal Loan", href: "/personal-loan" },
                { name: "Home Loan", href: "/home-loan" },
                { name: "Business Loan", href: "/business-loan" },
                { name: "Property Loan", href: "/loan-against-property" },
                { name: "Car Loan", href: "/car-loan" },
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-400 hover:text-white hover:translate-x-1 d-inline-block text-decoration-none transition-all">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Calculators Column */}
          <div className="col-lg-2 col-md-3 col-6 text-start">
            <h5 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Calculators</h5>
            <ul className="list-unstyled space-y-2.5 text-xs font-bold">
              {["EMI Calculator", "Eligibility Checker", "SIP Calculator"].map((link) => (
                <li key={link}>
                  <a href="/#calculator" className="text-slate-400 hover:text-white hover:translate-x-1 d-inline-block text-decoration-none transition-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="col-lg-2 col-md-3 col-6 text-start">
            <h5 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Legal</h5>
            <ul className="list-unstyled space-y-2.5 text-xs font-bold">
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms & Conditions", href: "/terms" }
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-400 hover:text-white hover:translate-x-1 d-inline-block text-decoration-none transition-all">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations Column */}
          <div className="col-lg-2 col-md-3 col-6 text-start">
            <h5 className="text-white font-black uppercase tracking-widest text-[10px] mb-4">Locations</h5>
            <ul className="list-unstyled space-y-2.5 text-xs font-bold">
              <li>
                <a href="/loan-agent-pune" className="text-slate-400 hover:text-white hover:translate-x-1 d-inline-block text-decoration-none transition-all">
                  Pune Office
                </a>
              </li>
              <li>
                <a href="/home-loan-chhatrapati-sambhajianagar" className="text-slate-400 hover:text-white hover:translate-x-1 d-inline-block text-decoration-none transition-all">
                  Sambhajianagar
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Service Areas Link Pool for SEO Crawlability */}
        <div className="border-t border-slate-900/60 pt-8 mb-8 text-start">
          <div className="row g-4">
            <div className="col-md-6 col-12">
              <h6 className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-3">Pune Directories</h6>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { name: "Personal Loan", href: "/personal-loan-pune" },
                  { name: "Business Loan", href: "/business-loan-pune" },
                  { name: "Home Loan", href: "/home-loan-pune" },
                  { name: "Property Loan", href: "/loan-against-property-pune" },
                  { name: "DSA Agent", href: "/dsa-loan-pune" },
                ].map((item, idx) => (
                  <a key={idx} href={item.href} className="px-3 py-1.5 bg-slate-950 border border-slate-900/80 hover:border-primary/40 text-slate-450 hover:text-white rounded-full text-[10px] font-bold text-decoration-none transition-colors">
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="col-md-6 col-12">
              <h6 className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-3">Chhatrapati Sambhajianagar Directories</h6>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { name: "Personal Loan", href: "/personal-loan-chhatrapati-sambhajianagar" },
                  { name: "Business Loan", href: "/business-loan-chhatrapati-sambhajianagar" },
                  { name: "Home Loan", href: "/home-loan-chhatrapati-sambhajianagar" },
                  { name: "Property Loan", href: "/loan-against-property-chhatrapati-sambhajianagar" },
                  { name: "DSA Agent", href: "/dsa-loan-chhatrapati-sambhajianagar" },
                ].map((item, idx) => (
                  <a key={idx} href={item.href} className="px-3 py-1.5 bg-slate-950 border border-slate-900/80 hover:border-primary/40 text-slate-450 hover:text-white rounded-full text-[10px] font-bold text-decoration-none transition-colors">
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-900/60 pt-8 d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
          <p className="text-[10px] font-bold text-slate-500 m-0">
            © 2026 Techstar Money Solution. All rights reserved. Designed for elite digital finance.
          </p>
          <div className="d-flex gap-4 text-[10px] uppercase font-black tracking-widest">
            {["Facebook", "Twitter", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="text-slate-500 hover:text-primary text-decoration-none transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}


