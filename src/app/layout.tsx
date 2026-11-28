import type { Metadata } from "next"
import { Fraunces, Geist_Mono, Knewave, Nunito } from "next/font/google"

import "./globals.css"
import Toaster from "@/components/toaster"
import { cn } from "@/lib/utils"

// Body and UI text: rounded and warm.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
})

// Headlines: a variable serif. SOFT rounds the corners, WONK (kept off) would add quirky letters,
// opsz adjusts the letter shapes to the size they're shown at. See DESIGN.md section 3.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
})

// The "Mentora" wordmark and Thena's name only: a thick, slanted brush lettering.
const knewave = Knewave({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-knewave",
})

// Code blocks in lesson notes.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: { default: "Mentora", template: "%s · Mentora" },
  description: "Turn any YouTube video or playlist into a course you finish.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        nunito.variable,
        fraunces.variable,
        knewave.variable,
        geistMono.variable
      )}
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
