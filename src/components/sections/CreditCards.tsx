import React from "react"
import { CreditCard, Check, ArrowRight, Zap, ShoppingBag, Plane } from "lucide-react"
import { Button } from "@/components/ui/Button"

const cards = [
  {
    name: "Reward Max Platinum",
    bank: "HDFC Bank",
    benefit: "5% Cashback on Amazon",
    fee: "Joining Fee: ₹0",
    image: "https://images.unsplash.com/photo-1540339832862-47452613f174?auto=format&fit=crop&q=80&w=400",
    color: "from-blue-600 to-indigo-900"
  },
  {
    name: "Travel Pro Miles",
    bank: "Axis Bank",
    benefit: "10,000 Bonus Miles",
    fee: "Annual Fee: ₹2,500",
    image: "https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&q=80&w=400",
    color: "from-rose-600 to-rose-900"
  },
  {
    name: "Shopping Gold",
    bank: "ICICI Bank",
    benefit: "Buy 1 Get 1 Movies",
    fee: "Lifetime Free",
    image: "https://images.unsplash.com/photo-1613243555988-441166d4d6fd?auto=format&fit=crop&q=80&w=400",
    color: "from-amber-600 to-amber-900"
  }
]

export function CreditCards() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-secondary leading-tight mb-4">
              Premium <span className="text-primary italic">Credit Cards</span> <br/>
              for Every Lifestyle
            </h2>
            <p className="text-muted-foreground text-lg">Compare 100+ cards based on your spending habits and get instant approval.</p>
          </div>
          <Button size="lg" className="h-14 px-8 rounded-full">View All Cards</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div key={i} className="group relative bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col">
              <div className={`h-56 bg-gradient-to-br ${card.color} p-8 flex flex-col justify-between relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-12 h-8 bg-amber-400 rounded-md opacity-80" /> {/* Chip */}
                  <span className="text-white font-black text-sm uppercase tracking-widest">{card.bank}</span>
                </div>
                <div className="relative z-10">
                  <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Card Holder</p>
                  <p className="text-white font-bold tracking-widest text-lg">{card.name}</p>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-secondary font-bold text-sm">
                    <Check size={18} className="text-green-500" /> {card.benefit}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <Zap size={18} className="text-primary" /> {card.fee}
                  </div>
                </div>
                
                <Button variant="outline" className="mt-auto w-full h-14 rounded-full border-slate-200 group-hover:border-primary group-hover:text-primary transition-all">
                  Apply Now <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
