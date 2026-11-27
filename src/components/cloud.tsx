import { cn } from "@/lib/utils"

/** A small puffy white cloud, for decorating banners. */
export default function Cloud({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 32"
      className={cn(
        "pointer-events-none absolute w-12 drop-shadow-[0_4px_4px_rgb(0_0_0/0.15)]",
        className
      )}
    >
      <g fill="white">
        <circle cx="20" cy="20" r="11" />
        <circle cx="34" cy="14" r="13" />
        <circle cx="48" cy="21" r="10" />
        <rect x="12" y="20" width="44" height="11" rx="5.5" />
      </g>
    </svg>
  )
}
