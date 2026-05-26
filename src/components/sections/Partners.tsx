import React from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ExternalLink } from "lucide-react"

const partners = [
  { name: "HDFC Bank", rate: "10.50%", fee: "Up to 2%", tenure: "Up to 72 months", loan: "Up to ₹50 Lakh" },
  { name: "ICICI Bank", rate: "10.75%", fee: "Up to 2.5%", tenure: "Up to 60 months", loan: "Up to ₹40 Lakh" },
  { name: "Axis Bank", rate: "10.49%", fee: "Up to 1.5%", tenure: "Up to 60 months", loan: "Up to ₹40 Lakh" },
  { name: "SBI", rate: "11.00%", fee: "Up to 1%", tenure: "Up to 72 months", loan: "Up to ₹20 Lakh" },
  { name: "Kotak Bank", rate: "10.99%", fee: "Up to 2%", tenure: "Up to 60 months", loan: "Up to ₹30 Lakh" },
  { name: "Bajaj Finance", rate: "13.00%", fee: "Up to 3%", tenure: "Up to 84 months", loan: "Up to ₹25 Lakh" },
]

export function Partners() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-secondary mb-4">Our Top Lending Partners</h2>
            <p className="text-muted-foreground mb-6">
              We have partnered with 100+ leading banks and NBFCs to bring you the best personal loan offers at competitive interest rates.
            </p>
            <div className="flex flex-wrap gap-12 items-center opacity-80 hover:opacity-100 transition-all">
              <img src="/official-partners.png" alt="Official Lending Partners" className="h-14 object-contain shadow-sm rounded-lg" />
            </div>
          </div>
          <Button variant="outline" className="hidden md:flex border-slate-200 hover:border-primary hover:text-primary">
            View All 100+ Partners <ExternalLink className="ml-2" size={16} />
          </Button>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((bank) => (
            <Card key={bank.name} className="overflow-hidden group hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center group-hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center font-black text-[10px] text-primary shadow-sm group-hover:border-primary group-hover:scale-105 transition-all">
                      {bank.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">{bank.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase">
                        <div className="w-1 h-1 rounded-full bg-green-500" /> Verified
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-black text-xl leading-none">{bank.rate}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">p.a*</div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Trust Badge / Stamp */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Certified Partner
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Max Loan</p>
                      <p className="text-sm font-semibold">{bank.loan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Max Tenure</p>
                      <p className="text-sm font-semibold">{bank.tenure}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Processing Fee</p>
                      <p className="text-sm font-semibold">{bank.fee}</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="primary">Apply Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
