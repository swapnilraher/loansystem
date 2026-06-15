"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
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
  'Disbursement Approval Pending': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  'Disbursed': { color: 'bg-green-100 text-green-700 border-green-200', icon: IndianRupee },
  'Not Interested': { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
  'Rejected': { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
  'CNR': { color: 'bg-zinc-50 text-zinc-500 border-zinc-200', icon: Phone },
  'Switch Off': { color: 'bg-zinc-100 text-zinc-500 border-zinc-200', icon: Phone },
  'Invalid Number': { color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle },
  'Future Prospect': { color: 'bg-teal-50 text-teal-600 border-teal-100', icon: Calendar },
}

const getAvatarGradient = (status: string) => {
  switch (status) {
    case 'Approved':
    case 'Sanctioned':
    case 'Disbursed':
      return 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white'
    case 'Rejected':
    case 'Not Interested':
    case 'Invalid Number':
      return 'bg-gradient-to-tr from-rose-500 to-red-500 text-white'
    case 'New Lead':
      return 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white'
    case 'Contacted':
    case 'Interested':
    case 'Processed':
      return 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white'
    default:
      return 'bg-gradient-to-tr from-slate-400 to-slate-600 text-white'
  }
}

export default function LeadsPage() {
  const { user, profile, adminRole } = useAuth()
  const { leads, loading, error } = useLeads()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [categoryFilter, setCategoryFilter] = useState("All Sources")
  const [partnerFilter, setPartnerFilter] = useState("All Partners")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [datePreset, setDatePreset] = useState("All Time")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLogging, setIsLogging] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'documents'>('timeline')
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
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Real-time WhatsApp Chat History Listener
  useEffect(() => {
    if (!showWAModal || !waTarget) {
      setChatMessages([]);
      return;
    }

    const phoneNum = waTarget.phone || waTarget.mobile || "";
    const cleanPhone = phoneNum.replace(/[^\d]/g, "");
    const phone10 = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.substring(2) : cleanPhone;

    if (!phone10) return;

    // Listen to whatsapp_messages where phone matches customer's 10-digit number
    const q = query(
      collection(db, "whatsapp_messages"),
      where("phone", "==", phone10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateObj = new Date();
        if (data.timestamp) {
          if (data.timestamp.toDate) {
            dateObj = data.timestamp.toDate();
          } else {
            dateObj = new Date(data.timestamp);
          }
        }
        return {
          id: doc.id,
          phone: data.phone,
          text: data.text,
          sender: data.sender, // 'customer' | 'bot' | 'staff'
          userName: data.userName,
          timestamp: data.timestamp,
          leadId: data.leadId,
          dateObj
        };
      });

      // Sort in memory by dateObj ascending
      msgs.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      setChatMessages(msgs);
    }, (error) => {
      console.error("Error listening to WhatsApp messages:", error);
    });

    return () => unsubscribe();
  }, [showWAModal, waTarget]);

  // Auto Scroll Chat to Bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // 📱 Mobile UI States
  const [statusChangeLeadId, setStatusChangeLeadId] = useState<string | null>(null)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showFABMenu, setShowFABMenu] = useState(false)
  const [typeFilter, setTypeFilter] = useState("All Types")

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm("तुम्हाला खात्री आहे की ही लीड काढून टाकायची आहे?")) {
      try {
        await deleteDoc(doc(db, "leads", leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
        alert("लीड यशस्वीरित्या काढून टाकली!");
      } catch (e) {
        console.error(e);
        alert("लीड काढून टाकताना त्रुटी आली.");
      }
    }
  }

  // 🔍 Advanced Filtering Logic
  const partnerNames = useMemo(() => {
    const names = new Set<string>()
    leads.forEach(l => {
      if (l.category === 'Partner' && l.partnerName) {
        names.add(l.partnerName)
      }
    })
    return Array.from(names)
  }, [leads])

  const loanTypes = useMemo(() => {
    const types = new Set<string>()
    leads.forEach(l => {
      if (l.type) {
        types.add(l.type)
      }
    })
    return Array.from(types)
  }, [leads])

  const pipelineLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        (lead.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.type || "").toLowerCase().includes(searchTerm.toLowerCase())
      
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

      const matchesPartner = partnerFilter === "All Partners" || lead.partnerName === partnerFilter
      const matchesType = typeFilter === "All Types" || lead.type === typeFilter

      return matchesSearch && matchesCategory && matchesDate && matchesPartner && matchesType
    })
  }, [leads, searchTerm, categoryFilter, partnerFilter, datePreset, dateRange, typeFilter])

  const filteredLeads = useMemo(() => {
    return pipelineLeads.filter(lead => statusFilter === "All Statuses" || lead.status === statusFilter)
  }, [pipelineLeads, statusFilter])

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
    const staffDetail = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher (Super Admin)' : `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    
    const targetLead = leads.find(l => l.id === leadId);
    let disbursedAmt = targetLead?.disbursedAmount || targetLead?.amount || "0";

    if (newStatus === "Disbursed") {
      const amt = window.prompt("Enter final Disbursed Amount:", disbursedAmt);
      if (!amt || isNaN(Number(amt))) {
        alert("Valid disbursed amount is required to complete disbursement.");
        return;
      }
      disbursedAmt = amt;
    }

    try {
      const leadRef = doc(db, 'leads', leadId)
      
      const updatePayload: any = { status: newStatus, updatedAt: serverTimestamp() }
      if (newStatus === "Disbursed") updatePayload.disbursedAmount = disbursedAmt;

      await updateDoc(leadRef, updatePayload)
      await logLeadActivity(leadId, 'Status Update', `Changed status to ${newStatus}${newStatus === 'Disbursed' ? ` (Amt: ₹${disbursedAmt})` : ''}`, staffDetail)
      
      if (newStatus === "Disbursed" && targetLead && targetLead.partnerId) {
        // Auto Calculate Commission (Mock 2% for all products for now, can be mapped to Product Master)
        const disbursedAmount = parseInt(disbursedAmt || "0");
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
    const staffDetail = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher (Super Admin)' : `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
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
    const staffDetail = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher (Super Admin)' : `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    try {
      await logLeadActivity(lead.id, 'Call', 'Placed a quick call to customer', staffDetail)
      if (lead.status === 'New Lead' || lead.status === 'New') {
        const leadRef = doc(db, 'leads', lead.id)
        await updateDoc(leadRef, { status: 'Contacted', updatedAt: serverTimestamp() })
      }
      window.location.href = `tel:${phoneNum}`
    } catch (e) {
      console.error("Error logging call:", e)
    }
  }

  const handleWhatsAppClick = async (lead: any) => {
    const phoneNum = lead.phone || lead.mobile;
    if (!phoneNum) {
      alert("No phone number available!");
      return;
    }
    
    setWaTarget(lead);
    setWaMessage("");
    setShowWAModal(true);
    
    const staffDetail = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher (Super Admin)' : `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`;
    try {
      await logLeadActivity(lead.id, 'WhatsApp', 'Opened direct WhatsApp chat panel', staffDetail);
      if (lead.status === 'New Lead' || lead.status === 'New') {
        const leadRef = doc(db, 'leads', lead.id);
        await updateDoc(leadRef, { status: 'Contacted', updatedAt: serverTimestamp() });
      }
    } catch (e) {
      console.error("Error logging WhatsApp activity:", e);
    }
  };

  const handleOpenExternalWhatsApp = () => {
    if (!waTarget) return;
    const phoneNum = waTarget.phone || waTarget.mobile;
    if (!phoneNum) {
      alert("No phone number available!");
      return;
    }
    const cleanPhone = phoneNum.replace(/[^\d]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const textToSend = waMessage || `Hello ${waTarget.panName || waTarget.fullName || waTarget.name || 'Customer'}, this is TechStar. We received your request for a loan. When is a good time to talk?`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(textToSend)}`;
    window.open(whatsappUrl, "_blank");
  };

  const sendWhatsAppMessage = async () => {
    if (!waTarget?.phone && !waTarget?.mobile) {
      alert("No phone number available!");
      return;
    }
    if (!waMessage.trim()) {
      alert("Please type a message to send!");
      return;
    }
    
    setIsSendingWA(true);
    try {
      const phoneNum = waTarget.phone || waTarget.mobile;
      const staffName = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher' : (profile?.name || user?.displayName || user?.email || "Staff");
      
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNum, 
          name: waTarget.panName || waTarget.fullName || waTarget.name || 'Customer',
          message: waMessage,
          leadId: waTarget.id,
          senderName: staffName
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setWaMessage(""); // clear message input
      } else {
        alert(`त्रुटी: ${result.error || 'मेसेज पाठवता आला नाही'}`);
      }
    } catch (e) {
      console.error(e);
      alert("मेसेज पाठवताना त्रुटी आली.");
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
    <div className="max-w-xl mx-auto bg-slate-50/50 min-h-screen relative pb-28 animate-in fade-in duration-500 w-full px-0 sm:px-4 shadow-2xl border-x border-slate-100/50">
      {/* App Top Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 px-4 py-3.5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              लीड्स पाइपलाइन
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                {leads.length}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <label 
              className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 cursor-pointer flex items-center justify-center"
              title="Excel अपलोड"
            >
              <Upload size={14} />
              <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleExcelUpload} />
            </label>
            <button 
              onClick={exportLeadsCSV}
              className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 flex items-center justify-center"
              title="Excel एक्सपोर्ट"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 flex items-center justify-center"
              title="रिफ्रेश करा"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
            <button 
              onClick={() => setShowFilterSheet(true)}
              className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 relative flex items-center justify-center"
              title="फिल्टर्स निवडा"
            >
              <Filter size={15} />
              {/* Badge if filters active */}
              {(categoryFilter !== "All Sources" || partnerFilter !== "All Partners" || datePreset !== "All Time" || statusFilter !== "All Statuses" || typeFilter !== "All Types") && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white" />
              )}
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="नाव, फोन किंवा लोन प्रकार शोधा..." 
            className="w-full pl-9 pr-10 py-2.5 bg-slate-100/60 border border-slate-100/80 rounded-2xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-semibold text-slate-700 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Horizontal Filter Cards */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x w-full">
        {['All Statuses', 'New Lead', 'Contacted', 'Interested', 'Approved', 'Disbursed', 'Rejected'].map((status) => {
          const count = status === 'All Statuses' 
            ? pipelineLeads.length 
            : pipelineLeads.filter(l => l.status === status).length;
          const isSelected = statusFilter === status;
          return (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 h-9 rounded-full border text-xs font-black transition-all snap-start shrink-0 flex items-center gap-2 active:scale-95 ${
                isSelected 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-900/10' 
                  : 'bg-white border-slate-100/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate leading-none">{status === 'All Statuses' ? 'सर्व' : status}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active Filters Summary Chips */}
      {(categoryFilter !== "All Sources" || partnerFilter !== "All Partners" || datePreset !== "All Time" || typeFilter !== "All Types") && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {datePreset !== "All Time" && (
            <span className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1 shadow-sm">
              तारीख: {datePreset}
              <X size={10} className="cursor-pointer text-slate-400" onClick={() => setDatePreset("All Time")} />
            </span>
          )}
          {categoryFilter !== "All Sources" && (
            <span className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1 shadow-sm">
              मार्ग: {categoryFilter}
              <X size={10} className="cursor-pointer text-slate-400" onClick={() => setCategoryFilter("All Sources")} />
            </span>
          )}
          {partnerFilter !== "All Partners" && (
            <span className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1 shadow-sm">
              भागीदार: {partnerFilter}
              <X size={10} className="cursor-pointer text-slate-400" onClick={() => setPartnerFilter("All Partners")} />
            </span>
          )}
          {typeFilter !== "All Types" && (
            <span className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1 shadow-sm">
              प्रकार: {typeFilter}
              <X size={10} className="cursor-pointer text-slate-400" onClick={() => setTypeFilter("All Types")} />
            </span>
          )}
        </div>
      )}

      {/* Lead Cards List */}
      <div className="px-3 py-2 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm h-32 animate-pulse" />
          ))
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center my-6 mx-1">
            <Search size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">माहिती उपलब्ध नाही.</p>
            <p className="text-slate-300 text-xs mt-1">दुसरा फिल्टर निवडून शोधा.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const panName = lead.panName || lead.fullName || lead.name || "Name Pending";
            const initials = panName.substring(0, 2).toUpperCase();
            return (
              <div 
                key={lead.id} 
                className="bg-white rounded-[2rem] border border-slate-100/70 pl-6 pr-5 py-4.5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-md transition-all active:scale-[0.99] flex flex-col gap-3.5 relative overflow-hidden"
              >
                {/* Inset rounded vertical SLA indicator bar */}
                <div className={`absolute left-1.5 top-3.5 bottom-3.5 w-1 rounded-full ${
                  lead.slaStatus === 'Overdue' ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />

                <div className="flex justify-between items-start gap-3 pl-1">
                  <div 
                    onClick={() => setSelectedLead(lead)}
                    className="flex gap-3 cursor-pointer group flex-1 min-w-0"
                  >
                    <div className={`w-11 h-11 rounded-full ${getAvatarGradient(lead.status)} flex items-center justify-center font-black uppercase text-xs shrink-0 transition-transform active:scale-95`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 text-sm group-hover:text-primary transition-colors truncate">
                        {panName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-slate-300" /> {lead.phone || lead.mobile || "No Phone"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-400 text-[10px] tracking-wider uppercase">{lead.type}</p>
                    <p className="text-xs font-black text-slate-850 mt-0.5 italic text-slate-800">
                      ₹ {parseInt(lead.amount || "0").toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Meta Tags Row */}
                <div className="flex flex-wrap gap-1.5 items-center pl-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    (lead.category || "Landing") === "Portal" ? "bg-blue-50 text-blue-500 border-blue-100" : 
                    (lead.category || "Landing") === "Bulk" ? "bg-purple-50 text-purple-500 border-purple-100" : 
                    (lead.category || "Landing") === "Partner" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                    "bg-amber-50 text-amber-500 border-amber-100"
                  }`}>
                    {lead.category === "Partner" && lead.partnerName ? `Partner: ${lead.partnerName}` : (lead.category || "Landing")}
                  </span>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    lead.slaStatus === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {lead.slaStatus || 'Healthy'}
                  </span>

                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-full text-[8px] font-bold ml-auto">
                    {lead.createdAt?.toDate 
                      ? lead.createdAt.toDate().toLocaleDateString('en-GB') 
                      : (typeof lead.createdAt === 'string' ? new Date(lead.createdAt).toLocaleDateString('en-GB') : 'NA')}
                  </span>
                </div>

                {/* Symmetrical Action Buttons Dock */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100/70 gap-2 shrink-0 pl-1">
                  <button 
                    onClick={() => setStatusChangeLeadId(lead.id)}
                    className={`premium-btn-status ${
                      STATUS_CONFIG[lead.status]?.color || 'bg-slate-50 text-slate-400 border-slate-200/50'
                    }`}
                  >
                    <span className="truncate">{lead.status || 'New Lead'}</span>
                    <ChevronDown size={11} className="shrink-0 opacity-80" />
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => handleQuickCall(lead)} 
                      className="premium-btn-action text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50"
                      title="कॉल करा"
                    >
                      <Phone size={14} />
                    </button>
                    {(adminRole === 'Super Admin' || adminRole === 'Admin' || adminRole === 'HR') && (
                      <button 
                        onClick={() => handleWhatsAppClick(lead)} 
                        className="premium-btn-action text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 flex items-center justify-center"
                        title="WhatsApp मेसेज"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.277.002 9.571-4.287 9.575-9.566.001-2.559-1.002-4.966-2.825-6.79C16.3 2.421 13.9 1.419 11.339 1.418c-5.286 0-9.582 4.29-9.587 9.57-.001 1.638.488 3.238 1.42 4.695L2.146 21.94l6.096-1.597c.005.003.01.006.015.008v-.005h-.01c-1.53-.949-1.53-.949 0 0zm11.368-6.19c-.3-.15-1.774-.875-2.05-.975-.274-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.042-1.516-4.385-2.28-6.218-5.424-.225-.387.225-.362.65-.788.1-.1.2-.225.3-.35.1-.1.15-.175.225-.35.075-.175.037-.325-.018-.425-.056-.1-.475-1.15-.65-1.575-.17-.412-.346-.356-.475-.362-.122-.006-.262-.007-.402-.007s-.367.05-.56.25c-.19.2-.727.708-.727 1.727 0 1.02.74 2.007.84 2.15.1.15 1.46 2.228 3.538 3.125 1.62.7 2.215.797 3.015.698.48-.06 1.475-.6 1.675-1.18.2-.58.2-1.08.14-1.18-.06-.1-.225-.15-.525-.3z"/>
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedLead(lead)} 
                      className="premium-btn-action text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20"
                      title="तपशील पहा"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>


      {/* MODALS & BOTTOM SHEETS */}

      {/* Status Selector Bottom Sheet */}
      {statusChangeLeadId && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setStatusChangeLeadId(null)}
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-extrabold text-slate-800">स्टेटस अपडेट करा</h3>
              <button 
                onClick={() => setStatusChangeLeadId(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {Object.keys(STATUS_CONFIG).map((status) => {
                const isCurrent = leads.find(l => l.id === statusChangeLeadId)?.status === status;
                return (
                  <button 
                    key={status}
                    onClick={() => {
                      handleStatusUpdate(statusChangeLeadId, status);
                      setStatusChangeLeadId(null);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between border ${
                      isCurrent 
                        ? 'bg-primary/5 border-primary/20 text-primary font-black shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${STATUS_CONFIG[status].color.split(' ')[1]}`} />
                      <span>{status}</span>
                    </div>
                    {isCurrent && <CheckCircle2 size={16} className="text-primary animate-in zoom-in duration-200" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Bottom Sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowFilterSheet(false)}
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-extrabold text-slate-800">फिल्टर्स निवडा</h3>
              <button 
                onClick={() => setShowFilterSheet(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">तारीख फिल्टर (Date)</label>
                <select 
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 font-semibold text-xs outline-none cursor-pointer"
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                >
                  <option>All Time</option>
                  <option>Last 7 Days</option>
                  <option>Last Month</option>
                  <option>Custom Range</option>
                </select>
                {datePreset === "Custom Range" && (
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase">From</span>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-slate-100 rounded-lg p-1.5 text-xs font-bold"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase">To</span>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-slate-100 rounded-lg p-1.5 text-xs font-bold"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Type Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">लोन प्रकार (Loan Type)</label>
                <select 
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 font-semibold text-xs outline-none cursor-pointer"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option>All Types</option>
                  {loanTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Source Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">मार्ग/स्रोत (Source)</label>
                <select 
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 font-semibold text-xs outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  value={categoryFilter}
                  disabled={partnerFilter !== "All Partners"}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option>All Sources</option>
                  <option>Landing</option>
                  <option>Portal</option>
                  <option>Bulk</option>
                  <option>Chatbot</option>
                </select>
              </div>

              {/* Partner Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">भागीदार (DSA Partner)</label>
                <select 
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-3 font-semibold text-xs outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  value={partnerFilter}
                  disabled={categoryFilter !== "All Sources"}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                >
                  <option>All Partners</option>
                  {partnerNames.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Reset / Apply Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => {
                    setDatePreset("All Time");
                    setCategoryFilter("All Sources");
                    setPartnerFilter("All Partners");
                    setStatusFilter("All Statuses");
                    setTypeFilter("All Types");
                    setDateRange({ start: "", end: "" });
                    setShowFilterSheet(false);
                  }}
                  className="w-full py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  फिल्टर्स रिसेट करा
                </button>

                <button 
                  onClick={() => setShowFilterSheet(false)}
                  className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
                >
                  लागू करा (Apply)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Bottom Sheet */}
      {selectedLead && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedLead(null)}
          />
          <div className="w-full max-w-2xl bg-white rounded-t-[2.5rem] shadow-2xl relative z-10 flex flex-col h-[92vh] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-[1.75rem] ${getAvatarGradient(selectedLead.status)} flex items-center justify-center font-black text-xl uppercase shadow-lg shadow-blue-500/10`}>
                  {(selectedLead.panName || selectedLead.fullName || selectedLead.name || "L")[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    {selectedLead.panName || selectedLead.fullName || selectedLead.name || "Name Pending"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => {
                        setStatusChangeLeadId(selectedLead.id);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 cursor-pointer ${STATUS_CONFIG[selectedLead.status]?.color || 'bg-slate-50 text-slate-400'}`}
                    >
                      {selectedLead.status}
                    </button>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Briefcase size={10} /> {selectedLead.type}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
                <X size={22} className="text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 py-3 shrink-0 bg-white border-b border-slate-100">
              <div className="flex bg-slate-100/60 p-1 rounded-2xl gap-1">
                {[
                  { id: 'details', label: 'माहिती (Details)', icon: User },
                  { id: 'timeline', label: 'क्रिया (Timeline)', icon: History },
                  { id: 'documents', label: 'डॉक्युमेंट्स (Storage)', icon: FileText },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <tab.icon size={12} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
              {activeTab === 'details' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CIBIL Score</p>
                      <p className={`text-base font-black italic ${parseInt(selectedLead.cibilScore || "0") > 750 ? 'text-emerald-600' : 'text-primary'}`}>
                        {selectedLead.cibilScore || 'Pending'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Income</p>
                      <p className="text-base font-black text-slate-800 italic">₹ {parseInt(selectedLead.monthlyIncome || "0").toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Management Details */}
                  <div className="p-5 bg-slate-900 rounded-[2rem] text-white space-y-4 shadow-md">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Management</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assign Agent</label>
                        <select className="w-full bg-white/10 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold outline-none text-white cursor-pointer">
                          <option className="text-slate-900">Anil Kapoor</option>
                          <option className="text-slate-900">Megha Singh</option>
                          <option className="text-slate-900">Suresh Prabhu</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Next Follow-up</label>
                        <input type="datetime-local" className="w-full bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-white cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Customer Profile */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Profile</h4>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      {[
                        { label: 'Employer Name', value: selectedLead.employer || 'Not Verified', icon: Briefcase },
                        { label: 'Occupation', value: selectedLead.occupation || 'N/A', icon: User },
                        { label: 'City & State', value: `${selectedLead.city || 'NA'}, ${selectedLead.state || 'IN'}`, icon: MapPin },
                        { label: 'Pincode', value: selectedLead.pincode || '400XXX', icon: MapPin },
                        { label: 'Existing EMIs', value: `₹ ${selectedLead.existingEmis || '0'}`, icon: IndianRupee },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100/50 last:border-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                            <item.icon size={11} /> {item.label}
                          </span>
                          <span className="text-xs font-black text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marketing Attribution */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketing Attribution</h4>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      {[
                        { label: 'Lead Source', value: selectedLead.source || 'Website Inbound', icon: Target },
                        { label: 'Campaign', value: selectedLead.campaign || 'Organic Search', icon: Zap },
                        { label: 'UTM Source', value: selectedLead.utmSource || 'direct', icon: Target },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100/50 last:border-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                            <item.icon size={11} /> {item.label}
                          </span>
                          <span className="text-xs font-black text-primary">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interaction Note Editor */}
                  <div className="p-4 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-3">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Interaction Note</h4>
                    <textarea 
                      placeholder="Type feedback here..."
                      className="w-full p-3 bg-white border border-primary/10 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 transition-all h-20 outline-none resize-none"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      {['Call', 'Meeting', 'WhatsApp'].map((type) => (
                        <button
                          key={type}
                          disabled={isLogging}
                          onClick={() => handleLogActivity(type)}
                          className="flex-1 py-2.5 bg-white border border-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete Action Button */}
                  <button 
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="w-full py-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    <span>लीड काढून टाका (Delete Lead)</span>
                  </button>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="relative pl-6 border-l-2 border-slate-100 ml-3 py-2 space-y-7 animate-in fade-in duration-300">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs pl-4 border-l-0 -ml-6">No recent activities logged.</div>
                  ) : (
                    activities.map((act) => {
                      const dateStr = act.timestamp?.toDate 
                        ? act.timestamp.toDate().toLocaleString('en-GB', { hour12: true }) 
                        : 'Just now';
                      return (
                        <div key={act.id} className="relative pl-5 animate-in fade-in duration-200">
                          {/* Timeline node dot */}
                          <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-[0_2px_6px_rgba(37,99,235,0.2)] z-10 flex items-center justify-center" />
                          
                          {/* Timeline event content */}
                          <div>
                            <div className="flex justify-between items-baseline gap-2">
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">{act.type}</span>
                              <span className="text-[9px] font-semibold text-slate-400">{dateStr}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 mt-2 pl-0.5 leading-relaxed">{act.note}</p>
                            <p className="text-[9px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1 pl-0.5">
                              <span>By</span>
                              <span className="text-slate-500">{act.userName}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Origin capture node */}
                  <div className="relative pl-5">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-[0_2px_6px_rgba(16,185,129,0.2)] z-10" />
                    <div>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">Lead Captured</span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {selectedLead.createdAt?.toDate 
                            ? selectedLead.createdAt.toDate().toLocaleDateString('en-GB') 
                            : (typeof selectedLead.createdAt === 'string' ? new Date(selectedLead.createdAt).toLocaleDateString('en-GB') : 'NA')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 italic mt-2 pl-0.5">
                        Application received via {selectedLead.source || 'Digital Channel'}
                        {selectedLead.category === 'Partner' && selectedLead.partnerName ? ` by Partner: ${selectedLead.partnerName}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4 animate-in fade-in duration-300 text-center py-12 text-slate-400 text-xs">
                  <FileText size={40} className="mx-auto text-slate-200 mb-2" />
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Chat Modal */}
      {showWAModal && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isSendingWA && setShowWAModal(false)} 
          />
          <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[90vh] md:max-h-[80vh] h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.277.002 9.571-4.287 9.575-9.566.001-2.559-1.002-4.966-2.825-6.79C16.3 2.421 13.9 1.419 11.339 1.418c-5.286 0-9.582 4.29-9.587 9.57-.001 1.638.488 3.238 1.42 4.695L2.146 21.94l6.096-1.597c.005.003.01.006.015.008v-.005h-.01c-1.53-.949-1.53-.949 0 0zm11.368-6.19c-.3-.15-1.774-.875-2.05-.975-.274-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.042-1.516-4.385-2.28-6.218-5.424-.225-.387.225-.362.65-.788.1-.1.2-.225.3-.35.1-.1.15-.175.225-.35.075-.175.037-.325-.018-.425-.056-.1-.475-1.15-.65-1.575-.17-.412-.346-.356-.475-.362-.122-.006-.262-.007-.402-.007s-.367.05-.56.25c-.19.2-.727.708-.727 1.727 0 1.02.74 2.007.84 2.15.1.15 1.46 2.228 3.538 3.125 1.62.7 2.215.797 3.015.698.48-.06 1.475-.6 1.675-1.18.2-.58.2-1.08.14-1.18-.06-.1-.225-.15-.525-.3z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">WhatsApp चॅटिंग</h3>
                  <p className="text-slate-500 font-semibold text-[10px]">
                    ग्राहक: <span className="text-emerald-600 font-bold">{waTarget?.panName || waTarget?.fullName || waTarget?.name}</span>
                    {waTarget?.phone && <span className="ml-1.5 text-slate-400">({waTarget.phone})</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Launch External Link Button */}
                <button
                  onClick={handleOpenExternalWhatsApp}
                  className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold border border-emerald-100 hover:border-emerald-200"
                  title="स्थानिक WhatsApp App मध्ये उघडा"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="shrink-0 text-emerald-500">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.277.002 9.571-4.287 9.575-9.566.001-2.559-1.002-4.966-2.825-6.79C16.3 2.421 13.9 1.419 11.339 1.418c-5.286 0-9.582 4.29-9.587 9.57-.001 1.638.488 3.238 1.42 4.695L2.146 21.94l6.096-1.597c.005.003.01.006.015.008v-.005h-.01c-1.53-.949-1.53-.949 0 0zm11.368-6.19c-.3-.15-1.774-.875-2.05-.975-.274-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.042-1.516-4.385-2.28-6.218-5.424-.225-.387.225-.362.65-.788.1-.1.2-.225.3-.35.1-.1.15-.175.225-.35.075-.175.037-.325-.018-.425-.056-.1-.475-1.15-.65-1.575-.17-.412-.346-.356-.475-.362-.122-.006-.262-.007-.402-.007s-.367.05-.56.25c-.19.2-.727.708-.727 1.727 0 1.02.74 2.007.84 2.15.1.15 1.46 2.228 3.538 3.125 1.62.7 2.215.797 3.015.698.48-.06 1.475-.6 1.675-1.18.2-.58.2-1.08.14-1.18-.06-.1-.225-.15-.525-.3z"/>
                  </svg>
                  <span className="hidden sm:inline">App मध्ये उघडा</span>
                </button>
                <button 
                  onClick={() => setShowWAModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages Panel */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-xs font-semibold">कोणताही जुना संवाद उपलब्ध नाही.</p>
                  <p className="text-[10px] text-slate-400 max-w-xs">खाली मेसेज लिहून थेट चॅटिंग सुरू करा. सर्व संवाद येथे आणि डेटाबेसमध्ये सेव्ह केला जाईल.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isStaff = msg.sender === 'staff';
                  
                  // Timestamp formatter
                  let timeStr = "";
                  if (msg.dateObj) {
                    timeStr = msg.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'} w-full`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-xs font-medium ${
                          isCustomer 
                            ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                            : isBot
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-100/50 rounded-tr-none'
                              : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}
                      >
                        {/* Sender Badge */}
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-wider opacity-60">
                          {isCustomer && (msg.userName || 'ग्राहक')}
                          {isBot && '🤖 TechStar Bot'}
                          {isStaff && `👤 ${msg.userName || 'Staff'}`}
                        </div>
                        
                        {/* Message text */}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        
                        {/* Time */}
                        <div className={`text-[8px] mt-1 text-right ${isStaff ? 'text-white/60' : 'text-slate-400'}`}>
                          {timeStr}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Composer Footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <div className="flex items-end gap-2">
                <textarea 
                  className="flex-1 h-11 min-h-[44px] max-h-[120px] bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl p-3 font-medium text-xs outline-none transition-all resize-none leading-normal"
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="मेसेज येथे टाईप करा..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendWhatsAppMessage();
                    }
                  }}
                  disabled={isSendingWA}
                />
                <button 
                  disabled={isSendingWA || !waMessage.trim()}
                  onClick={sendWhatsAppMessage}
                  className="h-11 w-11 bg-emerald-500 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl shadow-md shadow-emerald-500/10 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center shrink-0"
                  title="मेसेज पाठवा"
                >
                  {isSendingWA ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Mapping Bottom Sheet */}
      {showMappingModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isUploading && setShowMappingModal(false)} 
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
            <div className="px-6 pb-4 border-b border-slate-50 shrink-0">
              <h3 className="text-base font-black text-slate-800 tracking-tight">Excel कॉलम्स मॅप करा</h3>
              <p className="text-slate-500 font-semibold text-[10px]">Excel च्या कॉलम्सना TechStar फील्ड्सशी जोडा.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {[
                { id: 'name', label: 'पूर्ण नाव (Full Name)', required: true },
                { id: 'phone', label: 'मोबाईल नंबर (Phone Number)', required: true },
                { id: 'email', label: 'ईमेल पत्ता (Email)', required: false },
                { id: 'type', label: 'लोनचा प्रकार (Loan Type)', required: false },
                { id: 'amount', label: 'लोनची रक्कम (Amount)', required: false },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select 
                    className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 font-semibold text-xs outline-none transition-all focus:border-primary cursor-pointer"
                    value={fieldMapping[field.id]}
                    onChange={(e) => setFieldMapping({...fieldMapping, [field.id]: e.target.value})}
                  >
                    <option value="">-- कॉलम निवडा --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-50 bg-white shrink-0">
              <div className="flex gap-3">
                <button 
                  disabled={isUploading}
                  onClick={() => setShowMappingModal(false)}
                  className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  रद्द करा
                </button>
                <button 
                  disabled={isUploading}
                  onClick={processBulkUpload}
                  className="flex-[2] h-12 bg-primary text-white rounded-xl font-black uppercase text-[10px] shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isUploading ? <Loader2 className="animate-spin animate-infinite" size={14} /> : <CheckCircle2 size={14} />}
                  {isUploading ? 'अपलोड होत आहे...' : 'इंपोर्ट सुरू करा'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
