import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The CRM's type scale has to be declared to tailwind-merge, or it deletes it.
 *
 * Out of the box tailwind-merge only knows Tailwind's own `text-*` names. It
 * classifies anything else beginning `text-` as a COLOUR, so `text-admin-sm`
 * (a size) and `text-admin-text` (a colour) landed in the same conflict group
 * and the earlier one was silently dropped on every single `cn()` call:
 *
 *   cn("text-admin-sm text-admin-text")      -> "text-admin-text"   size lost
 *   cn("text-admin-accent-fg text-admin-xs") -> "text-admin-xs"     colour lost
 *
 * That is why form controls rendered at the inherited body size instead of
 * 12px, and why the primary button drew dark text on its green fill instead of
 * white. It affected every admin component built with `cn()`, which is all of
 * them. Naming the seven sizes here puts them in the `font-size` group, leaves
 * every other `text-admin-*` as a colour, and the two stop colliding.
 *
 * Keep this list in step with the `--text-admin-*` tokens in globals.css.
 *
 * The radius scale has the same problem for the same reason. `rounded-admin`,
 * `rounded-admin-sm` and `rounded-admin-lg` are not names tailwind-merge knows,
 * so it put none of them in the border-radius group and kept every one it was
 * given:
 *
 *   cn("rounded-admin-sm rounded-admin") -> "rounded-admin-sm rounded-admin"
 *
 * Both then apply and stylesheet order decides the winner, which means a
 * component overriding a shared control's radius silently got whichever the
 * bundler happened to emit last. Naming the three puts them in one group so the
 * later class wins, as everywhere else.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["admin-sm", "admin", "admin-lg"] }],
      "font-size": [
        {
          text: [
            "admin-2xs",
            "admin-xs",
            "admin-sm",
            "admin-base",
            "admin-lg",
            "admin-xl",
            "admin-2xl",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
