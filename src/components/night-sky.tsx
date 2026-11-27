import { seeded } from "@/lib/seeded"
import { cn } from "@/lib/utils"

// Computed once when the module loads: about 90 stars placed by percentage, so they stay round at any width.
const rand = seeded(7)
const STARS = Array.from({ length: 90 }, () => ({
  x: +(rand() * 100).toFixed(2),
  y: +(rand() * 100).toFixed(2),
  size: +(1 + rand() * 2).toFixed(1), // 1 to 3 px
  delay: +(rand() * 6).toFixed(2),
}))

/**
 * A deep purple night with a soft moon glow and slowly twinkling stars. Used for the landing's
 * night band and the build screen. Text inside should use text-moon / text-moon-muted.
 */
export default function NightSky({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-night text-moon",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgb(255 236 220 / 0.55) 0, rgb(255 214 230 / 0.18) 8%, transparent 22%), radial-gradient(ellipse at 70% 0%, #4b3a9a 0, transparent 60%), linear-gradient(180deg, #2a1d5c 0%, var(--night) 75%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute animate-twinkle rounded-full bg-moon"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
      {children}
    </section>
  )
}
