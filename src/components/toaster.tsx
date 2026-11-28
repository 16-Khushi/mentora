"use client"

import { Toaster as Sonner } from "sonner"

/** Small confirmations ("Link copied") at the bottom of the screen, in Mentora's style. */
export default function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={88}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-tile !border-0 !bg-ink !font-sans !text-white !shadow-float",
          description: "!text-lavender",
        },
      }}
    />
  )
}
