import { Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The "paste a YouTube link" box. A plain GET form to /new, so it works before any JavaScript loads:
 * /new?url=… picks the link up (step 8), and sends signed-out visitors to sign in first.
 */
export default function LinkForm({
  id,
  className,
}: {
  /** Unique per page, so each input has its own label. */
  id: string
  className?: string
}) {
  return (
    <form
      action="/new"
      method="get"
      className={cn(
        "flex w-full max-w-xl flex-col gap-2 rounded-tile border border-line bg-paper p-2 focus-within:ring-3 focus-within:ring-violet/40 sm:flex-row sm:items-center sm:pl-5",
        className
      )}
    >
      <label htmlFor={id} className="sr-only">
        YouTube video or playlist link
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-0">
        <Link2 className="size-5 shrink-0 text-slate-muted" aria-hidden />
        <input
          id={id}
          name="url"
          type="url"
          inputMode="url"
          required
          autoComplete="off"
          placeholder="Paste a YouTube video or playlist link"
          className="h-12 min-w-0 flex-1 bg-transparent text-lg text-slate outline-none placeholder:text-slate-muted"
        />
      </div>
      <Button type="submit" size="lg" className="h-12">
        Build my course
      </Button>
    </form>
  )
}
