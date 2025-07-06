"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { isIPhone, isIPad } from "@/utils/device-detection"

export function AppleDeviceWarningModal({ onClose, visible = true, }) {
  if (!visible) return null
  const { logout } = useAuth()
  const router = useRouter()
  const [countdown, setCountdown] = useState(20)
  const [deviceType, setDeviceType] = useState("device")

  // Determine device type on component mount
  useEffect(() => {
    if (isIPhone()) {
      setDeviceType("iPhone")
    } else if (isIPad()) {
      setDeviceType("iPad")
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer)
          handleLogout()
          return 0
        }
        return prevCount - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <h2 className="text-xl font-bold text-center mb-4">Device Compatibility Notice</h2>

        <div className="text-center mb-6">
          <p className="mb-4">
            <strong>Dear User!</strong>
          </p>
          <p className="mb-4">
            We've detected you're using an {deviceType}. For the best experience with our interactive map portal, we
            recommend accessing it from a desktop, laptop, or Android device.
          </p>
          <p className="mb-4">This ensures smoother performance and full feature support.</p>
          <p className="text-sm text-gray-600 mb-4">Visit our FAQs to learn more. Thank you for understanding!</p>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
            <p className="text-amber-700 font-medium">Logging out in {countdown} seconds</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleLogout} className="w-full">
            I Understand
          </Button>
        </div>
      </div>
    </div>
  )
}

// For backward compatibility
export const IPhoneWarningModal = AppleDeviceWarningModal
