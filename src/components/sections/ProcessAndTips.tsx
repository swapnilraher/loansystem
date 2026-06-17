"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/Card"
import { CheckCircle, XCircle, Info, FileText, UserCheck, Upload, ShieldCheck, CheckCircle2, DollarSign } from "lucide-react"

const steps = [
  { icon: FileText, title: "Fill Application", desc: "Share basic details and requirements." },
  { icon: UserCheck, title: "Check Eligibility", desc: "Get instant eligibility results." },
  { icon: Upload, title: "Upload Documents", desc: "Submit KYC and income proofs digitally." },
  { icon: ShieldCheck, title: "Verification", desc: "Lender verifies your submitted details." },
  { icon: CheckCircle2, title: "Final Approval", desc: "Receive your final loan offer letter." },
  { icon: DollarSign, title: "Disbursal", desc: "Funds transferred to your bank account." },
]

export function ProcessAndTips() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        {/* Credit Score Gauge (Simplified Representation) */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-secondary">Why Your Credit Score Matters</h2>
            <div className="prose prose-slate text-muted-foreground leading-relaxed">
              <p>
                Your Credit Score (CIBIL) is the most critical factor lenders consider when reviewing your personal loan application. It represents your creditworthiness based on your past repayment history.
              </p>
              <ul className="space-y-2 mt-4">
                <li><strong className="text-secondary">750+:</strong> Excellent - Best rates and high approval chance.</li>
                <li><strong className="text-secondary">700–749:</strong> Good - Likely to get approved at standard rates.</li>
                <li><strong className="text-secondary">650–699:</strong> Fair - Limited options and higher interest rates.</li>
                <li><strong className="text-secondary">Below 650:</strong> Challenging - Difficult to get unsecured loans.</li>
              </ul>
            </div>
          </div>
          
          <div className="relative flex flex-col items-center">
            <div className="w-64 h-32 bg-slate-200 rounded-t-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
              <motion.div 
                className="absolute bottom-0 left-1/2 w-1 h-32 bg-secondary origin-bottom -translate-x-1/2"
                initial={{ rotate: -90 }}
                whileInView={{ rotate: 45 }} // Represents ~750 score
                transition={{ duration: 2, ease: "easeOut" }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-secondary shadow-lg" />
            </div>
            <div className="text-center mt-6">
              <span className="text-4xl font-extrabold text-secondary">750</span>
              <p className="text-sm font-bold text-green-600 uppercase tracking-widest mt-1">Excellent Score</p>
            </div>
          </div>
        </div>

        {/* Loan Approval Process */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-secondary text-center mb-16">Loan Approval Process</h2>
          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-0 w-full h-1 bg-blue-100 -z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
              {steps.map((step, i) => (
                <div key={step.title} className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-blue-50 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <step.icon size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">{step.title}</h4>
                    <p className="text-xs text-muted-foreground mt-2">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pros/Cons & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
                <Info className="text-primary" /> Advantages vs Disadvantages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="font-bold text-green-600 text-sm uppercase">Advantages</p>
                  {[
                    "No collateral needed",
                    "Multi-purpose usage",
                    "Fastest disbursal",
                    "Fixed monthly EMI",
                  ].map((p) => (
                    <div key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={16} /> {p}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <p className="font-bold text-red-600 text-sm uppercase">Disadvantages</p>
                  {[
                    "Higher interest rates",
                    "Impact of defaults",
                    "Processing fees",
                    "Prepayment penalties",
                  ].map((c) => (
                    <div key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} /> {c}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary text-white flex flex-col">
            <CardContent className="p-8 flex-grow flex flex-col">
              <h3 className="text-xl font-bold mb-6">Expert Tips for Fast Approval</h3>
              <ul className="space-y-4 mb-8 flex-grow">
                {[
                  "Maintain a CIBIL score of 750 or above.",
                  "Reduce existing debt-to-income ratio.",
                  "Apply for a realistic amount based on income.",
                  "Keep all KYC and income documents ready.",
                  "Avoid multiple loan applications simultaneously.",
                  "Ensure income consistency in bank statements.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={12} />
                    </div>
                    {tip}
                  </li>
                ))}
              </ul>
              
              <div className="p-4 bg-white/10 rounded-lg border border-white/20 mt-auto">
                <p className="text-sm font-medium flex items-start gap-2 leading-relaxed">
                  <Info className="shrink-0 mt-0.5" size={18} />
                  <span>We compare multiple Banks & NBFCs to ensure you get the best loan offer, saving you from applying everywhere.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
