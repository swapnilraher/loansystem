"use client"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, MessageCircle, FileCheck, PhoneCall, UploadCloud, RefreshCw } from "lucide-react"
import { PremiumCard } from "../ui/PremiumCard"
import { Button } from "../ui/Button"

const docServices = [
  { title: "Income Proof Guidance", desc: "Assisting salaried and self-employed users in arranging valid income proofs." },
  { title: "Bank Statement Support", desc: "Helping structure and download official PDF statements for checks." },
  { title: "GST & Business Proofs", desc: "Guidance on active registrations and GST filing compliance." },
  { title: "ITR Filing Support", desc: "Preparing and validating income tax returns for past years." },
  { title: "Salary Slip Guidance", desc: "Assisting users in obtaining formal salary slips and vouchers." },
  { title: "Financial File Prep", desc: "Structuring your files to reduce rejection rates by lenders." },
  { title: "CIBIL Improvement", desc: "Custom guides to dispute errors and boost credit scores fast." },
  { title: "MSME/Business Registration", desc: "Assisting in Udyam registrations for business validation." },
  { title: "PAN & Aadhaar Linking", desc: "Resolving documentation mismatches and linking status." },
  { title: "Property Document Review", desc: "Validating registry papers and chain records before submission." },
  { title: "Loan File Compilation", desc: "Creating a complete package containing all supplementary documents." },
  { title: "DSA Documentation Support", desc: "Fast-tracking approvals via official broker standards." }
]

const requiredDocs = {
  personal: {
    title: "Personal Loan Documents",
    list: [
      { name: "Aadhaar Card", type: "KYC / Address Proof" },
      { name: "PAN Card", type: "Identity Proof" },
      { name: "Salary Slips (3 Months)", type: "Income Proof" },
      { name: "Bank Statements (6 Months)", type: "Financial Activity" },
      { name: "Employee ID Card", type: "Employment Verification" },
      { name: "Passport Size Photos", type: "Identity Verification" }
    ]
  },
  home: {
    title: "Home Loan Documents",
    list: [
      { name: "Property Title Deed", type: "Collateral Proof" },
      { name: "ITR & Form 16 (2 Years)", type: "Income Proof" },
      { name: "PAN & Aadhaar Card", type: "KYC Verification" },
      { name: "Bank Statements (6 Months)", type: "Financial Activity" },
      { name: "Approved Building Plan", type: "Property Verification" },
      { name: "Salary Slips (3 Months)", type: "Income Proof" }
    ]
  },
  business: {
    title: "Business Loan Documents",
    list: [
      { name: "GST Returns (1 Year)", type: "Business Activity" },
      { name: "ITR with Computation", type: "Financial Status" },
      { name: "Bank Statements (1 Year)", type: "Cashflow Proof" },
      { name: "MSME / Udyam Certificate", type: "Business Registration" },
      { name: "Partnership Deed / MOA", type: "Legal Existence" },
      { name: "PAN Card of Entity", type: "Identity Proof" }
    ]
  },
  lap: {
    title: "Loan Against Property",
    list: [
      { name: "Original Property Documents", type: "Collateral Proof" },
      { name: "Prior Title Deeds (Chain)", type: "Legal History" },
      { name: "Income Proof (Salary/ITR)", type: "Repayment Capacity" },
      { name: "KYC (PAN & Aadhaar)", type: "Identity Verification" },
      { name: "Occupancy Certificate (OC)", type: "Legal Clearance" }
    ]
  }
}

export function DocumentSupport() {
  const [activeTab, setActiveTab] = useState<keyof typeof requiredDocs>("personal")
  
  // Document Verification Simulation State
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "verifying" | "success">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (uploadState === "uploading") {
      interval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 100) {
            clearInterval(interval)
            setUploadState("verifying")
            return 100
          }
          return p + 10
        })
      }, 200)
    } else if (uploadState === "verifying") {
      interval = setTimeout(() => {
        setUploadState("success")
      }, 1500)
    }
    return () => clearInterval(interval)
  }, [uploadState])

  const triggerUploadDemo = () => {
    setUploadProgress(0)
    setUploadState("uploading")
  }

  return (
    <section className="py-12 md:py-16 bg-slate-55/50 dark:bg-slate-900/10 transition-colors duration-300 relative">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">Document Assistance</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
            Financial Documentation Support
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Even if you do not have complete documentation, our experts guide and assist you throughout the process.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Services Grid (12 Items) */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-black text-secondary dark:text-white mb-4">Our Documentation Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docServices.map((service, idx) => (
                <PremiumCard key={idx} className="p-5 cursor-pointer border-slate-100 hover:border-primary/30" glowColor="rgba(37, 99, 235, 0.04)">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center shrink-0">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-secondary dark:text-white mb-1">{service.title}</h4>
                      <p className="text-[11px] font-semibold text-slate-450 leading-relaxed">{service.desc}</p>
                    </div>
                  </div>
                </PremiumCard>
              ))}
            </div>
          </div>

          {/* Right Column: Required Documents Tabs & Verification simulator */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-xl font-black text-secondary dark:text-white mb-6">Documents Required</h3>

              {/* Tab Header Selector */}
              <div className="grid grid-cols-4 gap-2 mb-6 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                {(Object.keys(requiredDocs) as Array<keyof typeof requiredDocs>).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] font-black uppercase py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab === tab
                        ? "bg-primary text-white shadow"
                        : "text-slate-500 hover:text-secondary dark:hover:text-white"
                    }`}
                  >
                    {tab === "lap" ? "LAP" : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content List */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                  {requiredDocs[activeTab].title}
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {requiredDocs[activeTab].list.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 py-2.5 px-4 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-xs font-black text-secondary dark:text-white">{doc.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-lg">
                        {doc.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Simulator Interface */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-3">Live Document Validator Demo</p>
                
                <AnimatePresence mode="wait">
                  {uploadState === "idle" && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={triggerUploadDemo}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <UploadCloud size={32} className="text-primary animate-bounce" />
                      <p className="text-xs font-black text-secondary dark:text-white">Simulate Document Scan</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Test our instant verification processor</p>
                    </motion.div>
                  )}

                  {uploadState === "uploading" && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin text-primary" /> Scanning Data...</span>
                        <span className="text-primary">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${uploadProgress}%` }} 
                        />
                      </div>
                    </motion.div>
                  )}

                  {uploadState === "verifying" && (
                    <motion.div
                      key="verifying"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2"
                    >
                      <RefreshCw size={32} className="text-amber-500 animate-spin" />
                      <p className="text-xs font-black text-secondary dark:text-white">OCR Parsing & Verifying...</p>
                      <p className="text-[10px] text-slate-450 font-bold">Verifying PAN and bank authenticity via secure channel</p>
                    </motion.div>
                  )}

                  {uploadState === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                    >
                      <CheckCircle2 size={36} className="text-emerald-500" />
                      <p className="text-xs font-black text-emerald-800 dark:text-emerald-400">Document Scan Successful!</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-550 font-bold">100% verified. Ready for lender matching.</p>
                      <button 
                        onClick={() => setUploadState("idle")} 
                        className="text-[9px] font-black uppercase text-primary hover:underline mt-2 cursor-pointer"
                      >
                        Try Again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>

        {/* Conversion CTA Block */}
        <div className="mt-10 md:mt-14 relative overflow-hidden bg-gradient-to-br from-primary to-indigo-650 text-white rounded-3xl p-6 md:p-10 shadow-2xl border border-white/10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-white/5 skew-x-12 translate-x-1/4 pointer-events-none" />
          <div className="flex-1 space-y-4 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck size={14} /> Free Expert Assistance
            </span>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Need Help With Your Documents?</h3>
            <p className="text-sm md:text-base text-blue-100 font-medium max-w-xl">
              Even if you are self-employed, have limited documentation, or need guidance in preparing financial records, our team supports you throughout the process.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a href="tel:9579005645" className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-black h-14 px-8 rounded-xl hover:bg-slate-100 transition-colors uppercase text-xs tracking-widest shadow-xl shadow-black/10 cursor-pointer">
              <PhoneCall size={16} className="text-primary" /> Request Callback
            </a>
            <a href="https://wa.me/919579005645" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white font-black h-14 px-8 rounded-xl hover:bg-[#1fad53] transition-colors uppercase text-xs tracking-widest shadow-xl shadow-black/10 cursor-pointer">
              <MessageCircle size={16} /> WhatsApp Support
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}
