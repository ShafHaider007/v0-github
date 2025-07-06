"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"
import { Search, Download, Trophy, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { fetchPaymentList, fetchDashboardStats } from "@/utils/api"

// Remove the dummyWinners array completely

export default function WinnersList() {
  const [winners, setWinners] = useState([])
  const [revealedWinners, setRevealedWinners] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPhase, setFilterPhase] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiOpacity, setConfettiOpacity] = useState(1)
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const { toast } = useToast()

  // Set window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch winners data (bidders with rank 1)
  useEffect(() => {
    const fetchWinners = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First try to get data from dashboard stats
        const statsResponse = await fetchDashboardStats()
        let winnersData = []

        if (statsResponse?.data?.top_bidders) {
          // Filter top bidders to only include rank 1
          winnersData = statsResponse.data.top_bidders
            .filter((bidder) => bidder.rank_no === 1)
            .map(formatBidderToWinner)
        }

        // If we don't have enough data from dashboard stats, fetch from payments
        if (winnersData.length < 5) {
          // Make multiple requests to get all pages of data
          let allPayments = []
          let currentPage = 1
          let hasMorePages = true

          while (hasMorePages && currentPage <= 5) {
            // Limit to 5 pages
            const response = await fetchPaymentList(currentPage)
            const pagePayments = response.data.payments || []
            allPayments = [...allPayments, ...pagePayments]

            currentPage++
            hasMorePages = currentPage <= response.data.last_page
          }

          // Filter payments to only include those with rank_no = 1
          const winnerPayments = allPayments.filter(
            (payment) => Number(payment.rank_no) === 1 && Number(payment.bid_amount) > 0,
          )

          // Format payments to match winner structure and add to winners data
          const paymentWinners = winnerPayments.map(formatPaymentToWinner)

          // Combine both data sources, removing duplicates by plotId
          const plotIds = new Set(winnersData.map((w) => w.plotId))
          const uniquePaymentWinners = paymentWinners.filter((w) => !plotIds.has(w.plotId))

          winnersData = [...winnersData, ...uniquePaymentWinners]
        }

        setWinners(winnersData)
      } catch (error) {
        console.error("Error fetching winners:", error)
        setError("Failed to load winners data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load winners data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWinners()
  }, [toast])

  // Helper function to format bidder data from dashboard stats to winner format
  const formatBidderToWinner = (bidder) => {
    return {
      id: bidder.id,
      plotId: bidder.plot.plot_no,
      phase: bidder.plot.phase || "N/A",
      sector: bidder.plot.sector || "N/A",
      street: bidder.plot.street_no || "N/A",
      size: bidder.plot.cat_area || "Standard",
      category: bidder.plot.category || "Commercial",
      basePrice: Number(bidder.plot.base_price) || 0,
      finalBid: Number(bidder.bid_amount) || 0,
      winner: {
        name: bidder.user.name,
        cnic: bidder.user.cnic || "N/A",
        phone: bidder.user.phone || "N/A",
        email: bidder.user.email || "N/A",
        rank: bidder.rank_no,
        bidAmount: Number(bidder.bid_amount) || 0,
      },
    }
  }

  // Helper function to format payment data to winner format
  const formatPaymentToWinner = (payment) => {
    return {
      id: payment.id,
      plotId: payment.plot_no,
      phase: payment.phase || "N/A",
      sector: payment.sector || "N/A",
      street: payment.street_no || "N/A",
      size: payment.cat_area || "Standard",
      category: payment.category || "Commercial",
      basePrice: Number(payment.base_price) || 0,
      finalBid: Number(payment.bid_amount) || 0,
      winner: {
        name: payment.name,
        cnic: payment.cnic || "N/A",
        phone: payment.phone || "N/A",
        email: payment.email || "N/A",
        rank: payment.rank_no,
        bidAmount: Number(payment.bid_amount) || 0,
      },
    }
  }

  // Update the handleRevealWinner function to properly position the confetti
  const handleRevealWinner = (id, event) => {
    // Get position of the button for confetti
    const rect = event.currentTarget.getBoundingClientRect()

    // Show confetti with full opacity
    setConfettiOpacity(1)
    setShowConfetti(true)

    // Position confetti more to the left of the button
    setConfettiPosition({
      x: Math.max(rect.left - 100, 0), // Shift left by 100px, but not less than 0
      y: rect.top,
    })

    // Set the winner as revealed
    setRevealedWinners((prev) => ({
      ...prev,
      [id]: true,
    }))

    // Start fading out confetti after 4 seconds
    setTimeout(() => {
      setConfettiOpacity(0)
    }, 4000)

    // Hide confetti after fade out (total 5 seconds)
    setTimeout(() => {
      setShowConfetti(false)
    }, 5000)
  }

  const handleHideWinner = (id) => {
    setRevealedWinners((prev) => {
      const newState = { ...prev }
      delete newState[id]
      return newState
    })
  }

  const handleRevealAll = () => {
    const allIds = {}
    winners.forEach((winner) => {
      allIds[winner.id] = true
    })
    setRevealedWinners(allIds)

    // Reset opacity to full
    setConfettiOpacity(1)

    // Position confetti in the center-left of the viewport
    setConfettiPosition({
      x: windowSize.width / 3, // Position at 1/3 of the screen width
      y: 0,
    })

    setShowConfetti(true)

    // Start fading out confetti after 4 seconds
    setTimeout(() => {
      setConfettiOpacity(0)
    }, 4000)

    // Hide confetti after fade out (total 5 seconds)
    setTimeout(() => {
      setShowConfetti(false)
    }, 5000)
  }

  const handleHideAll = () => {
    setRevealedWinners({})
  }

  const handleExportCSV = () => {
    // Define the CSV headers
    const escapeCSV = (field) => {
      if (field === null || field === undefined) return ""
      const stringField = String(field)
      // If the field contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
      if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
        return `"${stringField.replace(/"/g, '""')}"`
      }
      return stringField
    }

    const headers = [
      "Plot ID",
      "Phase",
      "Sector",
      "Street",
      "Size",
      "Category",
      "Base Price",
      "Final Bid",
      "Winner Name",
      "CNIC",
      "Phone",
      "Email",
    ].map(escapeCSV)

    // Convert the winners to CSV rows
    const rows = winners
      .filter(
        (winner) =>
          (filterPhase === "all" || winner.phase === filterPhase) &&
          (searchTerm === "" ||
            winner.plotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            winner.winner.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      .map((winner) => [
        escapeCSV(winner.plotId),
        escapeCSV(winner.phase),
        escapeCSV(winner.sector),
        escapeCSV(winner.street),
        escapeCSV(winner.size),
        escapeCSV(winner.category),
        escapeCSV(winner.basePrice), // Remove toLocaleString() to avoid comma issues
        escapeCSV(winner.finalBid), // Remove toLocaleString() to avoid comma issues
        escapeCSV(winner.winner.name),
        escapeCSV(winner.winner.cnic),
        escapeCSV(winner.winner.phone),
        escapeCSV(winner.winner.email),
      ])

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a download link and trigger the download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `winners-list-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Winners list has been exported as CSV.",
    })
  }

  // Filter winners based on search term and phase only (removed category filter)
  const filteredWinners = winners.filter(
    (winner) =>
      (filterPhase === "all" || winner.phase === filterPhase) &&
      (searchTerm === "" ||
        winner.plotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        winner.winner.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Get unique phases for filter dropdown
  const phases = [...new Set(winners.map((winner) => winner.phase))]

  return (
    <div className="container py-6">
      {showConfetti && (
        <motion.div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 100,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: confettiOpacity }}
          transition={{ duration: 1 }}
        >
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={true}
            numberOfPieces={600}
            gravity={0.15}
            wind={0.01}
            initialVelocityX={4}
            initialVelocityY={10}
            confettiSource={{
              x: confettiPosition.x,
              y: confettiPosition.y,
              w: 100,
              h: 10,
            }}
            colors={["#FFD700", "#FFA500", "#FF4500", "#FF6347", "#FF8C00", "#FFFF00", "#FF1493", "#00BFFF"]}
          />
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Winners of Bids</h1>
          <p className="text-muted-foreground mt-1">Reveal the winners of the bidding process for each plot</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="default" size="sm" className="flex items-center gap-1" onClick={handleRevealAll}>
            <Eye className="h-4 w-4" />
            Reveal All
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleHideAll}>
            <EyeOff className="h-4 w-4" />
            Hide All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Winners List</CardTitle>
              <CardDescription>Click on "Reveal Winner" to see who won the bid for each plot</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Select value={filterPhase} onValueChange={setFilterPhase}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by plot ID or winner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredWinners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No winners found matching your filters</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSearchTerm("")
                  setFilterPhase("all")
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredWinners.map((winner) => (
                <Card key={winner.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{winner.plotId}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-blue-100 text-blue-800">{winner.category}</Badge>
                            <span className="text-sm text-muted-foreground">{winner.size}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Base Price</div>
                          <div className="font-semibold">PKR {winner.basePrice.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Phase</div>
                          <div>{winner.phase}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sector</div>
                          <div>{winner.sector}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Street</div>
                          <div>{winner.street}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-muted-foreground text-sm">Final Bid</div>
                        <div className="text-lg font-bold text-green-600">PKR {winner.finalBid.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((winner.finalBid / winner.basePrice - 1) * 100)}% above base price
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold flex items-center">
                          <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                          Winner Details
                        </h3>
                        {revealedWinners[winner.id] ? (
                          <Button variant="outline" size="sm" onClick={() => handleHideWinner(winner.id)}>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => handleRevealWinner(winner.id, e)}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Reveal Winner
                          </Button>
                        )}
                      </div>

                      <AnimatePresence>
                        {revealedWinners[winner.id] ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-muted-foreground text-sm">Name</div>
                                <div className="font-semibold">{winner.winner.name}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-sm">CNIC</div>
                                <div>{winner.winner.cnic}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-sm">Phone</div>
                                <div>{winner.winner.phone}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-sm">Email</div>
                                <div>{winner.winner.email}</div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="text-muted-foreground text-sm">Bid Amount</div>
                              <div className="text-lg font-bold text-green-600">
                                PKR {winner.winner.bidAmount.toLocaleString()}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center py-8"
                          >
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                              <Trophy className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-center text-muted-foreground">Winner information is hidden</p>
                            <p className="text-center text-xs text-muted-foreground mt-1">
                              Click the "Reveal Winner" button to see who won this plot
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
