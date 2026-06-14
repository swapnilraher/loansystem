"use client"

import React, { useState, useEffect } from "react"
import {
  MessageSquare, Plus, Trash2, Edit3, ToggleLeft, ToggleRight,
  ChevronRight, ChevronDown, GripVertical, X, Save,
  CheckCircle2, AlertCircle, Loader2, Bot, Zap, Users,
  Home, Briefcase, Building, CreditCard, ShieldCheck, Info,
  ArrowRight, Eye, EyeOff
} from "lucide-react"

const LOAN_CATEGORIES = [
  { label: "Home Loan", icon: Home, color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50", borderColor: "border-blue-200" },
  { label: "Personal Loan", icon: Users, color: "bg-purple-500", textColor: "text-purple-600", bgLight: "bg-purple-50", borderColor: "border-purple-200" },
  { label: "Business Loan", icon: Briefcase, color: "bg-amber-500", textColor: "text-amber-600", bgLight: "bg-amber-50", borderColor: "border-amber-200" },
  { label: "Loan Against Property", icon: Building, color: "bg-rose-500", textColor: "text-rose-600", bgLight: "bg-rose-50", borderColor: "border-rose-200" },
  { label: "Credit Card", icon: CreditCard, color: "bg-indigo-500", textColor: "text-indigo-600", bgLight: "bg-indigo-50", borderColor: "border-indigo-200" },
  { label: "Insurance", icon: ShieldCheck, color: "bg-emerald-500", textColor: "text-emerald-600", bgLight: "bg-emerald-50", borderColor: "border-emerald-200" },
]

const DEFAULT_FLOWS: FlowDef[] = [
  {
    id: "home-loan-default",
    name: "Home Loan Flow",
    category: "Home Loan",
    enabled: true,
    steps: [
      { id: "s1", question: "What loan amount are you looking for? (e.g. 50 lakhs)", responseType: "number", field: "loanAmount", delaySeconds: 0 },
      { id: "s2", question: "Which city is the property located in?", responseType: "text", field: "city", delaySeconds: 0 },
      { id: "s3", question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", responseType: "dropdown", field: "employmentType", options: ["Salaried", "Self Employed"], delaySeconds: 0 },
      { id: "s4", question: "What is your monthly income? (in ₹)", responseType: "number", field: "monthlyIncome", delaySeconds: 0 },
    ]
  },
  {
    id: "personal-loan-default",
    name: "Personal Loan Flow",
    category: "Personal Loan",
    enabled: true,
    steps: [
      { id: "s1", question: "What is your monthly income? (in ₹)", responseType: "number", field: "monthlyIncome", delaySeconds: 0 },
      { id: "s2", question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", responseType: "dropdown", field: "employmentType", options: ["Salaried", "Self Employed"], delaySeconds: 0 },
      { id: "s3", question: "Which city do you live in?", responseType: "text", field: "city", delaySeconds: 0 },
    ]
  },
  {
    id: "business-loan-default",
    name: "Business Loan Flow",
    category: "Business Loan",
    enabled: true,
    steps: [
      { id: "s1", question: "What is your business name?", responseType: "text", field: "businessName", delaySeconds: 0 },
      { id: "s2", question: "How long has your business been running? (e.g. 3 years)", responseType: "text", field: "businessVintage", delaySeconds: 0 },
      { id: "s3", question: "What is your annual turnover? (in ₹)", responseType: "number", field: "annualTurnover", delaySeconds: 0 },
      { id: "s4", question: "How much loan amount do you require? (in ₹)", responseType: "number", field: "loanAmount", delaySeconds: 0 },
    ]
  },
  {
    id: "lap-default",
    name: "Loan Against Property Flow",
    category: "Loan Against Property",
    enabled: true,
    steps: [
      { id: "s1", question: "What is the approximate value of your property? (in ₹)", responseType: "number", field: "propertyValue", delaySeconds: 0 },
      { id: "s2", question: "Which city is the property located in?", responseType: "text", field: "city", delaySeconds: 0 },
      { id: "s3", question: "How much loan amount do you require? (in ₹)", responseType: "number", field: "loanAmount", delaySeconds: 0 },
      { id: "s4", question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", responseType: "dropdown", field: "employmentType", options: ["Salaried", "Self Employed"], delaySeconds: 0 },
    ]
  },
  {
    id: "credit-card-default",
    name: "Credit Card Flow",
    category: "Credit Card",
    enabled: true,
    steps: [
      { id: "s1", question: "What is your monthly income? (in ₹)", responseType: "number", field: "monthlyIncome", delaySeconds: 0 },
      { id: "s2", question: "Are you Salaried or Self Employed?\n1️⃣ Salaried\n2️⃣ Self Employed", responseType: "dropdown", field: "employmentType", options: ["Salaried", "Self Employed"], delaySeconds: 0 },
      { id: "s3", question: "Which city do you live in?", responseType: "text", field: "city", delaySeconds: 0 },
    ]
  },
  {
    id: "insurance-default",
    name: "Insurance Flow",
    category: "Insurance",
    enabled: true,
    steps: [
      { id: "s1", question: "What type of insurance are you looking for?\n1️⃣ Life Insurance\n2️⃣ Health Insurance\n3️⃣ Vehicle Insurance", responseType: "dropdown", field: "insuranceType", options: ["Life Insurance", "Health Insurance", "Vehicle Insurance"], delaySeconds: 0 },
      { id: "s2", question: "What is your age?", responseType: "number", field: "age", delaySeconds: 0 },
      { id: "s3", question: "Which city do you live in?", responseType: "text", field: "city", delaySeconds: 0 },
    ]
  },
]

type ResponseType = "text" | "number" | "dropdown"
interface FlowStep {
  id: string
  question: string
  responseType: ResponseType
  field: string
  options?: string[]
  delaySeconds?: number
}
interface FlowDef {
  id: string
  name: string
  category: string
  enabled: boolean
  steps: FlowStep[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function getCategoryMeta(category: string) {
  return LOAN_CATEGORIES.find(c => c.label === category) || LOAN_CATEGORIES[0]
}

// ── FlowBuilder Modal ─────────────────────────────────────────────────────────
function FlowBuilderModal({ onSave, onClose, editFlow }: {
  onSave: (flow: Omit<FlowDef, 'id'>) => void
  onClose: () => void
  editFlow?: FlowDef
}) {
  const [name, setName] = useState(editFlow?.name || "")
  const [category, setCategory] = useState(editFlow?.category || "Home Loan")
  const [steps, setSteps] = useState<FlowStep[]>(editFlow?.steps || [{ id: generateId(), question: "", responseType: "text", field: "", options: [], delaySeconds: 0 }])

  function addStep() {
    setSteps(s => [...s, { id: generateId(), question: "", responseType: "text", field: "", options: [], delaySeconds: 0 }])
  }
  function removeStep(id: string) {
    setSteps(s => s.filter(st => st.id !== id))
  }
  function updateStep(id: string, updates: Partial<FlowStep>) {
    setSteps(s => s.map(st => st.id === id ? { ...st, ...updates } : st))
  }

  function handleSave() {
    if (!name.trim() || steps.length === 0) return
    onSave({ name: name.trim(), category, steps, enabled: true })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900">{editFlow ? 'Edit Flow' : 'Create New Flow'}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Build your WhatsApp automation flow</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Flow Name</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. Home Loan Flow"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Loan Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LOAN_CATEGORIES.map(cat => {
                const Icon = cat.icon
                const sel = category === cat.label
                return (
                  <button
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${sel ? `${cat.bgLight} ${cat.textColor} ${cat.borderColor} shadow-sm` : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Flow Steps</label>
              <span className="text-xs font-bold text-slate-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Question {idx + 1}</span>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(step.id)} className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* Question text */}
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none mb-3 bg-white font-medium"
                    placeholder="Enter your question..."
                    rows={2}
                    value={step.question}
                    onChange={e => updateStep(step.id, { question: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    {/* Response Type */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Response Type</label>
                      <select
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 bg-white"
                        value={step.responseType}
                        onChange={e => updateStep(step.id, { responseType: e.target.value as ResponseType })}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                    </div>

                    {/* Delay */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Delay (seconds)</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 bg-white"
                        value={step.delaySeconds || 0}
                        onChange={e => updateStep(step.id, { delaySeconds: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Dropdown options */}
                  {step.responseType === 'dropdown' && (
                    <div className="mt-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Options (comma separated)</label>
                      <input
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 bg-white"
                        placeholder="e.g. Salaried, Self Employed"
                        value={(step.options || []).join(', ')}
                        onChange={e => updateStep(step.id, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-bold text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
            >
              <Plus size={16} /> Add Question
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || steps.length === 0}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} /> Save Flow
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AllAutoChatting() {
  const [flows, setFlows] = useState<FlowDef[]>(DEFAULT_FLOWS)
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editFlow, setEditFlow] = useState<FlowDef | undefined>()
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [automationEnabled, setAutomationEnabled] = useState(true)

  useEffect(() => {
    fetchFlows()
  }, [])

  async function fetchFlows() {
    setLoading(true)
    try {
      const res = await fetch('/api/flows')
      const data = await res.json()
      if (data.flows && data.flows.length > 0) {
        setFlows(data.flows)
      }
      // else use default flows shown on first load
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveFlow(flowData: Omit<FlowDef, 'id'>) {
    try {
      if (editFlow) {
        await fetch(`/api/flows?id=${editFlow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flowData),
        })
        setFlows(f => f.map(fl => fl.id === editFlow.id ? { ...flowData, id: editFlow.id } : fl))
        showToast('Flow updated successfully!')
      } else {
        const res = await fetch('/api/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flowData),
        })
        const data = await res.json()
        setFlows(f => [...f, { ...flowData, id: data.id || generateId() }])
        showToast('Flow created successfully!')
      }
    } catch {
      showToast('Failed to save flow', 'error')
    }
    setShowBuilder(false)
    setEditFlow(undefined)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this flow?')) return
    try {
      await fetch(`/api/flows?id=${id}`, { method: 'DELETE' })
      setFlows(f => f.filter(fl => fl.id !== id))
      showToast('Flow deleted!')
    } catch {
      showToast('Failed to delete flow', 'error')
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    await fetch(`/api/flows?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    setFlows(f => f.map(fl => fl.id === id ? { ...fl, enabled } : fl))
  }

  const totalSteps = flows.reduce((acc, f) => acc + f.steps.length, 0)
  const activeFlows = flows.filter(f => f.enabled).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold text-white animate-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <FlowBuilderModal
          onSave={handleSaveFlow}
          onClose={() => { setShowBuilder(false); setEditFlow(undefined) }}
          editFlow={editFlow}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">All Auto Chatting</h2>
          <p className="text-slate-500 font-medium mt-1">Manage WhatsApp automation flows for each loan product.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global toggle */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black cursor-pointer transition-all select-none ${automationEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
            onClick={() => setAutomationEnabled(!automationEnabled)}>
            {automationEnabled ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
            Automation {automationEnabled ? 'ON' : 'OFF'}
          </div>
          <button
            onClick={() => { setEditFlow(undefined); setShowBuilder(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> New Flow
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Flows", value: flows.length, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Flows", value: activeFlows, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Questions", value: totalSteps, icon: ChevronRight, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Automation", value: automationEnabled ? "Enabled" : "Disabled", icon: Bot, color: automationEnabled ? "text-emerald-600" : "text-slate-500", bg: automationEnabled ? "bg-emerald-50" : "bg-slate-50" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={stat.color} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6 text-white flex items-start gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info size={20} className="text-white" />
        </div>
        <div>
          <p className="font-black text-sm">How it works</p>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            When a user messages your official WhatsApp number, the bot automatically asks for their <b>name</b> → <b>loan category</b> → then runs the matching flow to collect all required information. Completed responses are saved as <b>New Leads</b> in your CRM.
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-blue-200 uppercase tracking-widest">
            <span>User Messages</span>
            <ArrowRight size={12} />
            <span>Name → Category</span>
            <ArrowRight size={12} />
            <span>Flow Questions</span>
            <ArrowRight size={12} />
            <span>Lead Saved ✅</span>
          </div>
        </div>
      </div>

      {/* Flows List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {flows.map((flow) => {
            const meta = getCategoryMeta(flow.category)
            const Icon = meta.icon
            const isExpanded = expandedFlow === flow.id
            return (
              <div key={flow.id} className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden transition-all ${flow.enabled ? 'border-slate-100' : 'border-slate-200 opacity-70'}`}>
                {/* Flow Header */}
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className={`w-12 h-12 ${meta.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 text-base">{flow.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.bgLight} ${meta.textColor}`}>
                        {flow.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${flow.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {flow.enabled ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{flow.steps.length} question{flow.steps.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(flow.id, !flow.enabled)}
                      className={`p-2 rounded-xl transition-all ${flow.enabled ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      title={flow.enabled ? 'Disable' : 'Enable'}
                    >
                      {flow.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => { setEditFlow(flow); setShowBuilder(true) }}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(flow.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                    {/* Expand */}
                    <button
                      onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>

                {/* Flow Steps (expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Flow Questions</p>
                    <div className="space-y-3">
                      {flow.steps.map((step, idx) => (
                        <div key={step.id} className="flex gap-4 items-start">
                          <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-bold text-slate-900 whitespace-pre-line">{step.question}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                step.responseType === 'text' ? 'bg-blue-50 text-blue-600' :
                                step.responseType === 'number' ? 'bg-purple-50 text-purple-600' :
                                'bg-amber-50 text-amber-600'
                              }`}>
                                {step.responseType}
                              </span>
                              {step.responseType === 'dropdown' && step.options && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Options: {step.options.join(' / ')}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">→ saves to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{step.field}</code></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
