import { cn } from "@/lib/utils"

/** The big white sheet on cream that holds a whole section (course content, lesson notes). */
export default function Paper({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-sheet bg-paper p-6 sm:p-10", className)}
      {...props}
    />
  )
}
