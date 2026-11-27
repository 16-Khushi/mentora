import type { Metadata } from "next"
import DashboardPage from "@/modules/dashboard/dashboard-page"

export const metadata: Metadata = { title: "Today" }

export default function Page() {
  return <DashboardPage />
}
