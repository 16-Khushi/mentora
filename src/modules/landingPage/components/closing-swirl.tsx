import Reveal from "@/components/motion/reveal"

// The ribbon's centre line: enters bottom-left, loops up and down across the page, leaves top-right.
const RIBBON =
  "M -80 560 C 120 700, 330 560, 300 400 C 270 240, 420 120, 590 200 C 760 280, 700 520, 880 590 C 1060 660, 1250 560, 1220 380 C 1195 230, 1300 90, 1520 110"
// Paths the two lines of text follow, just outside the ribbon's curves.
const TEXT_TOP =
  "M 140 300 C 230 150, 420 40, 600 110 C 700 150, 760 220, 800 300"
const TEXT_BOTTOM = "M 820 700 C 1000 760, 1240 700, 1340 520"

/**
 * A violet bookmark ribbon winding across the end of the landing page, with two lines of
 * text curving along it. Drawn in SVG: a thick round stroke with a lighter sheen down the
 * middle, and a turbulence filter that roughens the edges like a dry brush.
 * The filter uses a fixed area (userSpaceOnUse): the default is measured without the
 * stroke's width, which slices the bottom off a thick ribbon.
 */
export default function ClosingSwirl() {
  return (
    <section aria-label="Mentora" className="overflow-x-clip pt-8">
      <Reveal>
        {/* On phones the curved text would run off the edges, so it sits above and below instead. */}
        <p className="px-4 text-center font-fraunces text-2xl text-violet sm:hidden">
          From watch later to finished
        </p>
        <svg
          viewBox="0 0 1440 800"
          className="-ml-[40%] block h-auto w-[180%] max-w-none sm:ml-0 sm:w-full"
          role="img"
          aria-label="From watch later to finished. Build a habit, one lesson at a time."
        >
          <defs>
            <filter
              id="brush"
              filterUnits="userSpaceOnUse"
              x="-200"
              y="-100"
              width="1840"
              height="1000"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.035"
                numOctaves="3"
                seed="4"
              />
              <feDisplacementMap in="SourceGraphic" scale="8" />
            </filter>
            <path id="swirl-text-top" d={TEXT_TOP} />
            <path id="swirl-text-bottom" d={TEXT_BOTTOM} />
          </defs>
          <g filter="url(#brush)" fill="none" strokeLinecap="round">
            <path d={RIBBON} stroke="var(--violet)" strokeWidth="96" />
            {/* A soft lighter stripe down the middle, like the sheen on a satin bookmark ribbon. */}
            <path d={RIBBON} stroke="#8a78d8" strokeWidth="34" opacity="0.45" />
            <path d={RIBBON} stroke="#b3a6ec" strokeWidth="8" opacity="0.35" />
          </g>
          <g
            className="font-fraunces max-sm:hidden"
            fill="var(--violet)"
            fontSize="44"
          >
            <text>
              <textPath href="#swirl-text-top" startOffset="4%">
                From watch later to finished
              </textPath>
            </text>
            <text>
              <textPath href="#swirl-text-bottom" startOffset="2%">
                One lesson at a time
              </textPath>
            </text>
          </g>
        </svg>
        <p className="px-4 text-center font-fraunces text-2xl text-violet sm:hidden">
          One lesson at a time
        </p>
      </Reveal>
    </section>
  )
}
