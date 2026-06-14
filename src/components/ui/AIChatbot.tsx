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
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-premium p-3 rounded-2xl rounded-br-none relative max-w-[200px]"
            >
              <p className="text-sm font-bold text-secondary dark:text-white">नमस्कार! कर्ज हवे आहे का? 👋</p>
              <button
                onClick={() => setShowTooltip(false)}
                className="absolute -top-2 -right-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full p-1 hover:bg-slate-200"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-premium w-[340px] sm:w-[400px] mb-4 overflow-hidden flex flex-col"
              style={{ height: "600px", maxHeight: "85vh" }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary via-blue-500 to-primary p-4 flex justify-between items-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Cg/%3E%3C/svg%3E")' }} />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight">Techstar Money Solution AI</h3>
                    <p className="text-xs text-blue-100 flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" /> 24/7 Active
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors relative z-10">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Area */}
              <div ref={chatAreaRef} className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50 dark:bg-slate-950/50 flex flex-col scroll-smooth">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.9, originY: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-3xl p-4 text-[15px] shadow-sm ${msg.sender === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-secondary dark:text-slate-200 rounded-bl-sm font-medium leading-relaxed'
                      }`}>
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
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" />
                      <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </motion.div>
                )}

                <div className="mt-auto pt-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">थेट संपर्क</p>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <a href="tel:9579005645" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-secondary dark:text-white py-2.5 rounded-full text-sm font-bold hover:border-primary hover:text-primary transition-colors shadow-sm hover-lift">
                      <Phone size={16} className="text-primary" /> Call Us
                    </a>
                    <a href="https://wa.me/919579005645" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-full text-sm font-bold hover:bg-[#1fad53] transition-colors shadow-sm hover-lift">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Replies & Input Area */}
              <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col">
                {/* Quick Reply Chips */}
                {chatState === 'idle' && (
                  <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide border-b border-slate-50 dark:border-slate-800/50">
                    {quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(reply)}
                        className="whitespace-nowrap bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-3">
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="येथे टाईप करा..."
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary dark:text-white outline-none font-medium placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                  <div className="text-center mt-2.5 text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1 uppercase tracking-widest">
                    <Sparkles size={10} className="text-amber-400" /> Powered by Techstar Money Solution AI
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(!isOpen)
            setShowTooltip(false)
          }}
          className="w-16 h-16 rounded-full shadow-premium flex items-center justify-center relative hover-lift group z-[100] border-0 outline-none overflow-visible bg-gradient-to-tr from-[#1EBE5D] to-[#128C7E]"
          style={{ boxShadow: "0 8px 30px rgba(37, 211, 102, 0.4)" }}
        >
          {/* Pulse Glow Backing */}
          <div className="absolute -inset-1 bg-gradient-to-tr from-[#25D366] to-[#128C7E] rounded-full blur opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse-slow pointer-events-none" />
          
          {/* Hover Phone Contact Tooltip */}
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-premium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 z-50 flex items-center gap-2">
              <MessageCircle size={12} className="text-[#25D366] animate-pulse" />
              <span>Chat with us</span>
            </div>
          )}

          {isOpen ? (
            <X size={26} className="text-white relative z-10" />
          ) : (
            <div className="relative flex items-center justify-center w-10 h-10 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          )}
          
          {!isOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-5.5 h-5.5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 shadow-sm">
              1
            </span>
          )}
        </motion.button>
      </div>
    </>
  )
}
