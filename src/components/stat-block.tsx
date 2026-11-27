import { cn } from "@/lib/utils"

/** A big serif number with a small label beside it: "2h 10m saved", "7 day streak". */
export default function StatBlock({
  value,
  label,
  className,
}: {
  value: React.ReactNode
  label: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-end gap-3 text-ink", className)}>
      <span className="type-stat">{value}</span>
      <span className="max-w-[9rem] pb-2 text-sm leading-tight font-bold">
        {label}
      </span>
    </div>
  )
}
