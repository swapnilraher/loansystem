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
    <section className="py-5 bg-light dark:bg-slate-950 transition-colors duration-300">
      <div className="container py-4">
        
        {/* Header Section */}
        <div className="row justify-content-between align-items-end mb-5 g-3">
          <div className="col-lg-8 col-12 text-start">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider mb-3">
              <TrendingUp size={14} /> Compare & Save
            </div>
            <h2 className="display-6 font-black text-paytm-navy dark:text-white leading-tight">
              One Platform for All Your <span className="text-paytm-blue">Financial Needs</span>
            </h2>
          </div>
          <div className="col-lg-auto col-12 text-start text-lg-end">
            <button className="btn btn-outline-secondary font-bold rounded-full py-2.5 px-4 text-xs uppercase tracking-wider">
              View All Products <ArrowRight size={16} className="ms-1" />
            </button>
          </div>
        </div>

        {/* Grid Section */}
        <div className="row g-4 justify-content-center">
          {products.map((p, i) => (
            <div 
              key={i}
              className="col-lg-4 col-md-6 col-12"
            >
              <div className="card shadow-sm border border-slate-100 dark:bg-slate-900 rounded-[2rem] h-100 overflow-hidden d-flex flex-column hover-lift">
                <div className="p-4 flex-grow-1">
                  
                  {/* Card Header */}
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl d-flex align-items-center justify-content-center ${p.color}`}>
                        <p.icon size={22} strokeWidth={2.5} />
                      </div>
                      <div className="text-start">
                        <h4 className="fs-6 font-black text-paytm-navy dark:text-white m-0">{p.title}</h4>
                        <p className="text-[11px] text-muted font-semibold m-0">{p.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="mb-3 text-start">
                    <span className="px-2.5 py-1 bg-success/15 text-success text-[10px] font-black rounded-pill border border-success/20 uppercase tracking-wider">
                      {p.badge}
                    </span>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800 my-3" />

                  {/* Features Grid */}
                  <div className="row g-2 text-start">
                    {p.features.map((feature, idx) => (
                      <div key={idx} className="col-4">
                        <span className="text-[9px] text-uppercase font-black text-slate-400 d-block mb-1">{feature.label}</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{feature.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-light dark:bg-slate-850 px-4 py-3 border-top border-slate-100 dark:border-slate-800 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <CheckCircle2 size={14} className="text-success" />
                    <span>100% Digital</span>
                  </div>
                  <a 
                    href={p.href}
                    className="btn btn-paytm btn-sm py-2 px-3 text-[10px] text-uppercase font-black tracking-wider d-flex align-items-center gap-1 shadow-sm"
                  >
                    Check Offers <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
