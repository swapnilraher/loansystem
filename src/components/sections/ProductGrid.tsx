"use client"
import React from "react"
import { 
  CreditCard, 
  Home, 
  Briefcase, 
  Coins, 
  Building, 
  ArrowRight,
  Zap,
  TrendingUp,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/Button"

const products = [
  { 
    title: "Personal Loan", 
    desc: "Instant approval for your needs", 
    icon: Zap, 
    color: "text-blue-600 bg-blue-50", 
    href: "/personal-loan",
    badge: "8.40% p.a onwards",
    features: [
      { label: "Interest Rate", value: "10.49% p.a." },
      { label: "Max Amount", value: "₹50 Lakhs" },
      { label: "Max Tenure", value: "6 Years" }
    ]
  },
  { 
    title: "Home Loan", 
    desc: "Build your dream home today", 
    icon: Home, 
    color: "text-emerald-600 bg-emerald-50", 
    href: "/home-loan",
    badge: "Lowest Rates",
    features: [
      { label: "Interest Rate", value: "8.50% p.a." },
      { label: "Max Amount", value: "₹5 Crore" },
      { label: "Max Tenure", value: "30 Years" }
    ]
  },
  { 
    title: "Credit Cards", 
    desc: "Best rewards & cashback cards", 
    icon: CreditCard, 
    color: "text-orange-600 bg-orange-50", 
    href: "/credit-card",
    badge: "Free Vouchers",
    features: [
      { label: "Joining Fee", value: "Nil*" },
      { label: "Cashback", value: "Up to 5%" },
      { label: "Lounge Access", value: "Complimentary" }
    ]
  },
  { 
    title: "Business Loan", 
    desc: "Scale your business with ease", 
    icon: Briefcase, 
    color: "text-purple-600 bg-purple-50", 
    href: "/business-loan",
    badge: "No Collateral",
    features: [
      { label: "Interest Rate", value: "15.00% p.a." },
      { label: "Max Amount", value: "₹75 Lakhs" },
      { label: "Max Tenure", value: "5 Years" }
    ]
  },
  { 
    title: "Loan Against Property", 
    desc: "Unlock the value of your property", 
    icon: Building, 
    color: "text-rose-600 bg-rose-50", 
    href: "/loan-against-property",
    badge: "Max Funding",
    features: [
      { label: "Interest Rate", value: "9.50% p.a." },
      { label: "Max Amount", value: "₹10 Crore" },
      { label: "Max Tenure", value: "15 Years" }
    ]
  },
  { 
    title: "Gold Loan", 
    desc: "Quick cash against your gold", 
    icon: Coins, 
    color: "text-amber-600 bg-amber-50", 
    href: "/gold-loan",
    badge: "Instant Cash",
    features: [
      { label: "Interest Rate", value: "9.00% p.a." },
      { label: "Max Amount", value: "No Limit" },
      { label: "Max Tenure", value: "3 Years" }
    ]
  },
]

export function ProductGrid() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="container mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg text-xs font-black uppercase tracking-widest mb-4">
              <TrendingUp size={14} /> Compare & Save
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white leading-tight">
              One Platform for All Your <span className="text-orange-500">Financial Needs</span>
            </h2>
          </div>
          <Button variant="outline" className="font-bold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            View All Products <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col overflow-hidden"
            >
              <div className="p-6 flex-grow">
                {/* Card Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.color}`}>
                      <p.icon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary dark:text-white">{p.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{p.desc}</p>
                    </div>
                  </div>
                  {/* Badge */}
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-full border border-green-100 dark:border-green-800/50 uppercase tracking-wider whitespace-nowrap">
                    {p.badge}
                  </span>
                </div>

                {/* Key Features Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-5 w-full"></div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {p.features.map((feature, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{feature.label}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{feature.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>100% Paperless</span>
                </div>
                <a 
                  href={p.href}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
                >
                  Check Offers <ArrowRight size={14} className="ml-1.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
