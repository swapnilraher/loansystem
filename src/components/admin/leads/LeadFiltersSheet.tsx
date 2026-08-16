"use client"

import React, { useState } from "react"
import { Search, X } from "lucide-react"
import { AdminButton, Sheet } from "@/components/admin/ui"
import { Field, Select, TextInput } from "./fields"
import {
  ALL_PARTNERS,
  ALL_SOURCES,
  ALL_TYPES,
  DATE_PRESETS,
  EMPTY_FILTERS,
  LeadFilters,
  SOURCE_OPTIONS,
} from "./leadFilters"

interface LeadFiltersSheetProps {
  open: boolean
  onClose: () => void
  filters: LeadFilters
  onChange: (next: LeadFilters) => void
  facets: { partners: string[]; types: string[]; cities: string[] }
}

export function LeadFiltersSheet({
  open,
  onClose,
  filters,
  onChange,
  facets,
}: LeadFiltersSheetProps) {
  const [citySearch, setCitySearch] = useState("")

  /**
   * Everything in here edits a DRAFT, not the live filter set. Previously each
   * control called `onChange` straight through, so the table re-filtered on
   * every keystroke and every checkbox behind the sheet — and there was no way
   * to back out, because by the time you closed it the change had happened.
   * Nothing leaves this component until "लागू करा" is pressed.
   */
  const [draft, setDraft] = useState<LeadFilters>(filters)

  /**
   * Reseed each time the sheet opens, so it always reflects what is actually
   * applied rather than an abandoned draft from last time. Adjusted during
   * render rather than in an effect, matching the pattern the leads page and
   * the admin layout already use — the committed tree is correct on the first
   * render instead of flashing stale values for a frame.
   */
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(filters)
      setCitySearch("")
    }
  }

  const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) =>
    setDraft(d => ({ ...d, [key]: value }))

  const visibleCities = facets.cities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  )

  /** Whether every city currently listed is already ticked. */
  const allVisibleSelected =
    visibleCities.length > 0 && visibleCities.every(c => draft.cities.includes(c))

  /**
   * Acts on what is on screen, not the whole facet list — with a search term
   * typed, "select all" meaning "also everything you filtered out" would be a
   * trap. Union/subtract so selections made under a different search survive.
   */
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const drop = new Set(visibleCities)
      set("cities", draft.cities.filter(c => !drop.has(c)))
    } else {
      set("cities", Array.from(new Set([...draft.cities, ...visibleCities])))
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="sm"
      title="फिल्टर्स निवडा"
      description="Narrow the pipeline down"
      footer={
        <>
          <AdminButton
            variant="ghost"
            onClick={() => {
              // Clears the draft only — still needs लागू करा to take effect.
              // Keep the search box, the status chip and the attention switch —
              // each has its own control outside this sheet, and resetting a
              // control the user cannot see from here would surprise them.
              setDraft({
                ...EMPTY_FILTERS,
                search: draft.search,
                status: draft.status,
                attention: draft.attention,
              })
              setCitySearch("")
            }}
          >
            रिसेट करा
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => {
              onChange(draft)
              onClose()
            }}
          >
            लागू करा
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="तारीख फिल्टर (Date)">
          <Select value={draft.datePreset} onChange={e => set("datePreset", e.target.value)}>
            {DATE_PRESETS.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        {draft.datePreset === "Custom Range" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="From">
              <TextInput
                type="date"
                value={draft.dateRange.start}
                onChange={e => set("dateRange", { ...draft.dateRange, start: e.target.value })}
              />
            </Field>
            <Field label="To">
              <TextInput
                type="date"
                value={draft.dateRange.end}
                onChange={e => set("dateRange", { ...draft.dateRange, end: e.target.value })}
              />
            </Field>
          </div>
        )}

        <Field label="लोन प्रकार (Loan type)">
          <Select value={draft.type} onChange={e => set("type", e.target.value)}>
            <option value={ALL_TYPES}>{ALL_TYPES}</option>
            {facets.types.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        {/* Source and partner are mutually exclusive: a partner lead always has
            category "Partner", so combining them can only ever return nothing. */}
        <Field label="मार्ग/स्रोत (Source)">
          <Select
            value={draft.source}
            disabled={draft.partner !== ALL_PARTNERS}
            onChange={e => set("source", e.target.value)}
          >
            <option value={ALL_SOURCES}>{ALL_SOURCES}</option>
            {SOURCE_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="भागीदार (DSA partner)">
          <Select
            value={draft.partner}
            disabled={draft.source !== ALL_SOURCES}
            onChange={e => set("partner", e.target.value)}
          >
            <option value={ALL_PARTNERS}>{ALL_PARTNERS}</option>
            {facets.partners.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="block text-admin-2xs font-semibold uppercase tracking-wide text-admin-subtle">
              शहर (City){draft.cities.length > 0 ? ` · ${draft.cities.length} निवडले` : ""}
            </span>
            {visibleCities.length > 0 && (
              <button
                type="button"
                onClick={toggleAllVisible}
                className="admin-focus shrink-0 h-7 px-1.5 -mr-1.5 rounded-admin-sm text-admin-2xs font-semibold text-admin-accent hover:underline"
              >
                {allVisibleSelected
                  ? "सर्व काढा (Clear all)"
                  : `सर्व निवडा (Select all${
                      citySearch ? ` ${visibleCities.length}` : ""
                    })`}
              </button>
            )}
          </div>

          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-subtle pointer-events-none"
            />
            <TextInput
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              placeholder="शहर शोधा… (e.g. Pune)"
              className="pl-8 pr-8 h-8"
            />
            {citySearch && (
              <button
                onClick={() => setCitySearch("")}
                aria-label="Clear city search"
                className="admin-focus absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-admin-subtle hover:text-admin-text"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Taller on a phone: a 165px window nested inside the sheet's own
              scroller meant two competing scroll areas under one thumb. */}
          <div className="max-h-72 sm:max-h-44 overflow-y-auto custom-scrollbar overscroll-contain bg-admin-surface-2 border border-admin-border rounded-admin-sm p-1.5 space-y-0.5">
            {visibleCities.length === 0 ? (
              <p className="text-admin-xs text-admin-subtle text-center py-3">
                {facets.cities.length === 0 ? "शहर उपलब्ध नाहीत" : "निकालात शहर सापडले नाही"}
              </p>
            ) : (
              visibleCities.map(city => (
                <label
                  key={city}
                  className="flex items-center justify-between gap-2 px-2 min-h-11 sm:min-h-0 sm:py-1.5 rounded-admin-sm hover:bg-admin-surface cursor-pointer"
                >
                  <span className="text-admin-sm text-admin-text truncate">{city}</span>
                  <input
                    type="checkbox"
                    checked={draft.cities.includes(city)}
                    onChange={e =>
                      set(
                        "cities",
                        e.target.checked
                          ? [...draft.cities, city]
                          : draft.cities.filter(c => c !== city)
                      )
                    }
                    className="admin-focus w-5 h-5 sm:w-3.5 sm:h-3.5 rounded-sm border border-admin-border-strong accent-admin-accent cursor-pointer shrink-0"
                  />
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
