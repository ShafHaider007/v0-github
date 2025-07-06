"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function AppleDeviceWarningModal({ onClose, deviceType = "Apple device" }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirect to home page after countdown
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compatibility Warning</AlertTitle>
          <AlertDescription>
            We've detected you're using an {deviceType}. Unfortunately, our interactive map is not compatible with{" "}
            {deviceType} devices due to technical limitations.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            For the best experience, please use a desktop computer, Android device, or tablet to access the interactive
            map features.
          </p>

          <p className="text-sm text-gray-600">
            You will be redirected to the home page in <span className="font-bold">{countdown}</span> seconds.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// For backward compatibility
export const IPhoneWarningModal = AppleDeviceWarningModal
