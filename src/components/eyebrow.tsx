import { cn } from "@/lib/utils"

/** Small uppercase label that sits above a headline: "TODAY", "DAY 2", "HOW IT WORKS". */
export default function Eyebrow({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("eyebrow text-plum", className)} {...props} />
}
