"use client"

import { AlertDialog } from "@base-ui/react/alert-dialog"
import { Menu } from "@base-ui/react/menu"
import {
  Check,
  Clock,
  EllipsisVertical,
  LogOut,
  Pencil,
  Share2,
} from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CUSTOM_PACE, isValidPace, paceLabel, PACES } from "@/lib/pace"
import { cn } from "@/lib/utils"

import { leaveCourse, setPace } from "../actions"

const ITEM =
  "flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-[0.95rem] text-slate outline-none select-none data-[highlighted]:bg-lavender data-[highlighted]:text-ink"

/**
 * ⋮ on the course page: the daily pace (the plan re-packs around it), sharing the course,
 * and leaving it.
 */
export default function CourseMenu({
  slug,
  title,
  minutesPerDay,
}: {
  slug: string
  title: string
  minutesPerDay: number
}) {
  const [pace, setShownPace] = useOptimistic(minutesPerDay)
  const [, start] = useTransition()
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState(String(minutesPerDay))
  const isCustom = !PACES.includes(pace as (typeof PACES)[number])
  const [leaving, startLeaving] = useTransition()

  const savePace = (minutes: number) =>
    start(async () => {
      setShownPace(minutes)
      await setPace(minutes)
      toast(`Plan re-packed for ${paceLabel(minutes)} a day`)
    })

  const customMinutes = Number(customValue)
  const customOk = isValidPace(customMinutes)
  const saveCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customOk) return
    setCustomOpen(false)
    savePace(customMinutes)
  }

  const share = async () => {
    const url = `${window.location.origin}/courses/${slug}`
    try {
      // Phones and tablets: the system share sheet. Desktops: copy the link, which is what people expect there.
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({
          title,
          text: `Learn "${title}" with me on Mentora`,
          url,
        })
        return
      }
      await navigator.clipboard.writeText(url)
      toast("Link copied", {
        description: "Anyone who opens it can join this course.",
      })
    } catch (error) {
      // The share sheet was closed: nothing to do. Anything else: show the link to copy by hand.
      if ((error as Error).name !== "AbortError")
        toast("Copy this link", { description: url })
    }
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label="Course options"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-lavender focus-visible:ring-3 focus-visible:ring-violet/40 focus-visible:outline-none data-[popup-open]:bg-lavender"
        >
          <EllipsisVertical className="size-5" aria-hidden />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            side="bottom"
            align="end"
            sideOffset={6}
            className="z-50"
          >
            <Menu.Popup className="w-64 origin-[var(--transform-origin)] rounded-tile border border-line bg-paper p-1.5 shadow-float transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <Menu.Group>
                <Menu.GroupLabel className="flex items-center gap-2 px-3 pt-2 pb-1 text-xs font-bold tracking-wider text-plum uppercase">
                  <Clock className="size-3.5" aria-hidden />
                  Daily pace
                </Menu.GroupLabel>
                <Menu.RadioGroup
                  value={isCustom ? "custom" : pace}
                  onValueChange={(v) => v !== "custom" && savePace(Number(v))}
                >
                  {PACES.map((m) => (
                    <Menu.RadioItem
                      key={m}
                      value={m}
                      closeOnClick
                      className={ITEM}
                    >
                      <span className="flex size-4 items-center justify-center">
                        <Menu.RadioItemIndicator>
                          <Check
                            className="size-4 text-teal-deep"
                            aria-hidden
                          />
                        </Menu.RadioItemIndicator>
                      </span>
                      {paceLabel(m)}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
                <Menu.Item
                  onClick={() => {
                    setCustomValue(String(pace))
                    setCustomOpen(true)
                  }}
                  className={ITEM}
                >
                  <span className="flex size-4 items-center justify-center">
                    {isCustom ? (
                      <Check className="size-4 text-teal-deep" aria-hidden />
                    ) : (
                      <Pencil
                        className="size-3.5 text-slate-muted"
                        aria-hidden
                      />
                    )}
                  </span>
                  Custom
                </Menu.Item>
              </Menu.Group>
              <Menu.Separator className="my-1.5 h-px bg-line" />
              <Menu.Item onClick={share} className={ITEM}>
                <Share2 className="size-4" aria-hidden />
                Share course
              </Menu.Item>
              <Menu.Item
                onClick={() => setConfirmLeave(true)}
                className={cn(
                  ITEM,
                  "text-coral-deep data-[highlighted]:bg-blush data-[highlighted]:text-coral-deep"
                )}
              >
                <LogOut className="size-4" aria-hidden />
                Leave course
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog.Root open={customOpen} onOpenChange={setCustomOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-night/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-card bg-paper p-6 shadow-float transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <form onSubmit={saveCustom} className="flex flex-col gap-4">
              <AlertDialog.Title className="type-h3 text-ink">
                Your daily pace
              </AlertDialog.Title>
              <AlertDialog.Description className="text-slate">
                How many minutes can you study each day? Your plan re-packs
                around it.
              </AlertDialog.Description>
              <label
                htmlFor="custom-pace"
                className="flex items-center gap-3 rounded-tile border border-line bg-paper px-4 focus-within:ring-3 focus-within:ring-violet/40"
              >
                <input
                  id="custom-pace"
                  type="number"
                  inputMode="numeric"
                  min={CUSTOM_PACE.min}
                  max={CUSTOM_PACE.max}
                  step={5}
                  autoFocus
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  aria-invalid={!customOk}
                  aria-describedby="custom-pace-hint"
                  className="h-12 min-w-0 flex-1 bg-transparent text-lg text-ink outline-none"
                />
                <span className="text-slate-muted">min a day</span>
              </label>
              <p
                id="custom-pace-hint"
                className={cn(
                  "-mt-2 text-sm",
                  customOk ? "text-slate-muted" : "text-coral-deep"
                )}
              >
                {customOk
                  ? `That's ${paceLabel(customMinutes)} a day.`
                  : `Pick a whole number from ${CUSTOM_PACE.min} to ${CUSTOM_PACE.max}.`}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <AlertDialog.Close
                  render={
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit" disabled={!customOk}>
                  Save pace
                </Button>
              </div>
            </form>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-night/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card bg-paper p-6 shadow-float transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <AlertDialog.Title className="type-h3 text-ink">
              Leave this course?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-slate">
              It leaves My courses. Your progress is kept, so if you come back
              you&apos;ll pick up where you stopped.
            </AlertDialog.Description>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Close
                render={<Button variant="ghost">Stay</Button>}
              />
              <Button
                variant="destructive"
                disabled={leaving}
                onClick={() => startLeaving(() => leaveCourse(slug))}
              >
                {leaving ? "Leaving…" : "Leave course"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
