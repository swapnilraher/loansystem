import { Header, Footer } from "@/components/sections/Layout"
import { ShieldCheck, Award, Target, Users, Landmark, MapPin, Phone, Mail, ArrowRight, Heart } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Techstar Money Solution",
  description: "Discover the story of Techstar Money Solution, India's premier loan marketplace founded by Swapnil Aher. We bridge the gap between borrowers and leading financial institutions.",
  alternates: {
    canonical: "/about"
  }
}

export default function AboutPage() {
  const values = [
    {
      icon: <ShieldCheck size={28} className="text-emerald-500" />,
      title: "Trust & Transparency",
      desc: "No hidden charges, no false promises. We maintain absolute integrity in all our loan advisory services."
    },
    {
      icon: <Target size={28} className="text-blue-500" />,
      title: "Customer First",
      desc: "Our financial recommendation engine and experts match you with the lenders offering the lowest interest rates."
    },
    {
      icon: <Users size={28} className="text-purple-500" />,
      title: "Empowering Partnerships",
      desc: "We support a growing network of DSA partners with tools and training to maximize their payout and efficiency."
    },
    {
      icon: <Award size={28} className="text-amber-500" />,
      title: "Fintech Innovation",
      desc: "Utilizing advanced algorithms to check loan eligibility and calculate EMIs instantly, reducing rejection rates."
    }
  ]

  const stats = [
    { value: "₹100Cr+", label: "Loans Disbursed" },
    { value: "5,000+", label: "Happy Customers" },
    { value: "50+", label: "Banking Partners" },
    { value: "24/7", label: "Expert Support" }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      <Header />

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 max-w-6xl mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 mb-6 text-xs font-black uppercase tracking-widest">
            <Heart size={14} className="animate-pulse" />
            <span>Empowering Your Financial Future</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 font-outfit">
            We Simplify the <span className="text-gradient">Loan Journey</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Techstar Money Solution is a leading digital loan marketplace, dedicated to connecting you with India's most trusted banks and NBFCs. We make borrowing transparent, affordable, and quick.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="container mx-auto px-4 max-w-5xl mb-24">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-xl p-8 md:p-12">
            <div className="row g-4 text-center">
              {stats.map((stat, idx) => (
                <div key={idx} className="col-6 col-md-3">
                  <div className="p-3">
                    <p className="text-3xl md:text-4xl font-black text-gradient font-outfit mb-2">{stat.value}</p>
                    <p className="text-xs uppercase font-black tracking-wider text-slate-400 m-0">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="container mx-auto px-4 max-w-5xl mb-24">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 d-block">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4 font-outfit leading-tight">
                From a Vision to India's Trusted Loan Partner
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-450 text-sm leading-relaxed">
                <p>
                  Techstar Money Solution was established with a singular mission: to eliminate the complexities and ambiguities of securing a loan in India. Whether you are an individual pursuing your dream home or a business seeking capital, we guide you at every step.
                </p>
                <p>
                  As an authorized Direct Selling Agent (DSA) partners with major banks and NBFCs, we operate a sophisticated platform that validates documentation, processes eligibility parameters, and secures the best market rates.
                </p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="bg-gradient-to-tr from-blue-600/10 via-emerald-600/5 to-purple-600/10 p-4 rounded-[2.5rem] border border-slate-200/40 dark:border-slate-800/40">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800/60 shadow-lg text-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 d-flex align-items-center justify-content-center mb-6">
                    <Landmark size={24} />
                  </div>
                  <h3 className="font-black text-xl mb-3 font-outfit">Lender Network</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4">
                    We coordinate directly with 50+ premier lending institutions, enabling rapid loan pre-approvals and customized loan structures to optimize your interest expense.
                  </p>
                  <a href="/#check-eligibility" className="btn btn-paytm btn-sm py-2 px-4 rounded-pill font-bold shadow-sm d-inline-flex align-items-center gap-2 text-xs">
                    Check Eligibility <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Leadership */}
        <section className="container mx-auto px-4 max-w-5xl mb-24">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 d-block">Leadership</span>
            <h2 className="text-3xl md:text-4xl font-black font-outfit">Driven by Financial Experts</h2>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden p-8 md:p-12">
            <div className="row g-5 align-items-center">
              <div className="col-lg-4 text-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-1 mx-auto shadow-lg mb-4">
                  <div className="w-100 h-100 rounded-full bg-white dark:bg-slate-900 d-flex align-items-center justify-content-center overflow-hidden">
                    {/* Placeholder replaced with initials + stylized design to avoid empty images */}
                    <span className="text-4xl font-black text-gradient font-outfit">SA</span>
                  </div>
                </div>
                <h3 className="text-xl font-black font-outfit m-0">Swapnil Aher</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mt-1 mb-0">Founder & Director</p>
              </div>
              <div className="col-lg-8 text-start">
                <h4 className="text-lg font-black font-outfit mb-3">Founder's Vision</h4>
                <div className="space-y-4 text-slate-600 dark:text-slate-450 text-sm leading-relaxed">
                  <p>
                    "Our objective at Techstar Money Solution is to make financial products accessible, transparent, and user-centric. We understand that applying for a loan is a critical decision. That's why we combine advanced technology with dedicated advisory services to deliver a frictionless experience for every borrower."
                  </p>
                  <p>
                    Under Swapnil's leadership, Techstar Money Solution has scaled from a regional consultancy in Pune to a digital-first marketplace serving thousands of clients, recognized for its credit assessment compliance and strong relationship with lending partners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="container mx-auto px-4 max-w-5xl mb-24">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 d-block">Our Principles</span>
            <h2 className="text-3xl md:text-4xl font-black font-outfit">Values that Guide Us</h2>
          </div>
          <div className="row g-4">
            {values.map((val, idx) => (
              <div key={idx} className="col-md-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 hover-lift glass-card h-100 text-start">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 d-flex align-items-center justify-content-center mb-4">
                    {val.icon}
                  </div>
                  <h3 className="font-black text-lg mb-2 font-outfit">{val.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed m-0">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact/Office Info */}
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="bg-gradient-to-r from-blue-600/90 to-blue-800 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-xl pointer-events-none" />
            
            <h2 className="text-2xl md:text-3xl font-black mb-4 font-outfit">Visit Our Headquarters</h2>
            <p className="text-blue-100 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Have questions, need personalized consulting, or want to discuss partner options? Drop by our office or contact our team directly.
            </p>
            
            <div className="row g-4 justify-content-center text-start">
              <div className="col-md-5">
                <div className="d-flex gap-3 align-items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 d-flex align-items-center justify-content-center flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-blue-200">Office Address</h4>
                    <p className="text-xs text-white/90 leading-relaxed m-0">
                      Sadashiv Peth, Pune,<br />
                      Maharashtra, India
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-5">
                <div className="d-flex gap-3 align-items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 d-flex align-items-center justify-content-center flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-blue-200">Contact Details</h4>
                    <p className="text-xs text-white/90 leading-relaxed m-0">
                      Phone: <a href="tel:9579005645" className="text-white text-decoration-none hover:underline">9579005645</a><br />
                      Email: <a href="mailto:support@techstarsolution.in" className="text-white text-decoration-none hover:underline">support@techstarsolution.in</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
