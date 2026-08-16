"use client";

import React, { useMemo } from "react";
import { Eye, FilterX, MessageSquare, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AdminButton,
  Column,
  DataTable,
  StatusBadge,
  TONE_CLASSES,
  type Tone,
} from "@/components/admin/ui";
import { formatINR, toAmount } from "@/lib/hooks/useBanks";
import {
  formatDateTime,
  formatDayShort,
  formatRelative,
  formatTime,
  timeAgo,
  toMillis,
} from "@/lib/dates";
import type { Lead } from "@/lib/hooks/useLeads";
import {
  localWaNumber,
  useLatestWhatsApp,
  waPreviewText,
  type LatestWaMessage,
} from "@/lib/hooks/useLatestWhatsApp";
import {
  isOverdue,
  isUntouched,
  lastManualNote,
  leadName,
  leadPhone,
  overdueDays,
  whatsAppNumber,
} from "./leadFilters";

/**
 * The one-glance verdict on a row. With Follow-up off by default, a coloured
 * left border was the only thing saying "this call is four days late" — too
 * quiet for the number that decides who gets rung next.
 */
function AttentionTag({ lead, now }: { lead: Lead; now: number }) {
  const late = overdueDays(lead, now);
  if (late > 0) {
    return (
      <span
        title={`Follow-up overdue by ${late} day${late === 1 ? "" : "s"}`}
        className="shrink-0 inline-flex items-center px-1.5 rounded-full bg-tone-danger text-tone-danger-fg border border-tone-danger-bd text-admin-2xs font-semibold admin-num"
      >
        {late}d late
      </span>
    );
  }
  if (isUntouched(lead)) {
    return (
      <span
        title="Nobody has worked this lead yet"
        className="shrink-0 inline-flex items-center px-1.5 rounded-full bg-tone-info text-tone-info-fg border border-tone-info-bd text-admin-2xs font-semibold"
      >
        New
      </span>
    );
  }
  return null;
}

/**
 * "This number is in the pipeline more than once." The row shown is the most
 * recently touched of them; the older files are still in Firestore, just not
 * taking a second line on the screen.
 */
/**
 * Only an Admin ever sees this: a deleted lead is filtered out of every other
 * role's data before it reaches the table. It sits on the row rather than in a
 * separate screen so the file stays in the pipeline stage it was deleted from.
 */
function DeletedTag() {
  return (
    <span className="shrink-0 rounded-full bg-tone-danger border border-tone-danger-bd px-1.5 py-px text-admin-2xs font-semibold text-tone-danger-fg">
      Deleted
    </span>
  )
}

function DuplicateTag({ count }: { count: number }) {
  return (
    <span
      title={`${count} leads share this phone number — showing the most recently updated one`}
      className="shrink-0 inline-flex items-center px-1.5 rounded-full bg-tone-warn text-tone-warn-fg border border-tone-warn-bd text-admin-2xs font-semibold admin-num"
    >
      ×{count}
    </span>
  );
}

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  error?: string | null;
  now: number;
  showOwner: boolean;
  /** Lead id → how many files share its phone number, when more than one. */
  duplicateCounts?: Map<string, number>;
  onOpen: (lead: Lead) => void;
  onStatusClick: (lead: Lead) => void;
  onCall: (lead: Lead) => void;
  onChat: (lead: Lead) => void;
  onExternalWhatsApp: (lead: Lead) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
  /** Row-count line rendered beside the column picker. */
  toolbarLeft?: React.ReactNode;
}

/** The seven tones, in a fixed order, so a hash can pick one. */
const AVATAR_TONES: Tone[] = [
  "info",
  "violet",
  "cyan",
  "warn",
  "success",
  "danger",
  "neutral",
];

/**
 * Same name → same colour, every session and every device. A random colour per
 * render makes the avatar a distraction instead of a recognition aid.
 */
function toneFromText(text: string, palette: Tone[] = AVATAR_TONES): Tone {
  let hash = 0;
  for (let i = 0; i < text.length; i++)
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const tone = TONE_CLASSES[toneFromText(name)];
  return (
    <span
      aria-hidden
      className={cn(
        "w-8 h-8 shrink-0 rounded-full border inline-flex items-center justify-center text-admin-2xs font-bold",
        tone.soft,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

const WhatsAppGlyph = ({ size = 12 }: { size?: number }) => (
  <svg
    viewBox="0 0 16 16"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden
  >
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592" />
  </svg>
);

/**
 * The second line of the customer cell. Name and number are one identity, not
 * two columns: a telecaller reads "who" and "what do I dial" together, and on
 * the mobile card the number was previously buried in the meta grid between
 * the city and the loan type.
 */
function PhoneLine({
  lead,
  onExternalWhatsApp,
}: {
  lead: Lead;
  onExternalWhatsApp: (lead: Lead) => void;
}) {
  const phone = leadPhone(lead);
  if (!phone) {
    return (
      <span className="block text-admin-xs font-normal text-admin-subtle">
        No phone
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <a
        href={`tel:${phone}`}
        onClick={(e) => e.stopPropagation()}
        className="admin-focus admin-num text-admin-xs font-normal text-admin-muted hover:text-admin-accent hover:underline whitespace-nowrap"
      >
        {phone}
      </a>
      <a
        href={`https://wa.me/${whatsAppNumber(lead)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="थेट WhatsApp उघडा"
        aria-label={`Open WhatsApp for ${leadName(lead)}`}
        onClick={(e) => {
          e.stopPropagation();
          onExternalWhatsApp(lead);
        }}
        className="admin-focus text-tone-success-fg hover:opacity-80 shrink-0"
      >
        <WhatsAppGlyph size={12} />
      </a>
    </span>
  );
}

/** Loan products get a stable pill colour so the column scans by shape + hue. */
function LeadTypePill({ type }: { type?: string }) {
  if (!type) return <span className="text-admin-subtle">—</span>;
  const tone =
    TONE_CLASSES[
      toneFromText(type, ["info", "violet", "cyan", "warn", "success"])
    ];
  return (
    <span
      className={cn(
        "inline-flex items-center max-w-full px-2 py-0.5 rounded-full border text-admin-2xs font-medium truncate",
        tone.soft,
      )}
    >
      {type}
    </span>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="admin-focus w-8 h-8 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 inline-flex items-center justify-center transition-colors"
    >
      <Icon size={14} />
    </button>
  );
}

/**
 * The last thing either side said on WhatsApp, in a chat-list line: who spoke,
 * what they said, and how long ago. Reading the pipeline without it meant
 * opening every thread to find out which customers had already replied.
 */
function WhatsAppCell({
  message,
  now,
}: {
  message: LatestWaMessage | undefined;
  now: number;
}) {
  if (!message) {
    return <span className="text-admin-subtle">—</span>;
  }
  const preview = waPreviewText(message);
  const outgoing = message.sender !== "customer";
  return (
    <span
      className="block min-w-0 truncate text-admin-xs"
      title={`${outgoing ? "You: " : ""}${preview}`}
    >
      <span
        className={cn(
          "font-medium",
          outgoing ? "text-admin-subtle" : "text-tone-success-fg",
        )}
      >
        {outgoing ? "You: " : "↩ "}
      </span>
      <span className="text-admin-muted">{preview}</span>
      <span className="admin-num text-admin-subtle"> · {timeAgo(message.timestamp, now)}</span>
    </span>
  );
}

/**
 * Phone-sized action row. The desktop version packs the icons together; at
 * thumb size that put "call the customer" a few pixels from "open details",
 * so a mis-tap dialled someone. These are 44px tall, labelled, and evenly
 * divided so there is no ambiguous target.
 */
function CardActions({
  lead,
  onCall,
  onChat,
  onExternalWhatsApp,
  onOpen,
}: {
  lead: Lead;
  onCall: (lead: Lead) => void;
  onChat: (lead: Lead) => void;
  onExternalWhatsApp: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
}) {
  const stop = (fn: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation();
    fn();
  };

  const base =
    "admin-focus flex-1 min-h-11 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-xs font-medium text-admin-text inline-flex items-center justify-center gap-1.5 active:bg-admin-surface-2 transition-colors";

  return (
    <div className="grid grid-cols-4 gap-2">
      <button
        onClick={stop(() => onCall(lead))}
        className={base}
        aria-label={`Call ${leadName(lead)}`}
      >
        <Phone size={14} />
        Call
      </button>
      <button
        onClick={stop(() => onChat(lead))}
        className={base}
        aria-label={`Chat with ${leadName(lead)}`}
      >
        <MessageSquare size={14} />
        Chat
      </button>
      <a
        href={`https://wa.me/${whatsAppNumber(lead)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.stopPropagation();
          onExternalWhatsApp(lead);
        }}
        className={base}
        aria-label={`Open WhatsApp for ${leadName(lead)}`}
      >
        <WhatsAppGlyph size={14} />
        WA
      </a>
      <button
        onClick={stop(() => onOpen(lead))}
        className={base}
        aria-label={`Open ${leadName(lead)}`}
      >
        <Eye size={14} />
        Open
      </button>
    </div>
  );
}

export function LeadsTable({
  leads,
  loading,
  error,
  now,
  showOwner,
  duplicateCounts,
  onOpen,
  onStatusClick,
  onCall,
  onChat,
  onExternalWhatsApp,
  selectedIds,
  onSelectionChange,
  onClearFilters,
  hasFilters = false,
  toolbarLeft,
}: LeadsTableProps) {
  /** Latest WhatsApp line per number, for the WhatsApp column below. */
  const latestWhatsApp = useLatestWhatsApp();

  /**
   * Three tiers, and the column order follows them: who this is (name, number,
   * how late they are), then the two facts that decide the next move (status,
   * amount), then the context nobody scans for until they need it — city, loan
   * type, owner, timestamps. Everything below the first tier is a step quieter
   * than the one above it.
   */
  const columns: Column<Lead>[] = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        card: "title",
        width: "w-60",
        sortValue: (lead) => leadName(lead),
        cell: (lead) => (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={leadName(lead)} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-admin-text truncate">
                  {leadName(lead)}
                </span>
                <AttentionTag lead={lead} now={now} />
                {lead.deleted ? <DeletedTag /> : null}
                {duplicateCounts?.get(lead.id) ? (
                  <DuplicateTag count={duplicateCounts.get(lead.id)!} />
                ) : null}
              </div>
              <PhoneLine lead={lead} onExternalWhatsApp={onExternalWhatsApp} />
            </div>
          </div>
        ),
        cardCell: (lead) => (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={leadName(lead)} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">{leadName(lead)}</span>
                <AttentionTag lead={lead} now={now} />
                {lead.deleted ? <DeletedTag /> : null}
                {duplicateCounts?.get(lead.id) ? (
                  <DuplicateTag count={duplicateCounts.get(lead.id)!} />
                ) : null}
              </div>
              <PhoneLine lead={lead} onExternalWhatsApp={onExternalWhatsApp} />
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        card: "trailing",
        // Status, owner and the timestamp are all fixed-shape values, so they
        // are capped rather than left to share the table's slack — the room
        // they were taking belongs to the customer and WhatsApp columns, which
        // hold real sentences.
        width: "w-28",
        sortValue: (lead) => lead.status,
        cell: (lead) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick(lead);
            }}
            className="admin-focus rounded-admin-sm"
            title="Change status"
            aria-label={`Status: ${lead.status}. Change it`}
          >
            <StatusBadge status={lead.status} dot />
          </button>
        ),
        // The pill itself is ~21px tall; on a card, missing it opened the
        // detail sheet instead. Pad the hit area out to 44px.
        cardCell: (lead) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick(lead);
            }}
            className="admin-focus -m-2 p-2 min-h-11 inline-flex items-center rounded-admin-sm active:bg-admin-surface-2"
            aria-label={`Status: ${lead.status}. Change it`}
          >
            <StatusBadge status={lead.status} dot />
          </button>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        align: "right",
        card: "meta",
        // On by default now, and sitting next to the status: "where is this
        // file and how big is it" is the pair every call is triaged on. It was
        // one tick inside the Columns menu, which nobody found.
        sortValue: (lead) => toAmount(lead.amount),
        cell: (lead) => (
          <span className="admin-num text-admin-sm font-medium text-admin-text">
            {formatINR(toAmount(lead.amount))}
          </span>
        ),
      },
      {
        id: "type",
        header: "Lead Type",
        card: "meta",
        sortValue: (lead) => lead.type || "",
        cell: (lead) => <LeadTypePill type={lead.type} />,
      },
      {
        id: "city",
        header: "City",
        card: "meta",
        // Every other column was auto-sized, so City took a share of the table
        // proportional to nothing in particular. A city name is one short word.
        width: "w-24",
        sortValue: (lead) => lead.city || "",
        cell: (lead) => (
          // `truncate` needs a block box to do anything -- on a bare inline
          // span `overflow: hidden` is ignored and a long name would push the
          // column back out to whatever width it wanted.
          <span className="text-admin-muted truncate block">
            {lead.city || "—"}
          </span>
        ),
      },
      {
        id: "owner",
        header: "Assigned To",
        card: "meta",
        width: "w-32",
        defaultHidden: !showOwner,
        sortValue: (lead) => lead.assignedToName || "",
        cell: (lead) => (
          <span className="inline-flex items-center gap-1.5 min-w-0 text-admin-muted">
            <User size={13} className="shrink-0 text-admin-subtle" />
            <span className="truncate">
              {lead.assignedToName || "Unassigned"}
            </span>
          </span>
        ),
      },
      {
        id: "created",
        header: "Created At",
        card: "meta",
        width: "w-28",
        sortValue: (lead) => toMillis(lead.createdAt) ?? 0,
        // Quietest tier on the row: a timestamp is what you check after you
        // have decided to look at a lead, never what makes you look. Exactly
        // two lines — date over time — and each one holds together, so a
        // narrow column can never break the date across a third line.
        cell: (lead) => {
          const stamp = formatDateTime(lead.createdAt);
          if (!stamp) return <span className="text-admin-subtle">—</span>;
          const [day, time] = stamp.split(", ");
          return (
            <span
              className="admin-num block text-admin-xs leading-tight text-admin-subtle"
              title={stamp}
            >
              <span className="block truncate">{day}</span>
              <span className="block truncate">{time}</span>
            </span>
          );
        },
      },
      {
        id: "whatsapp",
        header: "WhatsApp",
        card: "meta",
        width: "w-56",
        sortValue: (lead) =>
          latestWhatsApp.get(localWaNumber(leadPhone(lead)))?.sortKey ?? 0,
        cell: (lead) => (
          <WhatsAppCell
            message={latestWhatsApp.get(localWaNumber(leadPhone(lead)))}
            now={now}
          />
        ),
      },
      {
        id: "followUp",
        header: "Follow-up",
        card: "meta",
        defaultHidden: true,
        // Firestore hands back Timestamps and ISO strings; stringifying them
        // sorted "[object Object]" against "2026-08-06" and produced no order.
        sortValue: (lead) => toMillis(lead.followUpDate) ?? 0,
        cell: (lead) => {
          if (!lead.followUpDate)
            return <span className="text-admin-subtle">—</span>;
          const overdue = isOverdue(lead, now);
          return (
            <span
              className={cn(
                "truncate",
                overdue
                  ? "text-tone-danger-fg font-medium"
                  : "text-admin-xs text-admin-subtle",
              )}
              title={`${formatDayShort(lead.followUpDate)} ${formatTime(lead.followUpDate)}${
                lead.followUpReason ? ` · ${lead.followUpReason}` : ""
              }`}
            >
              {formatRelative(lead.followUpDate, now)}
              {lead.followUpReason ? ` · ${lead.followUpReason}` : ""}
            </span>
          );
        },
      },
      {
        id: "lastNote",
        header: "Last note",
        card: "meta",
        defaultHidden: true,
        // What a colleague actually wrote about this customer, and nothing
        // else: "Changed status to Approved" and "Opened direct WhatsApp chat
        // panel" are the CRM narrating itself, and they used to bury the one
        // remark that decides the next call.
        sortValue: (lead) => lastManualNote(lead) || "",
        cell: (lead) => {
          const note = lastManualNote(lead);
          return note ? (
            <span className="text-admin-muted truncate block" title={note}>
              {note}
            </span>
          ) : (
            <span className="text-admin-subtle">—</span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        pinned: true,
        stickyRight: true,
        cardCell: (lead) => (
          <CardActions
            lead={lead}
            onCall={onCall}
            onChat={onChat}
            onExternalWhatsApp={onExternalWhatsApp}
            onOpen={onOpen}
          />
        ),
        // The three-dot menu is gone: its panel was clipped by the sticky
        // actions cell, so the items inside it were unreachable. Its two useful
        // entries are plain buttons now — status is still changed by pressing
        // the badge in the Status column.
        cell: (lead) => (
          <div className="flex items-center justify-end gap-0.5">
            <IconAction
              label="कॉल करा"
              icon={Phone}
              onClick={() => onCall(lead)}
            />
            <IconAction
              label="CRM chat"
              icon={MessageSquare}
              onClick={() => onChat(lead)}
            />
            <IconAction
              label="तपशील पहा"
              icon={Eye}
              onClick={() => onOpen(lead)}
            />
          </div>
        ),
      },
    ],
    [
      now,
      showOwner,
      duplicateCounts,
      latestWhatsApp,
      onOpen,
      onStatusClick,
      onCall,
      onChat,
      onExternalWhatsApp,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={leads}
      getRowId={(lead) => lead.id}
      loading={loading}
      error={error}
      onRowClick={onOpen}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      paginate
      defaultPageSize={10}
      storageKey="leads"
      toolbarLeft={toolbarLeft}
      getRowClassName={(lead) =>
        isOverdue(lead, now)
          ? "border-l-2 border-l-tone-danger-fg"
          : isUntouched(lead)
            ? "border-l-2 border-l-tone-info-fg"
            : undefined
      }
      emptyTitle={
        hasFilters ? "No leads match these filters" : "माहिती उपलब्ध नाही"
      }
      emptyDescription={
        hasFilters
          ? "Nothing in the pipeline matches the current search, status or filters."
          : "New enquiries arrive here in real time."
      }
      emptyAction={
        hasFilters && onClearFilters ? (
          <AdminButton
            variant="primary"
            icon={FilterX}
            onClick={onClearFilters}
          >
            Clear all filters
          </AdminButton>
        ) : undefined
      }
    />
  );
}
