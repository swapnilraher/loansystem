import React from "react"
import { Smartphone, CheckCircle2, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function AppDownload() {
  return (
    <section className="py-24 bg-white overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="bg-blue-600 rounded-[3rem] p-10 md:p-20 text-white flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden shadow-2xl">
          {/* Decorative background circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[50px] border-white/5 rounded-full pointer-events-none" />
          
          <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <Smartphone size={14} /> Mobile App
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Your Financial Advisor <br/>
              <span className="text-blue-200 italic">In Your Pocket</span>
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Download the TechStar app to track your loans, check your CIBIL score for free, and get instant notifications on best offers.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button size="lg" className="bg-slate-950 hover:bg-slate-900 h-16 px-8 rounded-2xl flex items-center gap-3">
                <div className="text-left">
                  <p className="text-[8px] uppercase font-bold opacity-60 leading-none">Download on</p>
                  <p className="text-lg font-black leading-tight">Google Play</p>
                </div>
              </Button>
              <Button size="lg" className="bg-slate-950 hover:bg-slate-900 h-16 px-8 rounded-2xl flex items-center gap-3">
                <div className="text-left">
                  <p className="text-[8px] uppercase font-bold opacity-60 leading-none">Download on</p>
                  <p className="text-lg font-black leading-tight">App Store</p>
                </div>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Star size={16} fill="white" />
                <span className="font-bold">4.8 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Download size={16} />
                <span className="font-bold">1M+ Downloads</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-md">
            <img 
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=600" 
              alt="Mobile App" 
              className="relative w-full rounded-[3rem] shadow-2xl border-8 border-slate-900 -rotate-6 group-hover:rotate-0 transition-transform duration-700"
            />
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-400 rounded-3xl flex items-center justify-center text-secondary rotate-12 animate-bounce shadow-xl">
              <Star size={40} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
