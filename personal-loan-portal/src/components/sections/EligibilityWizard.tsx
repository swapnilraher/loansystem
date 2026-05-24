"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "react-transition-group" // Wait, we can use Framer Motion for better animation control!
import { motion as motionFramer } from "framer-motion"
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Coins, Building } from "lucide-react"
import { PremiumCard } from "../ui/PremiumCard"
import { Button } from "../ui/Button"

const steps = [
  { id: 1, title: "Loan Requirement" },
  { id: 2, title: "Employment & Salary" },
  { id: 3, title: "Credit Score & City" }
]

const cities = ["Mumbai", "Pune", "Delhi / NCR", "Bangalore", "Hyderabad", "Kolkata", "Chennai", "Ahmedabad", "Other"]

export function EligibilityWizard() {
  const [step, setStep] = useState(1)
  const [loanType, setLoanType] = useState<"personal" | "home" | "business">("personal")
  const [amount, setAmount] = useState(1000000) // Default 10 L
  const [employment, setEmployment] = useState<"salaried" | "self_employed">("salaried")
  const [income, setIncome] = useState(50000) // Default 50k
  const [emis, setEmis] = useState(0) // Existing EMIs
  const [cibil, setCibil] = useState<"750+" | "700-749" | "650-699" | "<650">("750+")
  const [city, setCity] = useState("Pune")
  
  // Results generation logic
  const calculateResult = () => {
    // Basic DSR calculation (Debt-to-Service Ratio)
    const disposableIncome = income - emis
    const maxAffordableEMI = disposableIncome * 0.5
    
    // Estimated Interest Rate based on CIBIL
    let baseRate = 10.49
    if (loanType === "home") baseRate = 8.50
    if (loanType === "business") baseRate = 14.0
    
    let rateAdj = 0
    if (cibil === "700-749") rateAdj = 0.5
    else if (cibil === "650-699") rateAdj = 1.5
    else if (cibil === "<650") rateAdj = 3.0

    const finalRate = baseRate + rateAdj
    
    // Approval odds calculation
    let odds: "Low" | "Medium" | "Good" | "Excellent" = "Good"
    let oddsColor = "text-emerald-500"
    let oddsBg = "bg-emerald-500/10"
    
    if (cibil === "750+" && disposableIncome > 20000) {
      odds = "Excellent"
    } else if (cibil === "<650" || disposableIncome < 15000) {
      odds = "Low"
      oddsColor = "text-red-500"
      oddsBg = "bg-red-500/10"
    } else if (cibil === "650-699" || disposableIncome < 30000) {
      odds = "Medium"
      oddsColor = "text-amber-500"
      oddsBg = "bg-amber-500/10"
    }

    // EMI estimation for the loan amount
    const P = amount
    const r = (finalRate / 12) / 100
    const n = 5 * 12 // 5 years fixed
    const estimatedEMI = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))

    return {
      rate: finalRate.toFixed(2),
      emi: estimatedEMI,
      odds,
      oddsColor,
      oddsBg,
      maxAffordableEMI
    }
  }

  const results = calculateResult()

  // Match best lenders
  const getMatchedLenders = () => {
    if (loanType === "home") {
      return [
        { name: "HDFC Bank", rate: results.rate, speed: "2 Days", doc: "Standard" },
        { name: "SBI", rate: (Number(results.rate) - 0.2).toFixed(2), speed: "4 Days", doc: "Detailed" }
      ]
    } else if (loanType === "business") {
      return [
        { name: "Tata Capital", rate: results.rate, speed: "24 Hours", doc: "Minimal" },
        { name: "Bajaj Finance", rate: (Number(results.rate) + 0.5).toFixed(2), speed: "12 Hours", doc: "Minimal" }
      ]
    } else {
      return [
        { name: "ICICI Bank", rate: results.rate, speed: "2 Hours", doc: "Minimal" },
        { name: "Axis Bank", rate: (Number(results.rate) - 0.1).toFixed(2), speed: "4 Hours", doc: "Standard" }
      ]
    }
  }

  const matchedLenders = getMatchedLenders()

  return (
    <section className="py-20 lg:py-24 bg-slate-50 dark:bg-slate-900/20 transition-colors duration-300 relative">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">Lender Match</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
            Smart Loan Eligibility Wizard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Find out your approval chance and get pre-approved matched lenders in less than 2 minutes.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Progress Steps header */}
          <div className="flex justify-between items-center mb-10 max-w-xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                  step === s.id 
                    ? "bg-primary border-primary text-white scale-110 shadow" 
                    : step > s.id 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}>
                  {step > s.id ? "✓" : s.id}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mt-2 tracking-wider hidden sm:block">
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          {/* Form Wizard Screen */}
          <div className="min-h-[250px]">
            {step === 1 && (
              <motionFramer.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                {/* Loan Type Selection */}
                <div>
                  <label className="block text-sm font-black text-secondary dark:text-white mb-4">What kind of loan do you need?</label>
                  <div className="grid grid-cols-3 gap-4">
                    {["personal", "home", "business"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setLoanType(type as any)}
                        className={`p-5 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                          loanType === type
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-150/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <Coins size={24} />
                        <span className="text-xs font-black uppercase tracking-wider">{type} Loan</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-550 dark:text-slate-400">Required Amount</span>
                    <span className="text-primary font-black">₹{(amount / 100000).toFixed(1)} Lacs</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="50000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>₹1 Lac</span>
                    <span>₹50 Lacs</span>
                  </div>
                </div>
              </motionFramer.div>
            )}

            {step === 2 && (
              <motionFramer.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                {/* Employment Type Selector */}
                <div>
                  <label className="block text-sm font-black text-secondary dark:text-white mb-4">What is your employment type?</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "salaried", label: "Salaried", desc: "Get paid monthly salary in bank" },
                      { id: "self_employed", label: "Self-Employed", desc: "Own a business or practice" }
                    ].map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => setEmployment(emp.id as any)}
                        className={`p-5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          employment === emp.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-150/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-500 hover:border-slate-350"
                        }`}
                      >
                        <span className="text-sm font-black uppercase tracking-wider">{emp.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{emp.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Income Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-550 dark:text-slate-400">Monthly Net Income</span>
                    <span className="text-primary font-black">₹{income.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="300000"
                    step="5000"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>₹15K</span>
                    <span>₹3 Lacs+</span>
                  </div>
                </div>

                {/* Existing EMIs Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-550 dark:text-slate-400">Existing Monthly EMIs (if any)</span>
                    <span className="text-primary font-black">₹{emis.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="2000"
                    value={emis}
                    onChange={(e) => setEmis(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>₹0</span>
                    <span>₹1 Lac</span>
                  </div>
                </div>
              </motionFramer.div>
            )}

            {step === 3 && (
              <motionFramer.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                {/* Credit Score Range */}
                <div>
                  <label className="block text-sm font-black text-secondary dark:text-white mb-4">Select your Credit Score (CIBIL) Range</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {["750+", "700-749", "650-699", "<650"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setCibil(range as any)}
                        className={`py-3.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                          cibil === range
                            ? "border-primary bg-primary/5 text-primary font-black text-xs"
                            : "border-slate-150/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-500 hover:border-slate-350 text-xs font-bold"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City Selector */}
                <div>
                  <label className="block text-sm font-black text-secondary dark:text-white mb-4">Select your current City</label>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCity(c)}
                        className={`py-2 px-4 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          city === c
                            ? "bg-primary border-primary text-white"
                            : "bg-slate-50/50 dark:bg-slate-900 border-slate-150/60 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </motionFramer.div>
            )}

            {step === 4 && (
              <motionFramer.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                {/* Results Screen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Result Panel */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-3xl text-center space-y-4">
                    <h4 className="text-xs uppercase font-black tracking-widest text-slate-450">Estimated Eligibility Output</h4>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold mb-1">Estimated Monthly EMI</p>
                      <p className="text-4xl font-black text-primary">₹{results.emi.toLocaleString("en-IN")}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">(Calculated over 5 Years tenure)</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/80 flex justify-center items-center gap-3">
                      <span className="text-xs text-slate-550 font-bold">Approval Odds:</span>
                      <span className={`text-xs font-black uppercase tracking-wider py-1 px-3.5 rounded-full ${results.oddsBg} ${results.oddsColor}`}>
                        {results.odds}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      Estimated Interest Rate: <span className="text-secondary dark:text-white font-extrabold">{results.rate}% p.a.</span>
                    </div>
                  </div>

                  {/* Matched Lenders List */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Best Matched Lenders For You
                    </h4>
                    
                    <div className="space-y-3">
                      {matchedLenders.map((lender) => (
                        <div key={lender.name} className="p-4 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-primary flex items-center justify-center font-black text-sm">
                              {lender.name.substring(0,2)}
                            </div>
                            <div>
                              <h5 className="text-sm font-black text-secondary dark:text-white">{lender.name}</h5>
                              <p className="text-[10px] text-slate-400 font-bold">Disbursal in {lender.speed}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-primary">{lender.rate}% p.a.</p>
                            <p className="text-[9px] text-slate-400 font-bold">Docs: {lender.doc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <a
                      href="/personal-loan"
                      className="w-full h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all cursor-pointer"
                    >
                      Instant Callback Approval <ArrowRight size={14} />
                    </a>
                  </div>

                </div>
              </motionFramer.div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800 mt-8 relative z-10">
            {step > 1 && step < 4 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-secondary dark:hover:text-white cursor-pointer"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="rounded-xl h-12 px-6 flex items-center gap-2 font-black uppercase text-xs tracking-widest cursor-pointer"
              >
                {step === 3 ? "Calculate odds" : "Continue"} <ArrowRight size={16} />
              </Button>
            ) : (
              <button
                onClick={() => setStep(1)}
                className="text-xs font-black uppercase tracking-widest text-primary hover:underline cursor-pointer"
              >
                Reset Calculation
              </button>
            )}
          </div>

        </div>

      </div>
    </section>
  )
}
