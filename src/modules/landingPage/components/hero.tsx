import Image from "next/image"

import BrushEdge from "@/components/brush-edge"
import Parallax from "@/components/motion/parallax"

import nightClouds from "../../../../public/landing/night-clouds.webp"
import nightHero from "../../../../public/landing/night-hero.jpg"
import nightLeaves from "../../../../public/landing/night-leaves.webp"
import LinkForm from "./link-form"

// Every layer covers the same box the same way, so they line up exactly at rest.
const LAYER = "object-cover object-center"

/**
 * The opening: a centred headline and link box on cream, then a painted night in three layers.
 * The painting (Thena reading on a cloud) stays put, the clouds drift up a little faster than
 * the page, and the foreground leaves start low, over the band, and rise quickly past you.
 */
export default function Hero() {
  return (
    <section className="flex flex-col overflow-x-clip">
      <div className="page-container flex flex-col items-center gap-6 pt-10 pb-6 text-center sm:pt-16">
        <h1 className="max-w-[14ch] type-display text-ink">
          From <em className="italic">watch later</em> to finished
        </h1>
        <p className="max-w-[44ch] type-lead">
          Paste any YouTube video or playlist. Get a course you actually finish.
        </p>
        <LinkForm id="hero-link" />
        <p className="text-sm text-slate-muted">
          Works with any public video or playlist that has captions.
        </p>
      </div>

      <div className="relative aspect-[1493/640] min-h-[300px] w-full sm:min-h-[420px]">
        <Image
          src={nightHero}
          alt="A painted moonlit night: Thena the owl sits on a cloud, reading a glowing book."
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className={LAYER}
        />
        <Parallax speed={-0.1} from="top" className="absolute inset-0">
          <Image
            src={nightClouds}
            alt=""
            fill
            sizes="100vw"
            className={LAYER}
          />
        </Parallax>
        {/* Fade the painting's paper-coloured top into the page's cream, so there is no seam. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-cream to-transparent"
        />
        {/* Fade the bottom into the band's colour, so painting and band read as one night. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-dusk"
        />
        {/* Foreground leaves: start 18% lower than the painting (over the band) and rise fast. */}
        <Parallax
          speed={-0.35}
          from="top"
          className="pointer-events-none absolute inset-x-0 top-[18%] z-20 h-full"
        >
          <div
            className="relative h-full w-full"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 72%, transparent 100%)",
            }}
          >
            <Image
              src={nightLeaves}
              alt=""
              fill
              sizes="100vw"
              className={LAYER}
            />
          </div>
        </Parallax>
      </div>

      <div className="relative z-10 -mt-px bg-dusk text-center">
        {/* The text rises into the dark bottom of the painting, above the leaves. */}
        <div className="relative z-30 page-container [margin-top:clamp(-9rem,-8vw,-3rem)] flex flex-col items-center gap-4 pb-20 sm:pb-28">
          <p className="type-h1 text-moon">Once upon a playlist…</p>
          <p className="max-w-[26ch] font-fraunces text-2xl leading-snug text-moon-muted sm:text-3xl">
            the videos you saved became the course you finished.
          </p>
        </div>
        <BrushEdge seed={4} className="relative z-30" />
      </div>
    </section>
  )
}
