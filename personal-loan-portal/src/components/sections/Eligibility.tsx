import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { UserCheck, Briefcase, FileText, Smartphone, Home, Wallet } from "lucide-react"

export function Eligibility() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Eligibility & Documentation</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meeting the basic criteria is the first step toward your personal loan. Check what you need to qualify.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 bg-blue-50/50 rounded-t-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <UserCheck size={24} />
              </div>
              <CardTitle>Salaried Individuals</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ul className="space-y-6">
                {[
                  { label: "Age", value: "21 – 60 years" },
                  { label: "Monthly Income", value: "₹15,000+ (varies by city)" },
                  { label: "Employment", value: "Stable job (min. 1 year total exp.)" },
                  { label: "Credit Score", value: "750 or above (recommended)" },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="font-bold text-secondary">{item.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 bg-amber-50/50 rounded-t-2xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Briefcase size={24} />
              </div>
              <CardTitle>Self-Employed Individuals</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ul className="space-y-6">
                {[
                  { label: "Business Age", value: "Minimum 3 years in continuity" },
                  { label: "Annual Income", value: "ITR of ₹5 Lakh+ per annum" },
                  { label: "Age", value: "25 – 65 years" },
                  { label: "Bank Activity", value: "Consistent banking transactions" },
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="font-bold text-secondary">{item.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { icon: FileText, label: "PAN Card" },
            { icon: Smartphone, label: "Aadhaar Card" },
            { icon: Wallet, label: "Salary Slips" },
            { icon: Home, label: "Address Proof" },
            { icon: FileText, label: "Bank Statements" },
            { icon: UserCheck, label: "Photo" },
          ].map((doc) => (
            <div key={doc.label} className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <doc.icon size={24} />
              </div>
              <span className="text-sm font-bold text-secondary text-center">{doc.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
