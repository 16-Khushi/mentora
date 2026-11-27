import { cn } from "@/lib/utils"

/** Rounded progress track. Violet while in progress, teal when complete. */
export default function ProgressBar({
  value,
  label,
  className,
}: {
  /** 0 to 100 */
  value: number
  /** What the bar measures, for screen readers: "Course progress". */
  label: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-lavender",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          pct === 100 ? "bg-teal" : "bg-violet"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
