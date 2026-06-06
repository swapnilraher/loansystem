"use client"

import React, { useState, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, writeBatch, doc, serverTimestamp } from "firebase/firestore"
import { Upload, X, FileSpreadsheet, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"

const SYSTEM_FIELDS = [
  { key: "name", label: "Full Name", required: true },
  { key: "mobile", label: "Mobile Number", required: true },
  { key: "city", label: "City", required: true },
  { key: "type", label: "Loan Type", required: true },
  { key: "amount", label: "Loan Amount", required: true },
  { key: "remarks", label: "Remarks (Optional)", required: false },
]

export function BulkUploadModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const { user, profile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Upload, 2: Map, 3: Processing/Success
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setError("")

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        
        // Convert sheet to JSON
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
        if (data.length < 2) {
          setError("File is empty or missing data rows.")
          return
        }

        const fileHeaders = data[0] as string[]
        const fileRows = data.slice(1).filter(row => row.length > 0) // Filter out empty rows

        setHeaders(fileHeaders.map(h => String(h).trim()))
        setRows(fileRows)
        
        // Auto-guess mapping based on exact/partial matches
        const autoMap: Record<string, string> = {}
        SYSTEM_FIELDS.forEach(sf => {
          const matchedHeader = fileHeaders.find(fh => 
            String(fh).toLowerCase().includes(sf.key) || 
            String(fh).toLowerCase().includes(sf.label.toLowerCase().split(' ')[0])
          )
          if (matchedHeader) autoMap[sf.key] = String(matchedHeader).trim()
        })
        
        setMapping(autoMap)
        setStep(2)
      } catch (err) {
        console.error(err)
        setError("Invalid Excel file format.")
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleProcess = async () => {
    if (profile?.dsaStatus && profile.dsaStatus !== "Active") {
      setError("Your account is currently inactive. You cannot upload leads.")
      return
    }
    // Validate mapping
    for (const field of SYSTEM_FIELDS) {
      if (field.required && !mapping[field.key]) {
        setError(`Please map the required field: ${field.label}`)
        return
      }
    }

    setStep(3)
    setLoading(true)
    setError("")

    try {
      const batch = writeBatch(db)
      let validCount = 0

      rows.forEach(rowArray => {
        // Build the lead object by mapping columns
        const lead: any = {}
        SYSTEM_FIELDS.forEach(field => {
          const mappedHeader = mapping[field.key]
          if (mappedHeader) {
            const headerIndex = headers.indexOf(mappedHeader)
            if (headerIndex !== -1) {
              lead[field.key] = rowArray[headerIndex] ? String(rowArray[headerIndex]) : ""
            }
          }
        })

        // Basic validation for this row
        if (lead.name && lead.mobile) {
          // Standardize mobile
          lead.mobile = lead.mobile.replace(/\D/g, '')
          lead.phone = lead.mobile // CRM compat

          if (lead.mobile.length === 10) {
            const newRef = doc(collection(db, "leads"))
            batch.set(newRef, {
              ...lead,
              status: "New Lead",
              category: "Partner",
              source: "Excel Bulk Upload",
              partnerId: user?.uid,
              partnerName: profile?.kycData?.name || profile?.name || "Partner",
              dsaCode: profile?.dsaCode || "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            validCount++
          }
        }
      })

      if (validCount === 0) {
        throw new Error("No valid rows found to upload. Ensure mobile numbers are 10 digits.")
      }

      await batch.commit()
      setLoading(false)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to upload leads")
      setStep(2)
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !loading && onClose()}></div>
      
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black text-secondary">Bulk Upload Leads</h3>
            <p className="text-xs font-bold text-slate-400">Import customers via Excel/CSV</p>
          </div>
          <button onClick={onClose} disabled={loading} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <div 
                onClick={() => {
                  if (profile?.dsaStatus && profile.dsaStatus !== "Active") {
                    setError("Your account is currently inactive. You cannot upload leads.")
                    return
                  }
                  fileInputRef.current?.click()
                }}
                className={`w-full h-48 border-2 border-dashed border-primary/30 rounded-3xl bg-primary/5 transition-colors flex flex-col items-center justify-center group ${profile?.dsaStatus && profile.dsaStatus !== "Active" ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10 cursor-pointer'}`}
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={32} />
                </div>
                <p className="font-black text-secondary">Click to upload Excel</p>
                <p className="text-xs font-bold text-slate-400 mt-1">.xlsx, .xls, .csv</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500">
                  <span className="font-black text-secondary">Note:</span> Ensure your file contains columns for Name, Mobile Number, City, Loan Type, and Amount. You will map them in the next step.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <FileSpreadsheet className="text-emerald-500" size={24} />
                <div>
                  <p className="text-sm font-black text-secondary">{file?.name}</p>
                  <p className="text-xs font-bold text-slate-500">{rows.length} rows detected</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-secondary mb-4">Map Columns</h4>
                <div className="space-y-3">
                  {SYSTEM_FIELDS.map(field => (
                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-2 w-1/2">
                        <span className="text-xs font-black text-secondary">{field.label}</span>
                        {field.required && <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded font-black uppercase">Req</span>}
                      </div>
                      <div className="flex-1">
                        <select
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-secondary outline-none focus:border-primary"
                          value={mapping[field.key] || ""}
                          onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                        >
                          <option value="">-- Select Column --</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleProcess}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Start Import <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-500">
              {loading ? (
                <>
                  <div className="w-20 h-20 bg-blue-50 text-primary rounded-[2rem] flex items-center justify-center animate-pulse">
                    <Loader2 size={40} className="animate-spin" />
                  </div>
                  <h3 className="text-xl font-black text-secondary mt-4">Processing Data...</h3>
                  <p className="text-sm font-bold text-slate-500">Uploading {rows.length} rows to the database securely.</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-xl font-black text-secondary mt-4">Upload Successful!</h3>
                  <p className="text-sm font-bold text-slate-500">All valid leads have been added to your dashboard.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
