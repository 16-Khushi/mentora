import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-semibold whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        outline: "border border-violet text-ink",
        solid: "bg-ink text-white",
        butter: "bg-butter text-ink",
        sky: "bg-sky text-ink",
        lavender: "bg-lavender text-ink",
        mint: "bg-mint text-ink",
        blush: "bg-blush text-ink",
      },
    },
    defaultVariants: { variant: "outline" },
  }
)

/** Tags and chips: "Day 3", "18 min", "Beginner". */
export default function Pill({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof pillVariants>) {
  return (
    <span className={cn(pillVariants({ variant }), className)} {...props} />
  )
}
