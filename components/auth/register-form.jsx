"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import PasswordInput from "@/components/auth/password-input"
import PhoneInput from "@/components/auth/phone-input"
import { AUTH_ENDPOINTS } from "@/config/api-config"

export default function RegisterForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cnic: "",
    password: "",
    password_confirmation: "",
    is_overseas: false, // Add this line
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Add OTP related states
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  // Add resend OTP timer states
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Add captcha related states
  const [captchaText, setCaptchaText] = useState("")
  const [userCaptcha, setUserCaptcha] = useState("")
  const [captchaError, setCaptchaError] = useState(false)

  // Store captcha styles to prevent regeneration
  const captchaStylesRef = useRef([])

  // Add countdown timer effect
  useEffect(() => {
    let timer = null

    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (countdown === 0) {
      setResendDisabled(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [resendDisabled, countdown])

  // Add this useEffect after the existing useEffect for countdown timer
  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha()
  }, [])

  // Add a new function to fetch the timer value from the API
  // Add this after the useState declarations

  const fetchExpireTime = async () => {
    try {
      const response = await fetch("https://expodigital5432apis.dhai-r.com.pk/api/expire-time")
      if (!response.ok) {
        throw new Error("Failed to fetch expire time")
      }
      const data = await response.json()
      return Number.parseInt(data) || 60 // Default to 60 seconds if the API returns an invalid value
    } catch (error) {
      return 60 // Default to 60 seconds if there's an error
    }
  }

  // Add the generateCaptcha function after the fetchExpireTime function
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

  // Add this function near the top of your component, after useState declarations
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
      setFormData((prev) => ({ ...prev, cnic: formattedValue }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the API endpoint domain and improve error handling in the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Add this at the beginning of the handleSubmit function, right after e.preventDefault()
    // Validate captcha
    if (userCaptcha !== captchaText) {
      setCaptchaError(true)
      setError("Incorrect captcha. Please try again.")
      generateCaptcha()
      return
    }

    // Validate form
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    // Add special character check
    if (/[=%<>"']/g.test(formData.password)) {
      setError("Password contains invalid special characters")
      return
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match")
      return
    }

    const cnicDigits = formData.cnic.replace(/\D/g, "")
    if (cnicDigits.length !== 13) {
      setError("CNIC must be 13 digits")
      return
    }

    setIsLoading(true)

    try {
      // Create form data for API request
      const apiFormData = new FormData()
      apiFormData.append("name", formData.name)
      apiFormData.append("email", formData.email)
      apiFormData.append("phone", formData.phone)
      apiFormData.append("cnic", cnicDigits)
      apiFormData.append("password", formData.password)
      apiFormData.append("password_confirmation", formData.password_confirmation)
      apiFormData.append("is_overseas", formData.is_overseas ? "1" : "0") // Add this line

      // Make API request with updated domain
      const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
        method: "POST",
        body: apiFormData,
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
          throw new Error("Registration failed")
        }
      }


      // Update the section where we show the OTP form and start the timer
      // Find the part where we set showOtpForm to true and update it

      // Replace this part in handleSubmit function:
      if (data.user_id) {
        // If user_id is returned, show OTP form
        setUserId(data.user_id)
        setShowOtpForm(true)

        // Start the resend timer with dynamic value
        setResendDisabled(true)

        // Fetch and set the dynamic timer value
        fetchExpireTime().then((expireTime) => {
          setCountdown(expireTime)
        })
      } else if (data.token) {
        // If registration is successful and token is returned
        await login(data.token, data.user || {})
        router.push("/")
        router.refresh()
      } else {
        throw new Error("Unexpected response format")
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the API endpoint domain and improve error handling in the handleOtpSubmit function
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      // Create form data for OTP verification
      const formData = new FormData()
      formData.append("user_id", userId)
      formData.append("otp_code", otp)

      // Make API request to verify OTP with updated domain
      const response = await fetch(AUTH_ENDPOINTS.VERIFY_OTP, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract specific error message from the response
        const errorMessage = data.error || data.message || "OTP verification failed"
        throw new Error(errorMessage)
      }


      // Check for access_token in the response
      if (data.access_token) {
        // Set success message
        setSuccessMessage("Account verified successfully! Redirecting to dashboard...")

        // If verification is successful, login with the token
        await login(data.access_token, data.user || {})

        // Then redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        // If no token is returned, redirect to login page
        setSuccessMessage("Account verified successfully! Redirecting to login page...")
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      }
    } catch (err) {
      setError(err.message || "An error occurred during OTP verification")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the API endpoint domain and improve error handling in the handleResendOtp function
  // Replace the existing handleResendOtp function with this one

  const handleResendOtp = async () => {
    if (!userId || resendDisabled) return

    try {
      setIsLoading(true)
      setError("")
      setSuccessMessage("")

      // Create form data for resend OTP
      const formData = new FormData()
      formData.append("user_id", userId)

      // Make API request to resend OTP with updated domain
      const response = await fetch(AUTH_ENDPOINTS.RESEND_OTP, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract specific error message from the response
        const errorMessage = data.error || data.message || "Failed to resend OTP"
        throw new Error(errorMessage)
      }

      setSuccessMessage("OTP has been resent.")

      // Fetch the dynamic timer value and reset the countdown timer
      const expireTime = await fetchExpireTime()
      setResendDisabled(true)
      setCountdown(expireTime)
    } catch (err) {
      setError(err.message || "An error occurred while resending OTP")
    } finally {
      setIsLoading(false)
    }
  }

  if (showOtpForm) {
    return (
      <div className="grid gap-6 w-full">
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

        <form onSubmit={handleOtpSubmit} className="w-full">
          <div className="grid gap-4 w-full">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold">Verify OTP</h2>
              <p className="text-sm text-muted-foreground">Enter the verification code sent to your email/phone</p>
              <p className="text-red-600 text-sm font-medium mt-1">
                In case SMS OTP failed or not received, please check your email (also check spam folder)
              </p>
            </div>

            <div className="grid gap-2 w-full">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="text-center">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Processing...</p>
              ) : resendDisabled ? (
                <p className="text-sm text-muted-foreground">Resend OTP in {countdown} seconds</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="grid gap-6 w-full">
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

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid gap-4 w-full">
          <div className="grid gap-2 w-full">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              className="w-full"
            />
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full"
            />
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
              required
              placeholder="3001234567"
            />
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="cnic">CNIC/NICOP (13 digits)</Label>
            <Input
              id="cnic"
              name="cnic"
              type="text"
              placeholder="12345-1234567-1"
              value={formData.cnic}
              onChange={handleCNICChange}
              required
              maxLength={15} // 13 digits + 2 hyphens
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Format: 12345-1234567-1</p>
          </div>

          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="align-middle" style={{ width: "24px", paddingRight: "0" }}>
                  <input
                    type="checkbox"
                    id="is_overseas"
                    checked={formData.is_overseas}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_overseas: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </td>
                <td className="align-middle pl-2">
                  <label htmlFor="is_overseas" className="text-sm">
                    I am an overseas Pakistani
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid gap-2 w-full">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full"
            />
            <ul className="text-xs text-muted-foreground list-disc pl-4">
              <li>Minimum 8 characters required</li>
              <li>Avoid special characters like =, %, &lt;, &gt;, and quotation marks</li>
            </ul>
          </div>

          <div className="grid gap-2 w-full">
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <PasswordInput
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full"
            />
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>

      <div className="mt-4 pb-8 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
