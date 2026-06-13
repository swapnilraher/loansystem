"use client"

import React from "react"
import { Header, Footer } from "@/components/sections/Layout"
import { PersonalLoanForm } from "./PersonalLoanForm"
import { HomeLoanForm } from "./HomeLoanForm"
import { BusinessLoanForm } from "./BusinessLoanForm"
import { LAPForm } from "./LAPForm"
import { CarLoanForm } from "./CarLoanForm"
import { SEOSchema } from "@/components/ui/SEOSchema"
import { Button } from "@/components/ui/Button"
import { PremiumCard } from "@/components/ui/PremiumCard"
import { StickyMobileCTA } from "@/components/ui/StickyMobileCTA"
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight, 
  Building, 
  FileText, 
  UserCheck, 
  Star, 
  CheckCircle2, 
  Info 
} from "lucide-react"

interface LocationPageTemplateProps {
  service: string
  location: string
  serviceSlug: string
  locationSlug: string
}

export default function LocationPageTemplate({ 
  service, 
  location, 
  serviceSlug, 
  locationSlug 
}: LocationPageTemplateProps) {
  
  // Dynamic pricing settings based on loan products
  let startRate = "10.49%"
  let maxAmount = "₹50 Lakhs"
  let tenure = "1 to 5 Years"
  let fee = "Up to 2.50%"
  
  if (service.includes("Home")) {
    startRate = "8.40%"
    maxAmount = "₹10 Crores"
    tenure = "Up to 30 Years"
    fee = "Up to 0.50%"
  } else if (service.includes("Property") || service.includes("Mortgage") || service.includes("LAP")) {
    startRate = "9.00%"
    maxAmount = "₹5 Crores"
    tenure = "Up to 15 Years"
    fee = "Up to 1.00%"
  } else if (service.includes("Business") || service.includes("MSME") || service.includes("Working Capital")) {
    startRate = "14.00%"
    maxAmount = "₹75 Lakhs"
    tenure = "1 to 5 Years"
    fee = "Up to 3.00%"
  } else if (service.includes("Car") || service.includes("Vehicle") || service.includes("Auto")) {
    startRate = "8.75%"
    maxAmount = "₹50 Lakhs"
    tenure = "Up to 7 Years"
    fee = "Up to 1.50%"
  } else if (service.includes("Agent") || service.includes("DSA")) {
    startRate = "8.40%"
    maxAmount = "₹10 Crores"
    tenure = "Flexible"
    fee = "Minimal"
  }

  // Conversational FAQ schema mapping
  const faqItems = [
    {
      question: `How to get a ${service.toLowerCase()} in ${location}?`,
      answer: `To get a ${service.toLowerCase()} in ${location} through Techstar Money Solution, simply click 'Apply Now' and fill out our 2-minute secure check form. Our local ${location} executives will assist in evaluating bank quotes, managing paperwork, and coordinating direct bank verification.`
    },
    {
      question: `What are the documents required for a ${service.toLowerCase()} in ${location}?`,
      answer: `Standard documentation includes KYC (PAN Card, Aadhaar Card), address verification proof in ${location}, financial records (3 months salary slips or past 2 years ITR returns with computation), and 6 to 12 months official bank statements.`
    },
    {
      question: `What is the minimum CIBIL score required for a loan in ${location}?`,
      answer: "A credit score of 700 or above is ideal to qualify for competitive interest rates starting from 8.40% p.a. However, even if your CIBIL score is lower or has disputes, our local experts offer documentation guidance to strengthen your file for approvals."
    },
    {
      question: `How fast is the approval process for a ${service.toLowerCase()}?`,
      answer: `Techstar Money Solution fast-tracks the evaluation. Pre-approvals and matched banking quotes are generated in under 15 minutes. Final disbursement into your bank account can take 24 to 48 hours for unsecured personal/business loans, and 5 to 7 days for secured property loans in ${location}.`
    }
  ]

  // Breadcrumbs mapping
  const breadcrumbItems = [
    { name: "Home", url: "https://techstarsolution.in" },
    { name: service, url: `https://techstarsolution.in/${serviceSlug}` },
    { name: `${service} in ${location}`, url: `https://techstarsolution.in/${serviceSlug}-${locationSlug}` }
  ]

  // Local SEO Geo coordinate mapping
  let localGeo = { latitude: 19.9975, longitude: 73.7898, postalCode: "422001", street: "College Road, Near Canada Corner", locality: "Nashik" }
  if (location === "Pune") {
    localGeo = { latitude: 18.5204, longitude: 73.8567, postalCode: "411001", street: "FC Road, Shivaji Nagar", locality: "Pune" }
  } else if (location === "Mumbai") {
    localGeo = { latitude: 19.0760, longitude: 72.8777, postalCode: "400001", street: "Bandra Kurla Complex (BKC)", locality: "Mumbai" }
  } else if (location.includes("Sambhajia") || location.includes("Aurangabad")) {
    localGeo = { latitude: 19.8698, longitude: 75.3182, postalCode: "431005", street: "Opposite Devgiri College, Station Road", locality: "Chhatrapati Sambhajianagar" }
  }

  // Peer location links for semantic routing (Internal Linking Cluster)
  const peerLocations = [
    { name: `${service} Nashik`, url: `/${serviceSlug}-nashik` },
    { name: `${service} Pune`, url: `/${serviceSlug}-pune` },
    { name: `${service} Mumbai`, url: `/${serviceSlug}-mumbai` },
    { name: `${service} Sambhajianagar`, url: `/${serviceSlug}-chhatrapati-sambhajianagar` }
  ].filter(l => !l.name.includes(location) && !l.name.includes("Sambhajia"))

  const peerServices = [
    { name: `Personal Loan ${location}`, url: `/personal-loan-${locationSlug}` },
    { name: `Business Loan ${location}`, url: `/business-loan-${locationSlug}` },
    { name: `Home Loan ${location}`, url: `/home-loan-${locationSlug}` },
    { name: `Property Loan ${location}`, url: `/loan-against-property-${locationSlug}` },
    { name: `Loan Agent ${location}`, url: `/loan-agent-${locationSlug}` },
    { name: `DSA Loan ${location}`, url: `/dsa-loan-${locationSlug}` }
  ].filter(s => !s.name.startsWith(service))

  const isSecuredProduct = service.includes("Home") || service.includes("Property")

  return (
    <>
      {/* Schema Injection */}
      <SEOSchema type="FinancialService" data={localGeo} />
      <SEOSchema type="LocalBusiness" data={localGeo} />
      <SEOSchema type="FAQ" data={{ items: faqItems }} />
      <SEOSchema type="Breadcrumb" data={{ items: breadcrumbItems }} />
      <SEOSchema type="Service" data={{ serviceType: `${service} in ${location}`, description: `Apply for ${service.toLowerCase()} in ${location} with starting rates of ${startRate} p.a. Minimal paperwork.` }} />

      <Header />
      
      <main className="min-h-screen pt-20 bg-slate-50/20 dark:bg-slate-950/10">
        
        {/* Localized Hero Banner */}
        <section className="relative py-12 lg:py-16 overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/30 -skew-x-12 translate-x-1/4 z-0 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              
              {/* Left Content */}
              <div className="flex-1 space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-full text-xs font-black uppercase tracking-wider border border-blue-100">
                  <MapPin size={14} className="text-primary animate-pulse" /> {location} Location Office
                </div>
                
                <h1 className="text-3xl lg:text-5xl font-extrabold text-secondary leading-[1.15] tracking-tight">
                  Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 italic">{service}</span> <br />
                  in {location}
                </h1>
                
                <p className="text-lg text-slate-650 dark:text-slate-450 leading-relaxed max-w-xl">
                  Compare competitive loan quotes from 50+ partner banks & financial institutions. Apply for {service.toLowerCase()} in {location} through Techstar Money Solution's customized digital platform. Fast turnaround, high approval ratios, and professional local consultation.
                </p>

                {/* Local Trust Credentials */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-150/40 dark:border-slate-700">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span className="text-xs font-black text-secondary dark:text-slate-200">RBI Authorized DSA Partner</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-150/40 dark:border-slate-700">
                    <Clock size={18} className="text-amber-500" />
                    <span className="text-xs font-black text-secondary dark:text-slate-200">24-48 Hours Disbursal*</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Lead Form Wrapper */}
              <div className="flex-1 w-full flex justify-center lg:justify-end">
                <div id={`${serviceSlug}-${locationSlug}-form`} className="w-full">
                  {service.includes("Home") && <HomeLoanForm />}
                  {(service.includes("Property") || service.includes("Mortgage") || service.includes("LAP")) && <LAPForm />}
                  {(service.includes("Business") || service.includes("MSME") || service.includes("Working Capital")) && <BusinessLoanForm />}
                  {(service.includes("Car") || service.includes("Vehicle") || service.includes("Auto")) && <CarLoanForm />}
                  {(!service.includes("Home") && 
                    !service.includes("Property") && !service.includes("Mortgage") && !service.includes("LAP") &&
                    !service.includes("Business") && !service.includes("MSME") && !service.includes("Working Capital") &&
                    !service.includes("Car") && !service.includes("Vehicle") && !service.includes("Auto")) && <PersonalLoanForm />}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Localized Rates & Parameters */}
        <section className="py-12 bg-slate-50/50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-3xl font-extrabold text-secondary uppercase tracking-tight">
                {service} in {location} Parameters (2026)
              </h2>
              <p className="text-slate-500 text-sm font-bold mt-2">
                Verified loan rates and conditions for borrowers residing in {location} region.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Interest Rate starting", value: `${startRate} p.a.`, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50/50", glow: "rgba(16, 185, 129, 0.12)" },
                { label: "Maximum Loan Limit", value: maxAmount, icon: Building, color: "text-blue-600 bg-blue-50/50", glow: "rgba(59, 130, 246, 0.12)" },
                { label: "Repayment Tenure", value: tenure, icon: Clock, color: "text-amber-600 bg-amber-50/50", glow: "rgba(245, 158, 11, 0.12)" },
                { label: "Processing Fee", value: fee, icon: FileText, color: "text-purple-600 bg-purple-50/50", glow: "rgba(168, 85, 247, 0.12)" }
              ].map((item, idx) => (
                <PremiumCard 
                  key={idx} 
                  glowColor={item.glow}
                  className="p-6 flex flex-col items-center text-center transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4 border border-slate-100/50`}>
                    <item.icon size={22} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-lg font-black text-secondary">{item.value}</p>
                </PremiumCard>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Topical Authority & AI GEO Content section */}
        <section className="py-12 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4 max-w-4xl space-y-8">
            
            <div className="prose prose-lg prose-slate mx-auto text-left">
              <h2 className="text-3xl font-black text-secondary leading-tight mb-6">
                Why Apply for a {service} in {location} via Techstar Money Solution?
              </h2>
              <p className="text-slate-650 leading-relaxed mb-6">
                Techstar Money Solution operates as a premium Direct Selling Agent (DSA) offering comprehensive financial marketplace support across major hubs in Maharashtra. When searching for a verified <strong>loan agent in {location}</strong> or seeking assistance with a <strong>DSA loan in {location}</strong>, our physical team supports you directly at every stage of the validation.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                We perform an objective review of processing fees, interest slab margins, prepayment penalties, and flexible repayment tenures across 50+ public/private banks and non-banking financial companies (NBFCs). This means you save significantly on finance charges, obtaining the best possible quote matching your monthly salary or business income profile.
              </p>

              <h3 className="text-2xl font-black text-secondary mt-12 mb-4">
                Eligibility & Guidelines for Applicants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-3xl">
                  <h4 className="font-black text-base text-secondary dark:text-white flex items-center gap-2 mb-3">
                    <UserCheck size={18} className="text-primary" /> Salaried Individuals
                  </h4>
                  <ul className="space-y-2 text-xs font-bold text-slate-550 dark:text-slate-350 list-disc pl-4">
                    <li>Age limit: 21 to 60 years</li>
                    <li>Minimum Salary: ₹20,000 per month (varies by employer tier)</li>
                    <li>Resident status: Indian Citizen living in {location}</li>
                    <li>Credit history: 700+ CIBIL score recommended</li>
                  </ul>
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-3xl">
                  <h4 className="font-black text-base text-secondary dark:text-white flex items-center gap-2 mb-3">
                    <Building size={18} className="text-primary" /> Self-Employed & MSMEs
                  </h4>
                  <ul className="space-y-2 text-xs font-bold text-slate-550 dark:text-slate-350 list-disc pl-4">
                    <li>Business existence: Minimum 3 years active continuity</li>
                    <li>Income threshold: Verified ITR of ₹3.5 Lakhs+ p.a.</li>
                    <li>Age constraints: 25 to 65 years</li>
                    <li>Registration: GST filing history or MSME Udyam Certificate</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-black text-secondary mt-12 mb-4">
                Documentation Verification Checklist
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Arranging complete papers reduces application query flags or direct rejection ratios by lending credit managers. Keep the following ready:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  "PAN Card (Mandatory Identity Proof)",
                  "Aadhaar Card (Linked Mobile for e-KYC)",
                  "Latest 3 Months Salary Slips (Salaried)",
                  "Income Tax Returns (ITR) with Computation (2 Years)",
                  "Last 6 Months Bank Savings/Current Statements",
                  "GST Returns & Business Address Registration Proof"
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100/50 dark:border-slate-700">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-650 dark:text-slate-300">{doc}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/40 rounded-3xl flex gap-4 my-8">
                <Info size={24} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-secondary dark:text-white text-sm mb-1">CIBIL Score Support</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                    Don't worry if you have minor defaults or a low credit score. Our local {location} documentation team reviews your statements to outline potential corrections and coordinates with banks accepting exceptions.
                  </p>
                </div>
              </div>
            </div>

            {/* PAA Conversational FAQ Panel */}
            <div className="pt-12 border-t border-slate-150 text-left">
              <h3 className="text-2xl md:text-3xl font-black text-secondary mb-8 uppercase tracking-tight">
                FAQ about {service} in {location}
              </h3>
              <div className="space-y-6">
                {faqItems.map((item, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                    <h4 className="text-sm font-black text-secondary dark:text-white mb-2">Q. {item.question}</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">A. {item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Local NAP Consistency Card */}
            <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 my-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="text-left space-y-2 relative z-10">
                <h4 className="text-xs font-black uppercase text-primary tracking-widest">Office Contacts</h4>
                <p className="text-lg font-black text-white">Techstar Money Solution</p>
                <p className="text-xs text-slate-400 font-semibold max-w-sm flex items-center gap-1.5">
                  <MapPin size={12} className="text-primary shrink-0" /> Address: {localGeo.street}, {localGeo.locality}, Maharashtra - {localGeo.postalCode}
                </p>
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Phone size={12} className="text-primary shrink-0" /> Phone: +91 9579005645
                </p>
              </div>
              <div className="shrink-0 relative z-10">
                <a 
                  href="tel:9579005645" 
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white h-12 px-6 rounded-full font-black uppercase tracking-wider text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Call Consultant <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Semantic Internal Linking Clusters */}
            <div className="pt-8 border-t border-slate-150 text-left space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Related Local Directories</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-bold text-primary">
                <div className="space-y-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Compare Other Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {peerLocations.map((link, idx) => (
                      <a key={idx} href={link.url} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary rounded-lg transition-colors">
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Other Loans in {location}</p>
                  <div className="flex flex-wrap gap-2">
                    {peerServices.map((link, idx) => (
                      <a key={idx} href={link.url} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary rounded-lg transition-colors">
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      <StickyMobileCTA targetId={`${serviceSlug}-${locationSlug}-form`} label="Apply Now" />
      <Footer />
    </>
  )
}
