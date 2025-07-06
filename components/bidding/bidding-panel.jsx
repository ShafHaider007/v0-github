"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Update the component to accept onBidSubmit prop
export default function BiddingPanel({ plots, onBidSubmit }) {
  // Update the state to include bidRank and showRankInfo
  const [bidAmount, setBidAmount] = useState("")
  const [formattedBidAmount, setFormattedBidAmount] = useState("")
  const [bidRank, setBidRank] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showRankInfo, setShowRankInfo] = useState(false) // Add this line
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalBasePrice = plots.reduce((sum, plot) => sum + plot.price, 0)
  const minBidAmount = totalBasePrice + totalBasePrice * 0.05 // 5% higher than base price

  // Format number with commas
  const formatNumberWithCommas = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Handle bid amount change with formatting
  const handleBidAmountChange = useCallback((e) => {
    const value = e.target.value

    // Remove any non-numeric characters except commas
    const numericValue = value.replace(/[^0-9]/g, "")

    if (numericValue === "") {
      setBidAmount("")
      setFormattedBidAmount("")
      return
    }

    // Store the numeric value in state
    setBidAmount(numericValue)

    // Format with commas for display
    setFormattedBidAmount(formatNumberWithCommas(numericValue))
  }, [])

  // Update the handleBidSubmit function to call onBidSubmit with the rank
  const handleBidSubmit = async () => {
    if (!bidAmount || Number.parseInt(bidAmount) < minBidAmount) {
      alert(`Bid amount must be at least PKR ${formatNumberWithCommas(minBidAmount)}`)
      return
    }

    // Check if bid amount is a multiple of 1 lac (100,000)
    if (Number.parseInt(bidAmount) % 100000 !== 0) {
      alert("Bid amount must be in multiples of 1 lac (100,000)")
      return
    }

    try {
      setIsSubmitting(true)
      // Call API to submit bid
      // const response = await fetch(PLOT_ENDPOINTS.SUBMIT_BID, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     plotIds: plots.map(p => p.id),
      //     amount: parseInt(bidAmount)
      //   }),
      // })

      // Simulate API response
      const mockResponse = {
        success: true,
        bidRank: Math.floor(Math.random() * 5) + 1, // Random rank between 1-5
      }

      setBidRank(mockResponse.bidRank)
      setShowConfirmation(true)
      setShowRankInfo(true)

      // Call the onBidSubmit callback with the rank
      if (onBidSubmit) {
        onBidSubmit(mockResponse.bidRank)
      }
    } catch (error) {
      alert("Failed to submit bid. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Place Your Bid</h3>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700 mb-1">Total Base Price</p>
        <p className="font-bold text-xl">PKR {formatNumberWithCommas(totalBasePrice)}</p>
        <p className="text-xs text-gray-600 mt-1">
          Minimum bid: PKR {formatNumberWithCommas(minBidAmount)} (5% above base price)
        </p>
      </div>

      {showRankInfo && (
        <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">Your Current Bid Ranking</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Your bid is currently ranked:</p>
              <p className="font-bold text-xl text-yellow-700">#{bidRank} of all bids</p>
            </div>
            {bidRank > 1 ? (
              <div className="text-right">
                <p className="text-xs text-gray-600">To improve your ranking:</p>
                <p className="text-sm font-medium text-yellow-800">
                  Increase your bid by at least PKR {formatNumberWithCommas(Math.round(minBidAmount * 0.05))}
                </p>
              </div>
            ) : (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Highest Bid</div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="bidAmount" className="block text-sm font-medium mb-1">
          Your Bid Amount (PKR)
        </label>
        <Input
          id="bidAmount"
          type="text"
          value={formattedBidAmount}
          onChange={handleBidAmountChange}
          placeholder="Enter Bid Amount"
          className="font-medium"
          inputMode="numeric"
        />
      </div>

      <Button onClick={handleBidSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white">
        {isSubmitting ? "Updating..." : "Update Bid"}
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bid Submitted Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              {bidRank === 1 ? (
                <div>
                  <p className="text-green-600 font-semibold mb-2">
                    Congratulations! Your bid is currently the highest.
                  </p>
                  <div className="bg-green-50 p-3 rounded-md mb-2">
                    <p className="text-sm">
                      Your bid of <span className="font-bold">PKR {formatNumberWithCommas(bidAmount)}</span> is
                      currently ranked <span className="font-bold">#1</span> among all bids for these plots.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-2">
                    Your bid is currently ranked <span className="font-bold">#{bidRank}</span> among all bids for these
                    plots.
                  </p>
                  <div className="bg-yellow-50 p-3 rounded-md mb-2">
                    <p className="text-sm">
                      To improve your ranking, consider increasing your bid amount. The minimum increment is 5% of your
                      current bid.
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-2">You can view and manage all your bids in the "My Bids" section.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
