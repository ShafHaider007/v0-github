"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import WinnersList from "@/components/admin/winners-list"
import { useAuth } from "@/hooks/use-auth"
import DashboardLoading from "@/components/loading/dashboard-loading"

export default function WinnersPage() {
  const { isAuthenticated, isLoading, role, user } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // If authentication check is complete
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // If authenticated but not an admin (role <= 0), redirect to dashboard
      if (role !== undefined && role <= 0) {
        router.push("/dashboard")
        return
      }

      // If we get here, user is authenticated and is an admin
      setAuthorized(true)
    }
  }, [isLoading, isAuthenticated, role, router])

  // Show loading state while checking authentication
  if (isLoading || !authorized) {
    return <DashboardLoading />
  }

  // Only render the winners list if authenticated and is an admin
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <WinnersList />
    </div>
  )
}
