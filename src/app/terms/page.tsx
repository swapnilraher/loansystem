import { Header, Footer } from "@/components/sections/Layout"
import { ShieldCheck, FileText, ArrowRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions | TechStar Business Solution",
  description: "Terms and conditions for using TechStar Business Solution services.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      <Header />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <FileText size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Terms & Conditions</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using our services.
            </p>
            <p className="text-xs uppercase font-black tracking-widest text-slate-400 mt-4">Last Updated: May 2026</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 dark:border-slate-800 space-y-8 prose dark:prose-invert prose-slate max-w-none">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Introduction
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Welcome to TechStar Business Solution. By accessing our website and utilizing our loan facilitation services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our website or services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                Our Role as a DSA
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                TechStar Business Solution acts as a Direct Selling Agent (DSA) and loan facilitator. We do not directly lend money. Instead, we connect you with our partner Banks and Non-Banking Financial Companies (NBFCs). The final decision to approve or reject a loan application rests solely with the respective lender based on their credit policies and your eligibility.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                User Information & Consent
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                By submitting your personal and financial details on our portal, you authorize TechStar Business Solution and our representatives to contact you via Phone, WhatsApp, SMS, or Email regarding your loan application. You also consent to us sharing your details with our partner lenders for the purpose of processing your loan request.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">4</span>
                Fees and Charges
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                TechStar Business Solution does not charge any direct fees from customers for our advisory or loan facilitation services. However, lenders may charge processing fees, administrative fees, or other charges as per their policies, which will be communicated to you by the lender before loan disbursement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">5</span>
                Accuracy of Information
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                You agree to provide true, accurate, current, and complete information during the application process. Providing false or misleading information may lead to the rejection of your loan application and potential legal action by the lenders.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">6</span>
                Limitation of Liability
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                TechStar Business Solution shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our services or the failure of a lender to approve your loan application. We do not guarantee loan approval or specific interest rates.
              </p>
            </section>

            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm font-bold text-slate-500">Have questions about our terms?</p>
              <a href="/#contact" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm hover:underline">
                Contact Support <ArrowRight size={16} />
              </a>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
