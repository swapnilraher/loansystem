"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatCurrency } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export function EMICalculator() {
  const [amount, setAmount] = useState(500000)
  const [interest, setInterest] = useState(10.5)
  const [tenure, setTenure] = useState(5)
  const [tenureType, setTenureType] = useState<"years" | "months">("years")

  const [emi, setEmi] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)
  const [totalPayment, setTotalPayment] = useState(0)

  useEffect(() => {
    const r = interest / 12 / 100
    const n = tenureType === "years" ? tenure * 12 : tenure
    const emiValue = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    
    if (!isNaN(emiValue) && isFinite(emiValue)) {
      setEmi(Math.round(emiValue))
      const totalPay = emiValue * n
      setTotalPayment(Math.round(totalPay))
      setTotalInterest(Math.round(totalPay - amount))
    }
  }, [amount, interest, tenure, tenureType])

  const chartData = [
    { name: "Principal", value: amount, color: "#2563eb" },
    { name: "Interest", value: totalInterest, color: "#f59e0b" },
  ]

  return (
    <section className="py-10 md:py-14 bg-slate-50 dark:bg-slate-950 transition-colors duration-300" id="calculator">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-secondary dark:text-white mb-4">Personal Loan EMI Calculator</h2>
          <p className="text-muted-foreground dark:text-slate-400 max-w-2xl mx-auto">
            Adjust the sliders or enter values manually to estimate your repayments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden dark:bg-slate-900">
            <CardContent className="p-8 space-y-8">
              {/* Loan Amount */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Loan Amount (₹)</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-40 h-12 bg-blue-50 dark:bg-slate-800 border-none rounded-pill text-primary font-black text-right px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                  />
                </div>
                <input 
                  type="range" min="50000" max="5000000" step="10000" value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Interest Rate (% p.a)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={interest}
                    onChange={(e) => setInterest(Number(e.target.value))}
                    className="w-40 h-12 bg-blue-50 dark:bg-slate-800 border-none rounded-pill text-primary font-black text-right px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                  />
                </div>
                <input 
                  type="range" min="8" max="36" step="0.1" value={interest} 
                  onChange={(e) => setInterest(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Tenure */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tenure</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                      <button 
                        onClick={() => { setTenureType("years"); if(tenure > 7) setTenure(5); }}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-pill transition-all ${tenureType === "years" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"}`}
                      >Years</button>
                      <button 
                        onClick={() => { setTenureType("months"); if(tenure <= 7) setTenure(60); }}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-pill transition-all ${tenureType === "months" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"}`}
                      >Months</button>
                    </div>
                  </div>
                  <input 
                    type="number"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-40 h-12 bg-blue-50 dark:bg-slate-800 border-none rounded-pill text-primary font-black text-right px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:text-white"
                  />
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max={tenureType === "years" ? 7 : 84} 
                  step="1" 
                  value={tenure} 
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="p-5 min-h-[120px] flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/10 rounded-[24px] text-center border border-blue-100/50 dark:border-blue-900/20">
                  <p className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-widest leading-tight">Monthly<br/>EMI</p>
                  <p className="text-xl font-black text-secondary dark:text-white mt-1">{formatCurrency(emi)}</p>
                </div>
                <div className="p-5 min-h-[120px] flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-900/10 rounded-[24px] text-center border border-amber-100/50 dark:border-amber-900/20">
                  <p className="text-[10px] font-black text-amber-600 mb-1 uppercase tracking-widest leading-tight">Total<br/>Interest</p>
                  <p className="text-xl font-black text-secondary dark:text-white mt-1">{formatCurrency(totalInterest)}</p>
                </div>
                <div className="p-5 min-h-[120px] flex flex-col items-center justify-center bg-slate-900 dark:bg-slate-800 rounded-[24px] text-center shadow-lg">
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest leading-tight">Total<br/>Payment</p>
                  <p className="text-xl font-black text-white mt-1">{formatCurrency(totalPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden h-full dark:bg-slate-900">
            <CardHeader className="pt-10">
              <CardTitle className="text-center font-black text-secondary dark:text-white uppercase tracking-tight">Payment Breakup</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 md:p-10">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#0f172a', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: number) => formatCurrency(value)} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-8 mt-10">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

  )
}
