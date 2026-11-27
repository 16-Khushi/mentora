import Benefits from "./components/benefits"
import ClosingSwirl from "./components/closing-swirl"
import Features from "./components/features"
import FinalCta from "./components/final-cta"
import Hero from "./components/hero"
import HowItWorks from "./components/how-it-works"
import MeetThena from "./components/meet-thena"
import TrustCards from "./components/trust-cards"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <MeetThena />
      <Benefits />
      <TrustCards />
      <FinalCta />
      <ClosingSwirl />
    </>
  )
}
