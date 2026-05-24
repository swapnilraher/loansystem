"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Calculator, Landmark, TrendingUp } from "lucide-react"

export function HomeLoanCalculator() {
  const [amount, setAmount] = useState(5000000)
  const [rate, setRate] = useState(8.5)
  const [tenure, setTenure] = useState(20)
  const [tenureType, setTenureType] = useState<"years" | "months">("years")
  const [emi, setEmi] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)

  useEffect(() => {
    const r = rate / 12 / 100
    const n = tenureType === "years" ? tenure * 12 : tenure
    const emiCalc = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    
    if (!isNaN(emiCalc) && isFinite(emiCalc)) {
      setEmi(Math.round(emiCalc))
      setTotalInterest(Math.round(emiCalc * n - amount))
    }
  }, [amount, rate, tenure, tenureType])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  return (
    <section className="py-24 bg-slate-50 overflow-hidden relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black uppercase tracking-widest mb-4">
            <Calculator size={14} /> Financial Planning
          </div>
          <h2 className="text-4xl font-black text-secondary mb-4">Home Loan <span className="text-primary italic">EMI Calculator</span></h2>
          <p className="text-muted-foreground">Plan your dream home budget. Enter values manually or use the sliders below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Sliders Side */}
          <div className="space-y-10 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
            {/* Amount */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="font-bold text-secondary">Loan Amount (₹)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-40 h-12 bg-blue-50 border-none rounded-2xl text-primary font-black text-right px-4 focus:ring-4 focus:ring-primary/10 outline-none"
                />
              </div>
              <input 
                type="range" min="1000000" max="100000000" step="100000" value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>10 Lac</span>
                <span>10 Cr</span>
              </div>
            </div>

            {/* Interest */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="font-bold text-secondary">Interest Rate (% p.a)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-40 h-12 bg-blue-50 border-none rounded-2xl text-primary font-black text-right px-4 focus:ring-4 focus:ring-primary/10 outline-none"
                />
              </div>
              <input 
                type="range" min="8" max="15" step="0.1" value={rate} 
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>8%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="font-bold text-secondary">Tenure</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => { setTenureType("years"); if(tenure > 30) setTenure(20); }}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${tenureType === "years" ? "bg-white text-primary shadow-sm" : "text-slate-400"}`}
                    >Years</button>
                    <button 
                      onClick={() => { setTenureType("months"); if(tenure <= 30) setTenure(240); }}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${tenureType === "months" ? "bg-white text-primary shadow-sm" : "text-slate-400"}`}
                    >Months</button>
                  </div>
                </div>
                <input 
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-40 h-12 bg-blue-50 border-none rounded-2xl text-primary font-black text-right px-4 focus:ring-4 focus:ring-primary/10 outline-none"
                />
              </div>
              <input 
                type="range" 
                min="1" 
                max={tenureType === "years" ? 30 : 360} 
                step="1" 
                value={tenure} 
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{tenureType === "years" ? "1 Yr" : "12 Mo"}</span>
                <span>{tenureType === "years" ? "30 Yrs" : "360 Mo"}</span>
              </div>
            </div>
          </div>

          {/* Result Side */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
            <h3 className="text-xl font-bold mb-10 text-slate-400 uppercase tracking-widest">Estimated Monthly EMI</h3>
            <div className="space-y-2 mb-12">
              <p className="text-6xl md:text-7xl font-black text-white tracking-tighter">{formatCurrency(emi)}</p>
              <p className="text-primary font-bold flex items-center gap-2">
                <TrendingUp size={16} /> Best rates starting at 8.40%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Interest</p>
                <p className="text-xl font-black text-slate-200">{formatCurrency(totalInterest)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Payable</p>
                <p className="text-xl font-black text-slate-200">{formatCurrency(amount + totalInterest)}</p>
              </div>
            </div>

            <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-wider shadow-xl shadow-primary/20">
              Apply For Home Loan
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
