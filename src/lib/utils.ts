import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the custom `text-2xs` size from index.css, so it is not
// mistaken for a color and dropped when combined with `text-ink`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
