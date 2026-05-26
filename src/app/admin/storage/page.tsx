"use client"

import React, { useState, useEffect } from "react"
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  MoreVertical, 
  Search, 
  HardDrive, 
  Cloud, 
  Clock, 
  ShieldCheck,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video,
  FileArchive
} from "lucide-react"
import { storage, db } from "@/lib/firebase"
import { ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage"

export default function StoragePage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const storageRef = ref(storage, 'documents/')
      const res = await listAll(storageRef)
      const fileData = await Promise.all(
        res.items.map(async (item) => {
          const url = await getDownloadURL(item)
          return {
            name: item.name,
            fullPath: item.fullPath,
            url: url,
            type: item.name.split('.').pop()
          }
        })
      )
      setFiles(fileData)
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const file = e.target.files[0]
    const storageRef = ref(storage, `documents/${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setUploading(true)
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setProgress(progress)
      }, 
      (error) => {
        console.error("Upload error:", error)
        setUploading(false)
      }, 
      () => {
        setUploading(false)
        setProgress(0)
        fetchFiles()
      }
    )
  }

  const handleDelete = async (fileName: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    try {
      const storageRef = ref(storage, `documents/${fileName}`)
      await deleteObject(storageRef)
      fetchFiles()
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Cloud Storage</h2>
          <p className="text-slate-500 font-medium">Manage user documents, KYCs, and official reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
            <Upload size={18} />
            <span>{uploading ? `Uploading ${Math.round(progress)}%` : 'Upload New File'}</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <HardDrive size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Storage</p>
            <h3 className="text-xl font-black text-secondary">5.0 GB / 10.0 GB</h3>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="w-1/2 h-full bg-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Cloud size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cloud Provider</p>
            <h3 className="text-xl font-black text-secondary">Firebase Storage</h3>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
              <ShieldCheck size={12} /> Active & Secure
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Backup</p>
            <h3 className="text-xl font-black text-secondary">Today, 04:30 AM</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Automated</p>
          </div>
        </div>
      </div>

      {/* File Explorer */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Folder className="text-primary" size={20} />
            <span className="text-sm font-black text-secondary">/ documents /</span>
          </div>
          <div className="relative group min-w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-sm font-bold text-slate-400">Loading your cloud files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-3">
              <Folder className="text-slate-200" size={60} />
              <p className="text-sm font-bold text-slate-400">No files found in this directory.</p>
            </div>
          ) : files.map((file, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  {file.type === 'pdf' && <FileText size={20} />}
                  {(file.type === 'jpg' || file.type === 'png' || file.type === 'jpeg') && <ImageIcon size={20} />}
                  {(file.type === 'mp4' || file.type === 'mov') && <Video size={20} />}
                  {(file.type === 'zip' || file.type === 'rar') && <FileArchive size={20} />}
                  {!['pdf', 'jpg', 'png', 'jpeg', 'mp4', 'mov', 'zip', 'rar'].includes(file.type) && <File size={20} />}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(file.name)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-secondary text-xs truncate mb-1">{file.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase">{file.type} FILE</p>
              
              <div className="mt-4 flex gap-2">
                <a href={file.url} target="_blank" className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-1">
                  <Download size={12} /> View
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
