/**
 * Confine Bootstrap to the marketing site; keep it out of the CRM entirely.
 *
 * The problem: bootstrap.min.css is imported globally and declares no `@layer`.
 * Unlayered author styles beat every layered one, and all of Tailwind is
 * layered, so Bootstrap silently won across the whole app -- Reboot's
 * `h1{font-size:calc(1.375rem + 1.5vw)}` over `text-admin-xl`,
 * `label{display:inline-block}` over `block` (which shrank every form field to
 * the width of its own placeholder), and `button,input,select,textarea
 * {font-size:inherit}` over every `text-admin-*` size.
 *
 * Moving Bootstrap into a low cascade layer fixes the CRM but breaks the
 * marketing site, because its headings have no explicit size class and were
 * relying on Reboot's defaults -- demote Reboot and the hero h1 drops to 17px.
 * And it does not even fix everything: Bootstrap's utilities (`.px-3`, `.p-5`,
 * `.gap-3`, ...) are `!important`, and for important declarations the cascade
 * REVERSES layer order, so a lower layer wins. They kept overriding Tailwind's
 * same-named utilities (p-3: 1rem vs 0.75rem, p-5: 3rem vs 1.25rem).
 *
 * So neither layer position works: the two trees want opposite answers.
 * Instead, scope by selector. Every Bootstrap rule is rewritten to match only
 * outside the CRM, then lifted back out of the layer so the marketing side
 * sees it unlayered and `!important` exactly as it does today -- byte-identical
 * rendering there -- while nothing inside `.admin-root` can match it at all.
 *
 * `globals.css` imports Bootstrap with `layer(bootstrap)` purely as a marker
 * for this plugin. The layer does not survive the build.
 */

/** Matches the CRM subtree; `.admin-root` is server-rendered by AdminLayout. */
const GUARD = "body:not(:has(.admin-root))"

/**
 * Selectors that must stay global. `:root`/`html` carry Bootstrap's `--bs-*`
 * custom properties, which the marketing rules below dereference; scoping them
 * to a descendant would leave every var() unresolved. The universal
 * box-sizing reset is identical to Preflight's, so leaving it global is inert.
 */
function isGlobalSelector(sel) {
  const s = sel.trim()
  return (
    s === ":root" ||
    s === "html" ||
    s.startsWith(":root") ||
    s === "*" ||
    s.startsWith("*,") ||
    s.startsWith("*::")
  )
}

function scopeSelector(sel) {
  const s = sel.trim()
  if (!s) return s
  if (isGlobalSelector(s)) return s
  // `body{...}` has to become the guard itself, not a descendant of it.
  if (s === "body") return GUARD
  if (s.startsWith("body")) return GUARD + s.slice(4)
  if (s.startsWith("html ")) return GUARD + " " + s.slice(5)
  return GUARD + " " + s
}

/** Rules inside these at-rules are selector-less (keyframe offsets, etc.). */
const NON_SELECTOR_PARENTS = /^(-\w+-)?keyframes$/i

function scopeRules(container) {
  container.walkRules((rule) => {
    const parent = rule.parent
    if (parent && parent.type === "atrule" && NON_SELECTOR_PARENTS.test(parent.name)) return
    rule.selectors = rule.selectors.map(scopeSelector)
  })
}

const plugin = () => ({
  postcssPlugin: "scope-bootstrap-to-marketing",
  OnceExit(root) {
    let layers = 0
    let rules = 0
    root.walkAtRules("layer", (atRule) => {
      if (atRule.params.trim() !== "bootstrap" || !atRule.nodes) return
      layers++
      scopeRules(atRule)
      atRule.walkRules(() => rules++)
      // Lift the rules out of the layer so the marketing tree keeps seeing
      // Bootstrap unlayered, precisely as it did before any of this.
      atRule.replaceWith(atRule.nodes)
    })
    if (process.env.DEBUG_BOOTSTRAP_LAYER) {
      console.log(`[scope-bootstrap] ${layers} layer(s), ${rules} rules scoped to ${GUARD}`)
    }
  },
})

plugin.postcss = true

module.exports = plugin
