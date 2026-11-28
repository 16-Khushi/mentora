/** The lesson to pick up again: one you started, or the next one in your latest course. */
export type ContinueLesson = {
  slug: string
  courseTitle: string
  position: number
  title: string
  minutes: number
  started: boolean
  /** The plan day this lesson is in, and how many of that day's lessons are still to do. */
  day: number
  leftToday: number
}

/** A course card on the Today page: "3 of 17 lessons · Next: …". */
export type RecentCourse = {
  slug: string
  title: string
  thumbnailUrl: string | null
  doneCount: number
  planCount: number
  nextTitle: string | null
  tone: "butter" | "mint" | "sky" | "blush" | "lavender" | "periwinkle"
}

export type TodayData = {
  name: string
  minutesPerDay: number
  courseCount: number
  continueLesson: ContinueLesson | null
  /** The three most recently studied courses. */
  recent: RecentCourse[]
  stats: {
    lessonsWeek: number
    /** 0 to 100, or null before any quiz. */
    quizScore: number | null
    watchedWeekSeconds: number
    /** When each lesson was finished (ISO), for the streak, which is counted in the browser. */
    completedAt: string[]
  }
}
