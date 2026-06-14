"use client"
import React, { useState } from "react"
import { Plus, Minus, ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "What is the minimum CIBIL score required for a Personal Loan?",
    a: "Generally, a CIBIL score of 750 or above is considered ideal. However, some lenders may offer loans to individuals with a score as low as 650, though the interest rates might be slightly higher."
  },
  {
    q: "How long does it take for loan disbursement?",
    a: "At Techstar Money Solution, our digital partners often provide instant approval. Once all documents are verified, the loan amount can be disbursed to your bank account within 24 to 48 hours."
  },
  {
    q: "Are there any hidden charges?",
    a: "We believe in 100% transparency. Any processing fees, stamp duty, or insurance charges will be clearly mentioned in your loan agreement. We do not charge any hidden fees for our advisory services."
  },
  {
    q: "Can I prepay or foreclose my loan?",
    a: "Yes, most banks allow foreclosure or part-prepayment after 6 to 12 EMIs. Charges vary by lender; some offer zero foreclosure charges after a certain period."
  },
  {
    q: "Do I need to provide collateral for a personal loan?",
    a: "No, personal loans are unsecured loans, meaning you don't need to provide any collateral like gold or property. Approval is based on your income and credit history."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-12 md:py-16 bg-white dark:bg-slate-950 transition-colors duration-300" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <h2 className="text-4xl font-black text-secondary dark:text-white mb-4">Got Questions? <br/><span className="text-primary italic">We've Got Answers.</span></h2>
          <p className="text-muted-foreground dark:text-slate-400">Find answers to the most commonly asked questions about loans, eligibility, and the application process.</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`group border rounded-3xl transition-all duration-300 overflow-hidden ${
                openIndex === i ? "border-primary bg-blue-50/30 dark:bg-primary/5 shadow-md" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
              }`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className={`text-lg font-bold transition-colors ${
                  openIndex === i ? "text-primary" : "text-secondary dark:text-slate-200"
                }`}>{faq.q}</span>
                <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center transition-all ${
                  openIndex === i ? "bg-primary text-white rotate-180" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700"
                }`}>
                  <ChevronDown size={20} />
                </div>
              </button>
              
              <div className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${
                openIndex === i ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
              }`}>
                <p className="text-secondary/70 dark:text-slate-400 leading-relaxed font-medium">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
