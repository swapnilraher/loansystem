import React from "react"
import { CheckCircle2, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"

export function Overview() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="lg:w-2/3 space-y-6">
            <h2 className="text-3xl font-bold text-secondary">What is a Personal Loan?</h2>
            
            <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                A Personal Loan is an <strong>unsecured form of credit</strong> that you can borrow from a bank or NBFC without providing any collateral like property or gold. It is one of the most versatile financial products available in India, offering quick access to funds for various personal needs. Unlike a home loan or a car loan, there are no restrictions on how you use the money.
              </p>
              <p>
                Whether you are facing a medical emergency, planning your dream wedding, renovating your home, or consolidating existing high-interest debts, a personal loan provides the necessary liquidity. The repayment is structured through <strong>Equated Monthly Installments (EMIs)</strong> over a flexible tenure ranging from 12 to 84 months.
              </p>
              <p>
                The eligibility for a personal loan primarily depends on your monthly income, credit score, and employment stability. Banks prefer individuals with a stable job in a reputed company and a <strong>CIBIL score above 750</strong>. However, with the rise of digital lending, many fintech partners now offer loans to individuals with slightly lower scores or varying income levels.
              </p>
              <p>
                Comparing personal loan offers is crucial because interest rates can vary significantly between lenders. Even a 0.5% difference in the interest rate can save you thousands of rupees over the loan tenure. Additionally, factors like processing fees, foreclosure charges, and disbursal time should be carefully considered before making a final decision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {[
                "Medical Emergencies",
                "Home Renovation",
                "Wedding Expenses",
                "Debt Consolidation",
                "Higher Education",
                "International Travel",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 border rounded-2xl bg-slate-50/50">
                  <CheckCircle2 className="text-primary" size={20} />
                  <span className="font-semibold text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/3 w-full">
            <Card className="bg-primary text-white border-none shadow-blue-200">
              <CardContent className="p-8 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Info size={24} />
                </div>
                <h3 className="text-2xl font-bold">Why Compare with Us?</h3>
                <ul className="space-y-4">
                  {[
                    "Access to 100+ Lending Partners",
                    "Unbiased Comparison of Rates",
                    "End-to-End Application Support",
                    "Zero Hidden Charges",
                    "Completely Paperless Process",
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
