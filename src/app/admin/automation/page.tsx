"use client"
import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  Bot, 
  Zap, 
  MessageSquare, 
  Mail, 
  Settings, 
  CheckCircle2, 
  FileSearch,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock
} from "lucide-react"

export default function AIAutomationDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const features = [
    {
      id: 'chatbot',
      title: 'AI Customer Support Bot',
      description: 'Deploy an intelligent assistant to answer FAQs and capture leads 24/7.',
      icon: Bot,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      status: 'active'
    },
    {
      id: 'lead-scoring',
      title: 'Auto Lead Qualification',
      description: 'Instantly score leads based on CIBIL, income, and employment data using our AI model.',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      status: 'active'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Auto Replies',
      description: 'Trigger automated WhatsApp updates for application status and document requests.',
      icon: MessageSquare,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      status: 'active'
    },
    {
      id: 'email',
      title: 'Email Drip Campaigns',
      description: 'Automated email sequences for abandoned applications and cross-selling.',
      icon: Mail,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      status: 'inactive'
    },
    {
      id: 'verification',
      title: 'AI Document Verification',
      description: 'Auto-extract text (OCR) and verify PAN/Aadhaar instantly to detect fraud.',
      icon: FileSearch,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      status: 'active'
    },
    {
      id: 'recommendations',
      title: 'Smart Recommendations',
      description: 'AI engine suggests the highest probability loan products to leads based on their profile.',
      icon: Sparkles,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      status: 'active'
    }
  ]

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary flex items-center gap-3">
            <Sparkles className="text-primary" size={32} />
            AI & Automation Engine
          </h1>
          <p className="text-slate-500 mt-2">Configure automated workflows and artificial intelligence features.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-soft hover-lift self-start md:self-auto">
          <Settings size={18} /> Global Settings
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><Bot size={20} /></div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Chats Handled (AI)</p>
          <h3 className="text-2xl font-black text-secondary mt-1">1,248</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><MessageSquare size={20} /></div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+45%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">WhatsApp Sent</p>
          <h3 className="text-2xl font-black text-secondary mt-1">5,892</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><Zap size={20} /></div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Leads Auto-Scored</p>
          <h3 className="text-2xl font-black text-secondary mt-1">342</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><FileSearch size={20} /></div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">99.9%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Auto-Verified Docs</p>
          <h3 className="text-2xl font-black text-secondary mt-1">890</h3>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-6">
          <button className="text-sm font-bold text-primary border-b-2 border-primary pb-2">Active Automations</button>
          <button className="text-sm font-bold text-slate-400 pb-2">Rule Builder</button>
          <button className="text-sm font-bold text-slate-400 pb-2">Integration Logs</button>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.id} className="group border border-slate-100 rounded-2xl p-6 hover:border-primary hover:shadow-soft transition-all duration-300 relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center`}>
                  <feature.icon size={24} />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  feature.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {feature.status}
                </div>
              </div>
              <h3 className="text-lg font-bold text-secondary mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2">{feature.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <button className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure <ArrowRight size={14} />
                </button>
                <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${
                    feature.status === 'active' ? 'bg-white translate-x-4' : 'bg-white'
                  }`} />
                  <div className={`absolute inset-0 rounded-full transition-colors ${
                    feature.status === 'active' ? 'bg-emerald-500' : 'bg-transparent'
                  }`} style={{ zIndex: -1 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Visual Workflow Builder Demo */}
      <div className="bg-slate-900 rounded-3xl p-10 overflow-hidden relative text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary-foreground border border-primary/50 rounded-full text-xs font-black uppercase tracking-widest">
              <Zap size={14} /> Workflow Builder
            </div>
            <h3 className="text-3xl font-black">Auto Follow-up System</h3>
            <p className="text-slate-400">Design powerful multi-channel sequences to engage drops-offs. Drag and drop triggers, delays, and actions to maximize your conversion rate on autopilot.</p>
            <button className="bg-white text-secondary px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors">
              Create New Sequence
            </button>
          </div>
          
          <div className="flex-1 w-full bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-xl flex items-center justify-center border-4 border-slate-900 shadow-xl z-20">
              <Bot size={20} />
            </div>
            
            <div className="space-y-4 ml-6 border-l-2 border-slate-700 pl-6 pb-6 relative">
              <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Trigger</p>
                <p className="text-sm font-medium">Lead Application Abandoned</p>
              </div>
            </div>

            <div className="space-y-4 ml-6 border-l-2 border-slate-700 pl-6 pb-6 relative">
               <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Wait Time</p>
                <p className="text-sm font-medium flex items-center gap-2"><Clock size={14}/> 15 Minutes</p>
              </div>
            </div>

            <div className="space-y-4 ml-6 pl-6 relative">
               <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Action</p>
                  <p className="text-sm font-medium flex items-center gap-2"><MessageSquare size={14} className="text-emerald-500"/> Send WhatsApp Reminder</p>
                </div>
                <CheckCircle2 className="text-emerald-500" size={20} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
