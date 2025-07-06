"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import PlotDashboard from "@/components/dashboard/plot-dashboard"
import { useAuth } from "@/hooks/use-auth"
import DashboardLoading from "@/components/loading/dashboard-loading"
import UserRouteGuard from "@/components/auth/user-route-guard"

export default function DashboardPage() {
  const { isAuthenticated, isLoading, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If authentication check is complete
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login")
      }
      // If authenticated but not a customer (role !== 0), redirect to admin
      else if (role !== undefined && role !== 0) {
        router.push("/admin")
      }
    }
  }, [isLoading, isAuthenticated, role, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return <DashboardLoading />
  }

  // If not authenticated or not a customer, don't render anything (will be redirected by useEffect)
  if (!isAuthenticated || (role !== undefined && role !== 0)) {
    return <DashboardLoading />
  }

  // Only render the dashboard if authenticated and is a customer
  return (
    <UserRouteGuard>
      <PlotDashboard />
    </UserRouteGuard>
  )
}
