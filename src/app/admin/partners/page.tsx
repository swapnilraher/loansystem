"use client"

import React, { useState, useMemo } from "react"
import { 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2,
  X,
  UserCircle,
  Briefcase,
  CreditCard,
  Banknote,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { usePartners, Partner } from "@/lib/hooks/usePartners"
import { useLeads } from "@/lib/hooks/useLeads"
import { useAuth } from "@/context/AuthContext"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function PartnersPage() {
  const { adminRole } = useAuth()
  const { partners, loading: partnersLoading } = usePartners()
  const { leads, loading: leadsLoading } = useLeads()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [sortBy, setSortBy] = useState("Newest First")
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'leads'>('overview')

  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const pName = partner.kycData?.name || partner.panData?.name || ""
      const dsaCode = partner.dsaCode || ""
      const phone = partner.mobileNumber || ""

      const matchesSearch = 
        pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dsaCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm)
      
      const matchesType = typeFilter === "All Types" || partner.businessType === typeFilter
      const matchesStatus = statusFilter === "All Statuses" || (partner.dsaStatus || "Active") === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })

    // Sort logic
    result.sort((a, b) => {
      const nameA = (a.kycData?.name || a.panData?.name || "").toLowerCase();
      const nameB = (b.kycData?.name || b.panData?.name || "").toLowerCase();
      const leadsA = leads.filter(l => l.partnerId === a.id).length;
      const leadsB = leads.filter(l => l.partnerId === b.id).length;

      if (sortBy === "Name A-Z") return nameA.localeCompare(nameB);
      if (sortBy === "Name Z-A") return nameB.localeCompare(nameA);
      if (sortBy === "Most Leads") return leadsB - leadsA;
      // Default Newest
      return 0;
    });

    return result;
  }, [partners, searchTerm, typeFilter, statusFilter, sortBy, leads])

  // Get leads for the selected partner
  const partnerLeads = useMemo(() => {
    if (!selectedPartner) return []
    return leads.filter(l => l.partnerId === selectedPartner.id)
  }, [leads, selectedPartner])

  const handleUpdateStatus = async (partnerId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "users", partnerId), {
        dsaStatus: newStatus,
        updatedAt: new Date()
      })
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner({...selectedPartner, dsaStatus: newStatus})
      }
    } catch (err) {
      console.error("Error updating status:", err)
      alert("Failed to update status")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">DSA Network</h2>
          <p className="text-slate-500 font-medium tracking-tight">Manage your registered <span className="text-primary font-black">{partners.length}</span> channel partners.</p>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-3">
            <Building2 size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Partners</p>
          <h3 className="text-2xl font-black text-secondary">{partners.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active DSA</p>
          <h3 className="text-2xl font-black text-secondary">{partners.filter(p => p.dsaStatus === 'Active').length}</h3>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-3">
            <ShieldCheck size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">KYC Verified</p>
          <h3 className="text-2xl font-black text-secondary">{partners.filter(p => p.kycVerified).length}</h3>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3">
            <Briefcase size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Leads Sourced</p>
          <h3 className="text-2xl font-black text-secondary">{leads.filter(l => l.category === 'Partner').length}</h3>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Name, DSA Code, Phone..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-all min-w-[150px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>All Types</option>
            <option>Individual</option>
            <option>Proprietorship</option>
            <option>Company</option>
          </select>
          <select 
            className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-all min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Statuses</option>
            <option>Active</option>
            <option>Blocked</option>
            <option>Pending</option>
          </select>
          <select 
            className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-50 transition-all min-w-[150px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option>Newest First</option>
            <option>Name A-Z</option>
            <option>Name Z-A</option>
            <option>Most Leads</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        {partnersLoading ? (
          <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading partners...</div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-20 text-center">
            <Search size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-bold">No registered partners found.</p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Profile</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">DSA Code & Type</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / KYC</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads (Total/Disb)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPartners.map((partner) => {
                    const partnerName = partner.kycData?.name || partner.panData?.name || "Unknown Partner"
                    const partnerTotalLeads = leads.filter(l => l.partnerId === partner.id).length
                    const partnerDisbursedLeads = leads.filter(l => l.partnerId === partner.id && l.status === "Disbursed").length
                    
                    return (
                      <tr key={partner.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl border border-slate-200/50 flex items-center justify-center font-black text-secondary overflow-hidden bg-slate-50 shrink-0">
                              {partner.kycData?.photoBase64 ? (
                                <img src={`data:image/jpeg;base64,${partner.kycData.photoBase64}`} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span>{partnerName.substring(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-secondary text-sm">{partnerName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Phone size={10} /> {partner.mobileNumber}
                                </p>
                                <span className="text-[9px] text-slate-300 font-bold">•</span>
                                <span className="text-[9px] text-slate-400 font-bold">
                                  Joined {partner.createdAt?.toDate ? partner.createdAt.toDate().toLocaleDateString('en-GB') : (typeof partner.createdAt === 'string' ? new Date(partner.createdAt).toLocaleDateString('en-GB') : 'NA')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest w-max">
                              {partner.dsaCode || "NO CODE"}
                            </span>
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              <Briefcase size={12} /> {partner.businessType || "Individual"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-2">
                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${partner.dsaStatus === 'Blocked' ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {partner.dsaStatus === 'Blocked' ? <XCircle size={14} /> : <CheckCircle2 size={14} />} 
                              {partner.dsaStatus || "Active"}
                            </span>
                            <div className="flex gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${partner.kycVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>eKYC</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${partner.panVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>PAN</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-11 h-11 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                              <span className="font-black text-secondary leading-none">{partnerTotalLeads}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center w-11 h-11 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                              <span className="text-[7px] font-black text-emerald-600/60 uppercase tracking-widest">Disb</span>
                              <span className="font-black text-emerald-600 leading-none">{partnerDisbursedLeads}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedPartner(partner)}
                              className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            {adminRole === 'Super Admin' && (
                              <button className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all" title="Delete/Block Partner">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredPartners.map((partner) => {
                const partnerName = partner.kycData?.name || partner.panData?.name || "Unknown Partner"
                const partnerTotalLeads = leads.filter(l => l.partnerId === partner.id).length
                const partnerDisbursedLeads = leads.filter(l => l.partnerId === partner.id && l.status === "Disbursed").length
                
                return (
                  <div key={partner.id} className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl border border-slate-200/50 flex items-center justify-center font-black text-secondary overflow-hidden bg-slate-50 shrink-0">
                        {partner.kycData?.photoBase64 ? (
                          <img src={`data:image/jpeg;base64,${partner.kycData.photoBase64}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{partnerName.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-secondary text-sm truncate">{partnerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {partner.mobileNumber}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DSA Code & Type</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-black uppercase">
                            {partner.dsaCode || "NO CODE"}
                          </span>
                          <span className="text-slate-500 font-bold flex items-center gap-0.5">
                            <Briefcase size={10} /> {partner.businessType || "Individual"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KYC Status</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${partner.kycVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>eKYC</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${partner.panVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>PAN</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leads</p>
                          <p className="font-black text-secondary text-xs">{partnerTotalLeads} <span className="text-[9px] font-bold text-slate-400">Total</span></p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-emerald-650 uppercase tracking-widest">Disbursed</p>
                          <p className="font-black text-emerald-600 text-xs">{partnerDisbursedLeads} <span className="text-[9px] font-bold text-emerald-600/60">Cases</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedPartner(partner)}
                          className="px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Details
                        </button>
                        {adminRole === 'Super Admin' && (
                          <button className="p-2 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Slide-over Drawer for Partner Details */}
      {selectedPartner && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={() => setSelectedPartner(null)} />
          <div className="w-full max-w-xl bg-white h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Drawer Header */}
            <div className="p-5 md:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[2rem] bg-white border border-slate-200 text-secondary flex items-center justify-center font-black text-2xl uppercase shadow-sm overflow-hidden">
                  {selectedPartner.kycData?.photoBase64 ? (
                    <img src={`data:image/jpeg;base64,${selectedPartner.kycData.photoBase64}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (selectedPartner.kycData?.name || selectedPartner.panData?.name || "Partner")[0]
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-secondary tracking-tight">
                    {selectedPartner.kycData?.name || selectedPartner.panData?.name || "Partner"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-primary/10 text-primary border-primary/20">
                      {selectedPartner.dsaCode || 'NO CODE'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <select 
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer ${selectedPartner.dsaStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}
                      value={selectedPartner.dsaStatus || "Active"}
                      onChange={(e) => handleUpdateStatus(selectedPartner.id, e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Temp Blocked">Temp Blocked</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Briefcase size={12} /> {selectedPartner.businessType}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-50">
              {[
                { id: 'overview', label: 'KYC & Bank', icon: ShieldCheck },
                { id: 'leads', label: `Leads (${partnerLeads.length})`, icon: Briefcase },
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-10">
                  {/* Basic Info */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Details</h4>
                    <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <Phone size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mobile Number</p>
                          <p className="font-black text-secondary text-sm">{selectedPartner.mobileNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Joined Date</p>
                          <p className="font-black text-secondary text-sm">
                            {selectedPartner.createdAt?.toDate ? selectedPartner.createdAt.toDate().toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* KYC Verification */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verification Data</h4>
                    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <CreditCard className="text-indigo-500" size={24} />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">PAN Match</p>
                            <p className="font-black text-secondary tracking-widest">{selectedPartner.panData?.panNumber || "N/A"}</p>
                          </div>
                        </div>
                        {selectedPartner.panVerified && <CheckCircle2 className="text-emerald-500" size={20} />}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="text-emerald-500" size={24} />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Aadhaar eKYC</p>
                          </div>
                          {selectedPartner.kycVerified && <CheckCircle2 className="text-emerald-500" size={20} />}
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DOB</p>
                            <p className="font-bold text-secondary text-xs">{selectedPartner.kycData?.dob || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                            <p className="font-medium text-secondary text-xs leading-relaxed">
                              {typeof selectedPartner.kycData?.address === 'object' && selectedPartner.kycData?.address !== null
                                ? [selectedPartner.kycData.address.house, selectedPartner.kycData.address.street, selectedPartner.kycData.address.landmark, selectedPartner.kycData.address.vtc, selectedPartner.kycData.address.district, selectedPartner.kycData.address.state, selectedPartner.kycData.address.pincode].filter(Boolean).join(', ')
                                : selectedPartner.kycData?.address || "N/A"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Bank Details */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payout Bank Account</h4>
                    {selectedPartner.bankDetails ? (
                      <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 relative overflow-hidden">
                        <Banknote className="absolute right-[-20px] bottom-[-20px] text-emerald-500/10 w-40 h-40" />
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-600 font-black mb-2">
                            <CheckCircle2 size={20} /> Penny Drop Verified
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Name at Bank</p>
                            <p className="font-black text-secondary">{selectedPartner.bankDetails.nameAtBank}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Bank & IFSC</p>
                              <p className="font-bold text-secondary text-sm">{selectedPartner.bankDetails.bankName} <br/><span className="text-xs text-slate-500">{selectedPartner.bankDetails.ifsc}</span></p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Account Number</p>
                              <p className="font-black text-secondary tracking-widest">{selectedPartner.bankDetails.accountNumber}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border border-amber-100">
                        <AlertCircle size={16} /> No bank account verified yet.
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'leads' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 pb-10">
                  {partnerLeads.length === 0 ? (
                    <div className="text-center p-10 bg-slate-50 rounded-3xl border border-slate-100">
                      <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">No leads submitted yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {partnerLeads.map(lead => (
                        <div key={lead.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-black text-secondary text-sm">{lead.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lead.type} • ₹ {lead.amount}</p>
                            </div>
                            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600">
                              {lead.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                              <Phone size={10} /> {lead.phone || lead.mobile}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                              {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
