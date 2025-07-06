"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchUserProfile, updateBidAmount, fetchDhaBiding } from "@/utils/api"
import { useAuth } from "@/hooks/use-auth"
import DashboardLoading from "@/components/loading/dashboard-loading"
import { AlertCircle, Clock, User, TrendingUp, CheckCircle, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BidRankIndicator from "@/components/bidding/bid-rank-indicator"


export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()

  // Add this function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch((err) => {})
  }

  // Add this function near the top of your component
  const formatCNIC = (cnic) => {
    if (!cnic) return ""

    // Remove any non-digit characters
    const digits = cnic.replace(/\D/g, "")

    // Format as 12345-1234567-1
    if (digits.length === 13) {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
    }

    return cnic // Return original if not 13 digits
  }

  // Add a check at the beginning of the component to redirect non-customer users
  useEffect(() => {
    console.log({
      authLoading,
      isAuthenticated,
      userRole: user?.role,
      shouldRedirect: !authLoading && isAuthenticated && user && user.role !== undefined && user.role > 0,
    })

    // Only redirect if the user is definitely an admin (role > 0)
    if (!authLoading && isAuthenticated && user && user.role !== undefined && user.role > 0) {
      router.push("/admin")
    }
  }, [authLoading, isAuthenticated, user, router])

  const [profileData, setProfileData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [bidAmounts, setBidAmounts] = useState({})
  const [bidErrors, setBidErrors] = useState({})
  const [bidSuccess, setBidSuccess] = useState({})
  const [isSubmitting, setIsSubmitting] = useState({})

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Load user profile data
  const loadUserProfile = async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetchUserProfile()
      setProfileData(response.data)

      // Initialize bid amounts from current bid amounts
      if (response.data && response.data.reserve_bookings) {
        const initialBidAmounts = {}
        response.data.reserve_bookings.forEach((booking) => {
          initialBidAmounts[booking.id] = booking.bid_amount
        })
        setBidAmounts(initialBidAmounts)
      }
    } catch (err) {
      setError("Failed to load profile data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [isAuthenticated])

  // Handle bid amount change
  const handleBidAmountChange = (bookingId, value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, "")

    setBidAmounts((prev) => ({
      ...prev,
      [bookingId]: numericValue,
    }))

    // Clear any previous errors/success for this booking
    setBidErrors((prev) => ({
      ...prev,
      [bookingId]: null,
    }))
    setBidSuccess((prev) => ({
      ...prev,
      [bookingId]: null,
    }))
  }

  // Handle bid submission
  const handleUpdateBid = async (bookingId) => {
    const currentAmount = Number.parseFloat(bidAmounts[bookingId])
    const originalAmount = Number.parseFloat(profileData.reserve_bookings.find((b) => b.id === bookingId).bid_amount)

    // Validate bid amount
    if (!currentAmount || currentAmount <= originalAmount) {
      setBidErrors((prev) => ({
        ...prev,
        [bookingId]: "New bid amount must be higher than the current bid amount",
      }))
      return
    }

    // Check if bid amount is a multiple of 1 lac (100,000)
    if (currentAmount % 100000 !== 0) {
      setBidErrors((prev) => ({
        ...prev,
        [bookingId]: "Bid amount must be in multiples of 1 lac (100,000)",
      }))
      return
    }

    try {
      setIsSubmitting((prev) => ({
        ...prev,
        [bookingId]: true,
      }))

      await updateBidAmount(bookingId, currentAmount)

      setBidSuccess((prev) => ({
        ...prev,
        [bookingId]: "Bid updated successfully!",
      }))

      // Refresh profile data to get updated rank
      await loadUserProfile()
    } catch (err) {
      // Handle API validation errors
      if (err.errors && err.errors.bid_amount && err.errors.bid_amount.length > 0) {
        // Display the specific bid_amount error message from the API
        setBidErrors((prev) => ({
          ...prev,
          [bookingId]: err.errors.bid_amount[0],
        }))
      } else if (err.message) {
        // Display the general error message
        setBidErrors((prev) => ({
          ...prev,
          [bookingId]: err.message,
        }))
      } else {
        // Fallback to generic error
        setBidErrors((prev) => ({
          ...prev,
          [bookingId]: "Failed to update bid. Please try again.",
        }))
      }
    } finally {
      setIsSubmitting((prev) => ({
        ...prev,
        [bookingId]: false,
      }))
    }
  }

  if (authLoading || isLoading) {
    return <DashboardLoading />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">My Bookings</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                {profileData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{profileData.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium break-words">{profileData.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{profileData.user.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CNIC</p>
                      <p className="font-medium">{formatCNIC(profileData.user.cnic)}</p>
                    </div>
                    <div className="pt-4">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push("/")}
                      >
                        Back to Dashboard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No user data available</div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">My Bookings & Reservations</CardTitle>
                <CardDescription>View all your plot bookings and bid status</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                {profileData && profileData.reserve_bookings && profileData.reserve_bookings.length > 0 ? (
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4 w-full">
                      <TabsTrigger value="all" className="flex-1">
                        All Bookings
                      </TabsTrigger>
                      <TabsTrigger value="residential" className="flex-1">
                        Residential
                      </TabsTrigger>
                      <TabsTrigger value="commercial" className="flex-1">
                        Commercial
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                      <div className="space-y-4">
                        {profileData.reserve_bookings.map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            bidAmount={bidAmounts[booking.id]}
                            onBidAmountChange={(value) => handleBidAmountChange(booking.id, value)}
                            onUpdateBid={() => handleUpdateBid(booking.id)}
                            error={bidErrors[booking.id]}
                            success={bidSuccess[booking.id]}
                            isSubmitting={isSubmitting[booking.id]}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="residential">
                      <div className="space-y-4">
                        {profileData.reserve_bookings
                          .filter((booking) => booking.plot.category === "Residential")
                          .map((booking) => (
                            <BookingCard
                              key={booking.id}
                              booking={booking}
                              bidAmount={bidAmounts[booking.id]}
                              onBidAmountChange={(value) => handleBidAmountChange(booking.id, value)}
                              onUpdateBid={() => handleUpdateBid(booking.id)}
                              error={bidErrors[booking.id]}
                              success={bidSuccess[booking.id]}
                              isSubmitting={isSubmitting[booking.id]}
                            />
                          ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="commercial">
                      <div className="space-y-4">
                        {profileData.reserve_bookings
                          .filter((booking) => booking.plot.category === "Commercial")
                          .map((booking) => (
                            <BookingCard
                              key={booking.id}
                              booking={booking}
                              bidAmount={bidAmounts[booking.id]}
                              onBidAmountChange={(value) => handleBidAmountChange(booking.id, value)}
                              onUpdateBid={() => handleUpdateBid(booking.id)}
                              error={bidErrors[booking.id]}
                              success={bidSuccess[booking.id]}
                              isSubmitting={isSubmitting[booking.id]}
                            />
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <Clock className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Bookings Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      You haven't made any plot reservations or bids yet.
                    </p>
                    <Button onClick={() => router.push("/")}>Browse Available Plots</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// The BookingCard component needs to be updated to show more plot details
// Replace the existing BookingCard component with this enhanced version

function BookingCard({ booking, bidAmount, onBidAmountChange, onUpdateBid, error, success, isSubmitting }) {
  const router = useRouter()
  const isCommercial = booking.plot.category === "Commercial"
  const [showBidForm, setShowBidForm] = useState(false)
  const [dhaBiding, setDhaBiding] = useState(0)
  
  useEffect(() => {
    const loadBiding = async () => {
      try {
        const value = await fetchDhaBiding()
        setDhaBiding(value)
      } catch (error) {
        console.error("Biding fetch failed:", error)
      }
    }
  
    loadBiding()
  }, [])

  // Format number with commas
  const formatNumberWithCommas = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch((err) => {})
  }

  return (
    <Card className="overflow-hidden">
      <div className={`border-l-4 ${isCommercial ? "border-green-500" : "border-primary"}`}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-base">Plot {booking.plot.plot_no}</h3>
                <Badge
                  className={
                    booking.plot.category === "Residential"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }
                >
                  {booking.plot.category}
                </Badge>
                <Badge
                  className={
                    booking.status === "Pending"
                      ? "bg-amber-100 text-amber-800"
                      : booking.status === "Completed" || booking.status === "Inprogress"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }
                >
                  {booking.status === "Inprogress" ? "Payment Done (Confirmation Awaited)" : booking.status}
                </Badge>
              </div>

              {/* Enhanced plot details section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mb-4 border-b pb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Phase</p>
                  <p className="font-medium">{booking.plot.phase || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sector</p>
                  <p className="font-medium">{booking.plot.sector || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Street</p>
                  <p className="font-medium">{booking.plot.street_no || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Block</p>
                  <p className="font-medium">
                    {booking.plot.block && booking.plot.block !== "NULL" ? booking.plot.block : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{booking.plot.size} sq ft</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{booking.plot.dimension || "N/A"}</p>
                </div>
              </div>

              {/* Booking details section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Date</p>
                  <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Token Amount</p>
                  <p className="font-medium">PKR {Number.parseFloat(booking.token_amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isCommercial ? "Reserve Price" : "Lump Sum Price"}</p>
                  <p className="font-medium">PKR {Number.parseFloat(booking.plot.base_price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{booking.challan_type}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="truncate">PSID: {booking.challan_no}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(booking.challan_no)
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full"
                    title="Copy PSID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {booking.challan_type === "KuickPay" && (
                  <span className="text-xs italic">(Go to your kuick pay app and enter PSID)</span>
                )}
              </div>
            </div>

            {isCommercial && booking.rank_no > 0 && (
              <div className="flex flex-row sm:flex-col items-center justify-center bg-amber-50 p-3 rounded-lg">
                <p className="text-xs font-medium mr-2 sm:mr-0 sm:mb-1">Current Rank</p>
                <div className="flex flex-col items-center">
                  <BidRankIndicator rank={booking.rank_no} size="sm" />
                  <p className="text-xs text-gray-500 mt-1">Out of all bids</p>
                </div>
              </div>
            )}
          </div>

          {/* Bidding section for commercial plots only */}
          {isCommercial && booking.status === "Inprogress" && dhaBiding === 1 && (
            <div className="mt-4">
              {/* Success message displayed outside the bid form */}
              {success && (
                <Alert className="mb-3 py-2 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-xs">{success}</AlertDescription>
                </Alert>
              )}

              {!showBidForm ? (
                <div>
                  <p className="text-sm text-green-600 font-medium mb-2">
                    <CheckCircle className="h-4 w-4 inline-block mr-1" /> Now you are eligible to place bid
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowBidForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {Number(booking.bid_amount) === 0 || booking.bid_amount === "0" || booking.bid_amount === "0.00"
                      ? "Place Bid"
                      : "Update Bid"}
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">Update Your Bid</h4>

                  {error && (
                    <Alert variant="destructive" className="mb-3 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-end gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">New Bid Amount (PKR)</p>
                      <Input
                        value={Number(bidAmount).toLocaleString()}
                        onChange={(e) => onBidAmountChange(e.target.value)}
                        placeholder="Enter new bid amount"
                        className="text-right"
                      />
                    </div>
                    <Button size="sm" onClick={onUpdateBid} disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update"}
                    </Button>
                  </div>

                  <div className="flex items-center text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span>
                      Bid Amount: PKR {formatNumberWithCommas(booking.bid_amount)}
                      {booking.rank_no > 1 && <span className="ml-1">(Increase to improve your rank)</span>}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Bid amount must be in multiples of 1 lac (100,000)</div>

                  <Button size="sm" variant="ghost" onClick={() => setShowBidForm(false)} className="mt-2 h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
