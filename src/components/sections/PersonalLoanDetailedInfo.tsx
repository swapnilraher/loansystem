"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  Wallet, 
  Percent, 
  Calendar,
  Heart,
  Plane,
  Home,
  UserCheck
} from "lucide-react"

export function PersonalLoanDetailedInfo() {
  const factors = [
    {
      title: "Credit (CIBIL) Score",
      desc: "A CIBIL score of 750+ indicates excellent repayment history and helps secure the lowest interest rates.",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      title: "Monthly Salary / Income",
      desc: "Higher income reduces default risk, qualifying you for larger loan values and better rate tiers.",
      icon: Wallet,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Employer Categories",
      desc: "Working with Category A MNCs, government bodies, or top corporate firms unlocks special pre-approved deals.",
      icon: Building2,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Existing Relationship",
      desc: "Lenders offer special processing fee waivers or interest discounts to their existing bank account holders.",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
    }
  ]

  const loanTypes = [
    { title: "Wedding Expenses", desc: "Manage venue bookings, jewelry, and catering without budget constraints.", icon: Sparkles, color: "bg-pink-50 text-pink-600 dark:bg-pink-950/20" },
    { title: "Medical Emergencies", desc: "Cover hospital bills, surgery costs, and urgent treatments instantly.", icon: Heart, color: "bg-red-50 text-red-600 dark:bg-red-950/20" },
    { title: "Home Renovation", desc: "Upgrade your living space, renovate kitchens, or repaint before festivals.", icon: Home, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/20" },
    { title: "Travel & Vacation", desc: "Finance international trips, flights, and holiday packages stress-free.", icon: Plane, color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20" },
    { title: "Debt Consolidation", desc: "Combine multiple high-interest credit card debts into a single, cheaper monthly EMI.", icon: DollarSign, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" }
  ]

  return (
    <section className="py-12 md:py-16 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-4 space-y-16">
        
        {/* Section 1: Factors Influencing Rates */}
        <div className="space-y-8 text-left">
          <div className="max-w-3xl">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              Interest Rate Insights
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
              Factors Influencing Your Personal Loan Rates
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 font-semibold">
              Interest rates aren't uniform. Lenders calculate your customized interest quote using these primary credit markers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {factors.map((factor, idx) => (
              <Card key={idx} className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover-lift rounded-3xl">
                <CardContent className="p-5 space-y-4">
                  <div className={`w-10 h-10 rounded-xl ${factor.color} flex items-center justify-center shrink-0`}>
                    <factor.icon size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-sm text-secondary dark:text-white">{factor.title}</h4>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">{factor.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 2: Detailed Fees & Charges Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              Pricing Transparency
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
              Standard Fees & Other Loan Charges
            </h2>
            <p className="text-xs md:text-sm text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
              Personal loan expenses go beyond just the interest rate. Compare all major fee components to choose the most cost-effective deal.
            </p>
            
            {/* Highlighted Callout: 0% Foreclosure */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                <Percent size={16} />
              </div>
              <div>
                <h5 className="font-black text-emerald-800 dark:text-emerald-400 text-xs">Nil Foreclosure Option (0%)</h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-bold mt-1">
                  Many of our top lending partners offer **0% foreclosure and part-prepayment charges** after 6 to 12 EMIs. Prepay your loan early without any penalties!
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] uppercase font-black tracking-widest text-slate-400">
                  <th className="py-4 px-6">Fee Category</th>
                  <th className="py-4 px-6">Charge Rates / Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-350">
                <tr>
                  <td className="py-4 px-6 font-bold text-secondary dark:text-white">Processing Fee</td>
                  <td className="py-4 px-6">1.00% to 3.50% of the loan amount (deducted at disbursal)</td>
                </tr>
                <tr className="bg-slate-50/30 dark:bg-slate-950/10">
                  <td className="py-4 px-6 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-primary" /> Foreclosure & Prepayment
                  </td>
                  <td className="py-4 px-6 font-black text-emerald-700 dark:text-emerald-400">
                    0% (NIL charges)* <span className="block text-[9px] text-slate-400 font-bold">Available with select partner banks after initial lock-in period</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-secondary dark:text-white">Late EMI Payment</td>
                  <td className="py-4 px-6">2% to 3% per month on the overdue EMI amount</td>
                </tr>
                <tr className="bg-slate-50/30 dark:bg-slate-950/10">
                  <td className="py-4 px-6 font-bold text-secondary dark:text-white">Bank EMI Bounce Fee</td>
                  <td className="py-4 px-6">₹450 to ₹600 per bounce bounce transaction</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-secondary dark:text-white">Stamp Duty & Govt Taxes</td>
                  <td className="py-4 px-6">As per state laws + 18% GST applicable on processing fees</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Specialized Loan Types */}
        <div className="space-y-8 text-center pt-4">
          <div className="max-w-2xl mx-auto">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
              Loan Variants
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-secondary dark:text-white mt-4 tracking-tight leading-tight">
              A Personal Loan for Every Lifecycle Need
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 font-semibold">
              Get specialized financing options structured around your specific personal milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loanTypes.map((loan, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50/30 dark:bg-slate-900/20 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 text-center group hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${loan.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <loan.icon size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-secondary dark:text-white">{loan.title}</h4>
                  <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 leading-relaxed">{loan.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
