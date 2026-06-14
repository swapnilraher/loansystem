"use client"
import React, { useState } from "react"
import { Building, Sparkles, Shield, ArrowRight, Zap, HelpCircle } from "lucide-react"

type LoanProduct = {
  bank: string
  rate: string
  processingFee: string
  amount: string
  tenure: string
}

type CardProduct = {
  name: string
  fee: string
  rewards: string
  benefit: string
  gift: string
}

const personalLoans: LoanProduct[] = [
  { bank: "HDFC Bank", rate: "10.50% - 21.00%", processingFee: "Up to 2.50%", amount: "Up to ₹50 Lakhs", tenure: "1 to 5 Years" },
  { bank: "State Bank of India (SBI)", rate: "11.00% - 15.00%", processingFee: "Up to 1.50%", amount: "Up to ₹20 Lakhs", tenure: "1 to 6 Years" },
  { bank: "ICICI Bank", rate: "10.75% - 19.00%", processingFee: "Up to 2.25%", amount: "Up to ₹50 Lakhs", tenure: "1 to 5 Years" },
  { bank: "Axis Bank", rate: "10.49% - 22.00%", processingFee: "Up to 2.00%", amount: "Up to ₹40 Lakhs", tenure: "1 to 5 Years" },
  { bank: "Bajaj Finserv", rate: "11.00% - 25.00%", processingFee: "Up to 3.99%", amount: "Up to ₹40 Lakhs", tenure: "1 to 7 Years" }
]

const homeLoans: LoanProduct[] = [
  { bank: "State Bank of India (SBI)", rate: "8.40% - 9.15%", processingFee: "Up to 0.35%", amount: "Up to ₹10 Crores", tenure: "Up to 30 Years" },
  { bank: "HDFC Bank", rate: "8.45% - 9.20%", processingFee: "Up to 0.50%", amount: "Up to ₹10 Crores", tenure: "Up to 30 Years" },
  { bank: "LIC Housing Finance", rate: "8.50% - 9.30%", processingFee: "Up to 0.25%", amount: "Up to ₹15 Crores", tenure: "Up to 30 Years" },
  { bank: "Axis Bank", rate: "8.65% - 9.45%", processingFee: "Up to 0.50%", amount: "Up to ₹5 Crores", tenure: "Up to 30 Years" },
  { bank: "Kotak Mahindra Bank", rate: "8.40% - 9.00%", processingFee: "Up to 0.50%", amount: "Up to ₹5 Crores", tenure: "Up to 30 Years" }
]

const businessLoans: LoanProduct[] = [
  { bank: "Tata Capital", rate: "14.00% - 22.00%", processingFee: "Up to 2.50%", amount: "Up to ₹75 Lakhs", tenure: "1 to 5 Years" },
  { bank: "Bajaj Finserv", rate: "14.50% - 26.00%", processingFee: "Up to 3.00%", amount: "Up to ₹50 Lakhs", tenure: "1 to 5 Years" },
  { bank: "HDFC Bank", rate: "15.00% - 21.00%", processingFee: "Up to 2.00%", amount: "Up to ₹50 Lakhs", tenure: "1 to 4 Years" },
  { bank: "ICICI Bank", rate: "14.25% - 20.00%", processingFee: "Up to 2.00%", amount: "Up to ₹40 Lakhs", tenure: "1 to 5 Years" }
]

const creditCards: CardProduct[] = [
  { name: "HDFC Regalia Gold", fee: "₹2,500 (Refundable)", rewards: "4% Reward Rate", benefit: "Complimentary Club Vistara & Flight Tickets", gift: "2,500 Reward Points" },
  { name: "SBI Card Elite", fee: "₹4,999", rewards: "2.5% Reward Rate", benefit: "Free Movie Tickets worth ₹6,000/year", gift: "₹5,000 e-Gift Voucher" },
  { name: "ICICI Coral Card", fee: "₹500 (Waived on spend)", rewards: "1% Reward Rate", benefit: "Buy 1 Get 1 Free Movie Tickets", gift: "Shopping Discount Vouchers" },
  { name: "Axis Bank Ace", fee: "₹499", rewards: "2% Cashback", benefit: "Unlimited 2% cashback on all spends", gift: "Cashback on first transaction" }
]

export default function LoanComparisonTable() {
  const [activeTab, setActiveTab] = useState<"personal" | "home" | "business" | "cards">("personal")

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">
            Compare Rates
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
            Latest Interest Rates & Card Offers
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold max-w-xl mx-auto">
            Compare and choose from top banks offering competitive rates, zero processing fees, and premium card benefits.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md">
            {[
              { id: "personal", label: "Personal Loan" },
              { id: "home", label: "Home Loan" },
              { id: "business", label: "Business Loan" },
              { id: "cards", label: "Credit Cards" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg"
                    : "text-slate-500 dark:text-slate-400 hover:text-secondary dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            {activeTab !== "cards" ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-450">
                    <th className="py-6 px-8">Bank / Lender</th>
                    <th className="py-6 px-6">Interest Rate (p.a.)</th>
                    <th className="py-6 px-6">Processing Fee</th>
                    <th className="py-6 px-6">Max Loan Amount</th>
                    <th className="py-6 px-6">Repayment Tenure</th>
                    <th className="py-6 px-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {((activeTab === "personal" ? personalLoans : activeTab === "home" ? homeLoans : businessLoans) as LoanProduct[]).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-6 px-8 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner shrink-0">
                          <Building size={20} />
                        </div>
                        <span className="font-black text-secondary dark:text-white text-sm">{row.bank}</span>
                      </td>
                      <td className="py-6 px-6">
                        <span className="text-sm font-black text-primary">{row.rate}</span>
                        <span className="block text-[10px] font-bold text-slate-400">Floating*</span>
                      </td>
                      <td className="py-6 px-6 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {row.processingFee}
                      </td>
                      <td className="py-6 px-6 text-sm font-bold text-secondary dark:text-white">
                        {row.amount}
                      </td>
                      <td className="py-6 px-6 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {row.tenure}
                      </td>
                      <td className="py-6 px-8 text-right">
                        <a
                          href={activeTab === "personal" ? "/personal-loan" : activeTab === "home" ? "/home-loan" : "#"}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                        >
                          Check Offer <ArrowRight size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-450">
                    <th className="py-6 px-8">Credit Card</th>
                    <th className="py-6 px-6">Annual Membership Fee</th>
                    <th className="py-6 px-6">Reward Rate</th>
                    <th className="py-6 px-6">Key Benefit</th>
                    <th className="py-6 px-6">Welcome Gift</th>
                    <th className="py-6 px-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {creditCards.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-6 px-8 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
                          <Sparkles size={20} />
                        </div>
                        <span className="font-black text-secondary dark:text-white text-sm">{row.name}</span>
                      </td>
                      <td className="py-6 px-6 text-sm font-black text-secondary dark:text-white">
                        {row.fee}
                      </td>
                      <td className="py-6 px-6 text-sm font-black text-primary">
                        {row.rewards}
                      </td>
                      <td className="py-6 px-6 text-xs font-bold text-slate-650 dark:text-slate-400">
                        {row.benefit}
                      </td>
                      <td className="py-6 px-6 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {row.gift}
                      </td>
                      <td className="py-6 px-8 text-right">
                        <a
                          href="#"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                        >
                          Apply Now <ArrowRight size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden">
            {activeTab !== "cards" ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-850 p-6 space-y-4">
                {((activeTab === "personal" ? personalLoans : activeTab === "home" ? homeLoans : businessLoans) as LoanProduct[]).map((row, idx) => (
                  <div key={idx} className="pt-6 first:pt-2 last:pb-2 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner shrink-0">
                        <Building size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-secondary dark:text-white text-sm">{row.bank}</h4>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">Floating*</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Interest Rate</p>
                        <p className="text-sm font-black text-primary">{row.rate} p.a.</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Processing Fee</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-350">{row.processingFee}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Max Amount</p>
                        <p className="text-xs font-bold text-secondary dark:text-white">{row.amount}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tenure</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-350">{row.tenure}</p>
                      </div>
                    </div>
                    <a
                      href={activeTab === "personal" ? "/personal-loan" : activeTab === "home" ? "/home-loan" : "#"}
                      className="w-full h-11 bg-primary hover:bg-blue-750 text-white rounded-full flex items-center justify-center font-black uppercase tracking-widest text-[10px] gap-2 shadow-md"
                    >
                      Check Offer <ArrowRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-850 p-6 space-y-4">
                {creditCards.map((row, idx) => (
                  <div key={idx} className="pt-6 first:pt-2 last:pb-2 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-secondary dark:text-white text-sm">{row.name}</h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Annual Fee</p>
                        <p className="text-xs font-black text-secondary dark:text-white">{row.fee}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reward Rate</p>
                        <p className="text-sm font-black text-primary">{row.rewards}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Key Benefit</p>
                        <p className="text-xs font-bold text-slate-650 dark:text-slate-350">{row.benefit}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Welcome Gift</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-450">{row.gift}</p>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="w-full h-11 bg-primary hover:bg-blue-750 text-white rounded-full flex items-center justify-center font-black uppercase tracking-widest text-[10px] gap-2 shadow-md"
                    >
                      Apply Now <ArrowRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 px-6">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-emerald-500" />
            <span>Information verified daily. Rates are subject to bank terms.</span>
          </div>
          <div>*Terms and conditions apply. Processing fee is exclusive of GST.</div>
        </div>
      </div>
    </section>
  )
}
