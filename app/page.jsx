"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLoading from "@/components/loading/dashboard-loading"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard page when the root route is accessed
    router.replace("/dashboard")
  }, [router])

  return (
    <main className="min-h-screen">
      <DashboardLoading />
    </main>
  )
}
