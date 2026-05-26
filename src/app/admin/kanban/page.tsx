"use client"

import React, { useState } from "react"
import { useLeads, logLeadActivity } from "@/lib/hooks/useLeads"
import { 
  Plus, 
  MoreHorizontal, 
  Clock, 
  Phone, 
  Mail, 
  Search, 
  Filter,
  Loader2,
  Calendar,
  IndianRupee,
  LayoutGrid,
  Columns
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"

const KANBAN_STATUSES = [
  'New',
  'In Progress',
  'Verified',
  'Approved',
  'Converted',
  'Rejected'
]

const statusColors: any = {
  'New': 'bg-blue-600',
  'In Progress': 'bg-amber-600',
  'Verified': 'bg-purple-600',
  'Approved': 'bg-emerald-600',
  'Converted': 'bg-green-700',
  'Rejected': 'bg-rose-600',
}

export default function KanbanPage() {
  const { user, profile, adminRole } = useAuth()
  const { leads, loading } = useLeads()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLeads = leads.filter(l => 
    (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.phone || "").includes(searchTerm)
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const leadId = e.dataTransfer.getData("leadId")
    if (!leadId) return

    const staffDetail = `${profile?.name || user?.displayName || user?.email || "Unknown"} (${adminRole || 'Staff'})`
    try {
      const leadRef = doc(db, 'leads', leadId)
      await updateDoc(leadRef, { status: newStatus, updatedAt: serverTimestamp() })
      await logLeadActivity(leadId, 'Status Update', `Changed status to ${newStatus} via Kanban`, staffDetail)
    } catch (error) {
      console.error("Error updating lead status:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId)
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Leads Pipeline</h2>
          <p className="text-slate-500 font-medium">Drag and drop leads to move them through stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Quick find..." 
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="text-primary animate-spin" size={40} />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Pipeline...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
          <div className="flex gap-6 h-full min-w-max">
            {KANBAN_STATUSES.map((status) => (
              <div 
                key={status} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="w-80 flex flex-col bg-slate-50/50 rounded-[2rem] border border-slate-100/50 p-4"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                    <h3 className="font-black text-secondary uppercase tracking-widest text-xs">{status}</h3>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400">
                      {filteredLeads.filter(l => l.status === status).length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-secondary">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-1 custom-scrollbar">
                  {filteredLeads.filter(l => l.status === status).map((lead) => (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">
                          {lead.type || 'Inquiry'}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-secondary transition-opacity">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      
                      <h4 className="font-bold text-secondary text-sm mb-1">{lead.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-4 italic">
                        <IndianRupee size={10} /> {parseInt(lead.amount || "0").toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                            {lead.name[0]}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone size={14} className="hover:text-blue-500 cursor-pointer" />
                          <Mail size={14} className="hover:text-emerald-500 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
