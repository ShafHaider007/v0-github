"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function TempPasswordRouteGuard({ children }) {
  const { isAuthenticated, isLoading, tempPassword } = useAuth()
  const router = useRouter()
  const [canAccess, setCanAccess] = useState(false)

  useEffect(() => {
    // Only run after auth state is loaded
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in, redirect to login
        router.push("/login")
      } else if (!tempPassword) {
        // Logged in but doesn't have a temporary password, redirect to dashboard

        // Determine where to redirect based on role
        // This will be handled by the appropriate route guard
        router.push("/dashboard")
      } else {
        // User is authenticated and has a temporary password
        setCanAccess(true)
      }
    }
  }, [isAuthenticated, isLoading, tempPassword, router])

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Only render children if authenticated and has temporary password
  return canAccess ? children : <div className="flex items-center justify-center min-h-screen">Checking access...</div>
}
