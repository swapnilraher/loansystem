import React from "react"
import { Heart, Home, GraduationCap, Plane, Briefcase, Smartphone, CreditCard, Gift } from "lucide-react"

const purposes = [
  { icon: Gift, label: "Wedding Expenses", color: "bg-pink-50 text-pink-600" },
  { icon: Heart, label: "Medical Emergencies", color: "bg-red-50 text-red-600" },
  { icon: Home, label: "Home Renovation", color: "bg-blue-50 text-blue-600" },
  { icon: Plane, label: "International Travel", color: "bg-cyan-50 text-cyan-600" },
  { icon: GraduationCap, label: "Higher Education", color: "bg-indigo-50 text-indigo-600" },
  { icon: Smartphone, label: "Gadget Purchases", color: "bg-slate-50 text-slate-600" },
  { icon: CreditCard, label: "Debt Consolidation", color: "bg-amber-50 text-amber-600" },
  { icon: Briefcase, label: "Business Needs", color: "bg-emerald-50 text-emerald-600" },
]

export function Purpose() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">What's Your Purpose?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our personal loans are designed to fit your unique life goals. Choose your reason and apply.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {purposes.map((p) => (
            <div key={p.label} className="group cursor-pointer">
              <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 border border-slate-100 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all">
                <div className={`w-16 h-16 rounded-2xl ${p.color} flex items-center justify-center`}>
                  <p.icon size={32} />
                </div>
                <span className="font-bold text-secondary text-center text-sm md:text-base">{p.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
