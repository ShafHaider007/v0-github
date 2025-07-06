"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { USER_ENDPOINTS } from "@/config/api-config"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [tempPassword, setTempPassword] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        setIsLoading(true)

        // Check for token in localStorage - only run in browser
        if (typeof window !== "undefined") {
          const storedToken = localStorage.getItem("token")
          const storedUser = localStorage.getItem("user")
          const storedTempPassword = localStorage.getItem("tempPassword")

          console.log("Checking auth with stored token:", storedToken ? "exists" : "none")
          console.log("Temp password flag:", storedTempPassword)

          if (storedToken && storedUser) {
            // Set initial state from localStorage
            setToken(storedToken)
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
            setRole(parsedUser.role)
            setIsAuthenticated(true)

            // Set temp password flag from localStorage
            if (storedTempPassword === "true") {
              setTempPassword(true)
              console.log("User has temporary password, set from localStorage")
            } else {
              setTempPassword(false)
            }

            // Retrieve user name from localStorage
            const storedUserName = localStorage.getItem("userName")
            if (storedUserName) {
              setUser((prevUser) => ({ ...prevUser, name: storedUserName }))
            }

            if (parsedUser && parsedUser.role !== undefined) {
              setRole(parsedUser.role)
              console.log("User role set from localStorage:", parsedUser.role)
            }

            // Skip token verification for admin users (role > 0)
            if (parsedUser && parsedUser.role !== undefined && parsedUser.role > 0) {
              console.log("Admin user detected, skipping token verification")
              setIsLoading(false)
              return
            }

            // Only verify token for regular users
            try {
              const response = await fetch(USER_ENDPOINTS.PROFILE, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                },
              })

              if (response.ok) {
                const userData = await response.json()
                console.log("User data verified:", userData)
                setUser(userData.user || userData.data || userData)
              } else {
                console.log("Token verification failed, logging out")
                // If token is invalid, log out
                logout()
              }
            } catch (error) {
              console.error("Error verifying token:", error)
              // Don't logout on network errors to allow offline usage
            }
          } else {
            console.log("No stored credentials found")
            setIsAuthenticated(false)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        logout()
      } finally {
        // Always set loading to false when done
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Update the login function to ensure token is properly stored
  const login = async (authToken, userData) => {
    // Update the login function to handle marketing role redirection
    try {
      console.log("Login called with token:", authToken ? "exists" : "none")
      console.log("User data received:", userData)

      if (!authToken) {
        console.error("No token provided to login function")
        return false
      }

      // Save token and user data
      setToken(authToken)
      setUser(userData)
      setIsAuthenticated(true)

      // Check for temporary password flag
      if (userData && userData.temp_password) {
        setTempPassword(true)
        localStorage.setItem("tempPassword", "true")
        console.log("User has temporary password, needs to change it")
      } else {
        setTempPassword(false)
        localStorage.removeItem("tempPassword")
      }

      // Store user name in localStorage
      if (userData && userData.name) {
        localStorage.setItem("userName", userData.name)
      }

      // Set role if available in userData
      if (userData && userData.role !== undefined) {
        setRole(userData.role)
        console.log("User role set during login:", userData.role)
        // Role 5 is for marketing users who should be redirected to /manager-booking
      } else {
        console.warn("No role found in user data")
        setRole(null)
      }

      // Store in localStorage - only run in browser
      if (typeof window !== "undefined") {
        localStorage.setItem("token", authToken)
        localStorage.setItem("user", JSON.stringify(userData))

        // Also set cookies for middleware
        document.cookie = `token=${authToken}; path=/;`
        document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/;`
      }

      console.log("Auth state updated, user is now authenticated with role:", userData.role)
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    console.log("Logging out user")
    // Clear auth state
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setTempPassword(false)

    // Clear user name from localStorage
    localStorage.removeItem("userName")
    localStorage.removeItem("tempPassword")

    // Clear localStorage - only run in browser
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      // Clear cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
  }

  const value = {
    user,
    isAuthenticated,
    token,
    role,
    tempPassword,
    login,
    logout,
    isLoading,
  }

  console.log("Auth context current state:", {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    hasToken: !!token,
    role,
    tempPassword,
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
