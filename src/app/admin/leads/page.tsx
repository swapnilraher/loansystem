"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  IndianRupee, 
  Calendar, 
  ChevronDown, 
  X, 
  History,
  FileText,
  User,
  Star,
  Loader2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Target,
  Briefcase,
  Zap,
  Upload,
  MessageSquare
} from "lucide-react"
import { useLeads, Lead, logLeadActivity } from "@/lib/hooks/useLeads"
import { db } from "@/lib/firebase"
import { doc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// 🔄 Comprehensive Lead Status Pipeline
const STATUS_CONFIG: any = {
  'New Lead': { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Plus },
  'Contacted': { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Phone },
  'Interested': { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Star },
  'Processed': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  'Documents Pending': { color: 'bg-orange-50 text-orange-600 border-orange-100', icon: FileText },
  'Documents Received': { color: 'bg-purple-50 text-purple-600 border-purple-100', icon: FileText },
  'Login to Bank': { color: 'bg-cyan-50 text-cyan-600 border-cyan-100', icon: ArrowUpRight },
  'Under Process': { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Clock },
  'Approved': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
  'Sanctioned': { color: 'bg-green-50 text-green-600 border-green-100', icon: IndianRupee },
  'Disbursed': { color: 'bg-green-100 text-green-700 border-green-200', icon: IndianRupee },
  'Not Interested': { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
  'Rejected': { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
  'CNR': { color: 'bg-zinc-50 text-zinc-500 border-zinc-200', icon: Phone },
  'Switch Off': { color: 'bg-zinc-100 text-zinc-500 border-zinc-200', icon: Phone },
  'Invalid Number': { color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle },
  'Future Prospect': { color: 'bg-teal-50 text-teal-600 border-teal-100', icon: Calendar },
}

export default function LeadsPage() {
  const { user, profile, adminRole } = useAuth()
  const { leads, loading, error } = useLeads()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [categoryFilter, setCategoryFilter] = useState("All Sources")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [datePreset, setDatePreset] = useState("All Time")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLogging, setIsLogging] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'documents'>('details')
  const [note, setNote] = useState("")
  const [activities, setActivities] = useState<any[]>([])

  // 📂 Excel Upload & Mapping States
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [fileData, setFileData] = useState<any[]>([])
  const [fieldMapping, setFieldMapping] = useState<any>({
    name: "",
    phone: "",
    email: "",
    type: "",
    amount: ""
  })
  const [isUploading, setIsUploading] = useState(false)

  // 💬 WhatsApp Modal States
  const [showWAModal, setShowWAModal] = useState(false)
  const [waTarget, setWaTarget] = useState<any>(null)
  const [waMessage, setWaMessage] = useState("")
  const [isSendingWA, setIsSendingWA] = useState(false)

  // 🔍 Advanced Filtering Logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.type || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "All Statuses" || lead.status === statusFilter
      const matchesCategory = categoryFilter === "All Sources" || (lead.category || "Landing") === categoryFilter
      
      // Date Filtering
      let leadDate = new Date();
      if (lead.createdAt?.toDate) {
        leadDate = lead.createdAt.toDate();
      } else if (typeof lead.createdAt === 'string') {
        leadDate = new Date(lead.createdAt);
      } else if (lead.createdAt?.seconds) {
        leadDate = new Date(lead.createdAt.seconds * 1000);
      }
      
      let matchesDate = true;

      const now = new Date();
      if (datePreset === "Last 7 Days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = leadDate >= sevenDaysAgo;
      } else if (datePreset === "Last Month") {
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        matchesDate = leadDate >= lastMonth;
      } else if (datePreset === "Custom Range" && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        matchesDate = leadDate >= start && leadDate <= end;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate
    })
  }, [leads, searchTerm, statusFilter, categoryFilter, datePreset, dateRange])

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    if (file.name.endsWith('.csv')) {
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setFileHeaders(Object.keys(results.data[0] as any));
            setFileData(results.data);
            setShowMappingModal(true);
          }
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        const headers = data[0] as string[];
        const rows = data.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });
        setFileHeaders(headers);
        setFileData(rows);
        setShowMappingModal(true);
      };
      reader.readAsBinaryString(file);
    }
  };

  const processBulkUpload = async () => {
    if (!fieldMapping.name || !fieldMapping.phone) {
      alert("Please map at least Name and Phone columns!");
      return;
    }

    setIsUploading(true);
    let count = 0;
    try {
      for (const row of fileData) {
        await addDoc(collection(db, "leads"), {
          name: row[fieldMapping.name] || "Unknown",
          phone: String(row[fieldMapping.phone] || ""),
          email: row[fieldMapping.email] || "",
          type: row[fieldMapping.type] || "Personal Loan",
          amount: String(row[fieldMapping.amount] || "0"),
          status: "New Lead",
          category: "Bulk",
          source: "Excel Upload",
          createdAt: serverTimestamp()
        });
        count++;
      }
      alert(`Successfully uploaded ${count} leads!`);
      setShowMappingModal(false);
    } catch (e) {
      console.error(e);
      alert("Error uploading data. Check console.");
    }
    setIsUploading(false);
  };

  // 🕒 Real-time Activity Sync
  useEffect(() => {
    if (!selectedLead?.id) return
    const q = query(
      collection(db, 'lead_activities'),
      where('leadId', '==', selectedLead.id),
      orderBy('timestamp', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [selectedLead?.id])

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    console.log("Updating Lead Status:", leadId, "to", newStatus)
    const staffDetail = `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    try {
      const leadRef = doc(db, 'leads', leadId)
      await updateDoc(leadRef, { status: newStatus, updatedAt: serverTimestamp() })
      await logLeadActivity(leadId, 'Status Update', `Changed status to ${newStatus}`, staffDetail)
      
      const targetLead = leads.find(l => l.id === leadId);
      if (newStatus === "Disbursed" && targetLead && targetLead.partnerId) {
        // Auto Calculate Commission (Mock 2% for all products for now, can be mapped to Product Master)
        const disbursedAmount = parseInt(targetLead.amount || "0");
        const commissionAmount = disbursedAmount * 0.02;

        await addDoc(collection(db, "commission_ledger"), {
          partnerId: targetLead.partnerId,
          partnerName: targetLead.partnerName || "DSA Partner",
          dsaCode: targetLead.dsaCode || "Unknown",
          leadId: leadId,
          customerName: targetLead.name || targetLead.fullName || "Customer",
          productType: targetLead.type || "Loan",
          disbursedAmount: disbursedAmount.toString(),
          commissionAmount: commissionAmount.toString(),
          commissionPercentage: "2",
          status: "Under Settlement",
          createdAt: serverTimestamp()
        });
      }

      if (selectedLead?.id === leadId) setSelectedLead({...selectedLead, status: newStatus})
      alert(`Status updated to ${newStatus}`)
    } catch (e) { 
      console.error("Status Update Error:", e) 
      alert("Error updating status. Check console.")
    }
  }

  const handleLogActivity = async (type: string) => {
    if (!selectedLead || !note.trim()) return
    setIsLogging(true)
    const staffDetail = `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    try {
      await logLeadActivity(selectedLead.id, type, note, staffDetail)
      setNote("")
    } catch (e) { console.error(e) }
    setIsLogging(false)
  }

  const handleQuickCall = async (lead: Lead) => {
    const phoneNum = lead.phone || (lead as any).mobile
    if (!phoneNum) {
      alert("No phone number available!")
      return
    }
    const staffDetail = `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    try {
      await logLeadActivity(lead.id, 'Call', 'Placed a quick call to customer', staffDetail)
      if (lead.status === 'New Lead' || lead.status === 'New') {
        const leadRef = doc(db, 'leads', lead.id)
        await updateDoc(leadRef, { status: 'Contacted', updatedAt: serverTimestamp() })
      }
      alert(`Call logged! Opening dialer...`)
      window.location.href = `tel:${phoneNum}`
    } catch (e) {
      console.error("Error logging call:", e)
    }
  }

  const handleWhatsAppClick = (lead: any) => {
    setWaTarget(lead);
    const name = lead.panName || lead.fullName || lead.name || 'Customer';
    setWaMessage(`Hello ${name}, this is TechStar. We received your request for a loan. When is a good time to talk?`);
    setShowWAModal(true);
  };

  const sendWhatsAppMessage = async () => {
    if (!waTarget?.phone && !waTarget?.mobile) {
      alert("No phone number available!");
      return;
    }
    
    setIsSendingWA(true);
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: waTarget.phone || waTarget.mobile, 
          name: waTarget.panName || waTarget.fullName || waTarget.name,
          message: waMessage // I should update the API to accept custom message
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert("Message sent successfully!");
        setShowWAModal(false);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to WhatsApp API.");
    }
    setIsSendingWA(false);
  };
  const exportLeadsCSV = () => {
    const headers = ["Lead ID", "Name", "Phone", "Email", "Type", "Amount", "Status", "Source", "Date"]
    const rows = filteredLeads.map(l => [
      l.id, 
      (l as any).panName || (l as any).fullName || l.name || 'N/A', 
      l.phone || (l as any).mobile || 'N/A', 
      l.email || 'NA', 
      l.type, 
      l.amount, 
      l.status, 
      l.source || (l as any).category || 'Direct',
      l.createdAt?.toDate 
        ? l.createdAt.toDate().toLocaleString() 
        : (typeof l.createdAt === 'string' ? new Date(l.createdAt).toLocaleString() : 'NA')
    ].map(v => `"${v}"`).join(","))
    
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `techstar_leads_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Leads Ecosystem</h2>
          <p className="text-slate-500 font-medium tracking-tight">Total <span className="text-primary font-black">{leads.length}</span> records synced from web, social, and manual sources.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-secondary rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
            <Upload size={18} />
            <span>Excel Upload</span>
            <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleExcelUpload} />
          </label>
          <button onClick={exportLeadsCSV} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Download size={18} />
            <span>Bulk Export</span>
          </button>
        </div>
      </div>

      {/* 📊 Pipeline Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-x-auto pb-2 custom-scrollbar">
        {['New Lead', 'Contacted', 'Interested', 'Approved', 'Disbursed', 'Rejected'].map((status) => (
          <div key={status} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm min-w-[120px]">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{status}</p>
            <h3 className="text-xl font-black text-secondary">{leads.filter(l => l.status === status).length}</h3>
          </div>
        ))}
      </div>

      {/* 🔍 Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search name, phone, or loan type..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-all"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
          >
            <option>All Time</option>
            <option>Last 7 Days</option>
            <option>Last Month</option>
            <option>Custom Range</option>
          </select>
          
          {datePreset === "Custom Range" && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase outline-none px-2"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <span className="text-[10px] font-black text-slate-300">To</span>
              <input 
                type="date" 
                className="bg-transparent text-[10px] font-black uppercase outline-none px-2"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </div>
          )}

          <select 
            className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-all min-w-[140px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option>All Sources</option>
            <option>Landing</option>
            <option>Portal</option>
            <option>Bulk</option>
            <option>Chatbot</option>
          </select>
          <select 
            className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-all min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* 📋 Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative">
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Detail</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Requirement</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={40} className="text-slate-200" />
                      <p className="text-slate-500 font-bold">No matching records in the ecosystem.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-200/50 flex items-center justify-center font-black text-secondary uppercase text-sm">
                        {(lead.name || "Lead").substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-secondary text-sm">
                          {lead.panName || lead.fullName || lead.name || "Name as per PAN"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Phone size={10} /> {lead.phone || lead.mobile || "No Phone"}
                          </p>
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${
                            (lead.category || "Landing") === "Portal" ? "bg-blue-50 text-blue-500" : 
                            (lead.category || "Landing") === "Bulk" ? "bg-purple-50 text-purple-500" : 
                            (lead.category || "Landing") === "Chatbot" ? "bg-teal-50 text-teal-600 border border-teal-100" : 
                            (lead.category || "Landing") === "Partner" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : 
                            "bg-amber-50 text-amber-500"
                          }`}>
                            {lead.category === "Partner" && lead.partnerName ? `Partner: ${lead.partnerName}` : (lead.category || "Landing")}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold ml-1">
                            {lead.createdAt?.toDate 
                              ? lead.createdAt.toDate().toLocaleDateString('en-GB') 
                              : (typeof lead.createdAt === 'string' ? new Date(lead.createdAt).toLocaleDateString('en-GB') : '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-secondary text-sm">{lead.type}</p>
                        <p className="text-[11px] font-black text-primary italic">₹ {parseInt(lead.amount || "0").toLocaleString()}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${lead.slaStatus === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {lead.slaStatus || 'Healthy'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="relative group/status inline-block">
                      <button className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${STATUS_CONFIG[lead.status]?.color || 'bg-slate-50 text-slate-400'}`}>
                        {lead.status || 'New Lead'}
                        <ChevronDown size={12} className="group-hover/status:rotate-180 transition-transform" />
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl py-3 z-[110] opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all max-h-[300px] overflow-y-auto custom-scrollbar">
                        {Object.keys(STATUS_CONFIG).map((status) => (
                          <button 
                            key={status}
                            onClick={() => handleStatusUpdate(lead.id, status)}
                            className="w-full text-left px-5 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-3"
                          >
                            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${STATUS_CONFIG[status].color.split(' ')[1]}`} />
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleQuickCall(lead)}
                        className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                        title="Log & Place Call"
                      >
                        <Phone size={18} />
                      </button>
                      {(adminRole === 'Super Admin' || adminRole === 'Admin' || adminRole === 'HR') && (
                        <button 
                          onClick={() => handleWhatsAppClick(lead)}
                          className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                          title="Send WhatsApp"
                        >
                          <MessageSquare size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all" title="Delete Lead">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 Lead Insights Slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={() => setSelectedLead(null)} />
          <div className="w-full max-w-xl bg-white h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[2rem] bg-primary text-white flex items-center justify-center font-black text-2xl uppercase shadow-lg shadow-primary/20">
                  {(selectedLead.panName || selectedLead.fullName || selectedLead.name || "L")[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-secondary tracking-tight">
                    {selectedLead.panName || selectedLead.fullName || selectedLead.name || "Name Pending"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${STATUS_CONFIG[selectedLead.status]?.color || 'bg-slate-50 text-slate-400'}`}>
                      {selectedLead.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Briefcase size={12} /> {selectedLead.type}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-50">
              {[
                { id: 'details', label: 'Overview', icon: User },
                { id: 'timeline', label: 'Activity Feed', icon: History },
                { id: 'documents', label: 'Storage', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-secondary'}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === 'details' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-10">
                  {/* Financial & Profile Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CIBIL Score</p>
                      <p className={`text-lg font-black italic ${parseInt(selectedLead.cibilScore || "0") > 750 ? 'text-emerald-600' : 'text-primary'}`}>
                        {selectedLead.cibilScore || 'Pending'}
                      </p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Income</p>
                      <p className="text-lg font-black text-secondary italic">₹ {parseInt(selectedLead.monthlyIncome || "0").toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Management Tools: Assignment & Follow-up */}
                  <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Management</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assign Agent</label>
                        <select className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                          <option className="text-slate-900">Anil Kapoor</option>
                          <option className="text-slate-900">Megha Singh</option>
                          <option className="text-slate-900">Suresh Prabhu</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Next Follow-up</label>
                        <input type="datetime-local" className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Segmentation Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {['Hot Lead', 'High Ticket', 'Salaried', 'Urgent'].map(tag => (
                          <button key={tag} className="px-2 py-1 bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase hover:bg-primary transition-all">
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Data Sections */}
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Customer Profile</h4>
                      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4">
                        {[
                          { label: 'Employer Name', value: selectedLead.employer || 'Not Verified', icon: Briefcase },
                          { label: 'Occupation', value: selectedLead.occupation || 'N/A', icon: User },
                          { label: 'City & State', value: `${selectedLead.city || 'NA'}, ${selectedLead.state || 'IN'}`, icon: MapPin },
                          { label: 'Pincode', value: selectedLead.pincode || '400XXX', icon: MapPin },
                          { label: 'Existing EMIs', value: `₹ ${selectedLead.existingEmis || '0'}`, icon: IndianRupee },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2">
                              <item.icon size={12} /> {item.label}
                            </span>
                            <span className="text-xs font-black text-secondary">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Marketing Attribution</h4>
                      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4">
                        {[
                          { label: 'Lead Source', value: selectedLead.source || 'Website Inbound', icon: Target },
                          { label: 'Campaign', value: selectedLead.campaign || 'Organic Search', icon: Zap },
                          { label: 'UTM Source', value: selectedLead.utmSource || 'direct', icon: Target },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2">
                              <item.icon size={12} /> {item.label}
                            </span>
                            <span className="text-xs font-black text-primary">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Action Bar */}
                  <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Interaction Note</h4>
                    <textarea 
                      placeholder="Type feedback here (e.g. 'Customer wants to think', 'Asked to call tomorrow')..."
                      className="w-full p-4 bg-white border border-primary/10 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/10 transition-all h-24"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      {['Call', 'Meeting', 'WhatsApp'].map((type) => (
                        <button
                          key={type}
                          disabled={isLogging}
                          onClick={() => handleLogActivity(type)}
                          className="flex-1 py-3 bg-white border border-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative pl-8 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary z-10" />
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between mb-2">
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest">{act.type}</span>
                          <span className="text-[8px] font-bold text-slate-400">{act.timestamp?.toDate ? act.timestamp.toDate().toLocaleString() : 'Just now'}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-600">{act.note}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">By {act.userName}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10" />
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Lead Captured</p>
                      <p className="text-xs font-medium text-slate-500 italic mt-1">Application received via {selectedLead.source || 'Digital Channel'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📊 Excel Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isUploading && setShowMappingModal(false)} />
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-2xl font-black text-secondary tracking-tight">Map Excel Columns</h3>
              <p className="text-slate-500 font-medium text-sm">Match your file headers to TechStar fields.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {[
                { id: 'name', label: 'Full Name', required: true },
                { id: 'phone', label: 'Phone Number', required: true },
                { id: 'email', label: 'Email Address', required: false },
                { id: 'type', label: 'Loan Type', required: false },
                { id: 'amount', label: 'Loan Amount', required: false },
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select 
                    className="w-full h-12 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl px-4 font-bold text-sm outline-none transition-all"
                    value={fieldMapping[field.id]}
                    onChange={(e) => setFieldMapping({...fieldMapping, [field.id]: e.target.value})}
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="p-8 border-t border-slate-50 bg-white">
              <div className="flex gap-4">
                <button 
                  disabled={isUploading}
                  onClick={() => setShowMappingModal(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={isUploading}
                  onClick={processBulkUpload}
                  className="flex-[2] h-14 bg-primary text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {isUploading ? 'Uploading Data...' : 'Start Bulk Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 💬 WhatsApp Composer Modal */}
      {showWAModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSendingWA && setShowWAModal(false)} />
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-secondary tracking-tight">WhatsApp Composer</h3>
                <p className="text-slate-500 font-medium text-xs">Sending to: <span className="text-emerald-600 font-bold">{waTarget?.panName || waTarget?.fullName || waTarget?.name}</span></p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
                <textarea 
                  className="w-full h-40 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-3xl p-5 font-medium text-sm outline-none transition-all resize-none"
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="Type your personalized message here..."
                />
              </div>
              
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm h-fit">
                  <AlertCircle size={14} className="text-emerald-500" />
                </div>
                <p className="text-[10px] font-bold text-emerald-700 leading-relaxed">
                  This message will be sent via the official WhatsApp Business API. Ensure the content follows Meta's guidelines.
                </p>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-white">
              <div className="flex gap-4">
                <button 
                  disabled={isSendingWA}
                  onClick={() => setShowWAModal(false)}
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-xs text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSendingWA}
                  onClick={sendWhatsAppMessage}
                  className="flex-[2] h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingWA ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  {isSendingWA ? 'Sending...' : 'Send Message Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
