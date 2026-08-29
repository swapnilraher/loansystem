"use client"

import React, { useEffect, useState } from "react"
import { X, Download, Eye, FileText, ZoomIn, ZoomOut, RotateCw, ExternalLink } from "lucide-react"

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fileUrl?: string
  fileName?: string
  mimeType?: string
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName = "Document",
  mimeType,
}: DocumentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl(null)
      return
    }

    let url = fileUrl.trim()
    let detectedPdf = false

    // Check if MIME type or URL indicates PDF
    if (
      mimeType?.includes("pdf") ||
      url.toLowerCase().includes(".pdf") ||
      url.startsWith("data:application/pdf") ||
      url.startsWith("JVBERi") // PDF magic header in base64
    ) {
      detectedPdf = true
    }

    setIsPdf(detectedPdf)

    // Handle base64 string without data prefix
    if (!url.startsWith("http") && !url.startsWith("data:")) {
      if (detectedPdf) {
        url = `data:application/pdf;base64,${url}`
      } else {
        url = `data:image/jpeg;base64,${url}`
      }
    }

    // Convert data URL to Blob URL for clean browser rendering without CORS or target_blank restrictions
    if (url.startsWith("data:")) {
      try {
        const parts = url.split(",")
        const mimeMatch = parts[0].match(/:(.*?);/)
        const mime = mimeMatch ? mimeMatch[1] : detectedPdf ? "application/pdf" : "image/jpeg"
        const bstr = atob(parts[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })
        const createdBlobUrl = URL.createObjectURL(blob)
        setBlobUrl(createdBlobUrl)
        return () => {
          URL.revokeObjectURL(createdBlobUrl)
        }
      } catch (err) {
        console.warn("Blob conversion error, using raw URL:", err)
        setBlobUrl(url)
      }
    } else {
      setBlobUrl(url)
    }
  }, [isOpen, fileUrl, mimeType])

  if (!isOpen) return null

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement("a")
    a.href = blobUrl
    const ext = isPdf ? ".pdf" : ".jpg"
    const name = fileName.endsWith(".pdf") || fileName.endsWith(".png") || fileName.endsWith(".jpg")
      ? fileName
      : `${fileName}${ext}`
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 truncate">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPdf && (
              <>
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 25))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs font-mono text-slate-400 min-w-[36px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(250, z + 25))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RotateCw size={15} />
                </button>
              </>
            )}

            <button
              onClick={handleDownload}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} />
              <span>Download</span>
            </button>

            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={15} />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center relative">
          {!fileUrl ? (
            <div className="text-center text-slate-500 text-xs">No document available to view.</div>
          ) : isPdf ? (
            blobUrl ? (
              <iframe
                src={blobUrl}
                className="w-full h-full border-none rounded-xl bg-white"
                title={title}
              />
            ) : (
              <div className="text-slate-400 text-xs flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                Loading PDF Document...
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl || fileUrl}
                alt={title}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
