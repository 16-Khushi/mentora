import { cn } from "@/lib/utils"

/**
 * "Mentora" in Knewave, a thick slanted brush lettering, in violet. Also used for Thena's name.
 * The only place Knewave appears; headlines stay in Fraunces.
 */
export default function Wordmark({
  className,
  name = "Mentora",
}: {
  className?: string
  /** The same lettering is used for Thena's name. */
  name?: string
}) {
  return (
    <span
      className={cn(
        "font-brand text-[1.75rem] leading-none tracking-wide text-violet",
        className
      )}
    >
      {name}
    </span>
  )
}
