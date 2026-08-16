"use client"

import React from "react"
import { Check, CheckCheck, Clock, Download, FileText, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/dates"

export interface WaMessage {
  id: string
  phone: string
  text?: string
  sender?: "customer" | "bot" | "staff"
  userName?: string
  timestamp?: unknown
  mediaType?: string
  mediaUrl?: string
  filename?: string
  /** Present on most rows; lets a reply mute the bot for the right lead. */
  leadId?: string
  /**
   * Written locally and not yet confirmed by WhatsApp. Sits in the thread the
   * moment the staff member presses send, exactly as the real client does, with
   * a clock in place of the tick until the send comes back.
   */
  pending?: boolean
  /** Millis, resolved once on read so sorting never touches Firestore types. */
  sortKey: number
}

/**
 * One message, in WhatsApp's own bubble language.
 *
 * Incoming sits left on the panel colour, outgoing sits right on the green.
 * The little tail is a CSS triangle rather than an SVG: it is two borders and
 * it inherits the bubble colour automatically in both themes.
 */
export function WhatsAppBubble({ message }: { message: WaMessage }) {
  const incoming = message.sender === "customer"
  const author =
    message.sender === "bot"
      ? "TechStar bot"
      : message.sender === "staff"
        ? message.userName || "Staff"
        : null

  return (
    // px-3 is not decorative: the tail below is offset 11px outside the bubble,
    // and the thread is a scroll container, so anything narrower clips it off
    // (or opens a horizontal scrollbar).
    <div className={cn("flex px-3", incoming ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[65%] rounded-lg px-2 py-1.5 shadow-admin-1",
          // The tail: a 8px triangle pinned to the top outer corner, coloured
          // by whichever bubble it belongs to.
          "before:absolute before:top-0 before:w-0 before:h-0 before:border-[6px]",
          incoming
            ? "bg-wa-bubble-in rounded-tl-none before:-left-[11px] before:border-transparent before:border-t-wa-bubble-in before:border-r-wa-bubble-in"
            : "bg-wa-bubble-out rounded-tr-none before:-right-[11px] before:border-transparent before:border-t-wa-bubble-out before:border-l-wa-bubble-out"
        )}
      >
        {/* Only labelled when it is not the customer -- staff need to know
            whether the bot or a colleague sent it. */}
        {author && (
          <p className="text-admin-2xs font-semibold text-wa-accent mb-0.5">{author}</p>
        )}

        {message.mediaType === "image" && message.mediaUrl && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-focus block mb-1 rounded-md overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.mediaUrl}
              alt={message.text || "Attachment"}
              className="w-full max-h-64 object-cover"
            />
          </a>
        )}

        {/* An attachment we cannot serve. Messages received before the media
            pipeline was fixed were stored with neither a URL nor a WhatsApp
            media id, so there is nothing left to fetch — say so rather than
            render just the "📷 Image" caption, which reads as a normal text
            message and leaves staff wondering where the picture went. */}
        {message.mediaType && !message.mediaUrl && (
          <span className="mb-1 flex items-center gap-2 rounded-md bg-wa-chat-bg/60 p-2">
            <ImageOff size={15} className="text-wa-meta shrink-0" />
            <span className="text-admin-xs text-wa-meta">
              {message.mediaType === "image" ? "Photo" : "File"} unavailable
            </span>
          </span>
        )}

        {message.mediaType === "document" && message.mediaUrl && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-focus mb-1 flex items-center gap-2 rounded-md bg-wa-chat-bg/60 p-2"
          >
            <FileText size={16} className="text-wa-meta shrink-0" />
            <span className="text-admin-xs text-wa-bubble-fg truncate flex-1">
              {message.filename || "Document"}
            </span>
            <Download size={13} className="text-wa-meta shrink-0" />
          </a>
        )}

        {message.text && (
          // `pr` reserves the corner the timestamp floats into, the way the
          // real client does, so the last line never runs under the clock.
          <p className="text-admin-sm text-wa-bubble-fg whitespace-pre-wrap break-words pr-12">
            {message.text}
          </p>
        )}

        <span className="absolute bottom-1 right-2 flex items-center gap-0.5 text-admin-2xs text-wa-meta">
          {formatTime(message.timestamp)}
          {/* Outbound only, matching WhatsApp: we know it left the CRM, so one
              tick. We get no delivery receipt back, so never show two. */}
          {!incoming &&
            (message.pending ? (
              <Clock size={12} className="animate-pulse" />
            ) : message.sender === "bot" ? (
              <CheckCheck size={13} className="text-wa-tick" />
            ) : (
              <Check size={13} />
            ))}
        </span>
      </div>
    </div>
  )
}

/** The centred pill WhatsApp uses to break a thread up by day. */
export function WhatsAppDayDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-2">
      <span className="rounded-md bg-wa-panel px-3 py-1 text-admin-2xs font-medium uppercase tracking-wide text-wa-meta shadow-admin-1">
        {label}
      </span>
    </div>
  )
}
