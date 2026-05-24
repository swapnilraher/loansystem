"use client"
import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, X } from "lucide-react"

const names = ["Amit", "Rahul", "Priya", "Sneha", "Kshitij", "Rajesh", "Anjali", "Vikrant", "Siddharth", "Neha", "Rohit", "Tanvi", "Sunita", "Gaurav", "Sachin"]
const cities = ["Pune", "Mumbai", "Nagpur", "Nashik", "Thane", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Jaipur", "Lucknow", "Kolkata"]
const loans = ["Personal Loan", "Home Loan", "Business Loan", "Car Loan"]
const amounts = ["₹2,50,000", "₹15,00,000", "₹45,00,000", "₹5,00,000", "₹8,00,000", "₹30,00,000", "₹12,00,000", "₹7,50,000"]

interface Notification {
  id: string
  name: string
  city: string
  loanType: string
  amount: string
}

export function FloatingLeadNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    const showNotification = () => {
      const randomName = names[Math.floor(Math.random() * names.length)]
      const randomCity = cities[Math.floor(Math.random() * cities.length)]
      const randomLoan = loans[Math.floor(Math.random() * loans.length)]
      const randomAmount = amounts[Math.floor(Math.random() * amounts.length)]
      
      setNotification({
        id: Math.random().toString(),
        name: randomName,
        city: randomCity,
        loanType: randomLoan,
        amount: randomAmount,
      })

      // Auto-hide after 4.5 seconds
      const hideTimeout = setTimeout(() => {
        setNotification(null)
      }, 4500)

      return () => clearTimeout(hideTimeout)
    }

    // Run first notification after 6 seconds, repeat every 15 seconds
    const initialTimeout = setTimeout(showNotification, 6000)
    
    const interval = setInterval(() => {
      showNotification()
    }, 15000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="fixed bottom-24 left-4 z-[99] max-w-sm hidden md:block pointer-events-none">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-3xl p-5 shadow-2xl border border-slate-800/80 backdrop-blur-2xl flex items-center gap-4 min-w-[320px] max-w-sm"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest leading-none">Approval Live</p>
              </div>
              <p className="text-sm font-black truncate">
                {notification.name} <span className="text-slate-400 font-bold">from</span> <span className="text-primary-foreground font-black border-b border-primary/40">{notification.city}</span>
              </p>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed mt-0.5">
                Approved for <span className="font-black text-emerald-400">{notification.amount}</span> {notification.loanType}
              </p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-white transition-colors shrink-0 self-start p-1"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
