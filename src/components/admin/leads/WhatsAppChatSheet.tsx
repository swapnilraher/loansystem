"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Clock, Download, Eye, FileText, ImageOff, Loader2, Paperclip, Send, Smile, X } from "lucide-react"
import { getBrowserCache, setBrowserCache } from "@/lib/cache/browserCache"
import { POLL_FAST, usePolledResource } from "@/lib/hooks/usePolledResource"
import { DOCUMENT_ACCEPT, PHOTO_ACCEPT, validateMedia } from "@/lib/whatsappMediaShared"
import { cn } from "@/lib/utils"
import { Sheet, useToast } from "@/components/admin/ui"
import { formatDayShort, formatTime, toDate } from "@/lib/dates"
import { leadName, leadPhone, whatsAppNumber } from "./leadFilters"
import type { Lead } from "@/lib/hooks/useLeads"
import { WhatsAppBubble, WhatsAppDayDivider } from "@/components/admin/whatsapp/WhatsAppBubble"

interface ChatMessage {
  id: string
  text?: string
  sender?: "customer" | "bot" | "staff"
  userName?: string
  timestamp?: unknown
  mediaType?: string
  mediaUrl?: string
  filename?: string
  sortKey: number
  /** Written locally, still on its way to WhatsApp. */
  pending?: boolean
  /** Set on pending bubbles only, so they stay with the lead they were typed for. */
  leadId?: string
}

/** A `whatsapp_messages` row exactly as the route serves it: ISO timestamps, no defaults. */
interface ChatRow {
  id?: string
  /** The 10-digit number the row was filed under; the thread checks it. */
  phone?: string
  text?: string
  sender?: ChatMessage["sender"]
  userName?: string
  timestamp?: unknown
  mediaType?: string
  mediaUrl?: string
  filename?: string
}

const EMOJI = ["😀","😂","🙂","😉","😍","🙏","👍","👎","👏","💪","🔥","🎉","❤️","✨","📞","💬","💼","💰","📅","⏰"]

interface WhatsAppChatSheetProps {
  lead: Lead | null
  onClose: () => void
  senderName: string
  onMuteToggle: (leadId: string, muted: boolean) => Promise<void>
  /** Remembers the hand-off so the follow-up prompt fires on tab focus. */
  onExternalHandoff: (lead: Lead) => void
}

/**
 * In-CRM WhatsApp thread. Deliberately keeps WhatsApp's bubble language — staff
 * switch between this and the real app all day — but the chrome around it uses
 * the admin tokens so it still belongs to the CRM.
 */
export function WhatsAppChatSheet({
  lead,
  onClose,
  senderName,
  onMuteToggle,
  onExternalHandoff,
}: WhatsAppChatSheetProps) {
  const toast = useToast()
  /** Sent, not yet confirmed by the poll — shown with a clock on it. */
  const [pending, setPending] = useState<ChatMessage[]>([])
  const pendingSeq = useRef(0)
  const [draft, setDraft] = useState("")
  const [uploading, setUploading] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const leadId = lead?.id
  const phone = lead ? leadPhone(lead) : ""

  // The customer's 10-digit number is the key `whatsapp_messages` is written
  // against; a stored 91-prefixed number would never match.
  const localNumber = (() => {
    const clean = phone.replace(/\D/g, "")
    return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
  })()

  /**
   * This customer's thread, newest fifty. A null url while the sheet is closed
   * or the lead has no number keeps a shut sheet from polling at all.
   */
  const { data: messageData, refresh: refreshMessages } = usePolledResource<{
    messages: ChatRow[]
  }>(
    leadId && localNumber
      ? `/api/whatsapp-messages?phone=${encodeURIComponent(localNumber)}&limit=50`
      : null,
    POLL_FAST
  )

  /**
   * Bot mute state is toggled from here and from the automation screens, so it
   * is read from the lead document rather than from the snapshot the table
   * holds. The id check keeps the previous customer's flag off the screen for
   * the tick between opening another thread and its first answer.
   */
  const { data: leadData, refresh: refreshLead } = usePolledResource<{
    lead?: { id?: string; botMuted?: boolean }
  }>(leadId ? `/api/leads/${encodeURIComponent(leadId)}` : null, POLL_FAST)

  const botMuted = leadData?.lead?.id === leadId && !!leadData?.lead?.botMuted

  /** Instant first render from the session cache, until the first poll answers. */
  const [cached, setCached] = useState<ChatMessage[]>([])
  useEffect(() => {
    if (!localNumber) {
      setCached([])
      return
    }
    setCached(getBrowserCache<ChatMessage[]>(`wa_chat_${localNumber}`) || [])
  }, [localNumber])

  /** Poll rows for *this* customer, or null while the answer in hand is stale. */
  const fresh = useMemo((): ChatMessage[] | null => {
    const rows = messageData?.messages
    if (!rows || !localNumber) return null

    // The url changes the moment another thread opens while the poll still holds
    // the previous customer's answer; the number on each row tells the two apart.
    const mine = rows.filter(row => String(row.phone ?? "") === localNumber)
    if (mine.length === 0 && rows.length > 0) return null

    const ordered: ChatMessage[] = mine.map(row => ({
      id: String(row.id ?? ""),
      text: row.text,
      sender: row.sender,
      userName: row.userName,
      timestamp: row.timestamp,
      mediaType: row.mediaType || "",
      mediaUrl: row.mediaUrl || "",
      filename: row.filename || "",
      sortKey: toDate(row.timestamp)?.getTime() ?? 0,
    }))
    // The route answers newest-first so the cap keeps the most recent messages;
    // a thread reads oldest-first.
    ordered.sort((a, b) => a.sortKey - b.sortKey)
    return ordered
  }, [messageData, localNumber])

  const messages = fresh ?? cached

  useEffect(() => {
    if (!fresh || !localNumber) return
    setBrowserCache(`wa_chat_${localNumber}`, fresh, 2 * 60 * 1000)
  }, [fresh, localNumber])

  /**
   * The stored thread plus anything still on its way out.
   *
   * A pending bubble drops out the moment its stored copy arrives, matched on
   * text within fifteen seconds of when it was written — the same window as the
   * give-up timeout in `send`, so a stored copy that is slow to arrive retires
   * its bubble instead of landing beside it as a duplicate. One stored message
   * settles only one bubble, so sending the same words twice still shows two.
   * Each bubble also remembers the lead it belongs to, so switching customers
   * never carries someone else's message along.
   */
  const thread = useMemo(() => {
    if (pending.length === 0) return messages
    const claimed = new Set<string>()
    const waiting = pending.filter(ticket => {
      if (ticket.leadId !== leadId) return false
      const stored = messages.find(
        message =>
          message.sender === "staff" &&
          (message.text || "") === (ticket.text || "") &&
          !claimed.has(message.id) &&
          message.sortKey >= ticket.sortKey - 15000
      )
      if (!stored) return true
      claimed.add(stored.id)
      return false
    })
    return waiting.length > 0 ? [...messages, ...waiting] : messages
  }, [messages, pending, leadId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread])

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return response.json()
  }

  /**
   * The message leaves the box the moment it is sent and waits in the thread
   * with a clock on it, the way the real client behaves. Holding the text in a
   * disabled composer behind a spinner read as "nothing happened".
   */
  const send = async () => {
    if (!lead || !draft.trim() || !phone) return
    const body = draft.trim()
    const ticket: ChatMessage = {
      id: `pending-${pendingSeq.current++}`,
      text: body,
      sender: "staff",
      userName: senderName,
      timestamp: new Date(),
      sortKey: Date.now(),
      pending: true,
      leadId: lead.id,
    }

    setPending(prev => [...prev, ticket])
    setDraft("")

    const restore = (title: string, description?: string) => {
      setPending(prev => prev.filter(p => p.id !== ticket.id))
      setDraft(current => (current ? current : body))
      toast.push({ tone: "danger", title, description })
    }

    try {
      const result = await post({
        phone,
        name: leadName(lead),
        message: body,
        leadId: lead.id,
        senderName,
      })
      if (result.success) {
        // Pull the stored copy in now rather than waiting up to a full tick for
        // it — that swap is what retires the bubble.
        void refreshMessages()
        // Covers a send that went out but was never logged, so the clock
        // cannot hang in the thread indefinitely.
        window.setTimeout(
          () => setPending(prev => prev.filter(p => p.id !== ticket.id)),
          15000
        )
      } else {
        restore("मेसेज पाठवता आला नाही", result.error)
      }
    } catch (e) {
      console.error(e)
      restore("मेसेज पाठवताना त्रुटी आली")
    }
  }

  const attach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !lead) return

    const problem = validateMedia(file.size, file.type)
    if (problem) {
      toast.push({ tone: "danger", title: "Can't attach that file", description: problem })
      event.target.value = ""
      return
    }

    setUploading(true)
    try {
      /**
       * Uploads to WhatsApp's own media store, not Firebase Storage.
       *
       * The previous `uploadBytes` call targeted a bucket this Firebase project
       * does not have, so sending an attachment from here always failed. Meta
       * accepts media by id, which needs no hosting of ours, and the id is read
       * back through /api/whatsapp/media/[mediaId].
       */
      const form = new FormData()
      form.append("file", file)
      const uploadResponse = await fetch("/api/whatsapp/upload", { method: "POST", body: form })
      const uploaded = await uploadResponse.json()

      if (!uploaded.success) {
        toast.push({ tone: "danger", title: "फाइल पाठवू शकलो नाही", description: uploaded.error })
        return
      }

      const result = await post({
        phone,
        name: leadName(lead),
        message: draft.trim(),
        leadId: lead.id,
        senderName,
        mediaId: uploaded.mediaId,
        mediaType: uploaded.mediaKind,
        filename: uploaded.filename,
      })
      if (result.success) {
        setDraft("")
        // The attachment has no pending bubble, so the refresh is the only thing
        // that puts it in the thread before the next tick.
        void refreshMessages()
      } else {
        toast.push({ tone: "danger", title: "फाइल पाठवू शकलो नाही", description: result.error })
      }
    } catch (e) {
      console.error("File upload/send error:", e)
      toast.push({ tone: "danger", title: "फाइल पाठवताना त्रुटी आली" })
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <Sheet
      open={!!lead}
      onClose={onClose}
      side="right"
      size="sm"
      padded={false}
    >
      {/* Custom WhatsApp Header */}
      <div className="shrink-0 bg-wa-header text-wa-header-fg border-b border-wa-divider px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-wa-accent/15 flex items-center justify-center text-wa-accent font-semibold text-sm shrink-0 select-none">
            {lead ? leadName(lead).slice(0, 2).toUpperCase() : "U"}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-wa-header-fg truncate leading-tight">
              {lead ? leadName(lead) : "ग्राहक"}
            </h2>
            <p className="text-xs text-wa-meta truncate font-normal mt-0.5">
              {phone ? `+91 ${phone.replace(/^91/, "")}` : "No phone number"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-full text-wa-meta hover:text-wa-header-fg hover:bg-wa-hover transition-colors duration-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* Auto-chat state — staff must know whether the bot is also replying. */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-2 border-b shrink-0 transition-colors duration-300",
          botMuted
            ? "bg-tone-warn/20 border-tone-warn-bd text-tone-warn-fg"
            : "bg-tone-success/20 border-tone-success-bd text-tone-success-fg"
        )}
      >
        <span className="text-admin-xs font-semibold flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", botMuted ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
          {botMuted ? "ऑटो-चॅट बंद आहे (bot muted)" : "ऑटो-चॅट सुरू आहे (bot active)"}
        </span>
        <button
          onClick={async () => {
            if (!lead) return
            await onMuteToggle(lead.id, !botMuted)
            // The flag lives on the lead document, so the banner only turns over
            // once the poll has read it back.
            void refreshLead()
          }}
          className="admin-focus px-2.5 py-1 rounded bg-white dark:bg-wa-header border border-wa-divider text-admin-2xs font-bold text-wa-header-fg hover:bg-wa-hover transition-colors"
        >
          {botMuted ? "सुरू करा" : "बंद करा"}
        </button>
      </div>

      {/* Chat messages viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar wa-wallpaper p-4 space-y-1.5 relative isolate">
        {thread.length === 0 ? (
          <div className="relative z-10 flex justify-center py-12">
            <span className="rounded-md bg-wa-panel px-4 py-2 text-admin-xs font-medium text-wa-meta shadow-admin-1">
              सध्या कोणताही जुना संवाद नाही. खाली मेसेज लिहून संवाद सुरू करा.
            </span>
          </div>
        ) : (
          thread.map((message, i) => {
            const previous = thread[i - 1]
            const day = formatDayShort(message.timestamp)
            const newDay = !previous || formatDayShort(previous.timestamp) !== day
            
            // Map ChatMessage structure to WaMessage
            const bubbleMessage = {
              ...message,
              phone: localNumber,
            }
            
            return (
              <React.Fragment key={message.id}>
                {newDay && day && <WhatsAppDayDivider label={day} />}
                <WhatsAppBubble message={bubbleMessage} />
              </React.Fragment>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {emojiOpen && (
        <div className="shrink-0 border-t border-wa-divider bg-wa-header px-3 py-2 flex flex-wrap gap-1">
          {EMOJI.map(emoji => (
            <button
              key={emoji}
              onClick={() => setDraft(prev => prev + emoji)}
              className="admin-focus w-10 h-10 sm:w-8 sm:h-8 rounded-md text-admin-lg hover:bg-wa-hover transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 border-t border-wa-divider bg-wa-header p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-2.5 flex items-center gap-2">
        <button
          onClick={() => setEmojiOpen(o => !o)}
          aria-label="Emoji"
          className={cn(
            "admin-touch admin-focus p-2 rounded-full transition-colors shrink-0",
            emojiOpen
              ? "bg-wa-hover text-wa-header-fg"
              : "text-wa-meta hover:text-wa-header-fg hover:bg-wa-hover"
          )}
        >
          <Smile size={20} />
        </button>

        <label
          className={cn(
            "admin-touch admin-focus p-2 rounded-full text-wa-meta hover:text-wa-header-fg hover:bg-wa-hover transition-colors shrink-0",
            uploading ? "pointer-events-none" : "cursor-pointer"
          )}
          title="Attach a file"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
          <input
            type="file"
            className="hidden"
            accept={`${PHOTO_ACCEPT},${DOCUMENT_ACCEPT}`}
            onChange={attach}
            disabled={uploading}
          />
        </label>

        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={1}
          placeholder="मेसेज टाईप करा…"
          className="admin-focus flex-1 min-h-9 max-h-24 bg-white dark:bg-[#2a3942] text-wa-header-fg rounded-lg px-3 py-1.5 text-sm placeholder:text-wa-meta resize-none border-none focus:ring-0 focus:outline-none"
        />

        <button
          onClick={send}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="admin-focus w-9 h-9 rounded-full bg-wa-accent text-wa-accent-fg flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-wa-accent/90 transition-colors shadow-sm cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>

      <div className="shrink-0 border-t border-wa-divider bg-wa-header px-3 py-2 text-center">
        <a
          href={lead ? `https://wa.me/${whatsAppNumber(lead)}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => lead && onExternalHandoff(lead)}
          className="admin-focus text-admin-xs font-semibold text-wa-accent hover:underline inline-flex items-center gap-1"
        >
          थेट WhatsApp ॲप मध्ये उघडा →
        </a>
      </div>
    </Sheet>
  )
}
