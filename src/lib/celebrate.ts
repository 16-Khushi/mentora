import confetti from "canvas-confetti"

/** Mentora's colours: teal, coral, violet, butter, mint and lilac. */
const COLORS = [
  "#27af90",
  "#f87483",
  "#644fb4",
  "#ffd85c",
  "#7fd3b8",
  "#c6b8ff",
]

/**
 * "Big burst": one big pop of confetti from just under Thena, then a smaller second pop.
 * Uses canvas-confetti (the library behind Magic UI's shadcn Confetti). Nothing fires for
 * people who turned on "reduce motion".
 */
export function bigBurst(origin = { x: 0.5, y: 0.35 }) {
  const base = { origin, colors: COLORS, disableForReducedMotion: true }
  void confetti({ ...base, particleCount: 120, spread: 90, startVelocity: 55 })
  const second = setTimeout(
    () =>
      void confetti({
        ...base,
        particleCount: 80,
        spread: 140,
        startVelocity: 40,
        scalar: 0.8,
      }),
    250
  )
  return () => {
    clearTimeout(second)
    confetti.reset()
  }
}
