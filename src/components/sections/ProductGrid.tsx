"use client"
import React from "react"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Home, 
  Briefcase, 
  Coins, 
  Building, 
  ArrowRight,
  Zap,
  TrendingUp,
  CheckCircle2,
  Landmark
} from "lucide-react"
import { Button } from "@/components/ui/Button"

const products = [
  { 
    title: "Personal Loan", 
    desc: "Instant approval for your needs", 
    icon: Zap, 
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", 
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
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", 
    href: "/home-loan",
    badge: "Lowest Rates",
    features: [
      { label: "Interest Rate", value: "8.50% p.a." },
      { label: "Max Amount", value: "₹5 Crore" },
      { label: "Max Tenure", value: "30 Years" }
    ]
  },
  { 
    title: "Mortgage Loan", 
    desc: "High value loans against property", 
    icon: Landmark, 
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20", 
    href: "/loan-against-property",
    badge: "Maximum Funding",
    features: [
      { label: "Interest Rate", value: "9.50% p.a." },
      { label: "Max Amount", value: "₹15 Crore" },
      { label: "Max Tenure", value: "15 Years" }
    ]
  },
  { 
    title: "Business Loan", 
    desc: "Scale your business with ease", 
    icon: Briefcase, 
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", 
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
    color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20", 
    href: "/loan-against-property",
    badge: "Quick Disbursal",
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
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", 
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
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-wider mb-3 shadow-sm border border-amber-200 dark:border-amber-800/50">
              <TrendingUp size={16} /> Compare & Save
            </div>
            <h2 className="display-5 font-black text-paytm-navy dark:text-white leading-tight">
              One Platform for All Your <span className="text-paytm-blue">Financial Needs</span>
            </h2>
          </div>
          <div className="col-lg-auto col-12 text-start text-lg-end">
            <button className="btn btn-paytm font-bold rounded-full py-3 px-6 text-sm uppercase tracking-wider shadow-lg hover:-translate-y-1 transition-transform border-0">
              View All Products <ArrowRight size={18} className="ms-1" />
            </button>
          </div>
        </div>

        {/* Grid Section */}
        <div className="row g-4 justify-content-center">
          {products.map((p, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="col-lg-4 col-md-6 col-12"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] h-100 overflow-hidden d-flex flex-column group shadow-lg border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative">
                
                {/* Glow Effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${p.color.split(' ')[0]} bg-current opacity-5 blur-[50px] rounded-full pointer-events-none`} />

                <div className="p-6 flex-grow-1 position-relative z-10">
                  
                  {/* Card Header */}
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="d-flex align-items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl d-flex align-items-center justify-content-center shadow-md ${p.color}`}>
                        <p.icon size={28} strokeWidth={2.5} />
                      </div>
                      <div className="text-start">
                        <h4 className="text-xl font-black text-paytm-navy dark:text-white m-0 group-hover:text-paytm-blue transition-colors mb-1">{p.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold m-0">{p.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="mb-4 text-start">
                    <span className="px-3 py-1.5 bg-success/15 text-success text-[11px] font-black rounded-pill border border-success/20 uppercase tracking-widest shadow-sm">
                      {p.badge}
                    </span>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800 my-4" />

                  {/* Features Grid */}
                  <div className="row g-3 text-start">
                    {p.features.map((feature, idx) => (
                      <div key={idx} className="col-4">
                        <span className="text-[10px] text-uppercase font-black text-slate-400 d-block mb-1 tracking-wider">{feature.label}</span>
                        <span className="text-[15px] font-black text-slate-800 dark:text-slate-100">{feature.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-top border-slate-100 dark:border-slate-800/60 d-flex justify-content-between align-items-center position-relative z-10">
                  <div className="d-flex align-items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>100% Digital</span>
                  </div>
                  <a 
                    href={p.href}
                    className="btn btn-primary bg-primary border-0 rounded-pill py-2.5 px-5 text-xs text-uppercase font-black tracking-widest d-flex align-items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Check Offers <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
