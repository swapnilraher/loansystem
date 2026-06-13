"use client"

import React, { useState, useEffect } from "react"
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Filter,
  MessageSquare,
  Zap,
  PhoneCall,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Phone
} from "lucide-react"
import { useUsers } from "@/lib/hooks/useUsers"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

import { useLeads } from "@/lib/hooks/useLeads"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export default function AdminDashboard() {
  const { user, profile, adminRole } = useAuth()
  const { leads, loading } = useLeads()
  const { users: adminUsers } = useUsers()
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const q = query(collection(db, "lead_activities"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  const stats = [
    { name: 'New Leads Today', value: leads.filter(l => l.status === 'New Lead' || l.status === 'New').length.toString(), change: '+12.5%', trend: 'up', icon: Users, color: 'blue' },
    { name: 'Disbursed Cases', value: leads.filter(l => l.status === 'Disbursed' || l.status === 'Converted').length.toString(), change: '+18.2%', trend: 'up', icon: ShieldCheck, color: 'emerald' },
    { name: 'Total Revenue', value: '₹42.5L', change: '+8.1%', trend: 'up', icon: DollarSign, color: 'indigo' },
    { name: 'Follow-ups Due', value: leads.filter(l => l.status === 'Documents Pending' || l.status === 'Under Process').length.toString(), change: '8 Overdue', trend: 'down', icon: Clock, color: 'amber' },
  ]

  const chartData = [
    { name: 'Jan', revenue: 4000, leads: 2400 },
    { name: 'Feb', revenue: 3000, leads: 1398 },
    { name: 'Mar', revenue: 2000, leads: 9800 },
    { name: 'Apr', revenue: 2780, leads: 3908 },
    { name: 'May', revenue: 1890, leads: 4800 },
    { name: 'Jun', revenue: 2390, leads: 3800 },
    { name: 'Jul', revenue: 3490, leads: 4300 },
  ]

  const loanTypeData = [
    { name: 'Home', value: leads.filter(l => l.type === 'Home Loan').length || 1 },
    { name: 'Personal', value: leads.filter(l => l.type === 'Personal Loan').length || 1 },
    { name: 'Car', value: leads.filter(l => l.type === 'Car Loan').length || 1 },
    { name: 'Business', value: leads.filter(l => l.type === 'Business Loan').length || 1 },
  ]
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 font-medium">Welcome back, {profile?.name || user?.displayName || user?.email || "Alex"}. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={18} />
            <span>Last 30 Days</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Filter size={18} />
            <span>Filter Reports</span>
          </button>
          <a
            href="https://analytics.google.com/analytics/web/#/p538052670/reports/intelligenthome"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-md shadow-black/10"
          >
            <ArrowUpRight size={18} />
            <span>Google Analytics</span>
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-1">{stat.name}</p>
              <h3 className="text-2xl font-black text-secondary">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-secondary">Revenue & Lead Trends</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance over time</p>
            </div>
            <select className="bg-slate-50 border-none text-xs font-bold text-slate-600 rounded-lg px-3 py-2 outline-none cursor-pointer">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Yearly</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-secondary">Recent Leads</h3>
            <button className="text-primary text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {leads.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 text-center py-10">No recent leads found.</p>
            ) : leads.slice(0, 5).map((lead, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                  <Briefcase size={20} className="text-slate-400 group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-secondary text-sm truncate">{lead.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{lead.type} • {lead.amount}</p>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-black px-2 py-1 rounded-lg inline-block uppercase tracking-wider ${
                    lead.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                    lead.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {lead.status}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Distribution and Employee Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-secondary mb-8">Loan Type Distribution</h3>
          <div className="w-full">
             <ResponsiveContainer width="100%" aspect={2}>
              <BarChart data={loanTypeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {
                    loanTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
          <div>
            <h3 className="text-xl font-black mb-1 relative z-10">Team Performance</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 relative z-10">Real-time Staff Productivity</p>
            <div className="space-y-4 relative z-10 max-h-[320px] overflow-y-auto custom-scrollbar">
              {adminUsers.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-10">No team members registered yet.</p>
              ) : adminUsers.map((member, i) => {
                const callsCount = activities.filter(a => a.type === 'Call' && (a.userName || '').includes(member.name)).length
                const updatesCount = activities.filter(a => a.type === 'Status Update' && (a.userName || '').includes(member.name)).length
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs uppercase text-slate-300">
                        {member.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">{member.name}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div title="Calls placed">
                        <p className="font-black text-xs text-blue-400">{callsCount}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Calls</p>
                      </div>
                      <div title="Lead updates">
                        <p className="font-black text-xs text-amber-400">{updatesCount}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Updates</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {adminRole === "Super Admin" && (
            <a 
              href="/admin/users" 
              className="w-full text-center mt-6 py-4 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 block"
            >
              Manage Team Members
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
