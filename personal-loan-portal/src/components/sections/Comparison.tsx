"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ArrowUpDown, Filter } from "lucide-react"

const comparisonData = [
  { bank: "HDFC Bank", rate: 10.5, fee: "0.5% - 2.5%", loan: "50 Lakh", tenure: "6 Years" },
  { bank: "ICICI Bank", rate: 10.75, fee: "Up to 2.25%", loan: "40 Lakh", tenure: "5 Years" },
  { bank: "Axis Bank", rate: 10.49, fee: "1% - 2%", loan: "40 Lakh", tenure: "5 Years" },
  { bank: "SBI", rate: 11.0, fee: "Up to 1.5%", loan: "20 Lakh", tenure: "6 Years" },
  { bank: "Kotak Bank", rate: 10.99, fee: "0.99% - 2.5%", loan: "30 Lakh", tenure: "5 Years" },
  { bank: "IDFC First", rate: 10.49, fee: "Up to 3%", loan: "1 Cr", tenure: "7 Years" },
]

export function Comparison() {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const sortedData = [...comparisonData].sort((a, b) => 
    sortOrder === "asc" ? a.rate - b.rate : b.rate - a.rate
  )

  return (
    <section className="py-20 bg-white" id="compare">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Interest Rate Comparison</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compare personal loan interest rates from top banks in India and choose the one that fits your budget.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 overflow-x-auto">
            <div className="min-w-[600px] bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 font-bold text-secondary">Lender</th>
                    <th className="px-6 py-5 font-bold text-secondary cursor-pointer" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                      <div className="flex items-center gap-2">Interest Rate <ArrowUpDown size={14} /></div>
                    </th>
                    <th className="px-6 py-5 font-bold text-secondary">Processing Fee</th>
                    <th className="px-6 py-5 font-bold text-secondary">Max Loan</th>
                    <th className="px-6 py-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item) => (
                    <tr key={item.bank} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-secondary">{item.bank}</td>
                      <td className="px-6 py-4 text-primary font-bold">{item.rate}% p.a.</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.fee}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-secondary">Up to ₹{item.loan}</td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm">Apply</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-none bg-slate-50 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Interest Rate Visualizer</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="bank" type="category" width={80} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={20}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rate < 10.6 ? "#2563eb" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
