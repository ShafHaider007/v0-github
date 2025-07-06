"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PasswordInput from "@/components/auth/password-input"

export default function ChangeTempPasswordForm() {
  const router = useRouter()
  const { token, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    // Basic validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      // Create form data for API request
      const formData = new FormData()
      formData.append("current_password", currentPassword)
      formData.append("password", newPassword)
      formData.append("password_confirmation", confirmPassword)

      // Make API request
      const response = await fetch("https://expodigital5432apis.dhai-r.com.pk/api/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract specific error message from the response
        if (data.errors) {
          // Handle validation errors
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n")
          throw new Error(errorMessages)
        } else if (data.error) {
          throw new Error(data.error)
        } else if (data.message && data.message !== "Password changed successfully.") {
          throw new Error(data.message)
        } else {
          throw new Error("Failed to change password")
        }
      }


      // Display success message
      setSuccessMessage(data.message || "Password changed successfully.")

      // Log out and redirect to login page after 3 seconds
      setTimeout(() => {
        logout()
        window.location.href = "/login"
      }, 3000)
    } catch (err) {
      setError(err.message || "An error occurred while changing password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 w-full">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Change Temporary Password</h1>
        <p className="text-sm text-muted-foreground">
          You are currently using a temporary password. Please change it to continue.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.split("\n").map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid gap-4 w-full">
          <div className="grid gap-2 w-full">
            <Label htmlFor="current-password">Temporary Password</Label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="new-password">New Password</Label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters long.</p>
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || successMessage}>
            {isLoading ? "Changing Password..." : "Change Password"}
          </Button>
        </div>
      </form>

      {successMessage && (
        <p className="text-center text-sm text-muted-foreground">
          You will be redirected to the login page in a few seconds...
        </p>
      )}
    </div>
  )
}
