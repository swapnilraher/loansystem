"use client"

import React from "react"
import { motion } from "framer-motion"

const stats = [
  { label: "Interest Rate Starting At", value: "10.50%", color: "#2563eb", percentage: 75 },
  { label: "Approval Rate", value: "92%", color: "#10b981", percentage: 92 },
  { label: "Loan Amount Up To", value: "₹50 Lakhs", color: "#f59e0b", percentage: 85 },
  { label: "Processing Time", value: "24 Hours", color: "#6366f1", percentage: 60 },
]

export function AnimatedStats() {
  return (
    <section className="py-20 bg-secondary text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-3xl rounded-full translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center text-center space-y-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke={stat.color}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="364.4"
                    initial={{ strokeDashoffset: 364.4 }}
                    whileInView={{ strokeDashoffset: 364.4 - (364.4 * stat.percentage) / 100 }}
                    transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{stat.value}</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
