"use client"

import React, { useState, useEffect } from "react"
import {
  MessageSquare, RefreshCw, User, Clock, CheckCircle2,
  Loader2, ArrowRight, Phone, ChevronDown, ChevronUp,
  Bot, Inbox, AlertCircle, Search, Circle
} from "lucide-react"

const FIREBASE_API_KEY = "AIzaSyDy-zXamx8BB18MgTXWoyWACKRSKvvOBTo"
const PROJECT_ID = "dsa-loan"

interface Session {
  phone: string
  name: string
  step: number
  category: string
  responses: Record<string, string>
  updatedAt?: string
}

interface Lead {
  id: string
  phone: string
  name: string
  type: string
  source: string
  status: string
  createdAt: string
  responses: Record<string, string>
}

const STEP_LABELS: Record<number, string> = {
  0: "Not Started",
  1: "Selected Language",
  2: "Asked Name",
  3: "Chose Category",
  4: "Q1 Answered",
  5: "Q2 Answered",
  6: "Q3 Answered",
  7: "Q4 Answered",
  8: "Completed",
}

const CATEGORY_COLORS: Record<string, string> = {
  "Home Loan": "bg-blue-100 text-blue-700",
  "Personal Loan": "bg-purple-100 text-purple-700",
  "Business Loan": "bg-amber-100 text-amber-700",
  "Loan Against Property": "bg-rose-100 text-rose-700",
  "Credit Card": "bg-indigo-100 text-indigo-700",
  "Insurance": "bg-emerald-100 text-emerald-700",
}

async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/waSession?key=${FIREBASE_API_KEY}`
  )
  if (!res.ok) return []
  const data = await res.json()
  if (!data.documents) return []
  return data.documents.map((doc: any) => {
    const phone = doc.name.split("/").pop()
    return {
      phone,
      name: doc.fields?.name?.stringValue || "Unknown",
      step: parseInt(doc.fields?.step?.integerValue || "0"),
      category: doc.fields?.category?.stringValue || "",
      responses: JSON.parse(doc.fields?.responses?.stringValue || "{}"),
      updatedAt: doc.fields?.updatedAt?.timestampValue || doc.updateTime || "",
    }
  })
}

async function fetchWALeads(): Promise<Lead[]> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/leads?key=${FIREBASE_API_KEY}`
  )
  if (!res.ok) return []
  const data = await res.json()
  if (!data.documents) return []
  return data.documents
    .map((doc: any) => ({
      id: doc.name.split("/").pop(),
      phone: doc.fields?.phone?.stringValue || "",
      name: doc.fields?.name?.stringValue || "",
      type: doc.fields?.type?.stringValue || "",
      source: doc.fields?.source?.stringValue || "",
      status: doc.fields?.status?.stringValue || "",
      createdAt: doc.fields?.createdAt?.timestampValue || "",
      responses: {}, // additional fields parsed below
    }))
    .filter((l: Lead) => l.source === "WhatsApp Automation")
}

function timeAgo(iso: string) {
  if (!iso) return "—"
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function WAInboxPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"active" | "completed">("active")
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    loadData()
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    setLoading(true)
    const [s, l] = await Promise.all([fetchSessions(), fetchWALeads()])
    setSessions(s)
    setLeads(l)
    setLastRefresh(new Date())
    setLoading(false)
  }

  const filteredSessions = sessions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search) ||
    l.type.toLowerCase().includes(search.toLowerCase())
  )

  const getProgressPct = (step: number, category: string) => {
    const flowLengths: Record<string, number> = {
      "Home Loan": 4, "Personal Loan": 3, "Business Loan": 4,
      "Loan Against Property": 4, "Credit Card": 3, "Insurance": 3
    }
    const total = (flowLengths[category] || 4) + 4 // +4 for language, name, category, and final steps
    return Math.min(Math.round((step / total) * 100), 100)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.277.002 9.571-4.287 9.575-9.566.001-2.559-1.002-4.966-2.825-6.79C16.3 2.421 13.9 1.419 11.339 1.418c-5.286 0-9.582 4.29-9.587 9.57-.001 1.638.488 3.238 1.42 4.695L2.146 21.94l6.096-1.597c.005.003.01.006.015.008v-.005h-.01c-1.53-.949-1.53-.949 0 0zm11.368-6.19c-.3-.15-1.774-.875-2.05-.975-.274-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.042-1.516-4.385-2.28-6.218-5.424-.225-.387.225-.362.65-.788.1-.1.2-.225.3-.35.1-.1.15-.175.225-.35.075-.175.037-.325-.018-.425-.056-.1-.475-1.15-.65-1.575-.17-.412-.346-.356-.475-.362-.122-.006-.262-.007-.402-.007s-.367.05-.56.25c-.19.2-.727.708-.727 1.727 0 1.02.74 2.007.84 2.15.1.15 1.46 2.228 3.538 3.125 1.62.7 2.215.797 3.015.698.48-.06 1.475-.6 1.675-1.18.2-.58.2-1.08.14-1.18-.06-.1-.225-.15-.525-.3z"/>
              </svg>
            </div>
            WhatsApp Inbox
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Live incoming conversations & completed leads from WhatsApp bot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">
            Refreshed {timeAgo(lastRefresh.toISOString())}
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Chats", value: sessions.length, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
          { label: "Completed Leads", value: leads.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
          { label: "In Progress", value: sessions.filter(s => s.step > 2).length, icon: Bot, color: "text-purple-600", bg: "bg-purple-50", dot: "bg-purple-500" },
          { label: "Total Today", value: sessions.length + leads.length, icon: Inbox, color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0 relative`}>
                <Icon size={20} className={stat.color} />
                <span className={`absolute -top-1 -right-1 w-3 h-3 ${stat.dot} rounded-full border-2 border-white animate-pulse`} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${tab === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            🟡 Active ({sessions.length})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${tab === "completed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            ✅ Completed ({leads.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
          <p className="text-slate-400 font-medium">Loading conversations...</p>
        </div>
      ) : tab === "active" ? (
        /* ── Active Sessions ── */
        filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-[2rem] border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Inbox size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold text-lg">No active conversations</p>
            <p className="text-slate-400 text-sm">When someone messages your WhatsApp number, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map(session => {
              const pct = getProgressPct(session.step, session.category)
              const isExpanded = expandedPhone === session.phone
              return (
                <div key={session.phone} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div
                    className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => setExpandedPhone(isExpanded ? null : session.phone)}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0 relative">
                      {(session.name || "?")[0].toUpperCase()}
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900">{session.name || "Unknown"}</span>
                        {session.category && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${CATEGORY_COLORS[session.category] || "bg-slate-100 text-slate-600"}`}>
                            {session.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone size={11} /> +{session.phone}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> {timeAgo(session.updatedAt || "")}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{pct}%</span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {STEP_LABELS[session.step] || `Step ${session.step}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${session.step >= 3 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {session.step >= 3 ? '● Answering' : '● Waiting'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded responses */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Collected Responses</p>
                      {Object.keys(session.responses).length === 0 ? (
                        <p className="text-sm text-slate-400 font-medium italic">No responses collected yet — conversation in progress.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(session.responses).map(([key, val]) => (
                            <div key={key} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-sm font-bold text-slate-900">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* ── Completed WA Leads ── */
        filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-[2rem] border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold text-lg">No completed leads yet</p>
            <p className="text-slate-400 text-sm">Completed WhatsApp conversations will appear here as leads.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <div key={lead.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {(lead.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900">{lead.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${CATEGORY_COLORS[lead.type] || "bg-slate-100 text-slate-600"}`}>
                      {lead.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600">
                      ✅ Completed
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone size={11} /> {lead.phone}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(lead.createdAt)}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 flex-shrink-0">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Auto-refresh notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium py-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        Auto-refreshing every 15 seconds
      </div>
    </div>
  )
}
