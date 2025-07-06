"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function UserRouteGuard({ children }) {
  const { isAuthenticated, isLoading, role, tempPassword } = useAuth()
  const router = useRouter()
  const [canAccess, setCanAccess] = useState(false)

  useEffect(() => {
    // Only run after auth state is loaded
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in, redirect to login
        router.push("/login")
      } else if (tempPassword) {
        // Has temporary password, redirect to change password page
        router.push("/change-password")
      } else if (role !== undefined && role > 0) {
        // Not a regular user, redirect to appropriate dashboard
        if (role === 5) {
          router.push("/marketing")
        } else {
          router.push("/admin")
        }
      } else {
        // User is authenticated, doesn't have a temporary password, and is a regular user
        console.log("UserRouteGuard: User is a regular user, allowing access")
        setCanAccess(true)
      }
    }
  }, [isAuthenticated, isLoading, role, tempPassword, router])

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Only render children if all conditions are met
  return canAccess ? children : <div className="flex items-center justify-center min-h-screen">Checking access...</div>
}
