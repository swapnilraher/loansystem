import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { Calendar, Clock, User, ArrowLeft, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

export const metadata = {
  title: "How to Improve Your Credit Score in 6 Months | TechStar Insights",
  description: "A comprehensive guide on boosting your CIBIL score quickly and effectively to get better loan deals.",
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* Blog Hero */}
      <section className="pt-32 pb-16 bg-slate-50 border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <a href="/" className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-8 hover:gap-3 transition-all">
            <ArrowLeft size={16} /> Back to Insights
          </a>
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-primary rounded-lg text-xs font-black uppercase tracking-widest">
              <TrendingUp size={14} /> Credit Health
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-secondary leading-tight">
              How to Improve Your <span className="text-primary italic">Credit Score</span> in 6 Months
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-primary" /> By TechStar Advisors
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" /> May 15, 2026
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" /> 8 min read
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-xl leading-relaxed text-slate-600 mb-12">
              A credit score isn't just a number; it's the key to your financial future. Whether you're planning to buy a home or get a personal loan for a wedding, your CIBIL score determines your eligibility and the interest rate you'll pay. If your score is currently below 750, don't worry. With discipline, you can see a significant improvement in as little as six months.
            </p>

            <h2 className="text-3xl font-black text-secondary mt-16 mb-8">1. Fix the Foundation: Month 1-2</h2>
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 mb-10">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <CheckCircle2 size={24} /> Review Your Credit Report
              </h3>
              <p className="text-slate-600">
                The first step is to download your official CIBIL report. Check for errors like closed accounts still showing as active, incorrect personal details, or loans you never took. Disputes can take 30-45 days to resolve, so start early.
              </p>
            </div>

            <h2 className="text-3xl font-black text-secondary mt-16 mb-8">2. The Golden Rule: 100% On-Time Payments</h2>
            <p className="text-slate-600 mb-8">
              Payment history accounts for **35% of your total credit score**. Even a single delayed payment can drop your score by 50 points or more.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
              {[
                "Set up Auto-Debit for all EMIs",
                "Pay Credit Card bills 3 days before due date",
                "Clear even the smallest dues (e.g. ₹500)",
                "Avoid 'Settling' accounts; always 'Close' them"
              ].map((tip, i) => (
                <li key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl font-bold text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" /> {tip}
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-black text-secondary mt-16 mb-8">3. Reduce Credit Utilization: Month 3-4</h2>
            <p className="text-slate-600 mb-8">
              Credit Utilization Ratio (CUR) is the percentage of your total credit limit that you're using. Ideally, you should keep this **below 30%**.
            </p>
            <div className="p-6 border-l-4 border-amber-500 bg-amber-50 rounded-r-2xl mb-10">
              <p className="text-amber-900 font-bold flex items-center gap-2">
                <AlertCircle size={20} /> Pro Tip:
              </p>
              <p className="text-amber-800 italic">
                If your limit is ₹1,00,000, don't spend more than ₹30,000 in a month. If you have a big purchase, pay it off immediately rather than waiting for the bill.
              </p>
            </div>

            <h2 className="text-3xl font-black text-secondary mt-16 mb-8">4. Diversify & Wait: Month 5-6</h2>
            <p className="text-slate-600 mb-8">
              Lenders like to see a mix of secured loans (Home/Car) and unsecured loans (Personal/Credit Card). If you only have credit cards, taking a small personal loan and paying it back perfectly can actually *improve* your score.
            </p>

            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] mt-20 text-center space-y-6">
              <h2 className="text-3xl font-black">Ready to Check Your Progress?</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Improving your score is a journey. Let TechStar help you find the best loan products that match your improved profile.
              </p>
              <div className="pt-6">
                <Button size="lg" className="h-16 px-12 text-lg">Check Free CIBIL Score</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
