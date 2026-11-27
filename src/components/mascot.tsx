import Image from "next/image"

import { cn } from "@/lib/utils"

/** Thena's poses, in public/mascot/. Each one belongs to a moment (DESIGN.md section 9). */
export type MascotPose =
  | "wave" // landing, login
  | "reading" // lesson notes
  | "thinking" // placement test
  | "writing" // build screen
  | "celebrate" // course finished
  | "sleeping" // empty states

/**
 * Thena the owl. Decorative by default (empty alt), because the text next to her says what matters.
 * Pass `alt` only when she carries meaning on her own.
 */
export default function Mascot({
  pose,
  size = 240,
  alt = "",
  preload = false,
  className,
}: {
  pose: MascotPose
  /** Width in px (she is square). Also tells the browser which image size to download. */
  size?: number
  alt?: string
  /** Load first: only for the one above-the-fold image on a page. */
  preload?: boolean
  className?: string
}) {
  return (
    <Image
      src={`/mascot/${pose}.png`}
      width={640}
      height={640}
      alt={alt}
      preload={preload}
      sizes={`${size}px`}
      // Default width comes from `size`. A width class in className (w-40 sm:w-72) replaces it,
      // because cn() drops the conflicting w-(--mascot-size).
      style={{ "--mascot-size": `${size}px` } as React.CSSProperties}
      className={cn(
        "pointer-events-none h-auto w-(--mascot-size) max-w-full select-none",
        className
      )}
    />
  )
}
