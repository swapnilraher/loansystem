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
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-600 z-[99] origin-left"
        style={{ scaleX }}
      />
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled
        ? "h-14 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-blue-900/5 backdrop-blur-xl"
        : "h-16 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md"
        }`}>
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className={`bg-primary flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-blue-200 shadow-xl overflow-hidden ${scrolled ? "w-8 h-8 rounded-lg" : "w-9 h-9 rounded-xl"
              }`}>
              <img src="/img/logo.jpeg" alt="Techstar Money Solution Logo" className="w-full h-full object-cover" />
            </div>
            <span className={`font-black tracking-tighter italic group-hover:text-primary transition-all duration-300 ${scrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl"
              } ${theme === "dark" ? "text-white" : "text-secondary"}`}>
              Techstar<span className="hidden sm:inline"> Money Solution</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            {navLinks.slice(0, 4).map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`text-xs md:text-sm font-extrabold uppercase tracking-tight relative py-1.5 group transition-colors hover:text-primary ${theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

            {/* Locations Dropdown */}
            <div className="relative group py-1.5">
              <button
                className={`text-xs md:text-sm font-extrabold uppercase tracking-tight flex items-center gap-1 transition-colors hover:text-primary ${theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
              >
                Locations
                <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-80 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl p-6 space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Nashik</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-left">
                      <a href="/personal-loan-nashik" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Personal Loan</a>
                      <a href="/business-loan-nashik" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Business Loan</a>
                      <a href="/home-loan-nashik" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Home Loan</a>
                      <a href="/loan-against-property-nashik" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Property Loan</a>
                      <a href="/loan-agent-nashik" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Loan Agent</a>
                      <a href="/dsa-loan-nashik" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">DSA Loan</a>
                    </div>
                  </div>
                  <div className="border-t border-slate-150/50 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Pune</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-left">
                      <a href="/personal-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Personal Loan</a>
                      <a href="/business-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Business Loan</a>
                      <a href="/home-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Home Loan</a>
                      <a href="/loan-against-property-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Property Loan</a>
                      <a href="/loan-agent-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Loan Agent</a>
                      <a href="/dsa-loan-pune" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">DSA Loan</a>
                    </div>
                  </div>
                  <div className="border-t border-slate-150/50 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Mumbai</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-left">
                      <a href="/personal-loan-mumbai" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Personal Loan</a>
                      <a href="/business-loan-mumbai" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Business Loan</a>
                      <a href="/home-loan-mumbai" className="hover:text-primary transition-colors text-slate-600 dark:text-slate-400">Home Loan</a>
                    </div>
                  </div>
                  <div className="border-t border-slate-150/50 dark:border-slate-800 pt-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Chhatrapati Sambhajianagar</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-left">
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

          <div className="flex items-center gap-3 lg:gap-6">
            <a href="tel:9579005645" className={`hidden xl:flex items-center gap-2.5 text-sm font-extrabold hover:text-primary transition-all group ${theme === "dark" ? "text-white" : "text-secondary"
              }`}>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <Phone size={16} />
              </div>
              9579005645
            </a>
            <Button size={scrolled ? "sm" : "md"} className="hidden xl:inline-flex rounded-xl shadow-xl shadow-blue-100/10 font-black uppercase tracking-wider px-5">Apply Now</Button>

            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 p-0.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <a href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-white" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[9px] font-black uppercase tracking-tight text-slate-400 leading-none mb-0.5">Welcome</p>
                    <p className="text-xs font-black dark:text-white leading-none">{user.displayName?.split(" ")[0] || "Member"}</p>
                  </div>
                </a>
                <button
                  onClick={() => logout()}
                  className="ml-1 p-1 text-slate-400 hover:text-red-500 transition-colors pl-2 border-l border-slate-200 dark:border-slate-700"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size={scrolled ? "sm" : "md"}
                onClick={() => setIsWhatsAppOpen(true)}
                className="hidden sm:flex rounded-xl font-black uppercase tracking-wider border-2 border-slate-200 dark:border-slate-700 items-center gap-1.5 px-4"
              >
                <MessageSquare size={16} className="text-green-500" />
                Login
              </Button>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-secondary hover:bg-slate-100 rounded-xl transition-colors border border-slate-100"
            >
              <Menu size={24} />
            </button>
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
                    {/* Nashik */}
                    <div className="px-4">
                      <p className="text-xs font-black text-secondary dark:text-white mb-2">Nashik</p>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <a href="/personal-loan-nashik" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Personal Loan</a>
                        <a href="/business-loan-nashik" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Business Loan</a>
                        <a href="/home-loan-nashik" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Home Loan</a>
                        <a href="/loan-against-property-nashik" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Property Loan</a>
                        <a href="/loan-agent-nashik" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Loan Agent</a>
                        <a href="/dsa-loan-nashik" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">DSA Loan</a>
                      </div>
                    </div>
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
                    {/* Mumbai */}
                    <div className="px-4">
                      <p className="text-xs font-black text-secondary dark:text-white mb-2">Mumbai</p>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <a href="/personal-loan-mumbai" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Personal Loan</a>
                        <a href="/business-loan-mumbai" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Business Loan</a>
                        <a href="/home-loan-mumbai" onClick={() => setIsOpen(false)} className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-primary">Home Loan</a>
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
                    className="w-full h-16 rounded-2xl text-lg shadow-xl shadow-blue-100 flex gap-3"
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
                <Button size="lg" className="w-full h-16 rounded-2xl text-lg shadow-xl shadow-blue-100">Apply Now</Button>
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
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4">
        {/* Disclaimer Section */}
        <div className="mb-10 p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] leading-relaxed">
          <strong className="text-slate-300">Disclaimer:</strong> Techstar Money Solution is a Direct Selling Agent (DSA) and does not lend directly. All loan products are sourced from partner banks and NBFCs. Interest rates, processing fees, and loan eligibility are subject to the lender's discretion and your credit profile. Information on this website is for general guidance only.
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">

          <div className="col-span-2 space-y-4">
            <a href="/" className="flex items-center gap-2 text-white group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 overflow-hidden">
                <img src="/img/logo.jpeg" alt="TechStar Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-black tracking-tight italic group-hover:text-primary transition-colors">Techstar Money Solution</span>
            </a>
            <p className="text-sm leading-relaxed max-w-xs">
              Empowering millions of Indians with quick, transparent, and hassle-free financial solutions.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="tel:9579005645" className="text-white hover:text-primary transition-all flex items-center gap-2 text-sm font-extrabold group">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Phone size={14} />
                </div>
                9579005645
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Products</h4>
            <ul className="space-y-2 text-sm">
              {[
                { name: "Home", href: "/" },
                { name: "Personal Loan", href: "/personal-loan" },
                { name: "Home Loan", href: "/home-loan" },
                { name: "Business Loan", href: "/business-loan" },
                { name: "Property Loan", href: "/loan-against-property" },
                { name: "Car Loan", href: "/car-loan" },
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-all relative group py-1 block">
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-8" />
                  </a>
                </li>
              ))}
            </ul>
          </div>


          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Calculators</h4>
            <ul className="space-y-2 text-sm">
              {["EMI Calculator", "Eligibility", "SIP"].map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-all relative group py-1 block">
                    {link}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-8" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Legal</h4>
            <ul className="space-y-2 text-sm">
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms & Conditions", href: "/terms" }
              ].map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-all relative group py-1 block">
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-8" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service Areas Link Pool for SEO Crawlability */}
        <div className="pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-[11px] text-slate-550 mb-8 text-left">
          <div className="space-y-2">
            <h5 className="font-black text-slate-300 uppercase tracking-widest text-[9px]">Loans in Nashik</h5>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="/personal-loan-nashik" className="hover:text-primary transition-colors text-slate-400">Personal Loan</a> <span className="text-slate-800">•</span>
              <a href="/business-loan-nashik" className="hover:text-primary transition-colors text-slate-400">Business Loan</a> <span className="text-slate-800">•</span>
              <a href="/home-loan-nashik" className="hover:text-primary transition-colors text-slate-400">Home Loan</a> <span className="text-slate-800">•</span>
              <a href="/loan-against-property-nashik" className="hover:text-primary transition-colors text-slate-400">Property Loan</a> <span className="text-slate-800">•</span>
              <a href="/loan-agent-nashik" className="hover:text-primary transition-colors text-slate-400">Loan Agent</a> <span className="text-slate-800">•</span>
              <a href="/dsa-loan-nashik" className="hover:text-primary transition-colors text-slate-400">DSA Loan</a>
            </div>
          </div>
          <div className="space-y-2">
            <h5 className="font-black text-slate-300 uppercase tracking-widest text-[9px]">Loans in Pune</h5>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="/personal-loan-pune" className="hover:text-primary transition-colors text-slate-400">Personal Loan</a> <span className="text-slate-800">•</span>
              <a href="/business-loan-pune" className="hover:text-primary transition-colors text-slate-400">Business Loan</a> <span className="text-slate-800">•</span>
              <a href="/home-loan-pune" className="hover:text-primary transition-colors text-slate-400">Home Loan</a> <span className="text-slate-800">•</span>
              <a href="/loan-against-property-pune" className="hover:text-primary transition-colors text-slate-400">Property Loan</a> <span className="text-slate-800">•</span>
              <a href="/loan-agent-pune" className="hover:text-primary transition-colors text-slate-400">Loan Agent</a> <span className="text-slate-800">•</span>
              <a href="/dsa-loan-pune" className="hover:text-primary transition-colors text-slate-400">DSA Loan</a>
            </div>
          </div>
          <div className="space-y-2">
            <h5 className="font-black text-slate-300 uppercase tracking-widest text-[9px]">Loans in Mumbai</h5>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="/personal-loan-mumbai" className="hover:text-primary transition-colors text-slate-400">Personal Loan</a> <span className="text-slate-800">•</span>
              <a href="/business-loan-mumbai" className="hover:text-primary transition-colors text-slate-400">Business Loan</a> <span className="text-slate-800">•</span>
              <a href="/home-loan-mumbai" className="hover:text-primary transition-colors text-slate-400">Home Loan</a>
            </div>
          </div>
          <div className="space-y-2">
            <h5 className="font-black text-slate-300 uppercase tracking-widest text-[9px]">Loans in Sambhajianagar</h5>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="/personal-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-400">Personal Loan</a> <span className="text-slate-800">•</span>
              <a href="/business-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-400">Business Loan</a> <span className="text-slate-800">•</span>
              <a href="/home-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-400">Home Loan</a> <span className="text-slate-800">•</span>
              <a href="/loan-against-property-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-400">Property Loan</a> <span className="text-slate-800">•</span>
              <a href="/loan-agent-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-400">Loan Agent</a> <span className="text-slate-800">•</span>
              <a href="/dsa-loan-chhatrapati-sambhajianagar" className="hover:text-primary transition-colors text-slate-400">DSA Loan</a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px]">© 2026 Techstar Money Solution. All rights reserved.</p>
          <div className="flex gap-6 text-[10px] uppercase font-bold tracking-widest">
            {["Facebook", "Twitter", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="hover:text-primary transition-colors relative group">
                {social}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}


