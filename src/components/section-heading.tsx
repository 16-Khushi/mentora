import Eyebrow from "@/components/eyebrow"
import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: string
  title: React.ReactNode
  lead?: React.ReactNode
  /** Marketing pages centre their headings; app screens keep them on the left. */
  align?: "start" | "center"
  /** h1 for the page title, h2 for sections inside it. */
  as?: "h1" | "h2"
  className?: string
}

/** Eyebrow + serif headline + lead line: opens every page and every section. */
export default function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  as: Tag = "h2",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag className={cn("text-ink", Tag === "h1" ? "type-h1" : "type-h2")}>
        {title}
      </Tag>
      {lead && <p className="max-w-[60ch] type-lead">{lead}</p>}
    </div>
  )
}
