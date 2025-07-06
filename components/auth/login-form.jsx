"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, RefreshCw, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PasswordInput from "@/components/auth/password-input"
import { AUTH_ENDPOINTS } from "@/config/api-config"

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Add OTP related states
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [otp, setOtp] = useState("")
  const [userId, setUserId] = useState(null)

  // Add success message state
  const [successMessage, setSuccessMessage] = useState("")

  // Add resend OTP timer states
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Inside the LoginForm component, add this special admin login check
  // Add this right after the useState declarations
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  // Add captcha related states
  const [captchaText, setCaptchaText] = useState("")
  const [userCaptcha, setUserCaptcha] = useState("")
  const [captchaError, setCaptchaError] = useState(false)

  // Store captcha styles to prevent regeneration
  const captchaStylesRef = useRef([])

  // Add these state variables after the existing useState declarations
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationOtp, setVerificationOtp] = useState("")
  const [verificationUserId, setVerificationUserId] = useState(null)
  const [verificationError, setVerificationError] = useState("")
  const [verificationSuccess, setVerificationSuccess] = useState("")
  const [verificationLoading, setVerificationLoading] = useState(false)

  // Add this useEffect after the useState declarations
  useEffect(() => {
    // Listen for the special key combination
    window.addEventListener("keydown", checkForAdminLogin)
    return () => {
      window.removeEventListener("keydown", checkForAdminLogin)
    }
  }, [])

  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha()
  }, [])

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

  // Add this function before handleSubmit
  const checkForAdminLogin = (e) => {
    // Special key combination (Ctrl+Shift+A) to show admin login
    if (e.ctrlKey && e.shiftKey && e.key === "A") {
      setIsAdminLogin(true)
      e.preventDefault()
    }
  }

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

  // Update the API endpoint domain and improve error handling in the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validate captcha
    if (userCaptcha !== captchaText) {
      setCaptchaError(true)
      setError("Incorrect captcha. Please try again.")
      generateCaptcha()
      return
    }

    setIsLoading(true)

    try {
      // Modify the handleSubmit function to handle admin login
      // Inside the try block of handleSubmit, add this special case for admin login
      if (isAdminLogin) {
        // Check for admin credentials
        if (email === "admin@dha.com" && password === "admin123") {
          // Create admin user object with role
          const adminUser = {
            id: "admin-1",
            name: "Admin User",
            email: email,
            type: "admin",
            role: 1, // Set role to 1 for Admin
          }

          // Login as admin
          const success = await login("admin-token-123", adminUser)

          if (success) {
            // Use the helper function for redirection
          } else {
            throw new Error("Failed to login as admin")
          }
          return
        } else {
          throw new Error("Invalid admin credentials")
        }
      }

      // Create form data for API request
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      // Make API request with updated domain
      const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
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
          throw new Error("Login failed")
        }
      }

      if (data.token) {
        // If login is successful and token is returned
        const token = data.token
        const userData = data.user || {}

        // Login with the token and user data
        await login(token, userData)

        // Check if user has a temporary password
        if (userData.temp_password) {
          // Redirect to change password page
          window.location.href = "/change-password"
          return
        }

        // Redirect based on role from the user object
        const userRole = userData.role

        // Find the section in handleSubmit where login is successful and token is returned
        // Update the redirection logic to handle marketing users

        // Replace this section:
        // If role is 0 (customer), go to user dashboard
        // If role is 1 or 2 (admin), go to admin dashboard
        let redirectPath
        if (userRole === 0) {
          redirectPath = "/dashboard" // Regular users
        } else if (userRole === 5) {
          redirectPath = "/manager-booking" // Marketing users
        } else {
          redirectPath = "/admin/winners" // Admin users
        }

        // Force a hard navigation to avoid client-side routing issues
        window.location.href = redirectPath
      } else if (data.user_id) {
        // If OTP is required, show OTP form
        setUserId(data.user_id)
        setShowOtpForm(true)

        // Start the resend timer with dynamic value
        setResendDisabled(true)

        // Fetch and set the dynamic timer value
        fetchExpireTime().then((expireTime) => {
          setCountdown(expireTime)
        })
      } else {
        throw new Error("Unexpected response format")
      }
    } catch (err) {
      // Check if the error is about email verification
      if (
        err.message === "Please verify your email address before logging in." ||
        (typeof err.message === "string" && err.message.includes("verify your email"))
      ) {
        try {
          await fetch("https://expodigital5432apis.dhai-r.com.pk/api/resend-verification-otp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          })
          console.log("OTP resent successfully")
        } catch (resendError) {
          console.error("Failed to resend OTP:", resendError)
        }
    
        setVerificationEmail(email)
        setShowVerificationForm(true)
      } else {
        setError(err.message || "An error occurred during login")
        generateCaptcha() 
      }
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

      // Check for access_token or token in the response
      if (data.access_token || data.token) {
        // Set success message
        setSuccessMessage("Verification successful! Redirecting to dashboard...")

        // If verification is successful, login with the token
        const token = data.access_token || data.token

        // Extract user data and role
        const userData = data.user || {}

        // If role is provided in the response, add it to userData
        if (data.role !== undefined) {
          userData.role = data.role
        }

        await login(token, userData)

        // Check if user has a temporary password
        if (userData.temp_password) {
          // Redirect to change password page
          setTimeout(() => {
            window.location.href = "/change-password"
          }, 1500)
          return
        }

        // Use the helper function for redirection
        setTimeout(() => {}, 1500)
      } else {
        throw new Error(data.message || "OTP verification failed")
      }
    } catch (err) {
      setError(err.message || "An error occurred during OTP verification")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleResendOtp function to use the dynamic timer value
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

  // Add this function after the handleResendOtp function
  const handleResendVerificationOtp = async () => {
    if (!verificationEmail) return

    try {
      setVerificationLoading(true)
      setVerificationError("")
      setVerificationSuccess("")

      // Create form data for resend verification OTP
      const formData = new FormData()
      formData.append("email", verificationEmail)

      // Make API request to resend verification OTP
      const response = await fetch("https://expodigital5432apis.dhai-r.com.pk/api/resend-verification-otp", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract specific error message from the response
        const errorMessage = data.error || data.message || "Failed to resend verification OTP"
        throw new Error(errorMessage)
      }

      if (data.user_id) {
        setVerificationUserId(data.user_id)
        setVerificationSuccess("Verification code has been sent to your email and SMS.")

        // Start the resend timer
        setResendDisabled(true)

        // Fetch and set the dynamic timer value
        fetchExpireTime().then((expireTime) => {
          setCountdown(expireTime)
        })
      } else {
        throw new Error("Unexpected response format")
      }
    } catch (err) {
      setVerificationError(err.message || "An error occurred while resending verification OTP")
    } finally {
      setVerificationLoading(false)
    }
  }

  // Add this function after the handleResendVerificationOtp function
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setVerificationError("")
    setVerificationSuccess("")
    setVerificationLoading(true)

    try {
      // Create form data for OTP verification
      const formData = new FormData()
      formData.append("user_id", verificationUserId)
      formData.append("otp_code", verificationOtp)

      // Make API request to verify OTP
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

      // Check for access_token or token in the response
      if (data.access_token || data.token) {
        // Set success message
        setVerificationSuccess("Verification successful! You can now log in.")

        // If verification is successful, login with the token
        const token = data.access_token || data.token

        // Extract user data and role
        const userData = data.user || {}

        // If role is provided in the response, add it to userData
        if (data.role !== undefined) {
          userData.role = data.role
        }

        await login(token, userData)

        // Check if user has a temporary password
        if (userData.temp_password) {
          // Redirect to change password page
          setTimeout(() => {
            window.location.href = "/change-password"
          }, 1500)
          return
        }

        // Redirect based on role
        setTimeout(() => {
          let redirectPath
          if (userData.role === 0) {
            redirectPath = "/dashboard" // Regular users
          } else if (userData.role === 5) {
            redirectPath = "/manager-booking" // Marketing users
          } else {
            redirectPath = "/admin" // Admin users
          }
          window.location.href = redirectPath
        }, 1500)
      } else {
        // If no token but verification was successful, reset the form to allow login
        setVerificationSuccess("Email verified successfully! Please log in.")
        setTimeout(() => {
          setShowVerificationForm(false)
          setError("")
        }, 2000)
      }
    } catch (err) {
      setVerificationError(err.message || "An error occurred during OTP verification")
    } finally {
      setVerificationLoading(false)
    }
  }

  // Now modify the return statement to include the verification form
  // Replace the entire return statement with this:
  return (
    <>
      {showVerificationForm ? (
        <div className="grid gap-6 w-full">
          {verificationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {verificationError.split("\n").map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {verificationSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{verificationSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Verify Your Email</h2>
            <p className="text-sm text-muted-foreground">
              Your email needs verification. We've sent a code to {verificationEmail}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="w-full">
            <div className="grid gap-4 w-full">
              <div className="grid gap-2 w-full">
                <Label htmlFor="verification-otp">Verification Code</Label>
                <Input
                  id="verification-otp"
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationOtp}
                  onChange={(e) => setVerificationOtp(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full" disabled={verificationLoading}>
                {verificationLoading ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center">
                {verificationLoading ? (
                  <p className="text-sm text-muted-foreground">Processing...</p>
                ) : resendDisabled ? (
                  <p className="text-sm text-muted-foreground">Resend code in {countdown} seconds</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerificationOtp}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowVerificationForm(false)}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Back to login
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : showOtpForm ? (
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
      ) : (
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full"
                />
              </div>

              <div className="grid gap-2 w-full">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
                          transform: `translateY(${captchaStylesRef.current[index]?.translateY || 0}px) rotate(${
                            captchaStylesRef.current[index]?.rotate || 0
                          }deg)`,
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
                  onChange={(e) => {
                    setUserCaptcha(e.target.value)
                    // No regeneration of captcha here
                  }}
                  required
                  className={`w-full ${captchaError ? "border-red-500" : ""}`}
                />
                {captchaError && <p className="text-xs text-red-500">Incorrect captcha. Please try again.</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
