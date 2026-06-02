import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { HomeLoanForm } from "@/components/sections/HomeLoanForm"
import { Partners } from "@/components/sections/Partners"
import { HomeLoanCalculator } from "@/components/sections/HomeLoanCalculator"
import { ProcessAndTips } from "@/components/sections/ProcessAndTips"
import { FAQ } from "@/components/sections/FAQ"
import { BlogAndCTA } from "@/components/sections/BlogAndCTA"
import { CIBILBanner } from "@/components/sections/CIBILBanner"
import {
  CheckCircle2,
  Home,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  TrendingDown,
  Zap,
  Percent,
  Building2,
  Landmark,
  Calculator
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { StickyMobileCTA } from "@/components/ui/StickyMobileCTA"

export const metadata = {
  title: "Home Loans 2026: Compare Rates from 50+ Banks | TechStar",
  description: "Get comprehensive information on home loans, tax benefits, eligibility, and documentation. Apply now for the lowest interest rates starting 8.40%.",
}

export default function HomeLoanPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Home Loan Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/30 -skew-x-12 translate-x-1/4 z-0" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-full text-xs font-black uppercase tracking-wider">
                <Percent size={14} /> Rates Starting at 8.40% P.A.
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-secondary leading-[1.1] tracking-tight">
                Finance Your <span className="text-primary italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Dream Home</span> <br />
                with Expert Guidance
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Compare official home loan offers from 50+ major banks and NBFCs. Get 90% funding, tax benefits up to ₹3.5 Lakhs, and 30-year flexible tenures.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <Zap className="text-amber-500" size={20} />
                  <span className="font-bold text-secondary text-sm">Instant Sanction Letter</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <ShieldCheck className="text-green-500" size={20} />
                  <span className="font-bold text-secondary text-sm">Zero Processing Fee*</span>
                </div>
              </div>
            </div>
            <div id="home-loan-form" className="flex-1 w-full flex justify-center lg:justify-end">
              <HomeLoanForm />
            </div>
          </div>
        </div>
      </section>

      {/* Tax Benefits Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-6 leading-tight">Maximize Your Savings with <span className="text-primary">Home Loan Tax Benefits</span></h2>
              <p className="text-slate-400 text-lg mb-10">Did you know you can save up to ₹3.5 Lakhs every year on your taxable income through a home loan? Here's the breakdown of how much you can save.</p>
              <div className="space-y-6">
                {[
                  { section: "Section 24(b)", limit: "₹2 Lakhs", desc: "Deduction on Interest Payment for self-occupied home." },
                  { section: "Section 80C", limit: "₹1.5 Lakhs", desc: "Deduction on Principal Repayment and Stamp Duty." },
                  { section: "Section 80EEA", limit: "₹1.5 Lakhs", desc: "Additional deduction for first-time home buyers (specific criteria)." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                      <Calculator size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">{item.section} - Max {item.limit}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-[3rem] p-10 text-secondary shadow-2xl relative">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                  <TrendingDown size={40} />
                </div>
                <h3 className="text-2xl font-black mb-8">Interest Rate Comparison 2026</h3>
                <div className="space-y-6">
                  {[
                    { bank: "SBI Home Loan", rate: "8.40% - 9.15%", type: "Floating" },
                    { bank: "HDFC Bank", rate: "8.45% - 9.20%", type: "Floating" },
                    { bank: "LIC Housing", rate: "8.50% - 9.30%", type: "Fixed/Float" },
                    { bank: "Axis Bank", rate: "8.65% - 9.45%", type: "Floating" },
                    { bank: "Kotak Bank", rate: "8.40% - 9.00%", type: "Floating" }
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-bold">{row.bank}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{row.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-primary">{row.rate}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">p.a*</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-8 h-14 rounded-2xl font-black">View More Rates</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Home Loan Types */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-secondary mb-6 tracking-tight">One Solution for Every <span className="text-primary italic">Property Goal</span></h2>
            <p className="text-muted-foreground text-lg">We offer specialized home loan products tailored to the specific type of property you are interested in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Home Purchase Loan", icon: Home, desc: "For buying a new or pre-owned apartment, villa, or independent house." },
              { title: "Plot & Land Loan", icon: Landmark, desc: "Financing for purchasing residential land or a plot of land for construction." },
              { title: "Home Renovation", icon: Zap, desc: "Funding for painting, repair, remodeling, or internal/external improvements." },
              { title: "Home Extension", icon: Building2, desc: "Funds to add new rooms, floors, or expand your existing living space." }
            ].map((item, i) => (
              <Card key={i} className="group hover:border-primary transition-all duration-300 rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-2xl">
                <CardContent className="p-10 space-y-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <item.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Partners />

      {/* Detailed Eligibility & Docs */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-secondary">Home Loan <span className="text-primary italic">Eligibility</span> Criteria</h2>
                <p className="text-muted-foreground">The following factors are considered by banks when evaluating your home loan application.</p>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: "Age", value: "21 to 65 years (70 for self-employed)" },
                    { label: "CIBIL Score", value: "700+ is ideal for lower interest rates" },
                    { label: "Income", value: "Min ₹25,000 (Salaried) / ₹3L p.a (Business)" },
                    { label: "Employment", value: "Min 2 years in current profession" },
                    { label: "Nationality", value: "Resident Indian or NRI/PIO" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <span className="font-bold text-slate-500">{item.label}</span>
                      <span className="font-black text-secondary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <h3 className="text-2xl font-black">PMAY Subsidy Benefit</h3>
                <p className="text-blue-100 leading-relaxed">Under the Pradhan Mantri Awas Yojana (PMAY), first-time home buyers can save up to **₹2.67 Lakhs** in interest subsidy. Check if you fall under EWS, LIG, or MIG categories.</p>
                <Button variant="outline" className="bg-white text-primary border-white font-bold h-12 rounded-xl">Check PMAY Eligibility</Button>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-secondary flex items-center gap-4">
                  <FileText className="text-primary" size={40} /> Mandatory Documents
                </h2>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-bold text-primary mb-4 uppercase tracking-widest text-[10px]">KYC & Personal</h4>
                    <ul className="space-y-3">
                      {["Aadhar Card & PAN Card (Mandatory)", "Last 3 months Salary Slips", "Last 6 months Bank Statements", "Form 16 / ITR for last 2 years"].map((txt, i) => (
                        <li key={i} className="flex items-center gap-3 text-secondary font-bold text-sm">
                          <CheckCircle2 size={18} className="text-green-500 shrink-0" /> {txt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-primary mb-4 uppercase tracking-widest text-[10px]">Property Documents</h4>
                    <ul className="space-y-3">
                      {["Copy of Sale Deed / Agreement to Sell", "Allotment Letter from Builder", "NOC from Society/Builder", "Possession Letter & Tax Receipts"].map((txt, i) => (
                        <li key={i} className="flex items-center gap-3 text-secondary font-bold text-sm">
                          <CheckCircle2 size={18} className="text-green-500 shrink-0" /> {txt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeLoanCalculator />

      <ProcessAndTips />
      <CIBILBanner />
      <FAQ />
      <BlogAndCTA />
      <Footer />

      <StickyMobileCTA targetId="home-loan-form" label="Apply Now" />
    </main>
  )
}
