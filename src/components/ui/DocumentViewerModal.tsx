"use client"

import React, { useEffect, useState } from "react"
import { X, Download, Eye, FileText, ZoomIn, ZoomOut, RotateCw, ExternalLink, Loader2, AlertCircle } from "lucide-react"

interface DocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fileUrl?: string
  fileName?: string
  mimeType?: string
  isSideBySide?: boolean
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName = "Document",
  mimeType,
  isSideBySide = false,
}: DocumentViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl(null)
      setError(null)
      return
    }

    let url = fileUrl.trim()
    let detectedPdf = false

    if (
      mimeType?.includes("pdf") ||
      url.toLowerCase().includes(".pdf") ||
      url.startsWith("data:application/pdf") ||
      url.startsWith("JVBERi")
    ) {
      detectedPdf = true
    }

    setIsPdf(detectedPdf)
    setLoading(true)
    setError(null)

    let isMounted = true

    async function loadDocument() {
      try {
        // 1. Handle HTTP or Relative API URLs (e.g. /api/document/proxy?...)
        if (url.startsWith("http") || url.startsWith("/")) {
          try {
            const res = await fetch(url, { cache: "no-store" })
            if (res.ok) {
              const buffer = await res.arrayBuffer()
              const contentType = res.headers.get("content-type") || ""
              const isPdfDoc =
                contentType.includes("pdf") ||
                mimeType?.includes("pdf") ||
                url.toLowerCase().includes(".pdf") ||
                fileName.toLowerCase().endsWith(".pdf")

              setIsPdf(isPdfDoc)
              const blob = new Blob([buffer], { type: contentType || (isPdfDoc ? "application/pdf" : "image/jpeg") })
              const createdUrl = URL.createObjectURL(blob)
              if (isMounted) {
                setBlobUrl(createdUrl)
                setLoading(false)
              }
              return
            }
          } catch (fetchErr) {
            console.warn("Fetch failed, falling back to direct URL:", fetchErr)
          }

          if (isMounted) {
            setBlobUrl(url)
            setLoading(false)
          }
          return
        }

        // 2. Handle data: URLs
        if (url.startsWith("data:")) {
          const parts = url.split(",")
          const mimeMatch = parts[0].match(/:(.*?);/)
          const isPdfDoc = (mimeMatch && mimeMatch[1]?.includes("pdf")) || url.startsWith("data:application/pdf")
          setIsPdf(isPdfDoc)

          const mime = mimeMatch ? mimeMatch[1] : isPdfDoc ? "application/pdf" : "image/jpeg"
          const bstr = atob(parts[1])
          let n = bstr.length
          const u8arr = new Uint8Array(n)
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
          }
          const blob = new Blob([u8arr], { type: mime })
          const createdUrl = URL.createObjectURL(blob)
          if (isMounted) {
            setBlobUrl(createdUrl)
            setLoading(false)
          }
          return
        }

        // 3. Handle raw base64 string without prefix
        const isPdfRaw = url.startsWith("JVBERi") || detectedPdf
        setIsPdf(isPdfRaw)
        const mime = isPdfRaw ? "application/pdf" : "image/jpeg"
        const bstr = atob(url)
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })
        const createdUrl = URL.createObjectURL(blob)
        if (isMounted) {
          setBlobUrl(createdUrl)
          setLoading(false)
        }
      } catch (err: any) {
        console.error("Document Load Error:", err)
        if (isMounted) {
          setError("Failed to load document. Try downloading directly.")
          setLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      isMounted = false
    }
  }, [isOpen, fileUrl, mimeType])

  if (!isOpen) return null

  const handleDownload = () => {
    if (!blobUrl && !fileUrl) return
    const targetUrl = blobUrl || fileUrl || ""
    const a = document.createElement("a")
    a.href = targetUrl
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
    <div
      className={
        isSideBySide
          ? "w-full lg:w-[480px] xl:w-[560px] h-[85vh] bg-admin-surface border border-admin-border rounded-admin-lg shadow-admin-2 flex flex-col shrink-0 overflow-hidden animate-fadeIn"
          : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      }
    >
      <div className={isSideBySide ? "w-full h-full flex flex-col" : "w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col"}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              <FileText size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate">{title}</h3>
              <p className="text-[10px] text-slate-400 truncate">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isPdf && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(50, z - 25))}
                  title="Zoom Out"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[10px] font-mono text-slate-400 min-w-[28px] text-center">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(250, z + 25))}
                  title="Zoom In"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RotateCw size={13} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="py-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Download size={12} />
              <span>Download</span>
            </button>

            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Open in new window"
              >
                <ExternalLink size={13} />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950 overflow-hidden p-2 flex items-center justify-center relative">
          {loading ? (
            <div className="text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading Document...</span>
            </div>
          ) : error ? (
            <div className="text-center space-y-2 p-4 text-xs text-red-400">
              <AlertCircle size={24} className="mx-auto text-red-500" />
              <p>{error}</p>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700"
              >
                Download Document File
              </button>
            </div>
          ) : !fileUrl ? (
            <div className="text-center text-slate-500 text-xs">No document available to view.</div>
          ) : isPdf ? (
            blobUrl ? (
              <iframe
                src={blobUrl}
                className="w-full h-full border-none rounded-lg bg-white"
                title={title}
              />
            ) : (
              <div className="text-slate-400 text-xs">Unable to display PDF preview</div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
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
