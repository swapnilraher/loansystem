import React from "react"
import { PersonalLoanForm } from "./PersonalLoanForm"
import { CheckCircle2, Star, Users, Zap, Shield, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 -skew-x-12 translate-x-1/4 z-0" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-full text-sm font-bold">
                <Star size={16} fill="currentColor" /> India's Most Trusted Loan Platform
              </div>
              {/* Bootstamp / Trust Seal */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border-2 border-amber-200 bg-amber-50 rounded-lg shadow-sm">
                <ShieldCheck className="text-amber-600" size={18} />
                <span className="text-[10px] font-black text-amber-800 uppercase leading-tight">Official<br/>Partner</span>
              </div>
            </div>

            
            <h1 className="text-4xl lg:text-6xl font-extrabold text-secondary leading-tight">
              Get Instant <span className="text-primary">Personal Loan</span> Up to ₹50 Lakhs
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Compare top banks and NBFCs, check eligibility in minutes, and receive quick approvals with minimal documentation. Your financial freedom starts here.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Users, label: "100+ Lending Partners" },
                { icon: Zap, label: "Approval in 24 Hours" },
                { icon: Shield, label: "No Collateral Required" },
                { icon: Star, label: "10 Lakh+ Customers" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-secondary">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg">Check Eligibility</Button>
              <Button variant="outline" size="lg">How it Works</Button>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <PersonalLoanForm />
          </div>
        </div>
      </div>
    </section>
  )
}
