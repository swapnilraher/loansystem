"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, X, Sparkles, ArrowRight } from "lucide-react"

export function FloatingCalculatorWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState(1000000) // Default 10 Lacs
  const [tenure, setTenure] = useState(5) // Default 5 years
  const [rate, setRate] = useState(10.5) // Default 10.5%

  const calculateEMI = () => {
    const P = amount
    const r = (rate / 12) / 100
    const n = tenure * 12
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    return isNaN(emi) ? 0 : Math.round(emi)
  }

  const emi = calculateEMI()
  const totalRepayment = emi * tenure * 12
  const interestCharged = totalRepayment - amount

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-4 z-40">
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 relative group overflow-hidden border border-white/10"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Calculator size={24} className="relative z-10" />
        </motion.button>
      </div>

      {/* Calculator Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[98]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-[400px] bg-white/90 dark:bg-slate-900/90 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-[99] backdrop-blur-2xl text-secondary dark:text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <h3 className="font-black text-lg">Instant EMI Calculator</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Amount Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Loan Amount</span>
                    <span className="text-primary font-black">₹{(amount / 100000).toFixed(1)} Lacs</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="50000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>₹1 Lac</span>
                    <span>₹50 Lacs</span>
                  </div>
                </div>

                {/* Tenure Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Tenure</span>
                    <span className="text-primary font-black">{tenure} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>1 Year</span>
                    <span>5 Years</span>
                  </div>
                </div>

                {/* Interest Rate Slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Interest Rate</span>
                    <span className="text-primary font-black">{rate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>8%</span>
                    <span>18%</span>
                  </div>
                </div>

                {/* Result Block */}
                <div className="p-5 bg-gradient-to-br from-primary/5 to-blue-500/5 dark:from-slate-800/40 dark:to-slate-800/20 rounded-2xl border border-primary/10 dark:border-slate-750 text-xs">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Monthly EMI</p>
                    <p className="text-3xl font-black text-primary">₹{emi.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-bold mb-0.5">Interest Cost</p>
                      <p className="font-extrabold text-slate-700 dark:text-slate-300">₹{Math.round(interestCharged).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-bold mb-0.5">Total Repayment</p>
                      <p className="font-extrabold text-slate-700 dark:text-slate-300">₹{Math.round(totalRepayment).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Link CTA */}
                <a
                  href="/personal-loan"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all duration-300 active:scale-[0.97]"
                >
                  Proceed to Apply <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
