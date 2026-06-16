"use client"

import React, { useState, useEffect } from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  RotateCcw, 
  Phone,
  MessageSquare,
  HelpCircle,
  FileText
} from "lucide-react"

interface ScoreResult {
  score: number;
  rating: string;
  summary: {
    active_accounts: number;
    delayed_payments: number;
    credit_age_years: number;
    enquiries_30_days: number;
  };
  message: string;
}

export default function CibilScorePage() {
  const [formData, setFormData] = useState({
    name: "",
    pan: "",
    mobile: "",
    email: "",
    dob: "",
    pincode: "",
    consent: false
  });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);

  const loadingStatuses = [
    "Connecting securely to credit bureaus...",
    "Verifying identity and PAN registration details...",
    "Retrieving credit accounts and payment history...",
    "Calculating credit risk score and final report..."
  ];

  // Handle loading steps simulation
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingStatuses.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Client-side validations
    if (!formData.consent) {
      setError("Please check the consent box to proceed.");
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(formData.pan)) {
      setError("Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).");
      return;
    }

    if (formData.mobile.length !== 10 || !/^\d+$/.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.pincode.length !== 6 || !/^\d+$/.test(formData.pincode)) {
      setError("Please enter a valid 6-digit PIN Code.");
      return;
    }

    setLoading(true);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/cibil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      // Delay response slightly to match premium simulation feeling
      setTimeout(() => {
        if (response.ok && data.status === "success") {
          setResult({
            score: data.score,
            rating: data.rating,
            summary: data.summary,
            message: data.message
          });
        } else {
          setError(data.error || "Failed to retrieve credit score. Please check your details and try again.");
        }
        setLoading(false);
      }, 5000);

    } catch (err) {
      setError("Network error occurred. Please try again later.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      pan: "",
      mobile: "",
      email: "",
      dob: "",
      pincode: "",
      consent: false
    });
    setResult(null);
    setError("");
  };

  // Helper to determine CIBIL rating description and colors
  const getScoreColor = (score: number) => {
    if (score >= 750) return { text: "text-emerald-500", border: "border-emerald-500", bg: "bg-emerald-500/10", stroke: "text-emerald-500" };
    if (score >= 700) return { text: "text-green-500", border: "border-green-500", bg: "bg-green-500/10", stroke: "text-green-500" };
    if (score >= 650) return { text: "text-amber-500", border: "border-amber-500", bg: "bg-amber-500/10", stroke: "text-amber-500" };
    return { text: "text-rose-500", border: "border-rose-500", bg: "bg-rose-500/10", stroke: "text-rose-500" };
  };

  const getScoreDetails = (score: number) => {
    if (score >= 750) {
      return {
        title: "Excellent Credit Profile",
        desc: "You are in the top tier of creditworthiness. You have an extremely high chance of instant loan approvals at prime interest rates with minimal documentation requirements.",
        tips: [
          "Maintain your low credit utilization below 30%.",
          "Keep accounts open to preserve your long credit history age.",
          "Continue monitoring reports for any administrative errors."
        ]
      };
    }
    if (score >= 700) {
      return {
        title: "Good Credit Profile",
        desc: "Your credit health is healthy and you qualify easily for personal, home, or business loans from most tier-1 banks at competitive interest rates.",
        tips: [
          "Avoid making too many credit enquiries in a short period.",
          "Always pay outstanding balances in full each cycle.",
          "Check credit report yearly for dispute corrections."
        ]
      };
    }
    if (score >= 650) {
      return {
        title: "Average Credit Profile",
        desc: "Your credit score is fair. While you can get loans, some lenders might charge higher interest rates or request collateral or additional guarantor details.",
        tips: [
          "Set up automatic EMI payments to avoid delayed payments.",
          "Gradually reduce credit card balances to improve debt-to-income ratio.",
          "Do not apply for new credit lines until score climbs past 700."
        ]
      };
    }
    return {
      title: "Below Average Credit Profile",
      desc: "Your credit health requires immediate attention. Loan approvals will be difficult or carry high premium rates. We recommend taking proactive steps to fix credit issues.",
      tips: [
        "Immediately dispute any wrong accounts or defaults on your official CIBIL profile.",
        "Clear off all outstanding micro-debts or past-due card payments.",
        "Opt for secure credit cards to rebuild payment consistency."
      ]
    };
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Header />

      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[5%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-warning/5 blur-[120px] pointer-events-none" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/20 text-warning rounded-full text-xs font-black uppercase tracking-wider">
              <TrendingUp size={14} /> Bureau Partner Check
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-secondary dark:text-white tracking-tight leading-none">
              Check Your Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-warning to-amber-500 drop-shadow-xs italic">CIBIL Score</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold max-w-lg mx-auto">
              Get an instant credit health analysis from official credit bureaus. Totally secure, encrypted, and has 0% impact on your credit history.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Form State */}
              {!loading && !result && (
                <motion.div
                  key="form-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl"
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 rounded-2xl flex items-start gap-3 text-xs font-semibold">
                        <AlertCircle className="shrink-0 mt-0.5" size={16} />
                        <div>{error}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-secondary dark:text-slate-350 uppercase tracking-widest">Full Name (As per PAN)</label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="e.g. Rahul Ramesh Kumar"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-secondary dark:text-slate-350 uppercase tracking-widest">PAN Card Number</label>
                        <input
                          type="text"
                          name="pan"
                          required
                          maxLength={10}
                          placeholder="e.g. ABCDE1234F"
                          value={formData.pan}
                          onChange={handleChange}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white text-sm font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-secondary dark:text-slate-350 uppercase tracking-widest">Mobile Number</label>
                        <input
                          type="tel"
                          name="mobile"
                          required
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-secondary dark:text-slate-350 uppercase tracking-widest">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="e.g. rahul@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-secondary dark:text-slate-350 uppercase tracking-widest">Date of Birth</label>
                        <input
                          type="date"
                          name="dob"
                          required
                          value={formData.dob}
                          onChange={handleChange}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-secondary dark:text-slate-350 uppercase tracking-widest">Pin Code</label>
                        <input
                          type="text"
                          name="pincode"
                          required
                          maxLength={6}
                          placeholder="e.g. 411001"
                          value={formData.pincode}
                          onChange={handleChange}
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="consent"
                          checked={formData.consent}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary mt-0.5 cursor-pointer shrink-0"
                        />
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                          I authorize Techstar Money Solution to fetch my credit bureau reports and verify my identity details to check eligibility. I understand this action does not impact my official credit score history.
                        </span>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="submit"
                        className="w-full md:w-auto px-10 h-14 bg-gradient-to-r from-warning to-amber-500 text-slate-950 rounded-full font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-lg shadow-warning/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Submit & Check Credit Score
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Loading State */}
              {loading && (
                <motion.div
                  key="loading-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl text-center space-y-6"
                >
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    {/* Ring animation */}
                    <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                    <div className="absolute inset-0 border-4 border-warning border-t-transparent rounded-full animate-spin" />
                    <Loader2 size={36} className="text-warning animate-pulse" />
                  </div>

                  <div className="space-y-2 max-w-sm mx-auto">
                    <h3 className="font-black text-xl text-secondary dark:text-white tracking-tight">Fetching Credit Data</h3>
                    <p className="text-[10px] font-black text-warning uppercase tracking-widest leading-none">Bureau Secure Link Active</p>
                  </div>

                  {/* Progressive step indicator */}
                  <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-150/50 dark:border-slate-800 rounded-2xl p-4 min-h-[4.5rem] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-350"
                      >
                        {loadingStatuses[loadingStep]}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    <ShieldCheck size={12} className="text-emerald-500" /> ISO 27001 Secure Encrypted Data Tunnel
                  </div>
                </motion.div>
              )}

              {/* Result State */}
              {!loading && result && (
                <motion.div
                  key="result-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Gauge Card */}
                  <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="text-center md:text-left space-y-4">
                        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 ${getScoreColor(result.score).bg} border ${getScoreColor(result.score).border} rounded-full text-xs font-black uppercase tracking-wider`}>
                          <Award size={14} className={getScoreColor(result.score).text} /> CIBIL Score Report
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tight m-0">
                          {getScoreDetails(result.score).title}
                        </h2>
                        <p className="text-xs text-slate-450 leading-relaxed font-medium max-w-sm">
                          {getScoreDetails(result.score).desc}
                        </p>

                        <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
                          <button onClick={handleReset} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer text-slate-300">
                            <RotateCcw size={14} /> Check New Score
                          </button>
                        </div>
                      </div>

                      {/* Animated Bureau Gauge */}
                      <div className="flex justify-center">
                        <div className="relative w-44 h-44 d-flex align-items-center justify-content-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="6" strokeDasharray="264" strokeDashoffset="0" />
                            {/* Animated ring */}
                            <motion.circle 
                              initial={{ strokeDashoffset: 264 }}
                              animate={{ strokeDashoffset: 264 - (264 * ((result.score - 300) / 600)) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              cx="50" cy="50" r="42" fill="none" stroke="currentColor" className={`${getScoreColor(result.score).stroke} drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]`} strokeWidth="6" strokeLinecap="round" strokeDasharray="264" 
                            />
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 leading-none">
                            <span className="text-4xl font-black text-white">{result.score}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider mt-1.5 ${getScoreColor(result.score).text}`}>
                              {result.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1 leading-none">Active Accounts</p>
                      <h4 className="text-lg font-black text-secondary dark:text-white">{result.summary.active_accounts}</h4>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1 leading-none">Delayed Payments</p>
                      <h4 className={`text-lg font-black ${result.summary.delayed_payments > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {result.summary.delayed_payments}
                      </h4>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1 leading-none">Bureau Enquiries</p>
                      <h4 className="text-lg font-black text-secondary dark:text-white">{result.summary.enquiries_30_days} <span className="text-[10px] text-slate-400 font-semibold">(30d)</span></h4>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-center">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1 leading-none">Credit Age</p>
                      <h4 className="text-lg font-black text-secondary dark:text-white">{result.summary.credit_age_years} Yrs</h4>
                    </div>
                  </div>

                  {/* Recommendation and Tips Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="font-black text-lg text-secondary dark:text-white tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500" size={20} /> Recommendations for You
                      </h3>
                      <ul className="space-y-2.5">
                        {getScoreDetails(result.score).tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2.5 text-xs text-slate-500 dark:text-slate-450 font-semibold leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pre-approved loans promo */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl text-center flex flex-col justify-between">
                      <div className="space-y-1">
                        <Zap size={24} className="text-warning mx-auto" fill="currentColor" />
                        <h4 className="font-black text-sm text-secondary dark:text-white">Pre-Approved Offers</h4>
                        <p className="text-[10px] font-bold text-slate-400 leading-normal max-w-[150px] mx-auto">Instant personal loan offers matching your credit score.</p>
                      </div>

                      <div className="pt-4">
                        <a href="/personal-loan" className="w-full px-4 h-10 bg-primary hover:scale-[1.02] text-white rounded-lg text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1 transition-transform cursor-pointer">
                          Apply Now <ArrowRight size={12} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Quick Section */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                    <h3 className="font-black text-lg text-secondary dark:text-white tracking-tight mb-4 flex items-center gap-2">
                      <HelpCircle className="text-primary" size={20} /> Frequently Asked Questions
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-secondary dark:text-white mb-1">Q: Does checking my CIBIL score here decrease it?</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                          No. Checking your own credit score through our platform is considered a "soft enquiry" and will not impact your credit history or score in any way.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-black text-secondary dark:text-white mb-1">Q: How often is my credit score updated?</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                          Credit bureaus typically update report records every 30-45 days when banks submit credit account and repayment data.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
