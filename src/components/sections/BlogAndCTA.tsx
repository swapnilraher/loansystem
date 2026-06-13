"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowRight, MessageCircle, PhoneCall, TrendingUp, CreditCard, Building } from "lucide-react"

const articles = [
  { 
    title: "How to improve your Credit Score in 6 months", 
    category: "Credit Score", 
    date: "May 15, 2026",
    link: "/blog/improve-credit-score",
    gradient: "from-emerald-450 to-teal-650",
    icon: TrendingUp
  },
  { 
    title: "Personal Loan vs Credit Card: Which is better?", 
    category: "Guides", 
    date: "May 08, 2026", 
    link: "#",
    gradient: "from-blue-450 to-indigo-650",
    icon: CreditCard
  },
  { 
    title: "Top 5 Banks for Personal Loans in India 2026", 
    category: "Market News", 
    date: "May 05, 2026", 
    link: "#",
    gradient: "from-purple-450 to-pink-650",
    icon: Building
  },
]

export function BlogAndCTA() {
  return (
    <>
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white tracking-tight">Latest Insights</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-2">Expert advice to help you make better financial decisions.</p>
            </div>
            <a 
              href="#" 
              className="inline-flex items-center text-xs font-black uppercase text-primary tracking-widest hover:underline"
            >
              View Blog <ArrowRight className="ml-2" size={16} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((a) => {
              const Icon = a.icon;
              return (
                <a key={a.title} href={a.link} className="block group">
                  <Card className="cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-800/80 hover:border-primary/40 dark:hover:border-primary/40 transition-all h-full shadow-sm hover:shadow-md rounded-3xl flex flex-col bg-white dark:bg-slate-900">
                    <div className={`h-48 bg-gradient-to-br ${a.gradient} relative overflow-hidden flex items-center justify-center shrink-0`}>
                      <Icon className="text-white/20 w-20 h-20 transform group-hover:scale-110 transition-transform duration-500" />
                      <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                        {a.category}
                      </span>
                    </div>
                    <CardContent className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{a.date}</p>
                      <h4 className="font-bold text-secondary dark:text-white group-hover:text-primary transition-colors leading-snug text-base flex-grow">{a.title}</h4>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Floating CTA Banner */}
      <div className="container mx-auto px-4 max-w-7xl my-16">
        <section className="py-20 bg-primary relative overflow-hidden rounded-[2.5rem] lg:rounded-[3.5rem] shadow-xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[90px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 text-center text-white space-y-6">
            <h2 className="text-3xl md:text-5xl font-black max-w-3xl mx-auto leading-tight tracking-tight">
              Check Your Personal Loan Eligibility in Just 2 Minutes
            </h2>
            <p className="text-sm md:text-base text-white/80 max-w-xl mx-auto font-medium leading-relaxed">
              No impact on your credit score. Secure, hassle-free, and 100% digital process.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a 
                href="/personal-loan" 
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-650 rounded-full font-black uppercase tracking-wider text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Apply Now <ArrowRight size={16} className="ml-2" />
              </a>
              <a 
                href="tel:+919579005645" 
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white text-white rounded-full font-black uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
              >
                <PhoneCall className="mr-2" size={16} /> 9579005645
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
