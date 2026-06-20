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
  MessageSquare,
  Paperclip,
  Smile,
  Send,
  MoreVertical,
  Megaphone,
  ArrowLeft,
  Video
} from "lucide-react"
import { useLeads, Lead, logLeadActivity } from "@/lib/hooks/useLeads"
import { db, storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [broadcastProgress, setBroadcastProgress] = useState<{ sent: number; total: number; statusText: string } | null>(null)
  const [activeLeadDoc, setActiveLeadDoc] = useState<any>(null)
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 💬 Follow-up Prompt states
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  const [promptLeadId, setPromptLeadId] = useState("")
  const [promptType, setPromptType] = useState("")
  const [followUpRemarkText, setFollowUpRemarkText] = useState("")
  const [isSavingPromptFollowUp, setIsSavingPromptFollowUp] = useState(false)

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
          mediaType: data.mediaType || "",
          mediaUrl: data.mediaUrl || "",
          filename: data.filename || "",
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

  // Listen to active lead document details in real-time
  useEffect(() => {
    if (!waTarget || !waTarget.id) {
      setActiveLeadDoc(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, "leads", waTarget.id), (snapshot) => {
      if (snapshot.exists()) {
        setActiveLeadDoc({ id: snapshot.id, ...snapshot.data() });
      }
    }, (error) => {
      console.error("Error listening to active lead doc:", error);
    });
    return () => unsubscribe();
  }, [waTarget]);

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

  // 🕒 Listen to window focus for automated follow-up remark prompts
  useEffect(() => {
    const handleFocus = () => {
      const pendingStr = localStorage.getItem('pendingFollowUp');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          // Only show popup if it was clicked within the last 10 minutes
          if (Date.now() - pending.time < 10 * 60 * 1000) {
            setPromptLeadId(pending.leadId);
            setPromptType(pending.type);
            setFollowUpRemarkText("");
            setShowFollowUpPrompt(true);
          }
        } catch (e) {
          console.error("Error parsing pendingFollowUp:", e);
        }
        localStorage.removeItem('pendingFollowUp');
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [leads]);

  const handleSavePromptFollowUp = async () => {
    if (!promptLeadId || !followUpRemarkText.trim()) {
      alert("कृपया रिमार्क टाईप करा!");
      return;
    }
    setIsSavingPromptFollowUp(true);
    const staffDetail = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher (Super Admin)' : `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    try {
      await logLeadActivity(promptLeadId, promptType, followUpRemarkText, staffDetail);
      
      // Auto-update status to Contacted if it's currently New
      const targetLead = leads.find(l => l.id === promptLeadId);
      if (targetLead && (targetLead.status === 'New Lead' || targetLead.status === 'New')) {
        const leadRef = doc(db, 'leads', promptLeadId);
        await updateDoc(leadRef, { status: 'Contacted', updatedAt: serverTimestamp() });
      }

      setShowFollowUpPrompt(false);
      setFollowUpRemarkText("");
      alert("रिमार्क सेव्ह झाला!");
    } catch (e) {
      console.error("Error saving prompt follow-up:", e);
      alert("Failed to save follow-up.");
    }
    setIsSavingPromptFollowUp(false);
  };

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
      localStorage.setItem('pendingFollowUp', JSON.stringify({ leadId: lead.id, time: Date.now(), type: 'Call' }));
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
    
    localStorage.setItem('pendingFollowUp', JSON.stringify({ leadId: waTarget.id, time: Date.now(), type: 'WhatsApp' }));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileUploading(true);
    setIsSendingWA(true);
    try {
      const phoneNum = waTarget.phone || waTarget.mobile;
      const staffName = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher' : (profile?.name || user?.displayName || user?.email || "Staff");
      
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `whatsapp_media/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // 2. Determine mediaType
      let mediaType = "document";
      if (file.type.startsWith("image/")) {
        mediaType = "image";
      }

      // 3. Send message via WhatsApp Cloud API
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNum, 
          name: waTarget.panName || waTarget.fullName || waTarget.name || 'Customer',
          message: `Sent attachment: ${file.name}`,
          leadId: waTarget.id,
          senderName: staffName,
          mediaType,
          mediaUrl: downloadUrl,
          filename: file.name
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(`फाइल पाठवू शकलो नाही: ${result.error || 'त्रुटी आली'}`);
      }
    } catch (e) {
      console.error("File upload/send error:", e);
      alert("फाइल पाठवताना त्रुटी आली.");
    } finally {
      setIsFileUploading(false);
      setIsSendingWA(false);
      e.target.value = "";
    }
  };

  const handleSendBroadcast = async () => {
    if (filteredLeads.length === 0) return;
    if (!broadcastMessage.trim()) return;

    setIsSendingBroadcast(true);
    setBroadcastProgress({ sent: 0, total: filteredLeads.length, statusText: "सुरू होत आहे..." });

    const staffName = user?.email === 'swapnil.r.aher@gmail.com' ? 'Swapnil Aher' : (profile?.name || user?.displayName || user?.email || "Staff");

    let sentCount = 0;
    for (const lead of filteredLeads) {
      const phoneNum = lead.phone || lead.mobile;
      if (!phoneNum) {
        sentCount++;
        setBroadcastProgress({
          sent: sentCount,
          total: filteredLeads.length,
          statusText: `${lead.name || 'ग्राहक'} चा फोन नंबर उपलब्ध नाही, वगळत आहे...`
        });
        continue;
      }

      const name = lead.panName || lead.fullName || lead.name || 'Customer';
      const personalizedMessage = broadcastMessage.replace(/\{name\}/g, name);

      try {
        const response = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: phoneNum, 
            name: name,
            message: personalizedMessage,
            leadId: lead.id,
            senderName: staffName
          }),
        });
        const result = await response.json();
        if (!result.success) {
          console.error(`Failed to send broadcast to ${name}:`, result.error);
        }
      } catch (error) {
        console.error(`Broadcast error for ${name}:`, error);
      }

      sentCount++;
      setBroadcastProgress({
        sent: sentCount,
        total: filteredLeads.length,
        statusText: `${name} ला मेसेज पाठवला...`
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setBroadcastProgress({
      sent: filteredLeads.length,
      total: filteredLeads.length,
      statusText: "✅ ब्रॉडकास्ट यशस्वीरित्या पूर्ण झाले!"
    });

    setTimeout(() => {
      setShowBroadcastModal(false);
      setBroadcastProgress(null);
      setBroadcastMessage("");
      setIsSendingBroadcast(false);
    }, 1500);
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
    <div className="w-full min-h-screen relative pb-28 animate-in fade-in duration-500">
      {/* App Top Bar */}
      <div className="sticky top-16 lg:top-20 bg-white/95 backdrop-blur-md border-b border-slate-100 z-30 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        
        {/* Action buttons row: scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth shrink-0 animate-in fade-in duration-300">
          <label 
            className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 cursor-pointer flex items-center justify-center shrink-0"
            title="Excel अपलोड"
          >
            <Upload size={14} />
            <input type="file" className="hidden" accept=".xlsx, .csv" onChange={handleExcelUpload} />
          </label>
          <button 
            onClick={exportLeadsCSV}
            className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 flex items-center justify-center shrink-0"
            title="Excel एक्सपोर्ट"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 flex items-center justify-center shrink-0"
            title="रिफ्रेश करा"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw shrink-0"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
          <button 
            onClick={() => setShowBroadcastModal(true)}
            className="h-9 px-3.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            title="निवडलेल्या ग्राहकांना ब्रॉडकास्ट पाठवा"
          >
            <Megaphone size={14} className="text-primary shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider shrink-0">ब्रॉडकास्ट ({filteredLeads.length})</span>
          </button>
          <button 
            onClick={() => setShowFilterSheet(true)}
            className="premium-btn-action bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 relative flex items-center justify-center shrink-0"
            title="फिल्टर्स निवडा"
          >
            <Filter size={15} />
            {/* Badge if filters active */}
            {(categoryFilter !== "All Sources" || partnerFilter !== "All Partners" || datePreset !== "All Time" || statusFilter !== "All Statuses" || typeFilter !== "All Types") && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white" />
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="नाव, फोन किंवा लोन प्रकार शोधा..." 
            className="w-full pl-9 pr-10 py-2 bg-slate-100/60 border border-slate-100/80 rounded-2xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-semibold text-slate-700 placeholder-slate-400"
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
      <div className="px-4 py-3 flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible pb-2 no-scrollbar snap-x w-full">
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

      {/* Lead Rows List */}
      <div className="px-0 py-1.5 md:px-1 md:py-2">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm h-14 animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-100 p-12 text-center my-6 mx-1">
            <Search size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">माहिती उपलब्ध नाही.</p>
            <p className="text-slate-300 text-xs mt-1">दुसरा फिल्टर निवडून शोधा.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredLeads.map((lead) => {
              const panName = lead.panName || lead.fullName || lead.name || "Name Pending";
              const isUntouched = (lead.status === 'New Lead' || lead.status === 'New') && !lead.lastActivityNote;
              return (
                <>
                {/* Desktop Card (hidden on mobile) */}
                <div 
                  key={`desktop-${lead.id}`} 
                  className={`hidden md:flex items-center justify-between gap-3.5 pl-5 pr-4 py-3.5 bg-white border rounded-[1.5rem] relative overflow-hidden hover:shadow-md transition-all group shrink-0 ${
                    isUntouched ? 'border-rose-200 bg-rose-50/5 shadow-[inset_0_0_12px_rgba(244,63,94,0.02)]' : 'border-slate-100/70'
                  }`}
                >
                  {/* Inset rounded vertical SLA indicator bar */}
                  <div className={`absolute left-1 top-1.5 bottom-1.5 w-1 rounded-full ${
                    lead.slaStatus === 'Overdue' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />

                  <div className="flex items-center justify-between w-full gap-3 pl-1.5">
                    {/* Container for Column 1 & 3: side-by-side on mobile, contents on desktop */}
                    <div className="flex md:contents justify-between items-start w-full md:w-auto gap-4">
                      {/* Column 1: Client Info */}
                      <div 
                        onClick={() => setSelectedLead(lead)}
                        className="flex-1 md:flex-none md:w-48 min-w-0 cursor-pointer group/item"
                      >
                        <p className="font-extrabold text-slate-800 text-sm group-hover/item:text-primary transition-colors truncate flex items-center gap-1.5">
                          {isUntouched && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
                            </span>
                          )}
                          {panName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-slate-300" /> {lead.phone || lead.mobile || "No Phone"}
                        </p>
                        {lead.lastActivityNote && (
                          <p className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/60 rounded-lg px-2 py-0.5 font-bold mt-1.5 inline-block max-w-[200px] truncate" title={lead.lastActivityNote}>
                            💬 {lead.lastActivityNote}
                          </p>
                        )}
                      </div>

                      {/* Column 2: Source/Category */}
                      <div className="w-32 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          (lead.category || "Landing") === "Portal" ? "bg-blue-50 text-blue-500 border-blue-100" : 
                          (lead.category || "Landing") === "Bulk" ? "bg-purple-50 text-purple-500 border-purple-100" : 
                          (lead.category || "Landing") === "Partner" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                          (lead.category || "Landing")?.toLowerCase() === "whatsapp ads" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          "bg-amber-50 text-amber-500 border-amber-100"
                        }`}>
                          {lead.category === "Partner" && lead.partnerName ? `Partner: ${lead.partnerName}` : (lead.category || "Landing")}
                        </span>
                      </div>

                      {/* Column 3: Loan Details */}
                      <div className="flex flex-col justify-center items-start w-36 shrink-0 gap-0.5 text-left">
                        <p className="font-black text-slate-400 text-[9px] tracking-wider uppercase leading-none">{lead.type}</p>
                        <p className="text-xs font-black text-slate-850 mt-0.5 italic text-slate-800 leading-none">
                          ₹ {parseInt(lead.amount || "0").toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Column 4: SLA & Date */}
                    <div className="flex items-center gap-2 w-36 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                        lead.slaStatus === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {lead.slaStatus || 'Healthy'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        {lead.createdAt?.toDate 
                          ? `${lead.createdAt.toDate().toLocaleDateString('en-GB')} ${lead.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` 
                          : (typeof lead.createdAt === 'string' ? `${new Date(lead.createdAt).toLocaleDateString('en-GB')} ${new Date(lead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'NA')}
                      </span>
                    </div>

                    {/* Column 5: Status Dropdown & Actions Container */}
                    <div className="flex items-center justify-end w-auto gap-3 shrink-0">
                      {/* Status Selector */}
                      <button 
                        onClick={() => setStatusChangeLeadId(lead.id)}
                        className={`premium-btn-status h-8 px-2.5 text-[10px] ${
                          STATUS_CONFIG[lead.status]?.color || 'bg-slate-50 text-slate-400 border-slate-200/50'
                        }`}
                      >
                        <span>{lead.status || 'New Lead'}</span>
                        <ChevronDown size={11} className="shrink-0 opacity-80" />
                      </button>

                      {/* Action Icon buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleQuickCall(lead)} 
                          className="premium-btn-action h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 flex items-center justify-center"
                          title="कॉल करा"
                        >
                          <Phone size={13} />
                        </button>
                        {(adminRole === 'Super Admin' || adminRole === 'Admin' || adminRole === 'HR') && (
                          <>
                            <button 
                              onClick={() => handleWhatsAppClick(lead)} 
                              className="premium-btn-action h-8 w-8 text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 flex items-center justify-center text-indigo-600"
                              title="अंतर्गत WhatsApp चॅट (Internal Chat)"
                            >
                              <MessageSquare size={13} />
                            </button>
                            <button 
                              onClick={() => {
                                const phoneNum = lead.phone || lead.mobile || "";
                                const cleanPhone = phoneNum.replace(/[^\d]/g, "");
                                const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                                localStorage.setItem('pendingFollowUp', JSON.stringify({ leadId: lead.id, time: Date.now(), type: 'WhatsApp' }));
                                window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
                              }} 
                              className="premium-btn-action h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 flex items-center justify-center"
                              title="थेट WhatsApp उघडा (Open in WhatsApp App)"
                            >
                              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                              </svg>
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setSelectedLead(lead)} 
                          className="premium-btn-action h-8 w-8 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center"
                          title="तपशील पहा"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Card (visible only on mobile) */}
                <div 
                  key={`mobile-${lead.id}`}
                  className={`flex md:hidden flex-col gap-2.5 px-3.5 py-3.5 bg-white border rounded-2xl relative overflow-hidden transition-all hover:shadow-md ${
                    isUntouched ? 'border-rose-200 bg-rose-50/5 shadow-[inset_0_0_12px_rgba(244,63,94,0.01)]' : 'border-slate-100/70 shadow-sm shadow-slate-100/40'
                  }`}
                >
                  {/* Left SLA indicator bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    lead.slaStatus === 'Overdue' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />

                  {/* Header Row: Client Name & Amount */}
                  <div className="flex justify-between items-start w-full gap-2 pl-1.5">
                    <div 
                      onClick={() => setSelectedLead(lead)}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 truncate">
                        {isUntouched && (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                        {panName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-slate-300" /> {lead.phone || lead.mobile || "No Phone"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-800">
                        ₹ {parseInt(lead.amount || "0").toLocaleString()}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{lead.type || 'General'}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100/60 my-0.5 ml-1.5" />

                  {/* Category & SLA/Date */}
                  <div className="flex justify-between items-center w-full pl-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                      (lead.category || "Landing") === "Portal" ? "bg-blue-50 text-blue-500 border-blue-100" : 
                      (lead.category || "Landing") === "Bulk" ? "bg-purple-50 text-purple-500 border-purple-100" : 
                      (lead.category || "Landing") === "Partner" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                      (lead.category || "Landing")?.toLowerCase() === "whatsapp ads" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      "bg-amber-50 text-amber-500 border-amber-100"
                    }`}>
                      {lead.category === "Partner" && lead.partnerName ? `Partner: ${lead.partnerName}` : (lead.category || "Landing")}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                        lead.slaStatus === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {lead.slaStatus || 'Healthy'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {lead.createdAt?.toDate 
                          ? `${lead.createdAt.toDate().toLocaleDateString('en-GB')} ${lead.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` 
                          : (typeof lead.createdAt === 'string' ? `${new Date(lead.createdAt).toLocaleDateString('en-GB')} ${new Date(lead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'NA')}
                      </span>
                    </div>
                  </div>

                  {/* Comment Banner */}
                  {lead.lastActivityNote ? (
                    <div className="bg-indigo-50/50 border border-indigo-100/40 rounded-xl px-2.5 py-1.5 mt-1 ml-1.5 flex items-start gap-1.5">
                      <span className="text-xs shrink-0 mt-0.5">💬</span>
                      <p className="text-[10px] text-indigo-600 font-bold leading-normal line-clamp-2" title={lead.lastActivityNote}>
                        {lead.lastActivityNote}
                      </p>
                    </div>
                  ) : (
                    isUntouched && (
                      <div className="bg-rose-50/30 border border-rose-100/45 rounded-xl px-2.5 py-1.5 mt-1 ml-1.5 flex items-center gap-1.5 animate-pulse">
                        <span className="text-xs shrink-0">⚠️</span>
                        <p className="text-[9px] text-rose-500 font-black tracking-wide uppercase">
                          Action Pending
                        </p>
                      </div>
                    )
                  )}

                  {/* Action Row */}
                  <div className="flex items-center justify-between w-full mt-1.5 pl-1.5 gap-2">
                    <button 
                      onClick={() => setStatusChangeLeadId(lead.id)}
                      className={`premium-btn-status h-8 px-3 text-[10px] ${
                        STATUS_CONFIG[lead.status]?.color || 'bg-slate-50 text-slate-400 border-slate-200/50'
                      }`}
                    >
                      <span className="block truncate max-w-[90px]">{lead.status || 'New Lead'}</span>
                      <ChevronDown size={11} className="shrink-0 opacity-80" />
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleQuickCall(lead)} 
                        className="premium-btn-action h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 flex items-center justify-center"
                        title="कॉल करा"
                      >
                        <Phone size={13} />
                      </button>
                      {(adminRole === 'Super Admin' || adminRole === 'Admin' || adminRole === 'HR') && (
                        <>
                          <button 
                            onClick={() => handleWhatsAppClick(lead)} 
                            className="premium-btn-action h-8 w-8 text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 flex items-center justify-center text-indigo-600"
                            title="अंतर्गत WhatsApp चॅट (Internal Chat)"
                          >
                            <MessageSquare size={13} />
                          </button>
                          <button 
                            onClick={() => {
                              const phoneNum = lead.phone || lead.mobile || "";
                              const cleanPhone = phoneNum.replace(/[^\d]/g, "");
                              const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                              localStorage.setItem('pendingFollowUp', JSON.stringify({ leadId: lead.id, time: Date.now(), type: 'WhatsApp' }));
                              window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
                            }} 
                            className="premium-btn-action h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 flex items-center justify-center"
                            title="थेट WhatsApp उघडा (Open in WhatsApp App)"
                          >
                            <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                            </svg>
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setSelectedLead(lead)} 
                        className="premium-btn-action h-8 w-8 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center"
                        title="तपशील पहा"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                </>
              );
            })}
          </div>
        )}
      </div>


      {/* MODALS & BOTTOM SHEETS */}

      {/* Status Selector Bottom Sheet */}
      {statusChangeLeadId && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setStatusChangeLeadId(null)}
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2rem] p-6 pb-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] md:max-h-[80vh] overflow-y-auto custom-scrollbar">
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
        <div className="fixed inset-0 z-[130] flex items-end md:items-center justify-center p-0 md:p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowFilterSheet(false)}
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2rem] p-6 pb-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] md:max-h-[80vh] overflow-y-auto custom-scrollbar">
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
                  <option value="Whatsapp ads">Whatsapp ads</option>
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
        <div className="fixed inset-0 z-[140] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />
          <div className="w-full max-w-2xl bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl relative z-10 flex flex-col h-[92vh] md:h-[80vh] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
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
                  { id: 'details', labelMar: 'माहिती', labelEng: 'Details', icon: User },
                  { id: 'timeline', labelMar: 'क्रिया', labelEng: 'Timeline', icon: History },
                  { id: 'documents', labelMar: 'डॉक्युमेंट्स', labelEng: 'Storage', icon: FileText },
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
                      <span>
                        {tab.labelMar}
                        <span className="hidden sm:inline"> ({tab.labelEng})</span>
                      </span>
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
                            ? `${selectedLead.createdAt.toDate().toLocaleDateString('en-GB')} ${selectedLead.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` 
                            : (typeof selectedLead.createdAt === 'string' ? `${new Date(selectedLead.createdAt).toLocaleDateString('en-GB')} ${new Date(selectedLead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'NA')}
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

      {/* WhatsApp Chat Modal (WhatsApp Web Replica) */}
      {showWAModal && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isSendingWA && setShowWAModal(false)} 
          />
          <div className="w-full max-w-lg bg-[#efeae2] rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[90vh] md:max-h-[80vh] h-[88vh] md:h-[600px]">
            {/* WhatsApp Header (WhatsApp Mobile App Style) */}
            <div className="px-3 py-2.5 bg-[#008069] text-white flex items-center justify-between shrink-0 select-none shadow-md">
              <div className="flex items-center gap-1.5">
                {/* Back Button */}
                <button 
                  onClick={() => setShowWAModal(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="बंद करा"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>

                {/* Clean Contact Avatar Icon */}
                <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center relative shrink-0">
                  <User size={20} className="text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#1fa34c] border-2 border-[#008069] rounded-full" />
                </div>
                
                <div className="min-w-0 ml-1">
                  <h3 className="text-xs font-bold text-white truncate leading-tight">
                    {waTarget?.panName || waTarget?.fullName || waTarget?.name || 'Customer'}
                  </h3>
                  <p className="text-white/80 text-[9px] mt-0.5 leading-none">
                    online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-white">
                {/* Launch External Link Button (WhatsApp Brand Logo) */}
                <button
                  onClick={handleOpenExternalWhatsApp}
                  className="p-2 hover:bg-white/10 text-white rounded-full transition-all flex items-center justify-center shrink-0"
                  title="थेट WhatsApp ॲप मध्ये उघडा"
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className="shrink-0 text-white">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                </button>
                {/* Visual Settings Option */}
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0">
                  <MoreVertical size={16} />
                </button>
                {/* Close Button */}
                <button
                  onClick={() => !isSendingWA && setShowWAModal(false)}
                  className="p-2 hover:bg-white/10 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="बंद करा (Close)"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Auto-Chat Status Banner */}
            {activeLeadDoc?.botMuted ? (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-250 select-none">
                <div className="flex items-center gap-2 text-amber-850 text-[10px] font-extrabold text-amber-800">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                  🤖 ऑटो-चॅट बंद आहे (Auto-chat is Muted)
                </div>
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, "leads", waTarget.id), { botMuted: false });
                  }}
                  className="px-2 py-0.5 bg-amber-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  सुरू करा (Activate)
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-250 select-none">
                <div className="flex items-center gap-2 text-emerald-850 text-[10px] font-extrabold text-emerald-800">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                  🤖 ऑटो-चॅट सुरू आहे (Auto-chat is Active)
                </div>
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, "leads", waTarget.id), { botMuted: true });
                  }}
                  className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  बंद करा (Mute)
                </button>
              </div>
            )}

            {/* Chat Messages Panel with SVG Doodle Wallpaper overlay */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 relative select-text"
              style={{
                backgroundColor: "#efeae2",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%239c92ac' fill-opacity='0.05'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            >
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500 bg-white/70 rounded-3xl backdrop-blur-sm max-w-sm mx-auto shadow-sm my-12 border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <MessageSquare size={22} />
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">सध्या कोणताही जुना संवाद नाही.</p>
                  <p className="text-[10px] text-slate-500 max-w-xs font-semibold leading-relaxed">
                    खाली मेसेज लिहून थेट संवाद सुरू करा. सर्व संभाषणे डेटाबेसमध्ये जतन केली जातात.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isStaff = msg.sender === 'staff';
                  
                  let timeStr = "";
                  if (msg.dateObj) {
                    timeStr = msg.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} w-full animate-in fade-in zoom-in-95 duration-150`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-lg px-3.5 py-1.5 text-xs font-medium shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative leading-relaxed ${
                          isCustomer 
                            ? 'bg-white text-[#111b21] rounded-tl-none border border-slate-100/30' 
                            : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                        }`}
                      >
                        {/* Sender Label for clarity in admin panel */}
                        <div className="flex items-center gap-1.5 mb-0.5 text-[8px] font-black uppercase tracking-wider opacity-50">
                          {isCustomer && (msg.userName || 'ग्राहक')}
                          {isBot && '🤖 TechStar Bot'}
                          {isStaff && `👤 ${msg.userName || 'Staff'}`}
                        </div>
                        
                        {/* Media Content */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-slate-200/50 bg-slate-50">
                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                              <img src={msg.mediaUrl} alt={msg.text || "Image"} className="w-full max-h-48 object-cover group-hover:opacity-90 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={16} className="text-white" />
                              </div>
                            </a>
                          </div>
                        )}
                        
                        {msg.mediaType === 'document' && msg.mediaUrl && (
                          <div className="mb-2 bg-black/5 rounded-xl p-2 border border-slate-200/10 flex items-center justify-between gap-3 max-w-[240px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText size={20} className="text-red-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-800 truncate leading-snug">{msg.filename || "दस्तऐवज (Document)"}</p>
                                <p className="text-[7px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Document</p>
                              </div>
                            </div>
                            <a 
                              href={msg.mediaUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-1 bg-white text-slate-500 hover:text-slate-800 rounded-lg hover:shadow-sm border border-slate-100 transition-all shrink-0 cursor-pointer"
                              title="डाउनलोड करा"
                            >
                              <Download size={12} />
                            </a>
                          </div>
                        )}
                        
                        {/* Text */}
                        <p className="whitespace-pre-wrap select-text pr-10 text-[11px] leading-normal">{msg.text}</p>
                        
                        {/* Time & Double Checkmark */}
                        <div className="absolute right-2 bottom-1 flex items-center gap-0.5 text-[8px] text-[#667781] select-none">
                          <span>{timeStr}</span>
                          {!isCustomer && (
                            <span className={isStaff ? 'text-[#53bdeb] font-bold' : 'text-[#8696a0] font-bold'}>
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Emoji Picker Popover - positioned above footer */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xl z-20 grid grid-cols-7 gap-1.5 max-w-[280px] animate-in slide-in-from-bottom-2 duration-150 select-none">
                {['😀','😂','🤣','😊','😇','🙂','😉','😍','😘','😜','🤔','👍','👎','👏','🙏','💪','🔥','🎉','❤️','✨','📞','💬','💼','💰','💵','📅','⏰','❌'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (emoji === '❌') {
                        setShowEmojiPicker(false);
                      } else {
                        setWaMessage(prev => prev + emoji);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-colors cursor-pointer active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Composer Footer (WhatsApp Web style) */}
            <div className="px-4 py-2.5 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-2.5 shrink-0 select-none relative">
              <div className="flex items-center text-[#54656f] shrink-0">
                {/* Emoji Indicator */}
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${showEmojiPicker ? 'bg-slate-200 text-[#008069]' : 'hover:bg-slate-200/60'}`}
                  title="Emoji निवडा"
                >
                  <Smile size={20} />
                </button>
                {/* Attachment Indicator */}
                {isFileUploading ? (
                  <Loader2 className="animate-spin text-primary p-1 shrink-0" size={18} />
                ) : (
                  <label className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer relative flex items-center justify-center shrink-0">
                    <Paperclip size={18} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      disabled={isSendingWA}
                    />
                  </label>
                )}
              </div>

              {/* Text Area Input */}
              <textarea 
                className="flex-1 bg-white border border-[#e9edef] rounded-2xl px-4 py-2 text-xs outline-none shadow-[0_1px_1.5px_rgba(0,0,0,0.06)] min-h-[36px] max-h-[100px] leading-relaxed resize-none text-[#111b21] placeholder-[#667781] focus:ring-1 focus:ring-[#008069]/30 transition-all"
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="मेसेज टाईप करा..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendWhatsAppMessage();
                  }
                }}
                disabled={isSendingWA}
              />

              {/* Circular WhatsApp Green Send Button */}
              <button 
                disabled={isSendingWA || !waMessage.trim()}
                onClick={sendWhatsAppMessage}
                className="w-9 h-9 bg-[#00a884] disabled:bg-slate-350 text-white rounded-full flex items-center justify-center hover:bg-[#008f72] transition-colors active:scale-95 shrink-0 shadow-sm disabled:opacity-40"
                title="मेसेज पाठवा"
              >
                {isSendingWA ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Mapping Bottom Sheet */}
      {showMappingModal && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isUploading && setShowMappingModal(false)} 
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[85vh] md:max-h-[80vh]">
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

      {/* WhatsApp Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => !isSendingBroadcast && setShowBroadcastModal(false)} 
          />
          <div className="w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[85vh] md:max-h-[80vh]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
            <div className="px-6 pb-4 border-b border-slate-50 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <Megaphone size={18} className="text-primary animate-pulse" />
                  WhatsApp ब्रॉडकास्ट
                </h3>
                <p className="text-slate-500 font-semibold text-[10px]">
                  फिल्टर केलेल्या {filteredLeads.length} ग्राहकांना संदेश पाठवा.
                </p>
              </div>
              <button 
                disabled={isSendingBroadcast} 
                onClick={() => setShowBroadcastModal(false)} 
                className="p-1 text-slate-400 hover:bg-slate-50 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Target List Preview */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  ग्राहकांची यादी ({filteredLeads.length} जण)
                </label>
                <div className="border border-slate-100 rounded-2xl p-3 max-h-24 overflow-y-auto bg-slate-50 flex flex-wrap gap-1.5">
                  {filteredLeads.map(l => (
                    <span key={l.id} className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold">
                      {(l as any).panName || (l as any).fullName || l.name || 'ग्राहक'}
                    </span>
                  ))}
                  {filteredLeads.length === 0 && (
                    <span className="text-[10px] text-slate-400 font-bold">फिल्टरमध्ये कोणताही ग्राहक आढळला नाही.</span>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  ब्रॉडकास्ट मेसेज (Custom Message)
                </label>
                <textarea 
                  placeholder="ग्राहकांसाठी तुमचा मेसेज येथे लिहा..."
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-primary transition-all h-32 outline-none resize-none leading-relaxed text-[#111b21]"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  disabled={isSendingBroadcast}
                />
              </div>

              {/* Dynamic Variables Tip */}
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-3 text-[9px] text-blue-800 font-bold leading-relaxed">
                👉 तुम्ही मेसेजमध्ये <code className="bg-blue-100 px-1 py-0.5 rounded text-[8px] font-mono">{"{name}"}</code> हा व्हेरिएबल वापरू शकता, तो प्रत्येक ग्राहकाच्या नावाने आपोआब बदलला जाईल.
              </div>

              {/* Progress Panel */}
              {broadcastProgress && (
                <div className="space-y-2 bg-slate-50 p-4 border border-slate-100 rounded-2xl animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <span>प्रगती (Progress)</span>
                    <span>{broadcastProgress.sent} / {broadcastProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${(broadcastProgress.sent / broadcastProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold truncate">{broadcastProgress.statusText}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-50 bg-white shrink-0">
              <div className="flex gap-3">
                <button 
                  disabled={isSendingBroadcast}
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  रद्द करा
                </button>
                <button 
                  disabled={isSendingBroadcast || filteredLeads.length === 0 || !broadcastMessage.trim()}
                  onClick={handleSendBroadcast}
                  className="flex-[2] h-12 bg-primary text-white rounded-xl font-black uppercase text-[10px] shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSendingBroadcast ? <Loader2 className="animate-spin animate-infinite" size={14} /> : <Megaphone size={14} />}
                  {isSendingBroadcast ? 'मेसेज पाठवत आहे...' : 'ब्रॉडकास्ट सुरू करा'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Quick Follow-up Popup Prompt */}
      {showFollowUpPrompt && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFollowUpPrompt(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <Clock size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-secondary uppercase tracking-wider">Follow-up / Remark नोंदा</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">कस्टमरला केलेल्या {promptType === 'Call' ? 'कॉल' : 'WhatsApp'} बाबत माहिती लिहा</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">रिमार्क (Remark) / चर्चा</label>
                <textarea
                  placeholder="उदा. ग्राहक उद्या बोलण्यास सांगितले, डॉक्युमेंट्स पाठवणार आहे, इ."
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-rose-350 focus:bg-white rounded-2xl p-4 text-xs font-bold shadow-sm transition-all focus:outline-none min-h-[100px]"
                  value={followUpRemarkText}
                  onChange={(e) => setFollowUpRemarkText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFollowUpPrompt(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  disabled={isSavingPromptFollowUp || !followUpRemarkText.trim()}
                  onClick={handleSavePromptFollowUp}
                  className="flex-[2] py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingPromptFollowUp ? "सेव्ह होत आहे..." : "रिमार्क सेव्ह करा"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
