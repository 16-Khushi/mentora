/** The pastel fills a card can use. Each carries a meaning, see DESIGN.md section 2. */
export type Tone =
  "butter" | "sky" | "lavender" | "mint" | "blush" | "periwinkle" | "paper"

/** Courses rotate through these, so a list of courses never looks the same colour twice in a row. */
export const COURSE_TONES = [
  "butter",
  "sky",
  "lavender",
  "mint",
  "blush",
] as const satisfies readonly Tone[]
