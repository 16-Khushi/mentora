"use client"

import { Check } from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CUSTOM_PACE, isValidPace, paceLabel, PACES } from "@/lib/pace"
import { cn } from "@/lib/utils"
import { setPace } from "@/modules/course/actions"

const CHIP =
  "flex h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none"

/**
 * The daily pace: the same choices as the course menu (30, 60, 90, 120 mins or Custom).
 * Every course plan re-packs around it.
 */
export default function PacePicker({
  minutesPerDay,
}: {
  minutesPerDay: number
}) {
  const [pace, setShown] = useOptimistic(minutesPerDay)
  const [, start] = useTransition()
  const isPreset = PACES.includes(pace as (typeof PACES)[number])
  const [customOpen, setCustomOpen] = useState(!isPreset)
  const [custom, setCustom] = useState(String(minutesPerDay))
  const customMinutes = Number(custom)
  const customOk = isValidPace(customMinutes)

  const save = (minutes: number) =>
    start(async () => {
      setShown(minutes)
      await setPace(minutes)
      toast(`Plans re-packed for ${paceLabel(minutes)} a day`)
    })

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Daily pace"
        className="flex flex-wrap gap-2"
      >
        {PACES.map((m) => {
          const on = !customOpen && pace === m
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setCustomOpen(false)
                if (pace !== m) save(m)
              }}
              className={cn(
                CHIP,
                on
                  ? "border-ink bg-ink text-white"
                  : "border-violet text-ink hover:bg-lavender"
              )}
            >
              {on && <Check className="size-4" aria-hidden />}
              {paceLabel(m)}
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={customOpen}
          onClick={() => setCustomOpen(true)}
          className={cn(
            CHIP,
            customOpen
              ? "border-ink bg-ink text-white"
              : "border-violet text-ink hover:bg-lavender"
          )}
        >
          {customOpen && <Check className="size-4" aria-hidden />}
          Custom
        </button>
      </div>

      {customOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (customOk) save(customMinutes)
          }}
          className="flex flex-wrap items-start gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="custom-pace"
              className="flex h-11 items-center gap-2 rounded-control border border-line bg-paper px-4 focus-within:ring-3 focus-within:ring-violet/40"
            >
              <input
                id="custom-pace"
                type="number"
                inputMode="numeric"
                min={CUSTOM_PACE.min}
                max={CUSTOM_PACE.max}
                step={5}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-invalid={!customOk}
                aria-describedby="custom-pace-hint"
                className="w-20 bg-transparent text-lg text-ink outline-none"
              />
              <span className="text-slate-muted">mins a day</span>
            </label>
            <p
              id="custom-pace-hint"
              className={cn(
                "text-sm",
                customOk ? "text-slate-muted" : "text-coral-deep"
              )}
            >
              {customOk
                ? `Any whole number from ${CUSTOM_PACE.min} to ${CUSTOM_PACE.max}.`
                : `Pick a whole number from ${CUSTOM_PACE.min} to ${CUSTOM_PACE.max}.`}
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!customOk || customMinutes === pace}
          >
            Save pace
          </Button>
        </form>
      )}
    </div>
  )
}
