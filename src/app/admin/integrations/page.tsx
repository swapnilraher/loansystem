"use client"

import React, { useState } from "react"
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
  Plus,
  Bot,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Copy,
  Eye,
  EyeOff,
  Save
} from "lucide-react"
import Link from "next/link"

const integrations = [
  {
    name: "WhatsApp Business API",
    description: "Automated notifications, lead follow-ups, and chat support via WhatsApp.",
    status: "Connected",
    icon: MessageSquare,
    color: "bg-green-500",
    lastSync: "2 mins ago",
    features: ["OTP Verification", "Lead Notifications", "Document Upload Reminders", "Auto Chat Flows"]
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
  const [showToken, setShowToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [waEnabled, setWaEnabled] = useState(true)

  const WEBHOOK_URL = "https://your-domain.com/api/whatsapp"
  const VERIFY_TOKEN = "swapnil942040020202"
  const PHONE_ID = "1112131761984283"

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

      {/* ─── WhatsApp Automation Section ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#128C7E] to-[#075E54] rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-white">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.277.002 9.571-4.287 9.575-9.566.001-2.559-1.002-4.966-2.825-6.79C16.3 2.421 13.9 1.419 11.339 1.418c-5.286 0-9.582 4.29-9.587 9.57-.001 1.638.488 3.238 1.42 4.695L2.146 21.94l6.096-1.597c.005.003.01.006.015.008v-.005h-.01c-1.53-.949-1.53-.949 0 0zm11.368-6.19c-.3-.15-1.774-.875-2.05-.975-.274-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.042-1.516-4.385-2.28-6.218-5.424-.225-.387.225-.362.65-.788.1-.1.2-.225.3-.35.1-.1.15-.175.225-.35.075-.175.037-.325-.018-.425-.056-.1-.475-1.15-.65-1.575-.17-.412-.346-.356-.475-.362-.122-.006-.262-.007-.402-.007s-.367.05-.56.25c-.19.2-.727.708-.727 1.727 0 1.02.74 2.007.84 2.15.1.15 1.46 2.228 3.538 3.125 1.62.7 2.215.797 3.015.698.48-.06 1.475-.6 1.675-1.18.2-.58.2-1.08.14-1.18-.06-.1-.225-.15-.525-.3z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-black">WhatsApp Automation</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${waEnabled ? 'bg-emerald-400/30 text-emerald-200 border border-emerald-400/30' : 'bg-white/10 text-white/60 border border-white/10'}`}>
                    {waEnabled ? '● Live' : '○ Paused'}
                  </span>
                </div>
                <p className="text-white/70 text-sm mt-1">Auto‑reply and collect lead info from every incoming message</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl cursor-pointer transition-all select-none text-sm font-black ${waEnabled ? 'bg-white text-[#075E54]' : 'bg-white/20 text-white border border-white/20'}`}
                onClick={() => setWaEnabled(!waEnabled)}
              >
                {waEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {waEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Flow Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {['User Messages', 'Bot Greets', 'Collects Info', 'Lead Saved'].map((step, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <div className="text-2xl mb-1">{['💬', '🤖', '📋', '✅'][i]}</div>
                <div className="text-xs font-black text-white/90">{step}</div>
              </div>
            ))}
          </div>

          {/* Config Fields */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Webhook Configuration</p>
            {/* Webhook URL */}
            <div>
              <label className="block text-xs font-bold text-white/60 mb-1.5">Webhook URL (paste in Meta Developer → Webhook)</label>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                <code className="flex-1 text-xs text-emerald-300 font-mono truncate">{WEBHOOK_URL}</code>
                <button
                  onClick={() => handleCopy(WEBHOOK_URL)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Copy size={16} className="text-white/60" />}
                </button>
              </div>
            </div>
            {/* Verify Token */}
            <div>
              <label className="block text-xs font-bold text-white/60 mb-1.5">Verify Token</label>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                <code className="flex-1 text-xs text-yellow-300 font-mono">
                  {showToken ? VERIFY_TOKEN : '••••••••••••••••••••'}
                </code>
                <button onClick={() => setShowToken(!showToken)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  {showToken ? <EyeOff size={16} className="text-white/60" /> : <Eye size={16} className="text-white/60" />}
                </button>
                <button onClick={() => handleCopy(VERIFY_TOKEN)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <Copy size={16} className="text-white/60" />
                </button>
              </div>
            </div>
            {/* Phone ID */}
            <div>
              <label className="block text-xs font-bold text-white/60 mb-1.5">WhatsApp Phone Number ID</label>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                <code className="flex-1 text-xs text-blue-300 font-mono">{PHONE_ID}</code>
                <button onClick={() => handleCopy(PHONE_ID)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <Copy size={16} className="text-white/60" />
                </button>
              </div>
            </div>
          </div>

          {/* Go to Flow Builder */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/integrations/all-auto-chatting"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#075E54] rounded-2xl text-sm font-black hover:bg-white/90 transition-all shadow-xl"
            >
              <Bot size={18} />
              Manage Auto Chat Flows
              <ArrowRight size={16} />
            </Link>
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 border border-white/20 text-white rounded-2xl text-sm font-black hover:bg-white/20 transition-all">
              <ExternalLink size={16} />
              Open Meta Developer Console
            </button>
          </div>
        </div>
      </div>

      {/* Other Integrations */}
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
                <span className="font-bold text-sm">WhatsApp Webhook</span>
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
