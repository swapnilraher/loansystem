"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, X, Send, Sparkles, Phone, MessageCircle, MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"

type ChatState = 'idle' | 'awaiting_name' | 'awaiting_mobile' | 'completed';

export function AIChatbot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [messages, setMessages] = useState([
    { id: 1, text: "नमस्कार! मी Techstar Money Solution AI आहे. मी तुम्हाला कर्जाबद्दल कशी मदत करू शकेन?", sender: 'ai' }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatAreaRef = useRef<HTMLDivElement>(null)

  // Lead Collection State
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [leadData, setLeadData] = useState({ name: '', mobile: '' })

  const quickReplies = [
    "💰 वैयक्तिक कर्ज",
    "🏠 गृह कर्ज",
    "💼 बिझनेस लोन",
    "📄 कोणती कागदपत्रे?",
    "⏱️ किती वेळ लागतो?",
    "💯 पात्रता काय आहे?"
  ]

  useEffect(() => {
    // Auto scroll to bottom
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping])

  useEffect(() => {
    // Hide tooltip after 10 seconds
    const timer = setTimeout(() => setShowTooltip(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userText = text;
    const userMessage = { id: Date.now(), text: userText, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(async () => {
      let aiResponse = "";
      const lowerInput = userText.toLowerCase();

      // Lead Collection Flow
      if (chatState === 'awaiting_name') {
        setLeadData(prev => ({ ...prev, name: userText }));
        aiResponse = `धन्यवाद, ${userText}. आता कृपया तुमचा १० अंकी मोबाईल नंबर सांगा, जेणेकरून आमचे अधिकारी तुम्हाला संपर्क करतील.`;
        setChatState('awaiting_mobile');
      }
      else if (chatState === 'awaiting_mobile') {
        const digits = userText.replace(/\D/g, '');
        if (digits.length >= 10) {
          setLeadData(prev => ({ ...prev, mobile: userText }));
          aiResponse = "धन्यवाद! तुमची माहिती सुरक्षितपणे नोंदवली गेली आहे. आमचे तज्ञ लवकरच तुम्हाला कॉल करतील. तुम्हाला आणखी काही माहिती हवी असल्यास विचारू शकता.";
          setChatState('completed');

          try {
            await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fullName: leadData.name || 'Chatbot User',
                mobileNumber: userText,
                source: 'AI Chatbot',
                category: 'Chatbot',
                type: 'Loan Inquiry'
              })
            });
          } catch (e) {
            console.error("Failed to save lead from chat", e);
          }
        } else {
          aiResponse = "हा मोबाईल नंबर योग्य वाटत नाही. कृपया तुमचा १० अंकी चालू मोबाईल नंबर पुन्हा सांगा.";
        }
      }
      // General Inquiry Flow (idle or completed)
      else {
        if (lowerInput.includes("hi") || lowerInput.includes("hello") || lowerInput.includes("namaskar") || lowerInput.includes("नमस्कार") || lowerInput.includes("kase ahat") || lowerInput.includes("कसे आहात")) {
          aiResponse = "नमस्कार! Techstar Money Solution मध्ये आपले स्वागत आहे. मी तुम्हाला कर्ज मिळवण्यात कशी मदत करू?";
        }
        else if (lowerInput.includes("personal") || lowerInput.includes("vyaktigat") || lowerInput.includes("loan") || lowerInput.includes("karj") || lowerInput.includes("कर्ज")) {
          aiResponse = "आम्ही ₹५० लाखांपर्यंतचे वैयक्तिक कर्ज (Personal Loan) देतो, ज्याचा व्याजदर १०.४९% पासून सुरू होतो. यासाठी कोणतीही कागदपत्रे प्रत्यक्ष द्यावी लागत नाहीत (Paperless)! कर्ज प्रक्रियेसाठी कृपया आधी तुमचे पूर्ण नाव सांगा.";
          setChatState('awaiting_name');
        }
        else if (lowerInput.includes("home") || lowerInput.includes("ghar") || lowerInput.includes("घर")) {
          aiResponse = "आमचे गृह कर्ज (Home Loan) ८.५०% व्याजदराने सुरू होते आणि ३० वर्षांपर्यंतची मुदत मिळते. प्रक्रियेला सुरुवात करण्यासाठी कृपया तुमचे पूर्ण नाव सांगा.";
          setChatState('awaiting_name');
        }
        else if (lowerInput.includes("business") || lowerInput.includes("बिझनेस") || lowerInput.includes("व्यवसाय")) {
          aiResponse = "आम्ही नवीन व्यवसायासाठी आणि व्यवसाय वाढवण्यासाठी ₹१ कोटी पर्यंत 'बिझनेस लोन' देतो. अधिक माहितीसाठी कृपया तुमचे पूर्ण नाव सांगा.";
          setChatState('awaiting_name');
        }
        else if (lowerInput.includes("cibil") || lowerInput.includes("score") || lowerInput.includes("सिबिल")) {
          aiResponse = "कर्ज मिळवण्यासाठी साधारणपणे ७०० किंवा त्यापेक्षा जास्त CIBIL स्कोर चांगला मानला जातो. तुम्ही आमच्या वेबसाईटवर तुमचा स्कोर मोफत तपासू शकता!";
        }
        else if (lowerInput.includes("interest") || lowerInput.includes("rate") || lowerInput.includes("vyaj") || lowerInput.includes("व्याज")) {
          aiResponse = "व्याजदर तुमच्या प्रोफाईलवर अवलंबून असतो. वैयक्तिक कर्ज (Personal Loan) १०.४९% आणि गृह कर्ज (Home Loan) ८.५०% पासून सुरू होते.";
        }
        else if (lowerInput.includes("document") || lowerInput.includes("kagadpatre") || lowerInput.includes("कागदपत्रे") || lowerInput.includes("proof")) {
          aiResponse = "साधारणपणे तुम्हाला पॅन कार्ड, आधार कार्ड, शेवटच्या ३ महिन्यांची सॅलरी स्लिप आणि ६ महिन्यांचे बँक स्टेटमेंट लागेल.";
        }
        else if (lowerInput.includes("time") || lowerInput.includes("vel") || lowerInput.includes("वेळ") || lowerInput.includes("किती वेळ")) {
          aiResponse = "तुमची सर्व कागदपत्रे बरोबर असल्यास, कर्ज फक्त २४ ते ४८ तासात मंजूर होऊन तुमच्या खात्यात जमा होते.";
        }
        else if (lowerInput.includes("fee") || lowerInput.includes("शुल्क") || lowerInput.includes("processing")) {
          aiResponse = "प्रोसेसिंग फी साधारणपणे १% ते २% पर्यंत असते. काही बँका सणासुदीला झिरो (0%) प्रोसेसिंग फी ऑफर करतात.";
        }
        else if (lowerInput.includes("eligibility") || lowerInput.includes("patrata") || lowerInput.includes("पात्रता")) {
          aiResponse = "तुम्ही भारताचे नागरिक असावे, वय २१-६० वर्षे असावे, आणि पगार किमान ₹१५,००० असावा. तुमचे क्रेडिट कार्डचे बिल वेळेवर भरलेले असावे.";
        }
        else if (lowerInput.includes("contact") || lowerInput.includes("call") || lowerInput.includes("संपर्क") || lowerInput.includes("बोलणे")) {
          aiResponse = "तुम्ही थेट आमच्या तज्ञांशी बोलू शकता. कृपया खाली दिलेल्या 'Call Us' किंवा 'WhatsApp' बटणावर क्लिक करा!";
        }
        else {
          aiResponse = "मला तुमचा प्रश्न नक्की समजला नाही. तुम्हाला वैयक्तिक कर्ज (Personal Loan) हवे आहे की गृह कर्ज (Home Loan)? कर्ज प्रक्रियेसाठी कृपया तुमचे पूर्ण नाव सांगा.";
          setChatState('awaiting_name');
        }
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai'
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1200)
  }

  // Hide on admin and partner routes (positioned after all hook calls to comply with Rules of Hooks)
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/partner')) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-[92px] lg:bottom-6 right-6 z-[100] flex flex-col items-end">
        {/* Welcome Tooltip */}
        <AnimatePresence>
          {!isOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="mb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-premium p-3.5 rounded-[20px] rounded-br-none relative max-w-[220px] border-b-primary/30 dark:border-b-primary/50"
            >
              <div className="flex items-start gap-2 pr-4">
                <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs font-extrabold text-secondary dark:text-white leading-snug">
                  नमस्कार! कर्ज हवे आहे का? 👋
                </p>
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                className="absolute top-2.5 right-2.5 bg-slate-100/85 dark:bg-slate-800/85 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-full p-1 transition-colors"
              >
                <X size={10} />
              </button>
              {/* Little speech bubble arrow */}
              <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-slate-200/50 dark:border-slate-800/50 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)] w-[340px] sm:w-[400px] mb-4 overflow-hidden flex flex-col border-t-primary/30"
              style={{ height: "600px", maxHeight: "85vh" }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#001a3d] via-[#002e7d] to-[#0046be] p-4.5 flex justify-between items-center text-white relative overflow-hidden shrink-0">
                {/* Tech Grid Background pattern */}
                <div className="absolute inset-0 bg-white/5 opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }} />
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-3.5 relative z-10">
                  {/* Premium Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500/20 to-white/10 backdrop-blur-md border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                      <defs>
                        <linearGradient id="headerAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1E3A8A" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                        <linearGradient id="headerAgentHair" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                        <linearGradient id="headerAgentSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FED7AA" />
                          <stop offset="100%" stopColor="#FDBA74" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="48" fill="url(#headerAvatarGrad)" />
                      <path d="M28 85C28 72 38 68 50 68C62 68 72 72 72 85" fill="#E2E8F0" />
                      <path d="M47 70L50 82L53 70Z" fill="#3B82F6" />
                      <circle cx="50" cy="45" r="16" fill="url(#headerAgentSkin)" />
                      <path d="M34 40C34 28 42 26 50 26C58 26 66 28 66 40C66 42 63 36 50 36C37 36 34 42 34 40Z" fill="url(#headerAgentHair)" />
                      <circle cx="44" cy="44" r="1.7" fill="#1E293B" />
                      <circle cx="56" cy="44" r="1.7" fill="#1E293B" />
                      <path d="M46 51C47.5 52.5 52.5 52.5 54 51" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M33 42C33 32 40 28 50 28C60 28 67 32 67 42" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                      <rect x="30" y="38" width="5" height="10" rx="2" fill="#0F172A" />
                      <rect x="65" y="38" width="5" height="10" rx="2" fill="#0F172A" />
                      <path d="M33 45C33 55 42 58 45 58" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="45" cy="58" r="2" fill="#10B981" />
                    </svg>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#002e7d]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight tracking-wide text-white">Techstar Money AI</h3>
                    <p className="text-[10px] text-emerald-300 flex items-center gap-1 font-black uppercase tracking-wider mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 24/7 active support
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                  className="hover:bg-white/20 transition-all relative z-10 hover:scale-105 active:scale-95"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={chatAreaRef} 
                className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col scroll-smooth"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,70,190,0.015) 0%, transparent 80%)'
                }}
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      style={msg.sender === 'user' ? {
                        background: 'linear-gradient(135deg, #0046be 0%, #005be0 100%)',
                        color: 'white',
                        borderRadius: '16px',
                        borderTopRightRadius: '0px',
                        boxShadow: '0 4px 14px rgba(0, 70, 190, 0.18)',
                        padding: '14px',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      } : {
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        borderTopLeftRadius: '0px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        padding: '14px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: '#0F172A'
                      }}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div 
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        borderTopLeftRadius: '0px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span className="w-2 h-2 bg-primary/65 rounded-full animate-bounce" style={{ animationDuration: '0.9s' }} />
                      <span className="w-2 h-2 bg-primary/65 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.9s' }} />
                      <span className="w-2 h-2 bg-primary/65 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.9s' }} />
                    </div>
                  </motion.div>
                )}

                {/* Direct CTA Block */}
                <div className="mt-auto pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    <p style={{ color: '#94A3B8', fontSize: '9px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center', margin: '0' }}>थेट संपर्क साधा</p>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <a 
                      href="tel:9579005645" 
                      style={{
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        color: 'white',
                        padding: '12px 16px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none'
                      }}
                      className="hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Phone size={14} className="text-white" /> Call Us
                    </a>
                    <a 
                      href="https://wa.me/919579005645" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        color: 'white',
                        padding: '12px 16px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none'
                      }}
                      className="hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Replies & Input Area */}
              <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col">
                {/* Quick Reply Chips */}
                {chatState === 'idle' && (
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.04 }
                      }
                    }}
                    className="flex gap-2 overflow-x-auto p-3 scrollbar-hide border-b border-slate-50 dark:border-slate-800/50"
                  >
                    {quickReplies.map((reply, idx) => (
                      <motion.button
                        key={idx}
                        variants={{
                          hidden: { opacity: 0, y: 10, scale: 0.9 },
                          show: { opacity: 1, y: 0, scale: 1 }
                        }}
                        onClick={() => handleSend(reply)}
                        style={{
                          background: 'rgba(0, 70, 190, 0.05)',
                          border: '1px solid rgba(0, 70, 190, 0.12)',
                          borderRadius: '9999px',
                          padding: '6px 14px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#0046be',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          outline: 'none'
                        }}
                        className="hover:bg-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                <div className="p-4 bg-white dark:bg-slate-900">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '4px',
                      position: 'relative'
                    }}
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="तुमचा प्रश्न येथे विचारा..."
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        padding: '10px 14px',
                        paddingRight: '50px',
                        fontSize: '14px',
                        color: '#0F172A'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: '#0046be',
                        border: 'none',
                        borderRadius: '12px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0, 70, 190, 0.2)',
                        position: 'absolute',
                        right: '6px'
                      }}
                      className="hover:scale-105 active:scale-95 transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                  <div className="text-center mt-3 text-[9px] text-slate-400 dark:text-slate-500 font-black flex items-center justify-center gap-1 uppercase tracking-widest select-none">
                    <Sparkles size={9} className="text-amber-500 animate-pulse" /> Powered by Techstar Money AI
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button Container with 3D Shadow */}
        <div className="relative group flex flex-col items-center">
          {!isOpen && (
            <motion.div
              animate={{
                scale: [1, 0.8, 1],
                opacity: [0.35, 0.15, 0.35]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-1.5 w-[85%] h-1.5 bg-slate-950/30 dark:bg-slate-950/60 rounded-full blur-[4px] pointer-events-none z-40 select-none"
            />
          )}

          <motion.button
            animate={{
              y: isOpen ? 0 : [0, -12, 0]
            }}
            transition={{
              y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setIsOpen(!isOpen)
              setShowTooltip(false)
            }}
            className={`relative z-[100] border-0 outline-none overflow-visible bg-transparent flex items-center justify-center cursor-pointer select-none transition-all duration-300 ${
              isOpen ? "w-12 h-12 sm:w-16 sm:h-16" : "w-auto h-auto"
            }`}
          >
            {isOpen ? (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 relative overflow-hidden group">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 220 }}
                >
                  <X size={20} className="block sm:hidden" />
                  <X size={26} className="hidden sm:block" />
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-[18px] sm:rounded-[24px] shadow-[0_12px_28px_rgba(16,185,129,0.2)] sm:shadow-[0_16px_36px_rgba(16,185,129,0.25)] hover:shadow-[0_20px_48px_rgba(16,185,129,0.4)] border border-white/15 border-t-white/30 border-l-white/30 select-none transition-all duration-300 relative overflow-hidden group">
                {/* Metallic sweep shine effect */}
                <motion.div
                  animate={{
                    x: [-150, 300]
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 w-[40px] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                />
                
                {/* Agent Avatar */}
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-500/10 to-white/5 border-2 border-white/95 overflow-hidden flex items-center justify-center shrink-0 shadow-md relative">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <defs>
                      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1E3A8A" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                      <linearGradient id="agentHair" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1E293B" />
                        <stop offset="100%" stopColor="#0F172A" />
                      </linearGradient>
                      <linearGradient id="agentSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FED7AA" />
                        <stop offset="100%" stopColor="#FDBA74" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="url(#avatarGrad)" />
                    <path d="M28 85C28 72 38 68 50 68C62 68 72 72 72 85" fill="#E2E8F0" />
                    <path d="M47 70L50 82L53 70Z" fill="#3B82F6" />
                    <circle cx="50" cy="45" r="16" fill="url(#agentSkin)" />
                    <path d="M34 40C34 28 42 26 50 26C58 26 66 28 66 40C66 42 63 36 50 36C37 36 34 42 34 40Z" fill="url(#agentHair)" />
                    <circle cx="44" cy="44" r="1.7" fill="#1E293B" />
                    <circle cx="56" cy="44" r="1.7" fill="#1E293B" />
                    <path d="M46 51C47.5 52.5 52.5 52.5 54 51" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M33 42C33 32 40 28 50 28C60 28 67 32 67 42" fill="none" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                    <rect x="30" y="38" width="5" height="10" rx="2" fill="#0F172A" />
                    <rect x="65" y="38" width="5" height="10" rx="2" fill="#0F172A" />
                    <path d="M33 45C33 55 42 58 45 58" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="45" cy="58" r="2" fill="#10B981" />
                  </svg>
                  
                  {/* Glowing Active Ring */}
                  <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-[#10B981] opacity-75 animate-ping" />
                  </span>
                </div>
                
                {/* Text Group */}
                <div className="text-left shrink-0 pr-1 relative z-10">
                  <div className="text-xs sm:text-[15px] font-black leading-tight tracking-wider uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">Chat With Us</div>
                  <div className="text-[8px] sm:text-[10px] text-[#A7F3D0] font-black tracking-widest uppercase leading-none mt-0.5 sm:mt-1">Live Support Online</div>
                </div>
              </div>
            )}
            
            {!isOpen && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 shadow-md z-50 animate-bounce" style={{ animationDuration: '2s' }}>
                1
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </>
  )
}
