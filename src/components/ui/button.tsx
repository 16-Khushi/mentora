import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Mentora buttons (DESIGN.md section 5). Flat colour, 12px corners, Nunito semibold.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control border border-transparent font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-violet/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125em]",
  {
    variants: {
      variant: {
        // Main action on a screen: "Build my course", "Sign in".
        default:
          "bg-ink text-white hover:bg-[color-mix(in_oklab,var(--ink),var(--violet)_35%)]",
        // Go forward in learning: "Start lesson", "Continue".
        accent:
          "bg-teal-deep text-white hover:bg-[color-mix(in_oklab,var(--teal-deep),black_12%)]",
        // Quiet alternative next to a primary button.
        outline: "border-line bg-paper text-ink hover:bg-lavender",
        secondary: "bg-lavender text-ink hover:bg-periwinkle",
        ghost: "text-ink hover:bg-lavender",
        destructive:
          "bg-coral-deep text-white hover:bg-[color-mix(in_oklab,var(--coral-deep),black_12%)]",
        link: "text-link underline underline-offset-4 hover:text-ink",
      },
      size: {
        default: "h-11 px-6 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
