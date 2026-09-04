"use client"

import React from "react"
import { Image as ImageIcon, Link2, Loader2, Upload, X } from "lucide-react"
import { authedFetch } from "@/lib/authedFetch"
import {
  countTemplateVariables,
  extractTemplateVariables,
  type CampaignImageSource,
  type CampaignMessage,
  type WaTemplate,
} from "@/lib/waCampaignShared"

/**
 * The editor for one of a campaign's two messages.
 *
 * Message 1 and Message 2 are the same shape, so they share this rather than
 * being written twice — the only difference the caller passes in is whether the
 * image controls are offered (Message 2 is text-only by design, so it stays a
 * plainly separate follow-up rather than a second attachment).
 */

interface Props {
  label: string
  message: CampaignMessage
  templates: WaTemplate[]
  allowImage: boolean
  nameColumn: string
  onChange: (next: CampaignMessage) => void
}

const field =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"

export default function MessageComposer({
  label,
  message,
  templates,
  allowImage,
  nameColumn,
  onChange,
}: Props) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState("")

  const template = templates.find(
    t => t.name === message.templateName && t.language === message.templateLanguage
  )

  const set = (patch: Partial<CampaignMessage>) => onChange({ ...message, ...patch })

  /** Keeps `bodyParams` the same length as the chosen template's placeholders. */
  const pickTemplate = (value: string) => {
    const [name, language] = value.split("||")
    const chosen = templates.find(t => t.name === name && t.language === language)
    const vars = chosen ? (chosen.variableNames || extractTemplateVariables(chosen.bodyText)) : []
    const count = chosen ? chosen.variableCount : vars.length
    const params = Array.from({ length: count }, (_, i) =>
      // The first variable is nearly always the recipient's name, so it starts
      // filled in. Anything else starts blank and has to be typed.
      message.bodyParams[i] ?? (i === 0 ? "{{Name}}" : "")
    )
    const isConnector = (name || "").toLowerCase() === "connector" || (name || "").toLowerCase().includes("connector")
    const defaultImg = isConnector ? "https://res.cloudinary.com/ugpy6fko/image/upload/v1788543861/wa-campaigns/u3xz2l1lpx7wylsxitog.png" : ""
    set({
      templateName: isConnector ? "connector" : (name || ""),
      templateLanguage: isConnector ? "en" : (language || "en_US"),
      bodyParams: params.length > 0 ? params : (isConnector ? ["{{Name}}"] : []),
      imageUrl: message.imageUrl || defaultImg,
      imageSource: (message.imageUrl || defaultImg) ? "url" : "none",
      // A template without an image header cannot carry one.
      ...(chosen && !chosen.hasImageHeader && !isConnector ? { imageUrl: "", imageSource: "none" as CampaignImageSource } : {}),
    })
  }

  const setParam = (index: number, value: string) => {
    const params = [...message.bodyParams]
    params[index] = value
    set({ bodyParams: params })
  }

  const upload = async (file: File) => {
    setUploading(true)
    setUploadError("")
    try {
      const form = new FormData()
      form.append("file", file)
      const response = await authedFetch("/api/admin/wa-campaigns/upload-image", {
        method: "POST",
        body: form,
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Upload failed.")
      set({ imageUrl: result.url, imageSource: "upload" })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const showImage = allowImage && (message.mode === "custom" || template?.hasImageHeader)

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-6 transition-colors ${
        message.enabled ? "border-primary/30 bg-white" : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-black uppercase tracking-widest text-secondary">{label}</span>
        <span className="relative inline-flex items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={message.enabled}
            onChange={e => set({ enabled: e.target.checked })}
          />
          <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500" />
          <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      {message.enabled && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            {(["template", "custom"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => set({ mode })}
                className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                  message.mode === mode ? "bg-white text-secondary shadow-sm" : "text-slate-500"
                }`}
              >
                {mode === "template" ? "Approved template" : "Custom message"}
              </button>
            ))}
          </div>

          {message.mode === "template" ? (
            <>
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Template
                </p>
                <select
                  className={field}
                  value={message.templateName ? `${message.templateName}||${message.templateLanguage}` : ""}
                  onChange={e => pickTemplate(e.target.value)}
                >
                  <option value="">Select a template…</option>
                  {templates.map(t => (
                    <option key={`${t.name}||${t.language}`} value={`${t.name}||${t.language}`}>
                      {t.name} ({t.language})
                    </option>
                  ))}
                </select>
              </div>

              {template && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Template body
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{template.bodyText}</p>
                </div>
              )}

              {message.bodyParams.map((param, index) => {
                const varName = template?.variableNames?.[index] || (index + 1)
                return (
                <div key={index}>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Variable {`{{${varName}}}`}
                  </p>
                  <div className="flex gap-2">
                    <input
                      className={field}
                      value={param}
                      placeholder="Type a value, or use {{Name}}"
                      onChange={e => setParam(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setParam(index, "{{Name}}")}
                      className="shrink-0 rounded-2xl border border-slate-200 px-3 text-xs font-black text-slate-500 hover:border-primary hover:text-primary"
                    >
                      Name
                    </button>
                  </div>
                </div>
              )})}
            </>
          ) : (
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                Message text
              </p>
              <textarea
                className={`${field} min-h-[120px] resize-y`}
                value={message.text}
                placeholder="Hello {{Name}}, …"
                onChange={e => set({ text: e.target.value })}
              />
              <button
                type="button"
                onClick={() => set({ text: `${message.text}{{Name}}` })}
                className="mt-2 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-black text-slate-500 hover:border-primary hover:text-primary"
              >
                + Insert {"{{Name}}"}
              </button>
              <p className="mt-2 text-[11px] font-medium text-amber-600">
                A custom message only reaches people who messaged you in the last 24 hours.
                For a cold list, use an approved template.
              </p>
            </div>
          )}

          {showImage && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <ImageIcon size={13} /> Image
              </p>

              <div className="mb-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                {(
                  [
                    ["none", "None"],
                    ["url", "Image URL"],
                    ["upload", "Upload"],
                  ] as const
                ).map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      set({ imageSource: value, ...(value === "none" ? { imageUrl: "" } : {}) })
                    }
                    className={`rounded-xl px-2 py-2 text-[11px] font-black uppercase transition-colors ${
                      message.imageSource === value ? "bg-white text-secondary shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>

              {message.imageSource === "url" && (
                <div className="flex items-center gap-2">
                  <Link2 size={16} className="shrink-0 text-slate-400" />
                  <input
                    className={field}
                    value={message.imageUrl}
                    placeholder="https://example.com/banner.jpg"
                    onChange={e => set({ imageUrl: e.target.value.trim() })}
                  />
                </div>
              )}

              {message.imageSource === "upload" && (
                <div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm font-bold text-slate-500 hover:border-primary hover:text-primary">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploading ? "Uploading…" : "Choose a JPEG or PNG"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={uploading}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void upload(file)
                      }}
                    />
                  </label>
                  {uploadError && (
                    <p className="mt-2 text-xs font-bold text-rose-600">{uploadError}</p>
                  )}
                </div>
              )}

              {message.imageUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.imageUrl}
                    alt="Campaign attachment"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-500">
                    {message.imageUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => set({ imageUrl: "", imageSource: "none" })}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {!nameColumn && (
            <p className="text-[11px] font-medium text-slate-400">
              Map a Name column above to use {"{{Name}}"}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
