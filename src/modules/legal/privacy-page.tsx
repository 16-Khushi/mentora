import LegalLayout, {
  ContactEmail,
  type LegalSection,
} from "./components/legal-layout"

// Keep this true to the code: if Mentora starts collecting or sharing something new, add it here
// and update SITE.legalUpdated in src/lib/site.ts.
const SECTIONS: LegalSection[] = [
  {
    title: "What we collect",
    body: (
      <>
        <p>
          We collect only what Mentora needs to build your courses and remember
          your progress:
        </p>
        <ul>
          <li>
            <strong>Your Google account basics</strong>, when you sign in: your
            name, email address, profile picture and Google account ID. We never
            see your Google password.
          </li>
          <li>
            <strong>The YouTube links you add</strong>, and the courses built
            from them.
          </li>
          <li>
            <strong>Your learning activity</strong>: which lessons you have
            watched and for how long, your quiz and placement test answers, the
            lessons you skip and your daily minutes setting.
          </li>
          <li>
            <strong>Basic technical logs</strong> kept by our hosting provider,
            such as the time of a request and an IP address, used to keep the
            service running and safe.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How we use it",
    body: (
      <ul>
        <li>To sign you in and keep you signed in.</li>
        <li>To build courses from the videos you add and to plan your days.</li>
        <li>To show your progress, streaks and quiz results back to you.</li>
        <li>To fix problems and keep Mentora secure.</li>
      </ul>
    ),
  },
  {
    title: "What we never do",
    body: (
      <ul>
        <li>We don&apos;t sell or rent your information.</li>
        <li>We don&apos;t show ads or use advertising trackers.</li>
        <li>
          We don&apos;t download YouTube videos. They play in YouTube&apos;s own
          player.
        </li>
      </ul>
    ),
  },
  {
    title: "Courses are shared, your progress is not",
    body: (
      <p>
        A course is built from a public video&apos;s own captions. Once one
        person has built a course for a video, anyone who adds the same video
        gets the same course instantly. The course itself contains no personal
        information. Your progress, answers and settings are yours alone and are
        never shown to other learners.
      </p>
    ),
  },
  {
    title: "Services that help run Mentora",
    body: (
      <>
        <p>
          We use a small number of services. Each receives only what it needs:
        </p>
        <ul>
          <li>
            <strong>Google</strong>: sign-in, and the YouTube Data API for video
            titles, lengths and chapters.
          </li>
          <li>
            <strong>YouTube</strong>: the embedded video player. YouTube may set
            its own cookies and collect data under Google&apos;s privacy policy
            when you play a video.
          </li>
          <li>
            <strong>Supadata</strong>: fetches a video&apos;s public captions.
            It receives the video&apos;s link, not your details.
          </li>
          <li>
            <strong>Nebius Token Factory</strong> (NVIDIA Nemotron models):
            writes lessons, notes and quizzes. It receives caption text and
            video titles, not your details.
          </li>
          <li>
            <strong>Neon</strong>: our database. <strong>Vercel</strong>:
            hosting. <strong>Inngest</strong>: runs course building in the
            background.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Cookies",
    body: (
      <p>
        Mentora sets one essential cookie that keeps you signed in. There are no
        analytics or advertising cookies. The YouTube player may set its own
        cookies when you watch.
      </p>
    ),
  },
  {
    title: "How long we keep it, and your choices",
    body: (
      <p>
        We keep your account and learning activity until you ask us to delete
        them. You can ask for a copy of your data, a correction, or deletion of
        your account at any time by emailing <ContactEmail />. We reply within
        30 days.
      </p>
    ),
  },
  {
    title: "Children",
    body: (
      <p>
        Mentora is not meant for children under 13, and we don&apos;t knowingly
        collect their information. If you believe a child has signed up, contact
        us and we will delete the account.
      </p>
    ),
  },
  {
    title: "Changes and contact",
    body: (
      <p>
        If this policy changes, we will update the date at the top of this page.
        Questions? Email <ContactEmail />.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy"
      title="Privacy policy"
      summary={
        <p>
          <strong>The short version:</strong> we keep your Google name and
          email, the videos you add and your progress, and use them only to run
          Mentora. No ads, no tracking, nothing sold, and you can ask us to
          delete everything.
        </p>
      }
      sections={SECTIONS}
    />
  )
}
