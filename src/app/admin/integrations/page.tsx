"use client"

import React from "react"
import { 
  MessageSquare, 
  PhoneCall, 
  Database, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  ExternalLink,
  ShieldCheck,
  RefreshCcw,
  Plus
} from "lucide-react"

const integrations = [
  {
    name: "WhatsApp Business API",
    description: "Automated notifications, lead follow-ups, and chat support via WhatsApp.",
    status: "Connected",
    icon: MessageSquare,
    color: "bg-green-500",
    lastSync: "2 mins ago",
    features: ["OTP Verification", "Lead Notifications", "Document Upload Reminders"]
  },
  {
    name: "Call Tracking (Exotel)",
    description: "Track all incoming and outgoing calls with recording and lead mapping.",
    status: "Inactive",
    icon: PhoneCall,
    color: "bg-blue-500",
    lastSync: "Never",
    features: ["Call Recording", "Agent Mapping", "Missed Call Alerts"]
  },
  {
    name: "Salesforce CRM",
    description: "Sync leads, customer data, and loan status with your Salesforce instance.",
    status: "Error",
    icon: Database,
    color: "bg-indigo-500",
    lastSync: "1 hour ago",
    features: ["Lead Sync", "Status Mapping", "Customer 360 View"]
  },
  {
    name: "Google Ads Integration",
    description: "Track conversion from Google Ads directly to lead disbursement.",
    status: "Connected",
    icon: Zap,
    color: "bg-amber-500",
    lastSync: "5 mins ago",
    features: ["CPA Tracking", "Keyword Mapping", "Revenue Attribution"]
  }
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Integrations & CRM</h2>
          <p className="text-slate-500 font-medium">Connect your favorite tools to streamline your workflow.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg">
          <Plus size={18} />
          <span>Add Integration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {integrations.map((item, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <item.icon size={28} />
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    item.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    item.status === 'Error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {item.status === 'Connected' && <CheckCircle2 size={12} />}
                    {item.status === 'Error' && <AlertCircle size={12} />}
                    {item.status}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">LAST SYNC: {item.lastSync}</p>
                </div>
              </div>

              <h3 className="text-xl font-black text-secondary mb-2">{item.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{item.description}</p>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Features</p>
                <div className="flex flex-wrap gap-2">
                  {item.features.map((feature, j) => (
                    <span key={j} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                Configure <Settings2 size={14} />
              </button>
              <button className="text-xs font-black text-slate-400 hover:text-secondary flex items-center gap-1">
                Documentation <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Global Integration Settings */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[150px] rounded-full" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-wider border border-primary/20">
              <ShieldCheck size={14} /> System Health
            </div>
            <h2 className="text-4xl font-black leading-tight">Universal Data Sync is <span className="text-primary italic">Active</span></h2>
            <p className="text-slate-400 text-lg">Your data is being synchronized across 4 platforms in real-time. We've processed over 12,000 requests in the last 24 hours with a 99.98% success rate.</p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm">Firestore Real-time</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm">Webhook Listeners</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
              <RefreshCcw size={18} /> Force Global Sync
            </button>
            <button className="w-full py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <Settings2 size={18} /> Integration Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
