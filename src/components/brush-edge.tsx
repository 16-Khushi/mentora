import { seeded } from "@/lib/seeded"
import { cn } from "@/lib/utils"

const W = 1440
const H = 56

// The slow wave the edge follows; the seed shifts it so different edges don't match.
const wave = (x: number, seed: number) =>
  28 + 10 * Math.sin(x / 230 + seed) + 4 * Math.sin(x / 61 + seed * 2)

// A rough, brushed edge: the wave plus small jitter.
function brushPath(seed: number) {
  const rand = seeded(seed)
  const pts: string[] = []
  for (let x = 0; x <= W; x += 16) {
    const y = wave(x, seed) + (rand() - 0.5) * 5
    pts.push(`${x},${y.toFixed(1)}`)
  }
  return `M0,${H} L${pts.join(" L")} L${W},${H} Z`
}

// Faint "bristle" streaks just above the edge, following the wave, like the dry end of a brush stroke.
function bristles(seed: number) {
  const rand = seeded(seed + 1)
  return Array.from({ length: 10 }, () => {
    const x = Math.round(rand() * (W - 160))
    const w = Math.round(40 + rand() * 110)
    return {
      x,
      w,
      y: +(wave(x + w / 2, seed) - 2 - rand() * 3).toFixed(1),
      o: +(0.12 + rand() * 0.2).toFixed(2),
    }
  })
}

/**
 * The painted edge where two sections meet. It is filled with the colour of the section it
 * belongs to (default: cream) and sits on the edge of the section above.
 * Put it at the bottom of a night section with flip, or at the top of a cream one.
 */
export default function BrushEdge({
  seed = 3,
  flip = false,
  className,
}: {
  seed?: number
  flip?: boolean
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn(
        "block h-10 w-full text-cream sm:h-14",
        flip && "rotate-180",
        className
      )}
    >
      <path d={brushPath(seed)} fill="currentColor" />
      {bristles(seed).map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={1.6}
          rx={0.8}
          fill="currentColor"
          opacity={b.o}
        />
      ))}
    </svg>
  )
}
