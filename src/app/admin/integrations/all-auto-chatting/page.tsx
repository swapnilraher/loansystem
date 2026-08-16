"use client"

/**
 * The WhatsApp bot's script, editable.
 *
 * What this screen writes is what the bot reads: `/api/flows` stores it and the
 * webhook merges it over the shipped defaults on the next message (see
 * `@/lib/waFlowStore`). The previous version of this page saved to a collection
 * nothing consumed, so every edit was decorative.
 *
 * Admin only. The route guard in the admin layout enforces that on navigation,
 * `/api/flows` enforces it again on every read and write, and the guard below is
 * the third layer — a Manager who reaches this URL sees why, not a broken page.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { authedFetch, authedJson } from "@/lib/authedFetch"
import { AdminButton, EmptyState, PageHeader, Sheet, SkeletonRows, useToast } from "@/components/admin/ui"
import {
  DEFAULT_CONFIG,
  LANGS,
  LANG_LABELS,
  MESSAGE_META,
  slugify,
  type FlowCondition,
  type FlowOption,
  type FlowStep,
  type Lang,
  type Localized,
  type StepType,
  type WaFlow,
  type WaFlowConfig,
  type WaMessages,
} from "@/lib/waFlows"

const STEP_TYPES: { value: StepType; label: string; hint: string }[] = [
  { value: "text", label: "Text", hint: "Any typed answer" },
  { value: "number", label: "Number", hint: "Amounts, PIN codes, scores" },
  { value: "dropdown", label: "Options", hint: "Buttons, or a list above 3 options" },
]

const CONDITION_OPS: { value: FlowCondition["op"]; label: string }[] = [
  { value: "equals", label: "is exactly" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "has no answer yet" },
  { value: "isNotEmpty", label: "has any answer" },
]

function newId(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`
}

/** A blank flow, pre-filled with the one step every flow needs. */
function blankFlow(order: number): WaFlow {
  return {
    id: "",
    category: "",
    label: {},
    order,
    enabled: true,
    intro: {},
    steps: [
      {
        id: newId("s"),
        field: "",
        type: "text",
        question: {},
        condition: null,
      },
    ],
  }
}

// ─── Small inputs ────────────────────────────────────────────────────────────

const fieldClass =
  "w-full rounded-admin-sm border border-admin-border bg-admin-surface px-3 py-2 text-admin-sm text-admin-text outline-none focus:border-admin-accent"

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <span className="text-admin-xs font-semibold uppercase tracking-wide text-admin-muted">
        {children}
      </span>
      {hint && <p className="text-admin-xs text-admin-subtle mt-0.5 normal-case">{hint}</p>}
    </div>
  )
}

/**
 * One value in three languages.
 *
 * Tabbed rather than three boxes stacked: staff edit one language at a time, and
 * a nine-textarea step card was unreadable on a phone. The dot marks a language
 * that has text, so a half-translated question is visible without opening it.
 */
function LocalizedInput({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: Localized
  onChange: (next: Localized) => void
  rows?: number
  placeholder?: string
}) {
  const [lang, setLang] = useState<Lang>("mr")

  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        {LANGS.map(code => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`px-2.5 py-1 rounded-admin-sm text-admin-xs font-semibold transition-colors ${
              lang === code
                ? "bg-admin-accent text-admin-accent-fg"
                : "bg-admin-surface-2 text-admin-muted hover:text-admin-text"
            }`}
          >
            {LANG_LABELS[code]}
            {value[code]?.trim() ? " ●" : ""}
          </button>
        ))}
      </div>
      {rows === 1 ? (
        <input
          className={fieldClass}
          placeholder={placeholder}
          value={value[lang] || ""}
          onChange={e => onChange({ ...value, [lang]: e.target.value })}
        />
      ) : (
        <textarea
          className={`${fieldClass} resize-y`}
          rows={rows}
          placeholder={placeholder}
          value={value[lang] || ""}
          onChange={e => onChange({ ...value, [lang]: e.target.value })}
        />
      )}
    </div>
  )
}

// ─── Option editor ───────────────────────────────────────────────────────────

function OptionRows({
  options,
  onChange,
}: {
  options: FlowOption[]
  onChange: (next: FlowOption[]) => void
}) {
  const update = (index: number, patch: Partial<FlowOption>) =>
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)))

  return (
    <div className="space-y-2">
      {options.map((option, i) => (
        <div key={i} className="rounded-admin border border-admin-border p-3 bg-admin-surface-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-admin-xs font-semibold text-admin-muted">Option {i + 1}</span>
            <button
              type="button"
              onClick={() => onChange(options.filter((_, index) => index !== i))}
              className="ml-auto text-admin-subtle hover:text-tone-danger-fg"
              aria-label={`Remove option ${i + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <Label hint="Saved to the lead. Keep it in English — the CRM reads and filters on this.">
            Stored value
          </Label>
          <input
            className={`${fieldClass} mb-2`}
            placeholder="e.g. Balance Transfer"
            value={option.value}
            onChange={e => update(i, { value: e.target.value })}
          />

          <Label hint="What the customer sees. Buttons cut off after 20 characters, list rows after 24.">
            Shown to customer
          </Label>
          <LocalizedInput
            rows={1}
            value={option.label}
            placeholder="e.g. बॅलन्स ट्रान्सफर"
            onChange={label => update(i, { label })}
          />
        </div>
      ))}

      <AdminButton
        size="sm"
        icon={Plus}
        onClick={() => onChange([...options, { value: "", label: {} }])}
      >
        Add option
      </AdminButton>

      {options.length > 3 && (
        <p className="text-admin-xs text-admin-muted">
          More than 3 options — WhatsApp will send this question as a selectable list.
        </p>
      )}
    </div>
  )
}

// ─── Step editor ─────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  total,
  earlierFields,
  onChange,
  onMove,
  onRemove,
}: {
  step: FlowStep
  index: number
  total: number
  earlierFields: string[]
  onChange: (next: FlowStep) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const condition = step.condition

  return (
    <div className="rounded-admin border border-admin-border bg-admin-surface">
      <div className="flex items-center gap-2 p-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-admin-surface-2 text-admin-xs font-semibold text-admin-text grid place-items-center">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-admin-sm text-admin-text truncate">
            {step.question.mr || step.question.en || step.question.hi || "New question"}
          </p>
          <p className="text-admin-xs text-admin-subtle truncate">
            {step.field || "no field"} · {step.type}
            {condition ? " · conditional" : ""}
          </p>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1.5 text-admin-subtle hover:text-admin-text disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1.5 text-admin-subtle hover:text-admin-text disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-admin-subtle hover:text-tone-danger-fg"
            aria-label="Delete question"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="p-1.5 text-admin-subtle hover:text-admin-text"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-admin-border p-3 space-y-3">
          <div>
            <Label>Question</Label>
            <LocalizedInput
              value={step.question}
              onChange={question => onChange({ ...step, question })}
              placeholder="What the bot asks"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label hint="The lead field this answer is saved to, e.g. propertyValue.">
                Saves to
              </Label>
              <input
                className={fieldClass}
                placeholder="fieldName"
                value={step.field}
                onChange={e => onChange({ ...step, field: e.target.value.trim() })}
              />
            </div>
            <div>
              <Label>Answer type</Label>
              <select
                className={fieldClass}
                value={step.type}
                onChange={e => {
                  const type = e.target.value as StepType
                  onChange({
                    ...step,
                    type,
                    options: type === "dropdown" ? step.options || [] : undefined,
                  })
                }}
              >
                {STEP_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label} — {t.hint}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {step.type === "dropdown" && (
            <div>
              <Label>Options</Label>
              <OptionRows
                options={step.options || []}
                onChange={options => onChange({ ...step, options })}
              />
            </div>
          )}

          <div className="rounded-admin border border-admin-border bg-admin-surface-2 p-3">
            <Label hint="Leave off to always ask. A skipped question keeps its place in the order.">
              Ask only when
            </Label>
            {condition ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    className={fieldClass}
                    value={condition.field}
                    onChange={e =>
                      onChange({ ...step, condition: { ...condition, field: e.target.value } })
                    }
                  >
                    <option value="">Select a field…</option>
                    {earlierFields.map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                    {condition.field && !earlierFields.includes(condition.field) && (
                      <option value={condition.field}>{condition.field}</option>
                    )}
                  </select>
                  <select
                    className={fieldClass}
                    value={condition.op}
                    onChange={e =>
                      onChange({
                        ...step,
                        condition: { ...condition, op: e.target.value as FlowCondition["op"] },
                      })
                    }
                  >
                    {CONDITION_OPS.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(condition.op === "equals" || condition.op === "notEquals") && (
                  <input
                    className={fieldClass}
                    placeholder="Stored value, e.g. Yes"
                    value={condition.value || ""}
                    onChange={e =>
                      onChange({ ...step, condition: { ...condition, value: e.target.value } })
                    }
                  />
                )}
                <AdminButton
                  size="sm"
                  variant="ghost"
                  icon={X}
                  onClick={() => onChange({ ...step, condition: null })}
                >
                  Always ask this
                </AdminButton>
              </div>
            ) : (
              <AdminButton
                size="sm"
                icon={Plus}
                onClick={() =>
                  onChange({
                    ...step,
                    condition: { field: earlierFields[0] || "", op: "equals", value: "" },
                  })
                }
              >
                Add a condition
              </AdminButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Flow editor sheet ───────────────────────────────────────────────────────

function FlowEditor({
  flow,
  open,
  onClose,
  onSave,
  saving,
}: {
  flow: WaFlow
  open: boolean
  onClose: () => void
  onSave: (flow: WaFlow) => void
  saving: boolean
}) {
  const [draft, setDraft] = useState<WaFlow>(flow)

  // A different flow opened in the same sheet — reset the form to it.
  const [seededId, setSeededId] = useState(flow.id)
  if (flow.id !== seededId) {
    setSeededId(flow.id)
    setDraft(flow)
  }

  const patch = (updates: Partial<WaFlow>) => setDraft(d => ({ ...d, ...updates }))

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draft.steps.length) return
    const steps = [...draft.steps]
    const [moved] = steps.splice(index, 1)
    steps.splice(target, 0, moved)
    patch({ steps })
  }

  const problems: string[] = []
  if (!draft.category.trim()) problems.push("Give the product a name.")
  if (draft.steps.length === 0) problems.push("Add at least one question.")
  draft.steps.forEach((step, i) => {
    if (!step.field.trim()) problems.push(`Question ${i + 1} has no field to save to.`)
    if (!Object.values(step.question).some(t => t?.trim()))
      problems.push(`Question ${i + 1} has no text.`)
    if (step.type === "dropdown" && (step.options || []).length === 0)
      problems.push(`Question ${i + 1} is an options question with no options.`)
  })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="lg"
      title={flow.id ? `Edit ${flow.category || "flow"}` : "New flow"}
      description="Questions are asked top to bottom. The customer's name and language are collected before any flow runs."
      footer={
        <div className="flex items-center justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Save}
            loading={saving}
            disabled={problems.length > 0}
            onClick={() => onSave(draft)}
          >
            Save flow
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label hint="Written to the lead as its loan type. Changing it on an existing flow creates a new one.">
            Product name
          </Label>
          <input
            className={fieldClass}
            placeholder="e.g. Home Loan"
            value={draft.category}
            onChange={e => patch({ category: e.target.value })}
          />
        </div>

        <div>
          <Label hint="How the product appears in the WhatsApp menu.">Menu label</Label>
          <LocalizedInput
            rows={1}
            value={draft.label}
            placeholder="e.g. होम लोन"
            onChange={label => patch({ label })}
          />
        </div>

        <div>
          <Label hint="Sent once, before the first question. Leave blank to use the default intro.">
            Opening message
          </Label>
          <LocalizedInput
            value={draft.intro || {}}
            onChange={intro => patch({ intro })}
            placeholder="नमस्कार सर/मॅडम 🙏"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Questions ({draft.steps.length})</Label>
            <AdminButton
              size="sm"
              icon={Plus}
              onClick={() =>
                patch({
                  steps: [
                    ...draft.steps,
                    { id: newId("s"), field: "", type: "text", question: {}, condition: null },
                  ],
                })
              }
            >
              Add question
            </AdminButton>
          </div>

          <div className="space-y-2">
            {draft.steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                total={draft.steps.length}
                earlierFields={draft.steps.slice(0, i).map(s => s.field).filter(Boolean)}
                onChange={next =>
                  patch({ steps: draft.steps.map((s, index) => (index === i ? next : s)) })
                }
                onMove={direction => moveStep(i, direction)}
                onRemove={() => patch({ steps: draft.steps.filter((_, index) => index !== i) })}
              />
            ))}
          </div>
        </div>

        {problems.length > 0 && (
          <div className="rounded-admin border border-tone-warn-bd bg-tone-warn p-3">
            <p className="text-admin-xs font-semibold text-tone-warn-fg flex items-center gap-1.5">
              <AlertTriangle size={13} /> Fix before saving
            </p>
            <ul className="mt-1 space-y-0.5">
              {problems.slice(0, 5).map((problem, i) => (
                <li key={i} className="text-admin-xs text-tone-warn-fg">
                  • {problem}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  )
}

// ─── Messages tab ────────────────────────────────────────────────────────────

function MessagesPanel({
  messages,
  onSave,
  saving,
}: {
  messages: WaMessages
  onSave: (next: WaMessages) => void
  saving: boolean
}) {
  const [draft, setDraft] = useState<WaMessages>(messages)
  const dirty = JSON.stringify(draft) !== JSON.stringify(messages)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 sticky top-0 z-10 bg-admin-bg py-2">
        <p className="text-admin-xs text-admin-muted">
          Everything the bot says outside a product&apos;s own questions.
        </p>
        <AdminButton
          variant="primary"
          size="sm"
          icon={Save}
          loading={saving}
          disabled={!dirty}
          onClick={() => onSave(draft)}
        >
          Save messages
        </AdminButton>
      </div>

      {MESSAGE_META.map(meta => (
        <div key={meta.key} className="rounded-admin border border-admin-border bg-admin-surface p-3">
          <Label hint={meta.hint}>{meta.title}</Label>
          <LocalizedInput
            value={draft[meta.key]}
            rows={meta.key === "pickOption" ? 1 : 4}
            onChange={value => setDraft(d => ({ ...d, [meta.key]: value }))}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AllAutoChatting() {
  const { role, loading: authLoading } = useAuth()
  const toast = useToast()

  const [config, setConfig] = useState<WaFlowConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<"flows" | "messages">("flows")
  const [editing, setEditing] = useState<WaFlow | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [resetting, setResetting] = useState<WaFlow | null>(null)

  const isAdmin = role === "Admin"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authedFetch("/api/flows")
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Could not load flows")
      setConfig({
        flows: data.flows,
        messages: data.messages,
        automationEnabled: data.automationEnabled,
      })
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not load the bot script",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // Async so the first state change lands after the render, not during it.
    const run = async () => {
      if (authLoading) return
      if (isAdmin) await load()
      else setLoading(false)
    }
    run()
  }, [authLoading, isAdmin, load])

  const saveFlow = async (flow: WaFlow) => {
    setSaving(true)
    try {
      const payload: WaFlow = {
        ...flow,
        id: flow.id || slugify(flow.category),
        order: flow.order ?? config.flows.length + 1,
      }
      const res = await authedJson("/api/flows", "POST", { flow: payload })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")

      setConfig(c => {
        const exists = c.flows.some(f => f.category === payload.category)
        return {
          ...c,
          flows: exists
            ? c.flows.map(f => (f.category === payload.category ? payload : f))
            : [...c.flows, payload],
        }
      })
      setEditing(null)
      toast.push({ tone: "success", title: "Flow saved — live within a minute" })
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not save the flow",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  /** Enable / disable and reordering are saves of the whole flow. */
  const patchFlow = async (flow: WaFlow, updates: Partial<WaFlow>) => {
    await saveFlow({ ...flow, ...updates })
  }

  const moveFlow = async (flow: WaFlow, direction: -1 | 1) => {
    const ordered = [...config.flows].sort((a, b) => a.order - b.order)
    const index = ordered.findIndex(f => f.category === flow.category)
    const target = index + direction
    if (target < 0 || target >= ordered.length) return

    // Swapping the two `order` values keeps every other flow where it is.
    const other = ordered[target]
    await patchFlow(flow, { order: other.order })
    await patchFlow(other, { order: flow.order })
  }

  const resetFlow = async (flow: WaFlow) => {
    setSaving(true)
    try {
      const res = await authedJson(`/api/flows?id=${encodeURIComponent(flow.id)}`, "DELETE")
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Reset failed")
      setResetting(null)
      await load()
      toast.push({ tone: "success", title: "Flow reset to the shipped version" })
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not reset the flow",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const saveMessages = async (messages: WaMessages) => {
    setSaving(true)
    try {
      const res = await authedJson("/api/flows", "PATCH", { messages })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      setConfig(c => ({ ...c, messages }))
      toast.push({ tone: "success", title: "Messages saved" })
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not save the messages",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleAutomation = async (enabled: boolean) => {
    setSaving(true)
    try {
      const res = await authedJson("/api/flows", "PATCH", { automationEnabled: enabled })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      setConfig(c => ({ ...c, automationEnabled: enabled }))
      toast.push({
        tone: enabled ? "success" : "warn",
        title: enabled ? "Automation is on" : "Automation is off",
        description: enabled
          ? undefined
          : "Incoming messages go straight to the inbox until you turn it back on.",
      })
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not change the automation switch",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const ordered = useMemo(
    () => [...config.flows].sort((a, b) => a.order - b.order),
    [config.flows]
  )

  if (!authLoading && !isAdmin) {
    return (
      <EmptyState
        icon={Bot}
        title="Admins only"
        description="The WhatsApp bot script can only be changed by an Admin. Ask an administrator if a question needs to change."
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp Auto Chatting"
        subtitle="The questions the bot asks and everything it says. Saved changes reach live conversations within a minute."
        breadcrumbs={[{ label: "System" }, { label: "Auto Chatting" }]}
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant={config.automationEnabled ? "secondary" : "danger"}
              icon={config.automationEnabled ? Eye : EyeOff}
              onClick={() => toggleAutomation(!config.automationEnabled)}
              loading={saving}
            >
              Automation {config.automationEnabled ? "ON" : "OFF"}
            </AdminButton>
            {tab === "flows" && (
              <AdminButton
                variant="primary"
                icon={Plus}
                onClick={() => setEditing(blankFlow(ordered.length + 1))}
              >
                New flow
              </AdminButton>
            )}
          </div>
        }
      >
        <div className="flex gap-1 mt-3">
          {(["flows", "messages"] as const).map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-admin-sm text-admin-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-admin-accent text-admin-accent-fg"
                  : "text-admin-muted hover:text-admin-text"
              }`}
            >
              {key === "flows" ? "Flows" : "Bot messages"}
            </button>
          ))}
        </div>
      </PageHeader>

      {!config.automationEnabled && (
        <div className="rounded-admin border border-tone-warn-bd bg-tone-warn p-3 flex items-start gap-2">
          <AlertTriangle size={15} className="text-tone-warn-fg mt-0.5 shrink-0" />
          <p className="text-admin-xs text-tone-warn-fg">
            Automation is off. Customers who message get no reply from the bot — every message lands
            in the WhatsApp Inbox for staff to answer by hand.
          </p>
        </div>
      )}

      {loading ? (
        <SkeletonRows rows={4} />
      ) : tab === "messages" ? (
        <MessagesPanel messages={config.messages} onSave={saveMessages} saving={saving} />
      ) : (
        <div className="space-y-2">
          {ordered.map((flow, index) => {
            const isOpen = expanded === flow.category
            return (
              <div
                key={flow.category}
                className={`rounded-admin border bg-admin-surface ${
                  flow.enabled ? "border-admin-border" : "border-admin-border opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 p-3">
                  <div className="w-9 h-9 rounded-admin-sm bg-admin-surface-2 grid place-items-center shrink-0">
                    <MessageSquare size={16} className="text-admin-muted" />
                  </div>
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => setExpanded(isOpen ? null : flow.category)}
                  >
                    <p className="text-admin-sm font-semibold text-admin-text truncate">
                      {flow.category}
                    </p>
                    <p className="text-admin-xs text-admin-subtle truncate">
                      {flow.steps.length} question{flow.steps.length === 1 ? "" : "s"} ·{" "}
                      {flow.enabled ? "in the menu" : "hidden from the menu"}
                    </p>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveFlow(flow, -1)}
                      disabled={index === 0 || saving}
                      className="p-1.5 text-admin-subtle hover:text-admin-text disabled:opacity-30"
                      aria-label="Move up the menu"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveFlow(flow, 1)}
                      disabled={index === ordered.length - 1 || saving}
                      className="p-1.5 text-admin-subtle hover:text-admin-text disabled:opacity-30"
                      aria-label="Move down the menu"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => patchFlow(flow, { enabled: !flow.enabled })}
                      disabled={saving}
                      className="p-1.5 text-admin-subtle hover:text-admin-text"
                      aria-label={flow.enabled ? "Hide from the menu" : "Show in the menu"}
                    >
                      {flow.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => setEditing(flow)}
                      className="p-1.5 text-admin-subtle hover:text-admin-text"
                      aria-label="Edit flow"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setResetting(flow)}
                      className="p-1.5 text-admin-subtle hover:text-tone-danger-fg"
                      aria-label="Reset flow"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-admin-border p-3 space-y-2">
                    {flow.steps.map((step, i) => (
                      <div key={step.id} className="flex gap-2">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-admin-surface-2 text-[10px] font-semibold text-admin-muted grid place-items-center mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-admin-sm text-admin-text whitespace-pre-line">
                            {step.question.mr || step.question.en}
                          </p>
                          <p className="text-admin-xs text-admin-subtle">
                            → {step.field}
                            {step.options?.length
                              ? ` · ${step.options.map(o => o.value).join(" / ")}`
                              : ""}
                            {step.condition
                              ? ` · only when ${step.condition.field} ${
                                  CONDITION_OPS.find(o => o.value === step.condition?.op)?.label
                                } ${step.condition.value || ""}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <FlowEditor
          flow={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
          onSave={saveFlow}
          saving={saving}
        />
      )}

      <Sheet
        open={!!resetting}
        onClose={() => setResetting(null)}
        side="center"
        size="sm"
        title="Reset this flow?"
        dismissOnBackdrop={false}
        footer={
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" onClick={() => setResetting(null)}>
              Keep my version
            </AdminButton>
            <AdminButton
              variant="danger"
              loading={saving}
              onClick={() => resetting && resetFlow(resetting)}
            >
              Reset
            </AdminButton>
          </div>
        }
      >
        <p className="text-admin-sm text-admin-text">
          <strong>{resetting?.category}</strong> goes back to the questions it shipped with. Your
          edits to this flow are discarded. Products that only exist here are removed from the menu.
        </p>
      </Sheet>
    </div>
  )
}
