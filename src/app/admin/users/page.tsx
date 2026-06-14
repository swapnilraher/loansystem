"use client"

import React, { useState, useEffect } from "react"
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  Shield,
  Trash2,
  Edit,
  UserCheck,
  X,
  ShieldCheck,
  Briefcase,
  Loader2,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from "lucide-react"
import { useUsers, AdminUser } from "@/lib/hooks/useUsers"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"

const roleColors: any = {
  'Super Admin': 'bg-rose-50 text-rose-600 border-rose-100',
  'Admin': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Manager': 'bg-purple-50 text-purple-600 border-purple-100',
  'Assistant Telecaller': 'bg-blue-50 text-blue-600 border-blue-100',
}

const statusColors: any = {
  'Active': 'bg-emerald-500',
  'Away': 'bg-amber-500',
  'Offline': 'bg-slate-300',
  'Inactive': 'bg-rose-500',
}

export default function UsersPage() {
  const { user, adminRole } = useAuth()
  const { users: adminUsers, loading: adminsLoading } = useUsers()
  const [portalUsers, setPortalUsers] = useState<any[]>([])
  const [portalLoading, setPortalLoading] = useState(true)
  const [viewTab, setViewTab] = useState<"admins" | "portal">("portal")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [selectedPortalUser, setSelectedPortalUser] = useState<any | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  
  // Form State for Admin Users
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Assistant Telecaller",
    designation: "",
    status: "Active" as const,
    password: "",
  })

  // Fetch Portal Users
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPortalUsers(usersData);
      setPortalLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch activities to compute stats
  useEffect(() => {
    const q = query(collection(db, "lead_activities"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  // Safeguard: Redirect if not Super Admin and trying to view admin tab
  useEffect(() => {
    if (viewTab === "admins" && adminRole !== "Super Admin") {
      setViewTab("portal")
    }
  }, [adminRole, viewTab])

  const filteredAdminUsers = adminUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPortalUsers = portalUsers.filter(user => 
    (user.panName || user.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.mobile || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenAddModal = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "Assistant Telecaller",
      designation: "",
      status: "Active",
      password: "Techstar@123",
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      designation: user.designation || "",
      status: user.status,
      password: (user as any).password || "",
    })
    setIsModalOpen(true)
  }

  const handleDeleteAdmin = async (userId: string) => {
    const userToDelete = adminUsers.find(u => u.id === userId);
    if (userToDelete?.email === "swapnil.r.aher@gmail.com") {
      alert("Action Denied: You cannot remove the primary Super Admin.");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this team member?")) return
    try {
      await deleteDoc(doc(db, 'admin_users', userId))
      alert("Team member removed successfully.")
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error deleting user.")
    }
  }

  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        if (editingUser.email === "swapnil.r.aher@gmail.com" && formData.role !== "Super Admin") {
          alert("Action Denied: You cannot change the role of the primary Super Admin.");
          return;
        }
        const userRef = doc(db, 'admin_users', editingUser.id)
        await updateDoc(userRef, {
          ...formData,
          updatedAt: serverTimestamp()
        })
      } else {
        await addDoc(collection(db, 'admin_users'), {
          ...formData,
          permissions: ["read:leads", "update:leads"],
          joinedAt: serverTimestamp(),
          lastLogin: "Never"
        })

        // Send WhatsApp Welcome Message
        try {
          await fetch('/api/admin/welcome-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone: formData.phone,
              name: formData.name,
              email: formData.email,
              password: formData.password,
              role: formData.role
            })
          });
        } catch(e) {
          console.error("Failed to send welcome msg:", e);
        }
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Error saving user data.")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">User Management</h2>
          <p className="text-slate-500 font-medium">Manage both portal users and your internal team.</p>
        </div>
        <div className="flex items-center gap-3">
          {viewTab === "admins" && (
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus size={18} />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-100/50 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setViewTab("portal")}
          className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${viewTab === "portal" ? "bg-white text-secondary shadow-sm border border-slate-100" : "text-slate-400 hover:text-secondary"}`}
        >
          Portal Users
        </button>
        {adminRole === "Super Admin" && (
          <button 
            onClick={() => setViewTab("admins")}
            className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${viewTab === "admins" ? "bg-white text-secondary shadow-sm border border-slate-100" : "text-slate-400 hover:text-secondary"}`}
          >
            Admin Team
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={`Search ${viewTab === "portal" ? "portal users" : "team members"}...`} 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {viewTab === "portal" ? (
        portalLoading ? (
          <div className="py-20 flex flex-col items-center gap-3"><Loader2 className="text-primary animate-spin" size={40} /><p className="text-sm font-bold text-slate-400">Loading portal users...</p></div>
        ) : filteredPortalUsers.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100"><UsersIcon size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-500 font-bold">No users found.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPortalUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 shadow-sm uppercase">
                      {(user.panName || user.displayName || "U").substring(0, 2)}
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                      Customer
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-secondary mb-1">{user.panName || user.displayName || "Unknown User"}</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">{user.city || "City not set"}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-xs font-bold truncate">{user.email || "No email"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-xs font-bold">{user.mobile || "No mobile"}</span>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 size={14} className={user.docs ? "text-green-500" : ""} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {user.docs ? Object.keys(user.docs).length : 0} Docs Uploaded
                    </span>
                  </div>
                  <button 
                    onClick={() => { setSelectedPortalUser(user); setIsDetailModalOpen(true); }}
                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                  >
                    View Details <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        adminsLoading ? (
          <div className="py-20 flex flex-col items-center gap-3"><Loader2 className="text-primary animate-spin" size={40} /><p className="text-sm font-bold text-slate-400">Loading team members...</p></div>
        ) : filteredAdminUsers.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100"><Shield size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-500 font-bold">No team members found.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAdminUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-xl border border-slate-200 shadow-sm uppercase">
                      {user.name.substring(0, 2)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColors[user.status]}`} />
                  </div>

                  <h3 className="text-xl font-black text-secondary mb-1">{user.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleColors[user.role] || 'bg-slate-50 text-slate-500'}`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-xs font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-xs font-bold">{user.phone}</span>
                    </div>
                    
                    {/* Staff Progress Stats */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1.5" title="Calls logged by this member">
                        <Phone size={12} className="text-primary" />
                        <span>Calls: {activities.filter(a => a.type === 'Call' && (a.userName || '').includes(user.name)).length}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Lead updates by this member">
                        <Clock size={12} className="text-amber-500" />
                        <span>Updates: {activities.filter(a => a.type === 'Status Update' && (a.userName || '').includes(user.name)).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                  <button onClick={() => handleOpenEditModal(user)} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Edit Member"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteAdmin(user.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Remove Member"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* User Detail Modal (For Portal Users) */}
      {isDetailModalOpen && selectedPortalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col">
            <div className="p-4 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-black italic">TS</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-secondary tracking-tight">{selectedPortalUser.panName || selectedPortalUser.displayName}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portal Customer Details</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 lg:p-12 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Profile Section */}
                <div className="space-y-6 md:space-y-8">
                  <h4 className="text-lg font-black flex items-center gap-2"><UserCheck className="text-primary" size={20} /> Personal Profile</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {[
                      { label: "PAN Name", value: selectedPortalUser.panName || "Not Set" },
                      { label: "PAN Number", value: selectedPortalUser.panNumber || "Not Set" },
                      { label: "Email", value: selectedPortalUser.email || "Not Set" },
                      { label: "Phone", value: selectedPortalUser.mobile || "Not Set" },
                      { label: "City", value: selectedPortalUser.city || "Not Set" },
                      { label: "Created At", value: selectedPortalUser.createdAt ? (new Date(selectedPortalUser.createdAt)).toLocaleDateString() : "Unknown" },
                    ].map((item, i) => (
                      <div key={i} className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="font-bold text-secondary text-sm break-all">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-6 md:space-y-8">
                  <h4 className="text-lg font-black flex items-center gap-2"><FileText className="text-primary" size={20} /> Uploaded Documents</h4>
                  <div className="space-y-4">
                    {!selectedPortalUser.docs || Object.keys(selectedPortalUser.docs).length === 0 ? (
                      <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-400 italic">No documents uploaded yet.</p>
                      </div>
                    ) : (
                      Object.entries(selectedPortalUser.docs).map(([name, status]) => (
                        <div key={name} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 group hover:border-primary transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><FileText size={18} /></div>
                            <span className="font-bold text-sm">{name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2 py-1 rounded-lg">Available</span>
                            <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"><ArrowUpRight size={16} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/30">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close View</Button>
              <Button className="bg-primary text-white">Approve Profile</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-secondary tracking-tight">{editingUser ? 'Edit Team Member' : 'Add Team Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmitAdmin} className="p-8 space-y-4 overflow-y-auto overscroll-contain max-h-[80vh] custom-scrollbar">
              <div className="space-y-1.5"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label><input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" placeholder="Enter name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label><input type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label><input type="text" required pattern="[0-9]{10}" title="Please enter exactly 10 digits" maxLength={10} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} placeholder="10 digit mobile" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Assistant Telecaller">Assistant Telecaller</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">Active</option>
                    <option value="Away">Away</option>
                    <option value="Offline">Offline</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" 
                  placeholder="e.g., Senior Loan Consultant" 
                  value={formData.designation} 
                  onChange={(e) => setFormData({...formData, designation: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">System Password</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" 
                  placeholder="Set login password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 mt-6 uppercase tracking-widest text-xs">{editingUser ? 'Update Member' : 'Create Member'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
