"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

export function DynamicBanners() {
  const banners = [
    {
      id: "personal-loan",
      title: "Get an instant Personal Loan up to",
      highlight: "₹ 5,00,000",
      features: [
        "Instant approval in minutes",
        "Flexible repayment options",
        "Minimal documentation",
      ],
      link: "/personal-loan",
      bgColor: "bg-slate-900",
      textColor: "text-white",
      highlightColor: "text-green-400",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=600&h=400",
    },
    {
      id: "education-loan",
      title: "Your University Plans,",
      highlight: "Funded Right",
      features: [
        "Low-interest education loans",
        "For studies in India and abroad",
        "100% funding available",
      ],
      link: "/education-loan",
      bgColor: "bg-blue-600",
      textColor: "text-white",
      highlightColor: "text-blue-200",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600&h=400",
    },
    {
      id: "cibil-score",
      title: "Get your CIBIL Credit Report",
      highlight: "worth ₹500 for FREE",
      features: [
        "5 Lac+ people have checked",
        "Instant delivery via WhatsApp",
        "No impact on your score",
      ],
      link: "/cibil-score",
      bgColor: "bg-emerald-50",
      textColor: "text-slate-900",
      highlightColor: "text-primary",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600&h=400",
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length)
  }

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 5000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isHovered])

  // Drag handler
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 55
    if (info.offset.x < -swipeThreshold) {
      nextSlide()
    } else if (info.offset.x > swipeThreshold) {
      prevSlide()
    }
  }

  return (
    <section className="py-20 lg:py-24 bg-white dark:bg-slate-950 overflow-hidden relative z-10">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <span className="text-xs font-black uppercase text-primary tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/30">Promotions</span>
          <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mt-4 tracking-tight">Exclusive Financial Offers</h2>
        </div>

        <div 
          className="relative max-w-5xl mx-auto px-4 md:px-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Slider Window */}
          <div className="overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              animate={{ x: -currentIndex * 100 + "%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="flex w-full h-full cursor-grab active:cursor-grabbing"
            >
              {banners.map((banner) => (
                <div 
                  key={banner.id} 
                  className={`w-full shrink-0 ${banner.bgColor} relative flex flex-col md:flex-row min-h-[350px] md:min-h-[400px]`}
                >
                  {/* Content */}
                  <div className={`flex-1 p-8 md:p-12 lg:p-16 z-10 relative flex flex-col justify-center ${banner.textColor}`}>
                    <h3 className="text-2xl md:text-4xl font-black leading-[1.2] mb-6">
                      {banner.title} <br/>
                      <span className={banner.highlightColor}>{banner.highlight}</span>
                    </h3>
                    
                    <ul className="space-y-3 mb-8">
                      {banner.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 font-semibold text-sm md:text-base opacity-90">
                          <CheckCircle2 size={18} className={banner.highlightColor} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div>
                      <a href={banner.link} className={`inline-flex items-center gap-2 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full transition-all shadow-lg active:scale-95 ${
                        banner.bgColor === 'bg-emerald-50' 
                          ? 'bg-primary text-white hover:bg-blue-700 shadow-primary/20' 
                          : 'bg-white text-slate-900 hover:bg-slate-100 shadow-black/10'
                      }`}>
                        Apply Now <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="md:w-[45%] h-52 md:h-auto relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-black/20 z-10 mix-blend-overlay" />
                    <img 
                      src={banner.image} 
                      alt={banner.title} 
                      className="absolute inset-0 w-full h-full object-cover object-center mix-blend-luminosity opacity-80"
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Left Arrow Button */}
          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-6 w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all active:scale-95 z-20 cursor-pointer"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Right Arrow Button */}
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-6 w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all active:scale-95 z-20 cursor-pointer"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx 
                    ? 'w-8 bg-primary' 
                    : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
