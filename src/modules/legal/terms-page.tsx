import Link from "next/link"

import LegalLayout, {
  ContactEmail,
  type LegalSection,
} from "./components/legal-layout"

const SECTIONS: LegalSection[] = [
  {
    title: "What Mentora is",
    body: (
      <p>
        Mentora turns public YouTube videos and playlists into structured
        courses with lessons, notes, quizzes, a placement test and a daily plan.
        By using Mentora you agree to these terms. Mentora is a new product:
        features may change, and the service may be paused or stopped.
      </p>
    ),
  },
  {
    title: "Your account",
    body: (
      <ul>
        <li>
          You sign in with Google. Keep your Google account secure; you are
          responsible for what happens under your account.
        </li>
        <li>You must be at least 13 years old to use Mentora.</li>
        <li>One account per person, please.</li>
      </ul>
    ),
  },
  {
    title: "Using Mentora fairly",
    body: (
      <>
        <p>Please don&apos;t:</p>
        <ul>
          <li>
            Add videos you aren&apos;t allowed to watch, or try to get around
            YouTube&apos;s rules.
          </li>
          <li>
            Scrape Mentora, overload it, or try to break into accounts or
            systems.
          </li>
          <li>
            Use Mentora to build courses from content that is illegal or
            harmful.
          </li>
        </ul>
        <p>We may limit or close accounts that break these rules.</p>
      </>
    ),
  },
  {
    title: "YouTube content and creators",
    body: (
      <>
        <p>
          Videos belong to their creators. Mentora never downloads or rehosts
          them: every video plays in YouTube&apos;s own embedded player, so
          creators keep their views. When you watch, YouTube&apos;s Terms of
          Service apply as well.
        </p>
        <p>
          Courses are built from a video&apos;s public captions. If you are a
          creator and would like a course built from your video removed, email{" "}
          <ContactEmail /> with the link and we will take it down.
        </p>
      </>
    ),
  },
  {
    title: "AI-written lessons",
    body: (
      <p>
        Lesson plans, notes, quizzes and placement tests are written by AI
        models from the video&apos;s captions. They can contain mistakes or miss
        context, so treat them as a study aid, not as professional advice, and
        check anything important against the video and other sources.
      </p>
    ),
  },
  {
    title: "Who owns what",
    body: (
      <ul>
        <li>Your account information and progress are yours.</li>
        <li>
          The Mentora app, its design, the Thena character and its artwork
          belong to Mentora.
        </li>
        <li>
          Courses built on Mentora can be opened by other learners who add the
          same video, so don&apos;t put personal information into anything that
          becomes part of a course.
        </li>
      </ul>
    ),
  },
  {
    title: "No guarantees",
    body: (
      <p>
        Mentora is provided &ldquo;as is&rdquo;. We work to keep it running and
        accurate, but we can&apos;t promise it will always be available,
        error-free, or that a video can always be turned into a course. To the
        extent the law allows, Mentora is not liable for indirect losses or for
        anything caused by content from YouTube or by AI-written material.
      </p>
    ),
  },
  {
    title: "Ending your use",
    body: (
      <p>
        You can stop using Mentora at any time and ask us to delete your account
        (see our <Link href="/privacy">privacy policy</Link>). We may suspend
        accounts that break these terms.
      </p>
    ),
  },
  {
    title: "Changes and contact",
    body: (
      <p>
        If these terms change, we will update the date at the top of this page;
        using Mentora after that means you accept the new terms. Questions?
        Email <ContactEmail />.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Terms"
      title="Terms of service"
      summary={
        <p>
          <strong>The short version:</strong> use Mentora to learn from videos
          you&apos;re allowed to watch, be kind to the service, and remember
          that AI-written notes can be wrong. Videos stay with their creators
          and play on YouTube.
        </p>
      }
      sections={SECTIONS}
    />
  )
}
