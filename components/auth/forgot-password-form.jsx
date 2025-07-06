"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PhoneInput from "@/components/auth/phone-input"

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [cnic, setCnic] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [redirectCountdown, setRedirectCountdown] = useState(null)

  // Add captcha related states
  const [captchaText, setCaptchaText] = useState("")
  const [userCaptcha, setUserCaptcha] = useState("")
  const [captchaError, setCaptchaError] = useState(false)

  // Store captcha styles to prevent regeneration
  const captchaStylesRef = useRef([])

  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha()
  }, [])

  // Generate a simple captcha with fixed styles
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let captcha = ""
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(captcha)
    setUserCaptcha("")
    setCaptchaError(false)

    // Generate and store fixed styles for each character
    captchaStylesRef.current = captcha.split("").map(() => ({
      translateY: Math.random() * 6 - 3,
      rotate: Math.random() * 10 - 5,
      color: `hsl(${Math.random() * 360}, 70%, 40%)`,
    }))
  }

  // Add this function after the generateCaptcha function
  const formatCNIC = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, "")

    // Format as 12345-1234567-1
    if (digits.length <= 5) {
      return digits
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
    }
  }

  // Add this handler for CNIC input
  const handleCNICChange = (e) => {
    const { value } = e.target

    // Only allow numbers
    const numericValue = value.replace(/\D/g, "")

    // Limit to 13 digits
    if (numericValue.length <= 13) {
      // Format and update the state
      const formattedValue = formatCNIC(numericValue)
      setCnic(formattedValue)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate captcha
    if (userCaptcha !== captchaText) {
      setCaptchaError(true)
      setError("Incorrect captcha. Please try again.")
      generateCaptcha()
      return
    }

    // Validate CNIC
    const cnicDigits = cnic.replace(/\D/g, "")
    if (cnicDigits.length !== 13) {
      setError("CNIC must be 13 digits")
      return
    }

    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      // Create form data for API request
      const formData = new FormData()
      formData.append("email", email)
      formData.append("cnic", cnicDigits)
      formData.append("phone", phone)

      // Make API request
      const response = await fetch("https://expodigital5432apis.dhai-r.com.pk/api/forgot-password", {
        method: "POST",
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
        } else if (data.message) {
          throw new Error(data.message)
        } else {
          throw new Error("Password reset request failed")
        }
      }

      // Show success message
      setSuccessMessage(data.message || "A temporary password has been sent to your email address.")

      // If the message indicates success, start countdown for redirect
      if (data.message === "A temporary password has been sent to your email address.") {
        setRedirectCountdown(5)

        // Start countdown timer
        const timer = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              router.push("/login")
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (err) {
      setError(err.message || "An error occurred during password reset request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 w-full">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">Enter your details below to reset your password</p>
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
          <AlertDescription>
            {successMessage}
            {redirectCountdown !== null && (
              <div className="mt-2">Redirecting to login page in {redirectCountdown} seconds...</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid gap-4 w-full">
          <div className="grid gap-2 w-full">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="cnic">CNIC/NICOP (13 digits)</Label>
            <Input
              id="cnic"
              type="text"
              placeholder="12345-1234567-1"
              value={cnic}
              onChange={handleCNICChange}
              required
              maxLength={15} // 13 digits + 2 hyphens
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Format: 12345-1234567-1</p>
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput id="phone" value={phone} onChange={setPhone} required className="w-full" />
          </div>

          {/* Captcha Section */}
          <div className="grid gap-2 w-full">
            <Label htmlFor="captcha">Captcha Verification</Label>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="bg-gray-100 p-2 rounded-md font-mono text-lg tracking-wider flex-1 text-center select-none"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  pointerEvents: "none",
                  backgroundImage:
                    "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxsaW5lIHgxPSIwIiB5PSIwIiB4Mj0iMCIgeTI9IjEwIiBzdHJva2U9IiNlZWUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')",
                  letterSpacing: "0.5em",
                  fontWeight: "bold",
                  position: "relative",
                }}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onDrag={(e) => e.preventDefault()}
              >
                {captchaText.split("").map((char, index) => (
                  <span
                    key={index}
                    style={{
                      display: "inline-block",
                      transform: `translateY(${captchaStylesRef.current[index]?.translateY || 0}px) rotate(${captchaStylesRef.current[index]?.rotate || 0}deg)`,
                      color: captchaStylesRef.current[index]?.color || "black",
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateCaptcha}
                className="h-10 w-10 flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh Captcha</span>
              </Button>
            </div>
            <Input
              id="captcha"
              type="text"
              placeholder="Enter the captcha text"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
              required
              className={`w-full ${captchaError ? "border-red-500" : ""}`}
            />
            {captchaError && <p className="text-xs text-red-500">Incorrect captcha. Please try again.</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-primary hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
