import React from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowRight, MessageCircle, PhoneCall } from "lucide-react"

const articles = [
  { 
    title: "How to improve your Credit Score in 6 months", 
    category: "Credit Score", 
    date: "May 15, 2026",
    link: "/blog/improve-credit-score"
  },
  { title: "Personal Loan vs Credit Card: Which is better?", category: "Guides", date: "May 08, 2026", link: "#" },
  { title: "Top 5 Banks for Personal Loans in India 2026", category: "Market News", date: "May 05, 2026", link: "#" },
]

export function BlogAndCTA() {
  return (
    <>
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-4">Latest Insights</h2>
              <p className="text-muted-foreground">Expert advice to help you make better financial decisions.</p>
            </div>
            <Button variant="ghost">View Blog <ArrowRight className="ml-2" size={16} /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((a) => (
              <a key={a.title} href={a.link}>
                <Card className="group cursor-pointer overflow-hidden border-slate-100 hover:border-primary transition-all h-full">
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    <span className="absolute bottom-4 left-4 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                      {a.category}
                    </span>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <p className="text-xs text-muted-foreground">{a.date}</p>
                    <h4 className="font-bold text-secondary group-hover:text-primary transition-colors">{a.title}</h4>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>


      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-50 skew-y-6 translate-y-1/2" />
        <div className="container mx-auto px-4 relative z-10 text-center text-white space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold max-w-3xl mx-auto leading-tight">
            Check Your Personal Loan Eligibility in Just 2 Minutes
          </h2>
          <p className="text-xl text-blue-100 max-w-xl mx-auto">
            No impact on your credit score. Secure, hassle-free, and 100% digital process.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button size="lg" variant="accent">Apply Now</Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              <PhoneCall className="mr-2" size={20} /> <a href="tel:+919579005645">9579005645</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
