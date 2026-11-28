-- Lesson notes become structured JSON (src/types/lesson.ts). No lessons existed when this ran.
ALTER TABLE "lesson" ALTER COLUMN "notes" SET DATA TYPE jsonb USING "notes"::jsonb;
