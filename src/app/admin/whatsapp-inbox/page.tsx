"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react"
import { getBrowserCache, setBrowserCache } from "@/lib/cache/browserCache"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useWaNotificationsContext } from "@/context/WaNotificationsContext"
import { useToast } from "@/components/admin/ui"
import { formatDayShort, timeAgo, toDate } from "@/lib/dates"
import { useNow } from "@/lib/hooks/useNow"
import { POLL_FAST, POLL_NORMAL, usePolledResource } from "@/lib/hooks/usePolledResource"
import { useLeads, Lead } from "@/lib/hooks/useLeads"
import { useUsers, type AdminUser } from "@/lib/hooks/useUsers"
import { useViewerIdentity } from "@/lib/hooks/useViewerIdentity"
import { can, normalizeRole, ownsLead } from "@/lib/permissions"
import { useLeadMutations } from "@/components/admin/leads/useLeadMutations"
import { LeadDetailSheet } from "@/components/admin/leads/LeadDetailSheet"
import { leadName, leadPhone } from "@/components/admin/leads/leadFilters"
import {
  WhatsAppBubble,
  WhatsAppDayDivider,
  type WaMessage,
} from "@/components/admin/whatsapp/WhatsAppBubble"
import {
  DOCUMENT_ACCEPT,
  PHOTO_ACCEPT,
  defaultMediaText,
  formatBytes,
  mediaKindFor,
  validateMedia,
  type WaMediaKind,
} from "@/lib/whatsappMediaShared"

/**
 * Reduced message cap to 80 to dramatically minimize database reads.
 */
const MESSAGE_LIMIT = 80

const EMOJI = ["😀", "😂", "🙂", "🙏", "👍", "👏", "🔥", "🎉", "❤️", "📞", "💬", "💰"]

interface WaSession {
  phone: string
  name: string
  step: number
  category: string
}

/** A `whatsapp_messages` row exactly as the route serves it: ISO timestamps, no defaults. */
interface InboxRow {
  id?: string
  phone?: string
  text?: string
  sender?: WaMessage["sender"]
  userName?: string
  timestamp?: unknown
  mediaType?: string
  mediaUrl?: string
  filename?: string
  leadId?: string
}

/** A `waSession` row. Its id is the phone number the bot is talking to. */
interface SessionRow {
  id?: string
  name?: string
  step?: unknown
  category?: string
}

interface Conversation {
  phone: string
  name: string
  category: string
  step: number
  /** The CRM lead this thread belongs to, when its messages recorded one. */
  leadId: string
  messages: WaMessage[]
  last: WaMessage
  /** Customer spoke last, so this thread is waiting on us. */
  awaitingReply: boolean
}

/** `whatsapp_messages` is keyed on the bare 10-digit number. */
function localNumber(raw: string): string {
  const clean = (raw || "").replace(/\D/g, "")
  return clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export default function WhatsAppInboxPage() {
  const { user, profile, role } = useAuth()
  const viewer = useViewerIdentity()
  const { markReadForPhone } = useWaNotificationsContext()
  const toast = useToast()
  const now = useNow()

  const { leads } = useLeads()
  const { users } = useUsers()
  const mutations = useLeadMutations()

  const [messageLimit, setMessageLimit] = useState(80)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)

  /**
   * The thread store and the bot's session state.
   *
   * Ordered and capped by the route rather than in memory: `whatsapp_messages`
   * comes back newest-first under `limit`, which is what keeps this from pulling
   * the whole collection into the browser — the same job `orderBy` + `limit` did
   * on the listener. A chat screen polls fast; the sessions only supply the name,
   * category and bot step on each row, so they poll at the ordinary rate.
   */
  const {
    data: messageData,
    loading: messagesLoading,
    error,
    refresh: refreshMessages,
  } = usePolledResource<{ messages: InboxRow[] }>(
    `/api/whatsapp-messages?limit=${messageLimit}`,
    POLL_FAST
  )

  const { data: sessionData } = usePolledResource<{ sessions: SessionRow[] }>(
    "/api/wa-sessions?limit=100",
    POLL_NORMAL
  )

  /** Both caches only cover the gap before the first poll answers. */
  const [cachedMessages] = useState<WaMessage[]>(
    () => getBrowserCache<WaMessage[]>("wa_inbox_messages") || []
  )
  const [cachedSessions] = useState<Record<string, WaSession>>(
    () => getBrowserCache<Record<string, WaSession>>("wa_inbox_sessions") || {}
  )

  const messages = useMemo((): WaMessage[] => {
    const rows = messageData?.messages
    if (!rows) return cachedMessages
    return rows.map(row => ({
      id: String(row.id ?? ""),
      phone: localNumber(String(row.phone ?? "")),
      text: row.text,
      sender: row.sender,
      userName: row.userName,
      timestamp: row.timestamp,
      mediaType: row.mediaType || "",
      mediaUrl: row.mediaUrl || "",
      filename: row.filename || "",
      leadId: row.leadId || "",
      sortKey: toDate(row.timestamp)?.getTime() ?? 0,
    }))
  }, [messageData, cachedMessages])

  const sessions = useMemo((): Record<string, WaSession> => {
    const rows = sessionData?.sessions
    if (!rows) return cachedSessions
    const next: Record<string, WaSession> = {}
    for (const row of rows) {
      const phone = localNumber(String(row.id ?? ""))
      if (!phone) continue
      next[phone] = {
        phone,
        name: row.name || "",
        step: Number(row.step ?? 0),
        category: row.category || "",
      }
    }
    return next
  }, [sessionData, cachedSessions])

  useEffect(() => {
    if (!messageData?.messages) return
    setBrowserCache("wa_inbox_messages", messages, 2 * 60 * 1000)
  }, [messageData, messages])

  useEffect(() => {
    if (!sessionData?.sessions) return
    setBrowserCache("wa_inbox_sessions", sessions, 5 * 60 * 1000)
  }, [sessionData, sessions])

  /** A warm cache stands in for the first poll, so the spinner is not shown twice. */
  const loading = messagesLoading && messages.length === 0

  const telecallers = useMemo(
    () =>
      users.filter(
        (u: AdminUser) =>
          (normalizeRole(u.role) === "Telecaller" || normalizeRole(u.role) === "Manager") &&
          u.status === "Active"
      ),
    [users]
  )
  const canAssign = can(role, "leads:assign")
  const canDelete = can(role, "leads:delete")

  /** Sent, not yet confirmed — rendered in the thread with a clock on it. */
  const [pending, setPending] = useState<WaMessage[]>([])
  const pendingSeq = useRef(0)
  /**
   * Preview URLs owned by pending bubbles. The staged attachment's own URL is
   * revoked the moment the composer clears, so a bubble that borrowed it would
   * show a broken image; these are its own, released together once the last
   * bubble settles.
   */
  const ticketUrls = useRef<string[]>([])

  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState("")
  const [emojiOpen, setEmojiOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  /**
   * The staged attachment, WhatsApp-style: picked first, previewed with an
   * optional caption, sent as one message. `previewUrl` is an object URL, so it
   * is revoked in an effect below rather than on every state write.
   */
  const [attachment, setAttachment] = useState<{
    file: File
    previewUrl: string
    kind: WaMediaKind
  } | null>(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const staffName = profile?.name || user?.displayName || user?.email || "Staff"

  /** An object URL that belongs to the bubble, not to the composer. */
  const ticketPreviewUrl = (file: File) => {
    const url = URL.createObjectURL(file)
    ticketUrls.current.push(url)
    return url
  }

  useEffect(() => {
    if (pending.length > 0) return
    ticketUrls.current.forEach(URL.revokeObjectURL)
    ticketUrls.current = []
  }, [pending.length])

  /**
   * A pending bubble retires the moment its stored copy shows up, so the
   * message is never on screen twice. Derived rather than pruned in an effect:
   * the poll is the authority on what has been stored, and deciding it while
   * rendering avoids a second render pass on every tick.
   *
   * Matched on sender, number and text within fifteen seconds of when the
   * bubble was written — the same window as the give-up timeout in `send`, so a
   * stored copy that is slow to arrive still retires its bubble rather than
   * landing beside it as a duplicate. Each stored message settles only one
   * bubble, so sending the same words twice still shows two.
   */
  const visiblePending = useMemo(() => {
    if (pending.length === 0) return pending
    const claimed = new Set<string>()
    return pending.filter(ticket => {
      const stored = messages.find(
        message =>
          message.sender === "staff" &&
          message.phone === ticket.phone &&
          (message.text || "") === (ticket.text || "") &&
          !claimed.has(message.id) &&
          message.sortKey >= ticket.sortKey - 15000
      )
      if (!stored) return true
      claimed.add(stored.id)
      return false
    })
  }, [pending, messages])

  /**
   * CRM name per number. The bot session and the stored `userName` both freeze
   * whatever the customer typed at the time, so renaming a lead on the Leads
   * screen never reached this list. The lead document is the source of truth
   * for who this is, and it is live.
   */
  const crmNames = useMemo(() => {
    const byPhone = new Map<string, string>()
    for (const lead of leads) {
      const phone = localNumber(leadPhone(lead))
      if (!phone) continue
      const name = leadName(lead)
      if (name && name !== "Name Pending") byPhone.set(phone, name)
    }
    return byPhone
  }, [leads])

  /** One entry per phone number, newest conversation first. */
  const conversations = useMemo((): Conversation[] => {
    const byPhone = new Map<string, WaMessage[]>()
    for (const message of messages) {
      if (!message.phone) continue
      const bucket = byPhone.get(message.phone)
      if (bucket) bucket.push(message)
      else byPhone.set(message.phone, [message])
    }

    return Array.from(byPhone.entries())
      .map(([phone, rows]) => {
        // The query came back newest-first; a thread reads oldest-first.
        const ordered = [...rows].sort((a, b) => a.sortKey - b.sortKey)
        const last = ordered[ordered.length - 1]
        const session = sessions[phone]
        const fromCustomer = ordered.find(m => m.sender === "customer" && m.userName)
        return {
          phone,
          name:
            crmNames.get(phone) ||
            session?.name ||
            fromCustomer?.userName ||
            `+91 ${phone}`,
          category: session?.category || "",
          step: session?.step ?? 0,
          // Newest wins: a number that was re-added as a fresh lead should mute
          // the lead it belongs to now, not the one it started on.
          leadId: [...ordered].reverse().find(m => m.leadId)?.leadId || "",
          messages: ordered,
          last,
          awaitingReply: last?.sender === "customer",
        }
      })
      .sort((a, b) => b.last.sortKey - a.last.sortKey)
  }, [messages, sessions, crmNames])

  /**
   * Filter conversations based on staff assignment:
   * - Admin sees ALL conversations.
   * - Non-admin staff (Telecallers/Managers) see ONLY conversations for:
   *   a) Leads assigned to them (ownsLead)
   *   b) Unassigned leads (!lead.assignedTo)
   *   c) New incoming WhatsApp chats that don't have a lead record yet
   */
  const permittedConversations = useMemo(() => {
    if (role === "Admin") return conversations
    return conversations.filter(c => {
      const lead = leads.find(l => l.id === c.leadId || localNumber(leadPhone(l)) === c.phone)
      if (!lead) return true
      if (!lead.assignedTo) return true
      return ownsLead(lead, viewer)
    })
  }, [conversations, leads, role, viewer])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return permittedConversations
    return permittedConversations.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.last.text || "").toLowerCase().includes(q)
    )
  }, [permittedConversations, search])

  const active = useMemo(
    () => permittedConversations.find(c => c.phone === selectedPhone) ?? null,
    [permittedConversations, selectedPhone]
  )

  const activeLead = useMemo(
    () =>
      leads.find(
        l => l.id === active?.leadId || localNumber(leadPhone(l)) === active?.phone
      ) ?? null,
    [leads, active]
  )

  /** The stored thread plus anything still on its way out. */
  const threadMessages = useMemo(() => {
    if (!active) return [] as WaMessage[]
    const mine = visiblePending.filter(ticket => ticket.phone === active.phone)
    return mine.length > 0 ? [...active.messages, ...mine] : active.messages
  }, [active, visiblePending])

  // Follow the thread as it grows, and when switching conversations.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [active?.phone, threadMessages.length])

  const awaiting = conversations.filter(c => c.awaitingReply).length

  /** Object URLs are per-attachment, so releasing them belongs to its lifetime. */
  useEffect(() => {
    if (!attachment) return
    return () => URL.revokeObjectURL(attachment.previewUrl)
  }, [attachment])

  /**
   * Switching threads discards whatever was staged — an attachment picked for
   * one customer must never follow you into another's conversation. Done here
   * rather than in an effect on `selectedPhone` so it stays a plain event.
   *
   * Opening a thread is also what marks it read, clearing any unread
   * "Auto Chatbot off" notification for that number.
   */
  const openConversation = (phone: string | null) => {
    setSelectedPhone(phone)
    setAttachment(null)
    setAttachMenuOpen(false)
    setEmojiOpen(false)
    setDraft("")
    if (phone) void markReadForPhone(phone)
  }

  /** Shared by the picker, drag-and-drop and paste. */
  const stageFile = (file: File | null | undefined) => {
    if (!file) return
    const problem = validateMedia(file.size, file.type)
    if (problem) {
      toast.push({ tone: "danger", title: "Can't attach that file", description: problem })
      return
    }
    setAttachment({
      file,
      previewUrl: URL.createObjectURL(file),
      kind: mediaKindFor(file.type),
    })
    setAttachMenuOpen(false)
    setEmojiOpen(false)
  }

  /**
   * WhatsApp's own behaviour: the message leaves the box the instant you press
   * send and waits in the thread with a clock on it. The composer previously
   * held the text hostage behind a spinner until Meta answered, which on a slow
   * connection looked like nothing had happened at all.
   */
  const send = async () => {
    if (!active) return
    const caption = draft.trim()
    const staged = attachment
    if (!staged && !caption) return

    const phone = active.phone
    const kind = staged?.kind
    const ticket: WaMessage = {
      id: `pending-${pendingSeq.current++}`,
      phone,
      // What the server will store, so the confirmed copy can be matched to
      // this bubble when the poll delivers it.
      text: caption || (kind ? defaultMediaText(kind, staged!.file.name) : ""),
      sender: "staff",
      userName: staffName,
      timestamp: new Date(),
      mediaType: kind === "image" ? "image" : kind ? "document" : "",
      mediaUrl: kind === "image" ? ticketPreviewUrl(staged!.file) : "",
      filename: staged?.file.name || "",
      leadId: active.leadId,
      sortKey: Date.now(),
      pending: true,
    }

    // Clear the composer first — the draft is now the bubble's problem.
    setPending(prev => [...prev, ticket])
    setDraft("")
    setAttachment(null)
    setEmojiOpen(false)

    /** Puts the composer back exactly as it was, so nothing is ever lost. */
    const restore = (title: string, description?: string) => {
      setPending(prev => prev.filter(p => p.id !== ticket.id))
      setDraft(caption)
      if (staged) setAttachment(staged)
      toast.push({ tone: "danger", title, description })
    }

    try {
      // POST /api/whatsapp claims an unassigned lead for whoever sent the
      // message, from the `senderUid` passed below, so the claim is no longer
      // written from here as well.
      const staffUid = user?.uid || profile?.id

      let uploaded: {
        mediaId: string
        mediaKind: WaMediaKind
        filename: string
      } | null = null

      // Attachments go to WhatsApp's own media store first; the send below then
      // references the returned id. No file hosting of our own is involved.
      if (staged) {
        const form = new FormData()
        form.append("file", staged.file)
        const uploadResponse = await fetch("/api/whatsapp/upload", {
          method: "POST",
          body: form,
        })
        const uploadResult = await uploadResponse.json()

        if (!uploadResult.success) {
          restore("Attachment upload failed", uploadResult.error)
          return
        }
        uploaded = uploadResult
      }

      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: active.name,
          message: caption,
          senderName: staffName,
          senderUid: staffUid || "",
          // Sending as a human is what stops the bot replying on this thread —
          // the same rule the Leads chat panel already follows.
          leadId: active.leadId || activeLead?.id || "",
          ...(uploaded
            ? {
                mediaId: uploaded.mediaId,
                mediaType: uploaded.mediaKind,
                filename: uploaded.filename,
              }
            : {}),
        }),
      })
      const result = await response.json()
      if (result.success) {
        // Pull the stored copy in now rather than waiting up to a full tick for
        // it — that swap is what retires the bubble.
        void refreshMessages()
        // The stored copy normally arrives on that refresh and replaces the
        // bubble; this only covers the case where the send succeeded but the CRM
        // failed to log it, so the clock does not hang there forever.
        window.setTimeout(
          () => setPending(prev => prev.filter(p => p.id !== ticket.id)),
          15000
        )
      } else {
        restore("मेसेज पाठवता आला नाही", result.error)
      }
    } catch (e) {
      console.error("WhatsApp send failed:", e)
      restore("मेसेज पाठवताना त्रुटी आली")
    }
  }

  /**
   * Height is pinned rather than flowing, because a chat client scrolls its own
   * thread instead of the page. The subtraction covers the sticky admin header
   * plus this page's own padding, and the extra on mobile clears the fixed
   * bottom tab bar.
   */
  const shellHeight = "h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-7.5rem)]"

  return (
    <div
      className={cn(
        "flex min-h-0 overflow-hidden rounded-admin border border-admin-border shadow-admin-1",
        shellHeight
      )}
    >
      {/* ── Conversation list ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col min-h-0 bg-wa-panel border-r border-wa-divider",
          // One pane at a time on a phone: the list steps aside for the thread.
          "w-full md:w-75 lg:w-85 md:shrink-0",
          active && "hidden md:flex"
        )}
      >
        <div className="shrink-0 bg-wa-header px-3 py-2.5 border-b border-wa-divider">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1 className="text-admin-base font-semibold text-wa-header-fg">Inbox</h1>
            <span className="admin-num text-admin-2xs text-wa-meta">
              {awaiting > 0 ? `${awaiting} awaiting reply` : `${conversations.length} chats`}
            </span>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-wa-meta pointer-events-none"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or start a new chat"
              className="admin-focus w-full h-9 pl-8 pr-8 rounded-lg bg-wa-panel border border-wa-divider text-admin-sm text-wa-bubble-fg placeholder:text-wa-meta"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="admin-focus absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-wa-meta hover:text-wa-bubble-fg"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-wa-meta">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-admin-sm">Loading conversations…</span>
            </div>
          ) : error ? (
            <p className="px-4 py-12 text-center text-admin-sm text-tone-danger-fg">{error}</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <MessageSquare size={26} className="text-wa-meta" />
              <p className="text-admin-sm font-medium text-wa-bubble-fg">
                {conversations.length === 0 ? "No conversations yet" : "No matches"}
              </p>
              <p className="text-admin-xs text-wa-meta">
                {conversations.length === 0
                  ? "Messages to your WhatsApp number land here in real time."
                  : "Try a different name, number or phrase."}
              </p>
            </div>
          ) : (
            filtered.map(conversation => {
              const isActive = conversation.phone === selectedPhone
              return (
                <button
                  key={conversation.phone}
                  onClick={() => openConversation(conversation.phone)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-wa-divider transition-colors",
                    isActive ? "bg-wa-active" : "hover:bg-wa-hover"
                  )}
                >
                  <span className="w-11 h-11 shrink-0 rounded-full bg-wa-accent text-wa-accent-fg inline-flex items-center justify-center text-admin-sm font-semibold">
                    {initials(conversation.name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="flex-1 truncate text-admin-sm font-medium text-wa-bubble-fg">
                        {conversation.name}
                      </span>
                      <span className="admin-num shrink-0 text-admin-2xs text-wa-meta">
                        {timeAgo(conversation.last.timestamp, now)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 mt-0.5">
                      <span className="flex-1 truncate text-admin-xs text-wa-meta">
                        {conversation.last.sender === "customer" ? "" : "You: "}
                        {conversation.last.text ||
                          (conversation.last.mediaType === "image" ? "📷 Photo" : "📎 Document")}
                      </span>
                      {conversation.awaitingReply && (
                        <span
                          title="Waiting on a reply"
                          className="w-2 h-2 shrink-0 rounded-full bg-wa-accent"
                        />
                      )}
                    </span>
                  </span>
                </button>
              )
            })
          )}

          {messages.length >= messageLimit && !loading && (
            <div className="p-3 text-center border-t border-wa-divider">
              <button
                onClick={() => setMessageLimit(prev => prev + 80)}
                className="text-admin-xs font-semibold text-wa-accent hover:underline py-1 px-3 rounded-admin-sm bg-wa-hover transition-colors"
              >
                Load older messages ({messageLimit} active)
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Thread ────────────────────────────────────────────────────── */}
      <section
        className={cn(
          "flex-1 min-w-0 flex flex-col min-h-0",
          !active && "hidden md:flex"
        )}
      >
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-wa-chat-bg px-6 text-center">
            <MessageSquare size={40} className="text-wa-meta" />
            <p className="text-admin-base font-medium text-wa-bubble-fg">
              Pick a conversation
            </p>
            <p className="text-admin-sm text-wa-meta max-w-xs">
              Every WhatsApp thread with a customer, live. Choose one on the left to read it
              and reply.
            </p>
          </div>
        ) : (
          <>
            <header className="shrink-0 flex items-center gap-2.5 bg-wa-header px-3 py-2 border-b border-wa-divider">
              <button
                onClick={() => openConversation(null)}
                aria-label="Back to conversations"
                className="admin-touch admin-focus md:hidden p-1.5 -ml-1 rounded-full text-wa-meta hover:text-wa-bubble-fg"
              >
                <ArrowLeft size={18} />
              </button>

              <span className="w-9 h-9 shrink-0 rounded-full bg-wa-accent text-wa-accent-fg inline-flex items-center justify-center text-admin-xs font-semibold">
                {initials(active.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-admin-sm font-semibold text-wa-header-fg">
                  {active.name}
                </p>
                <p className="admin-num truncate text-admin-2xs text-wa-meta">
                  +91 {active.phone}
                  {active.category ? ` · ${active.category}` : ""}
                  {active.step > 0 ? ` · bot step ${active.step}` : ""}
                </p>
              </div>

              {/* Direct lead access button */}
              {activeLead ? (
                <button
                  onClick={() => setDetailLead(activeLead)}
                  title="Open full lead details"
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 shrink-0 border border-emerald-400/30 cursor-pointer"
                >
                  <Briefcase size={14} className="text-white shrink-0" />
                  <span className="text-white font-black tracking-wide">Open Lead (लीड उघडा)</span>
                </button>
              ) : (
                <Link
                  href={`/admin/leads?q=${active.phone}`}
                  title="Find this customer in Leads"
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 shrink-0 border border-blue-400/30 cursor-pointer"
                >
                  <ExternalLink size={14} className="text-white shrink-0" />
                  <span className="text-white font-black tracking-wide">Find in Leads</span>
                </Link>
              )}
            </header>

            {/* Drop anywhere on the thread, the way WhatsApp Web does. */}
            <div
              onDragOver={e => {
                if (!e.dataTransfer.types.includes("Files")) return
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={e => {
                // Ignore the events fired while crossing child elements.
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
                setDragging(false)
              }}
              onDrop={e => {
                if (!e.dataTransfer.files?.length) return
                e.preventDefault()
                setDragging(false)
                stageFile(e.dataTransfer.files[0])
              }}
              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar wa-wallpaper"
            >
              {dragging && (
                <div className="absolute inset-0 z-30 m-3 flex flex-col items-center justify-center gap-2 rounded-admin border-2 border-dashed border-wa-accent bg-wa-panel/90">
                  <Paperclip size={22} className="text-wa-accent" />
                  <p className="text-admin-sm font-semibold text-wa-bubble-fg">
                    Drop to attach
                  </p>
                  <p className="text-admin-xs text-wa-meta">Photo, PDF or any file</p>
                </div>
              )}
              <div className="relative z-10 py-3 space-y-1.5">
                {threadMessages.map((message, i) => {
                  const previous = threadMessages[i - 1]
                  const day = formatDayShort(message.timestamp)
                  const newDay = !previous || formatDayShort(previous.timestamp) !== day
                  return (
                    <React.Fragment key={message.id}>
                      {newDay && day && <WhatsAppDayDivider label={day} />}
                      <WhatsAppBubble message={message} />
                    </React.Fragment>
                  )
                })}
                <div ref={endRef} />
              </div>
            </div>

            {emojiOpen && (
              <div className="shrink-0 flex flex-wrap gap-1 border-t border-wa-divider bg-wa-header px-2 py-2">
                {EMOJI.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setDraft(prev => prev + emoji)}
                    className="admin-focus w-10 h-10 sm:w-8 sm:h-8 rounded-md text-admin-lg hover:bg-wa-hover"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Staged attachment: preview, size, and a caption box below. */}
            {attachment && (
              <div className="shrink-0 flex items-center gap-3 border-t border-wa-divider bg-wa-header px-3 py-2.5">
                {attachment.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.previewUrl}
                    alt="Attachment preview"
                    className="w-14 h-14 rounded-md object-cover border border-wa-divider shrink-0"
                  />
                ) : (
                  <span className="w-14 h-14 rounded-md bg-wa-panel border border-wa-divider flex items-center justify-center shrink-0">
                    <FileText size={22} className="text-wa-meta" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-admin-sm font-medium text-wa-bubble-fg truncate">
                    {attachment.file.name}
                  </p>
                  <p className="admin-num text-admin-xs text-wa-meta mt-0.5">
                    {formatBytes(attachment.file.size)} · ready to send
                  </p>
                </div>

                <button
                  onClick={() => setAttachment(null)}
                  aria-label="Remove attachment"
                  className="admin-touch admin-focus p-2 rounded-full text-wa-meta hover:text-wa-bubble-fg shrink-0 disabled:opacity-40"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <div className="relative shrink-0 flex items-end gap-2 bg-wa-header px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-2">
              {/* WhatsApp's paperclip menu: photos on one side, files on the other. */}
              {attachMenuOpen && (
                <>
                  <button
                    aria-label="Close attachment menu"
                    onClick={() => setAttachMenuOpen(false)}
                    className="fixed inset-0 z-20 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute bottom-full left-2 z-30 mb-2 w-52 overflow-hidden rounded-admin border border-admin-border bg-admin-surface shadow-admin-3"
                  >
                    <button
                      role="menuitem"
                      onClick={() => photoInputRef.current?.click()}
                      className="admin-focus flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-admin-surface-2"
                    >
                      <ImageIcon size={16} className="text-tone-info-fg shrink-0" />
                      <span className="text-admin-sm text-admin-text">Photos &amp; videos</span>
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => documentInputRef.current?.click()}
                      className="admin-focus flex w-full items-center gap-2.5 border-t border-admin-border px-3 py-2.5 text-left hover:bg-admin-surface-2"
                    >
                      <FileText size={16} className="text-tone-warn-fg shrink-0" />
                      <span className="text-admin-sm text-admin-text">Document / PDF</span>
                    </button>
                  </div>
                </>
              )}

              <input
                ref={photoInputRef}
                type="file"
                accept={PHOTO_ACCEPT}
                hidden
                onChange={e => {
                  stageFile(e.target.files?.[0])
                  // Reset so picking the same file twice still fires onChange.
                  e.target.value = ""
                }}
              />
              <input
                ref={documentInputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                hidden
                onChange={e => {
                  stageFile(e.target.files?.[0])
                  e.target.value = ""
                }}
              />

              <button
                onClick={() => setEmojiOpen(o => !o)}
                aria-label="Emoji"
                className={cn(
                  "admin-touch admin-focus p-2 rounded-full shrink-0 transition-colors",
                  emojiOpen ? "text-wa-accent" : "text-wa-meta hover:text-wa-bubble-fg"
                )}
              >
                <Smile size={19} />
              </button>

              <button
                onClick={() => setAttachMenuOpen(o => !o)}
                aria-label="Attach a file"
                aria-expanded={attachMenuOpen}
                className={cn(
                  "admin-touch admin-focus p-2 rounded-full shrink-0 transition-colors disabled:opacity-40",
                  attachMenuOpen ? "text-wa-accent" : "text-wa-meta hover:text-wa-bubble-fg"
                )}
              >
                <Paperclip size={19} />
              </button>

              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                /* Screenshot straight into the thread, as on WhatsApp Web. */
                onPaste={e => {
                  const file = Array.from(e.clipboardData?.files ?? [])[0]
                  if (!file) return
                  e.preventDefault()
                  stageFile(file)
                }}
                rows={1}
                placeholder={attachment ? "Add a caption…" : "Type a message"}
                className="admin-focus flex-1 min-h-10 max-h-28 rounded-lg bg-wa-panel border border-wa-divider px-3 py-2.5 text-admin-sm text-wa-bubble-fg placeholder:text-wa-meta resize-none"
              />

              <button
                onClick={send}
                disabled={!draft.trim() && !attachment}
                aria-label={attachment ? "Send attachment" : "Send message"}
                className="admin-focus w-11 h-11 sm:w-10 sm:h-10 shrink-0 rounded-full bg-wa-accent text-wa-accent-fg inline-flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                {/* Never a spinner: the message is already in the thread with a
                    clock on it, which is where the waiting belongs. */}
                <Send size={17} />
              </button>
            </div>
          </>
        )}
      </section>
      {/* In-place Lead Detail Drawer */}
      {detailLead && (
        <LeadDetailSheet
          lead={detailLead}
          now={now}
          onClose={() => setDetailLead(null)}
          onOpenStatusPicker={() => {}}
          onCall={l => {
            const phone = leadPhone(l)
            if (phone) window.location.href = `tel:${phone}`
          }}
          onChat={l => {
            setDetailLead(null)
            const clean = leadPhone(l).replace(/\D/g, "")
            const local = clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
            setSelectedPhone(local)
          }}
          onExternalWhatsApp={l => {
            const clean = leadPhone(l).replace(/\D/g, "")
            const local = clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean
            window.location.href = `https://wa.me/91${local}`
          }}
          telecallers={telecallers}
          canAssign={canAssign}
          canDelete={canDelete}
          onAssign={mutations.assignAgent}
          onFollowUpDate={mutations.setFollowUpDate}
          onFollowUpReason={mutations.setFollowUpReason}
          onSaveDetails={mutations.saveDetails}
          onSaveNote={mutations.saveNote}
          onDelete={mutations.deleteLead}
          onRestore={mutations.restoreLead}
          onSaveBankerLocation={mutations.saveBankerLocation}
        />
      )}
    </div>
  )
}
