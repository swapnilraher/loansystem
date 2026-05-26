"use client"

import React from "react"
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Eye, 
  Edit2, 
  Plus, 
  Check,
  X,
  UserCheck,
  Briefcase,
  Key,
  Shield
} from "lucide-react"

const roles = [
  { name: "Super Admin", employees: 2, access: "Full System", level: "L1" },
  { name: "Sales Manager", employees: 5, access: "Lead Mgmt, Reports", level: "L2" },
  { name: "Agent", employees: 24, access: "Lead View, WhatsApp", level: "L3" },
  { name: "Accountant", employees: 3, access: "Revenue, Reports", level: "L2" },
]

const modules = [
  { name: "Lead Management", admin: true, manager: true, agent: true, accountant: false },
  { name: "Revenue Stats", admin: true, manager: true, agent: false, accountant: true },
  { name: "User Management", admin: true, manager: false, agent: false, accountant: false },
  { name: "Integrations", admin: true, manager: false, agent: false, accountant: false },
  { name: "Export Reports", admin: true, manager: true, agent: false, accountant: true },
  { name: "Call Recording", admin: true, manager: true, agent: false, accountant: false },
]

export default function PermissionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Roles & Permissions</h2>
          <p className="text-slate-500 font-medium">Define access levels and manage employee permissions.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus size={18} />
          <span>Create New Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {roles.map((role, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                <Shield size={24} />
              </div>
              <h3 className="font-black text-secondary text-lg mb-1">{role.name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mb-6">{role.employees} Employees • {role.level}</p>
              
              <div className="space-y-3 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Access</p>
                <p className="text-xs font-bold text-slate-600">{role.access}</p>
              </div>

              <button className="w-full py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-primary hover:bg-primary hover:text-white transition-all">
                Edit Permissions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-secondary">Module Access Matrix</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Granular control per role</p>
          </div>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all">
            Update All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Super Admin</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sales Manager</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Agent</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map((module, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Key size={16} />
                      </div>
                      <span className="font-bold text-secondary text-sm">{module.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center">
                      {module.admin ? <Check className="text-emerald-500" size={20} /> : <X className="text-rose-300" size={20} />}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center">
                      {module.manager ? <Check className="text-emerald-500" size={20} /> : <X className="text-rose-300" size={20} />}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center">
                      {module.agent ? <Check className="text-emerald-500" size={20} /> : <X className="text-rose-300" size={20} />}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center">
                      {module.accountant ? <Check className="text-emerald-500" size={20} /> : <X className="text-rose-300" size={20} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
          <div className="relative z-10 flex items-start gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center border border-white/10">
              <UserCheck size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2">2FA Enforcement</h3>
              <p className="text-indigo-200 text-sm leading-relaxed mb-6">Mandatory Two-Factor Authentication for all Admin and Manager level accounts to ensure data security.</p>
              <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all shadow-lg">
                Manage Security Protocols
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-start gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center border border-blue-100">
            <Lock size={32} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-secondary mb-2">IP Whitelisting</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">Restrict admin access to specific office IP addresses to prevent unauthorized remote access.</p>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">Active: 122.161.x.x</span>
              <button className="text-xs font-black text-primary hover:underline">Add New IP</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
