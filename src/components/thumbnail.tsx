import { PlayCircle } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

/** A video thumbnail in a rounded 16:9 frame, or a soft placeholder when there isn't one. */
export default function Thumbnail({
  src,
  alt = "",
  sizes,
  preload = false,
  className,
}: {
  src: string | null
  alt?: string
  /** How wide it shows, for picking the image size, e.g. "(min-width: 1024px) 320px, 100vw". */
  sizes: string
  preload?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-tile bg-lavender",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-violet">
          <PlayCircle className="size-10" strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  )
}
