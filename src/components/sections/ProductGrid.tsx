import React from "react"
import { 
  CreditCard, 
  Home, 
  Briefcase, 
  Coins, 
  Building, 
  Smartphone, 
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/Button"

const products = [
  { 
    title: "Personal Loan", 
    desc: "Instant approval for your needs", 
    icon: Zap, 
    color: "bg-blue-500", 
    href: "/personal-loan",
    badge: "8.40% p.a"
  },
  { 
    title: "Home Loan", 
    desc: "Build your dream home today", 
    icon: Home, 
    color: "bg-emerald-500", 
    href: "/home-loan",
    badge: "Lowest Rates"
  },
  { 
    title: "Credit Cards", 
    desc: "Best rewards & cashback cards", 
    icon: CreditCard, 
    color: "bg-orange-500", 
    href: "#",
    badge: "Free Vouchers"
  },
  { 
    title: "Business Loan", 
    desc: "Scale your business with ease", 
    icon: Briefcase, 
    color: "bg-purple-500", 
    href: "#",
    badge: "No Collateral"
  },
  { 
    title: "Loan Against Property", 
    desc: "Unlock the value of your property", 
    icon: Building, 
    color: "bg-rose-500", 
    href: "#",
    badge: "Max Funding"
  },
  { 
    title: "Gold Loan", 
    desc: "Quick cash against your gold", 
    icon: Coins, 
    color: "bg-amber-500", 
    href: "#",
    badge: "Instant Cash"
  },
]

export function ProductGrid() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-lg text-xs font-black uppercase tracking-widest mb-4">
              <TrendingUp size={14} /> Compare & Save
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-secondary dark:text-white leading-tight">
              One Platform for All Your <span className="text-primary italic">Financial Needs</span>
            </h2>
          </div>
          <Button variant="ghost" className="font-black uppercase tracking-widest text-xs hover:gap-3 transition-all dark:text-slate-400">
            View All Products <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p, i) => (
            <a 
              key={i} 
              href={p.href}
              className="group relative bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-primary hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 overflow-hidden"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <p.icon size={28} />
                  </div>
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 text-[10px] font-black text-secondary dark:text-slate-300 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm uppercase tracking-wider">
                    {p.badge}
                  </span>
                </div>
                
                <div className="space-y-2 mb-8">
                  <h3 className="text-2xl font-black text-secondary dark:text-white group-hover:text-primary transition-colors">{p.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium leading-relaxed">{p.desc}</p>
                </div>

                <div className="mt-auto flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  Compare Offers <ArrowRight size={14} />
                </div>
              </div>
              
              {/* Decorative background element */}
              <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${p.color} opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity`} />
            </a>
          ))}
        </div>


      </div>
    </section>

  )
}
