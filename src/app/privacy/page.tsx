import { Header, Footer } from "@/components/sections/Layout"
import { ShieldCheck, Lock, ArrowRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | TechStar Business Solution",
  description: "Privacy policy and data protection guidelines for TechStar Business Solution.",
  alternates: {
    canonical: "https://techstarsolution.in/privacy"
  }
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      <Header />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <Lock size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Your privacy is our priority. Learn how we collect, use, and protect your data.
            </p>
            <p className="text-xs uppercase font-black tracking-widest text-slate-400 mt-4">Last Updated: May 2026</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 dark:border-slate-800 space-y-8 prose dark:prose-invert prose-slate max-w-none">
            
            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Information We Collect
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                When you use TechStar Business Solution, we collect personal and financial information necessary to process your loan application. This includes, but is not limited to: your name, contact details (phone, email), PAN card details, employment information, income details, and demographic information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                How We Use Your Data
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The information collected is strictly used to:
              </p>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-2">
                <li>Evaluate your loan eligibility and process your application.</li>
                <li>Share necessary details with our partner Banks and NBFCs for loan sanctioning.</li>
                <li>Communicate with you regarding your application status via Phone, WhatsApp, SMS, or Email.</li>
                <li>Improve our website performance and customer service experience.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                Data Sharing and Disclosure
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                As a Direct Selling Agent (DSA), we must share your data with financial institutions to fulfill your loan request. We do not sell, trade, or rent your personal information to unauthorized third parties. We ensure that our lending partners are bound by strict confidentiality and data protection laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">4</span>
                Data Security
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We implement robust security measures, including data encryption and secure server hosting (via Firebase and Google Cloud), to protect your personal information against unauthorized access, alteration, or disclosure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">5</span>
                Cookies and Tracking
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Our portal may use "cookies" to enhance user experience. You may choose to set your web browser to refuse cookies, but note that some parts of the site may not function properly as a result.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">6</span>
                Your Rights
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                You have the right to request access to the personal data we hold about you and to request corrections if the data is inaccurate. You may also request deletion of your data, subject to legal and regulatory retention requirements mandated by financial authorities.
              </p>
            </section>

            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm font-bold text-slate-500">Have questions about our privacy policy?</p>
              <a href="/#contact" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm hover:underline">
                Contact Privacy Team <ArrowRight size={16} />
              </a>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
