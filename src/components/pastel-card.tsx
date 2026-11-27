import { cn } from "@/lib/utils"
import type { Tone } from "@/types/design"

// Full class names, so Tailwind can find them in the source.
const TONE_CLASS: Record<Tone, string> = {
  butter: "bg-butter",
  sky: "bg-sky",
  lavender: "bg-lavender",
  mint: "bg-mint",
  blush: "bg-blush",
  periwinkle: "bg-periwinkle",
  paper: "bg-paper",
}

/** A rounded pastel card with ink text: features, courses, today's lesson. */
export default function PastelCard({
  tone = "lavender",
  className,
  ...props
}: React.ComponentProps<"div"> & { tone?: Tone }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card p-6 text-slate sm:p-8",
        TONE_CLASS[tone],
        className
      )}
      {...props}
    />
  )
}
