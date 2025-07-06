"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import PlotDashboard from "@/components/dashboard/plot-dashboard"
import DashboardLoading from "@/components/loading/dashboard-loading"
import PlotDashboardUnauth from "@/components/dashboard/plot-dashboard-unauth"

export default function DashboardUnauthPage() {
  return (
    <PlotDashboardUnauth />
  )
}