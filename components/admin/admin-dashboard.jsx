"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Building, Home, Users, TrendingUp, Printer, FileCheck, Download, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/use-auth"

// Add this import at the top with the other imports
import Link from "next/link"

// Add these imports at the top with the other imports
import { fetchDashboardStats, fetchPaymentList, fetchRegisteredUsers } from "@/utils/api"

// Update the inventoryData object to ensure consistency
const inventoryData = {
  total: 1250,
  available: 850,
  sold: 320,
  bidding: 80, // Only commercial plots can be under bidding
  amountCollected: 1250000000, // 1.25 billion PKR
  residentialSold: 220,
  commercialSold: 100,
  residentialBidding: 0, // No bidding for residential
  commercialBidding: 80, // All bidding is commercial
  residentialTotal: 850,
  commercialTotal: 400,
  residentialAvailable: 630, // 850 - 220 = 630
  commercialAvailable: 220, // 400 - 100 - 80 = 220
}

// Updated sales data with time intervals instead of months
const salesData = [
  { interval: "9am-12pm", residential: 35, commercial: 15 }, // Residential higher
  { interval: "12pm-3pm", residential: 18, commercial: 28 }, // Commercial higher
  { interval: "3pm-6pm", residential: 22, commercial: 32 }, // Commercial higher
  { interval: "6pm-9pm", residential: 40, commercial: 25 }, // Residential higher
]

// Update the pie data to match the inventory data
// Original pie data - updated to reflect bidding only for commercial
const originalPieData = [
  { name: "Available", value: 850, color: "#10b981", type: "all" },
  { name: "Sold", value: 320, color: "#f59e0b", type: "all" },
  { name: "Bidding", value: 80, color: "#3b82f6", type: "all" },
]

// Residential pie data - no bidding category
const residentialPieData = [
  { name: "Available", value: 630, color: "#10b981", type: "residential" },
  { name: "Sold", value: 220, color: "#3b82f6", type: "residential" },
]

// Commercial pie data - includes bidding
const commercialPieData = [
  { name: "Available", value: 220, color: "#10b981", type: "commercial" },
  { name: "Sold", value: 100, color: "#3b82f6", type: "commercial" },
  { name: "Bidding", value: 80, color: "#f59e0b", type: "commercial" },
]

const COLORS = ["#10b981", "#f59e0b", "#3b82f6"]

// Update the topBidders array to include plot details instead of rank
const topBidders = [
  { id: 1, name: "Ahmed Khan", totalAmount: 120000000, plotId: "C-123", plotType: "Commercial", plotSize: "10 Marla" },
  { id: 2, name: "Sara Ali", totalAmount: 95000000, plotId: "B-456", plotType: "Commercial", plotSize: "8 Marla" },
  {
    id: 3,
    name: "Muhammad Usman",
    totalAmount: 85000000,
    plotId: "A-789",
    plotType: "Commercial",
    plotSize: "5 Marla",
  },
  { id: 4, name: "Fatima Zaidi", totalAmount: 75000000, plotId: "D-101", plotType: "Commercial", plotSize: "10 Marla" },
  { id: 5, name: "Ali Hassan", totalAmount: 65000000, plotId: "C-234", plotType: "Commercial", plotSize: "8 Marla" },
]

const recentTransactions = [
  {
    id: 1,
    plotId: "C-123",
    type: "Residential",
    phase: "Phase 4",
    amount: 15000000,
    date: "2023-12-01",
    status: "completed",
    buyer: "Ahmed Khan",
  },
  {
    id: 2,
    plotId: "B-456",
    type: "Commercial",
    phase: "Phase 3",
    amount: 25000000,
    date: "2023-11-28",
    status: "pending",
    buyer: "Sara Ali",
  },
  {
    id: 3,
    plotId: "A-789",
    type: "Residential",
    phase: "Phase 2",
    amount: 18000000,
    date: "2023-11-25",
    status: "completed",
    buyer: "Muhammad Usman",
  },
  {
    id: 4,
    plotId: "D-101",
    type: "Commercial",
    phase: "Phase 4",
    amount: 30000000,
    date: "2023-11-20",
    status: "completed",
    buyer: "Fatima Zaidi",
  },
  {
    id: 5,
    plotId: "C-234",
    type: "Residential",
    phase: "Phase 1",
    amount: 16000000,
    date: "2023-11-15",
    status: "pending",
    buyer: "Ali Hassan",
  },
]

const finalCandidates = [
  { id: 1, name: "Ahmed Khan", plotId: "C-123", type: "Residential", amount: 15000000, rank: 1 },
  { id: 2, name: "Sara Ali", plotId: "B-456", type: "Commercial", amount: 25000000, rank: 1 },
  { id: 3, name: "Muhammad Usman", plotId: "A-789", type: "Residential", amount: 18000000, rank: 1 },
  { id: 4, name: "Fatima Zaidi", plotId: "D-101", type: "Commercial", amount: 30000000, rank: 1 },
  { id: 5, name: "Ali Hassan", plotId: "C-234", type: "Residential", amount: 16000000, rank: 1 },
  { id: 6, name: "Zainab Malik", plotId: "E-345", type: "Commercial", amount: 28000000, rank: 1 },
  { id: 7, name: "Omar Farooq", plotId: "F-456", type: "Residential", amount: 17000000, rank: 1 },
  { id: 8, name: "Ayesha Siddiqui", plotId: "G-567", type: "Commercial", amount: 32000000, rank: 1 },
]

// Custom tooltip component that doesn't show on click
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
        {label && <p className="font-medium">{label}</p>}
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
            {`${entry.name || ""}: ${entry.value || 0}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Custom pie chart with proper legend and tooltip
const CustomPieChart = ({ data, chartFilterType }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          isAnimationActive={false}
          activeIndex={[]}
          activeShape={(props) => null}
          onClick={null}
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
              style={{ outline: "none", stroke: "none" }}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="custom-tooltip bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-gray-700">{`Count: ${data.value}`}</p>
                  <p className="text-gray-700">{`${(payload[0].percent * 100).toFixed(1)}%`}</p>
                </div>
              )
            }
            return null
          }}
          isAnimationActive={false}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          formatter={(value, entry, index) => <span className="text-xs font-medium">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Update the CustomBarChart component to accept props for loading and error states
const CustomBarChart = ({ data, isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interval" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
        <Legend formatter={(value) => <span className="text-xs font-medium">{value}</span>} />
        <Bar
          dataKey="residential"
          name="Residential"
          fill="#f59e0b"
          isAnimationActive={false}
          activeIndex={[]}
          activeBar={null}
          onClick={null}
          style={{ outline: "none" }}
        />
        <Bar
          dataKey="commercial"
          name="Commercial"
          fill="#3b82f6"
          isAnimationActive={false}
          activeIndex={[]}
          activeBar={null}
          onClick={null}
          style={{ outline: "none" }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function AdminDashboard() {
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [chartFilterType, setChartFilterType] = useState("all")
  const [transactionFilterType, setTransactionFilterType] = useState("all")

  // Add these state variables after the existing useState declarations
  const [dashboardStats, setDashboardStats] = useState(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)

  // Add these state variables after the existing useState declarations
  const [payments, setPayments] = useState([])
  const [paymentsPagination, setPaymentsPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  })
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true)
  const [paymentsError, setPaymentsError] = useState(null)

  // Add these state variables after the existing useState declarations
  const [registeredUsers, setRegisteredUsers] = useState(null)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState(null)

  // Add these state variables after the existing useState declarations
  const [salesChartData, setSalesChartData] = useState([
    { interval: "9am-12pm", residential: 0, commercial: 0 },
    { interval: "12pm-3pm", residential: 0, commercial: 0 },
    { interval: "3pm-6pm", residential: 0, commercial: 0 },
    { interval: "6pm-9pm", residential: 0, commercial: 0 },
  ])
  const [isSalesDataLoading, setIsSalesDataLoading] = useState(true)
  const [salesDataError, setSalesDataError] = useState(null)

  // Add state for the confirmation dialog
  // Add these after the existing useState declarations:
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const { user } = useAuth()
  const isFinanceUser = user && user.role === 3

  // With this live timer implementation:
  const [currentTime, setCurrentTime] = useState(new Date())

  // Add this useEffect to fetch the dashboard stats
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setIsStatsLoading(true)
        const response = await fetchDashboardStats()
        setDashboardStats(response.data)
      } catch (error) {
        setStatsError(error.message || "Failed to load dashboard stats")
      } finally {
        setIsStatsLoading(false)
      }
    }

    loadDashboardStats()
  }, [])

  // Add this useEffect after the existing useEffect for dashboard stats
  useEffect(() => {
    const loadPaymentList = async () => {
      try {
        setIsPaymentsLoading(true)
        // Request a larger page size to get more bidding data
        const response = await fetchPaymentList(paymentsPagination.currentPage)
        setPayments(response.data.payments || [])
        setPaymentsPagination({
          currentPage: response.data.current_page,
          lastPage: response.data.last_page,
          total: response.data.total,
          perPage: response.data.per_page,
        })
      } catch (error) {
        setPaymentsError(error.message || "Failed to load payment list")
      } finally {
        setIsPaymentsLoading(false)
      }
    }

    loadPaymentList()
  }, [paymentsPagination.currentPage])

  // Add a new function to load all payments for bidding data
  useEffect(() => {
    const loadAllBiddingData = async () => {
      try {
        // Only load if we don't already have payments data
        if (payments.length === 0) {
          setIsPaymentsLoading(true)

          // Make multiple requests to get all pages of data
          let allPayments = []
          let currentPage = 1
          let hasMorePages = true

          while (hasMorePages && currentPage <= 5) {
            // Limit to 5 pages to avoid too many requests
            const response = await fetchPaymentList(currentPage)
            const pagePayments = response.data.payments || []
            allPayments = [...allPayments, ...pagePayments]

            currentPage++
            hasMorePages = currentPage <= response.data.last_page
          }

          // Update state with all payments
          setPayments(allPayments)
        }
      } catch (error) {
        console.error("Error loading all bidding data:", error)
      } finally {
        setIsPaymentsLoading(false)
      }
    }

    loadAllBiddingData()
  }, []) // Run once on component mount

  // Add this useEffect after the existing useEffect hooks
  useEffect(() => {
    const loadRegisteredUsers = async () => {
      try {
        setIsUsersLoading(true)
        const response = await fetchRegisteredUsers()
        setRegisteredUsers(response)
      } catch (error) {
        setUsersError(error.message || "Failed to load registered users")
      } finally {
        setIsUsersLoading(false)
      }
    }

    loadRegisteredUsers()
  }, [])

  // Add this function after the existing useEffect hooks
  const fetchTimeIntervalData = async (startTime, endTime, intervalLabel) => {
    try {
      // Format today's date with the specified time
      const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
      const startDateTime = `${today} ${startTime}`
      const endDateTime = `${today} ${endTime}`

      // Fetch data for this time interval
      const response = await fetch(
        `https://expodigital5432apis.dhai-r.com.pk/api/dashboard-stats?start_date=${encodeURIComponent(startDateTime)}&end_date=${encodeURIComponent(endDateTime)}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${intervalLabel}`)
      }

      const data = await response.json()

      // Return the data with the interval label
      return {
        interval: intervalLabel,
        residential: data.data.total_sold_plots || 0,
        commercial: data.data.plots_under_bidding || 0,
      }
    } catch (error) {
      // Return default values on error
      return {
        interval: intervalLabel,
        residential: 0,
        commercial: 0,
        error: true,
      }
    }
  }

  // Add this useEffect to fetch data for all time intervals
  useEffect(() => {
    const fetchAllTimeIntervals = async () => {
      setIsSalesDataLoading(true)
      setSalesDataError(null)

      try {
        const timeIntervals = [
          { start: "09:00", end: "12:00", label: "9am-12pm" },
          { start: "12:00", end: "15:00", label: "12pm-3pm" },
          { start: "15:00", end: "18:00", label: "3pm-6pm" },
          { start: "18:00", end: "21:00", label: "6pm-9pm" },
        ]

        const results = await Promise.all(
          timeIntervals.map((interval) => fetchTimeIntervalData(interval.start, interval.end, interval.label)),
        )

        // Check if any intervals had errors
        const hasErrors = results.some((result) => result.error)
        if (hasErrors) {
          setSalesDataError("Some data could not be loaded")
        }

        // Update the chart data
        setSalesChartData(results)
      } catch (error) {
        setSalesDataError("Failed to load sales data")
      } finally {
        setIsSalesDataLoading(false)
      }
    }

    fetchAllTimeIntervals()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Get pie data based on filter
  const getPieData = () => {
    if (!isStatsLoading && dashboardStats) {
      return getInventoryData()
    }

    // Return original dummy data if no real data is available
    switch (chartFilterType) {
      case "residential":
        return residentialPieData
      case "commercial":
        return commercialPieData
      default:
        return originalPieData
    }
  }

  // Filter candidates based on type and search term
  const filteredCandidates = finalCandidates.filter((candidate) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "residential" && candidate.type === "Residential") ||
      (filterType === "commercial" && candidate.type === "Commercial")

    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.plotId.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesType && matchesSearch
  })

  // Filter transactions based on type
  const filteredTransactions = recentTransactions.filter((transaction) => {
    return (
      transactionFilterType === "all" ||
      (transactionFilterType === "residential" && transaction.type === "Residential") ||
      (transactionFilterType === "commercial" && transaction.type === "Commercial")
    )
  })

  // Handle print functionality
  const handlePrint = () => {
    window.print()
  }

  // Function to export transactions as CSV
  const exportTransactionsCSV = () => {
    // Define the CSV headers
    const headers = [
      "Plot ID",
      "Phase",
      "Sector",
      "Street",
      "Size",
      "Type",
      "Buyer",
      "Base Price",
      "Amount (PKR)",
      "Payment Date",
      "Status",
    ]

    // Convert the payments to CSV rows
    const rows = payments
      .filter(
        (payment) =>
          transactionFilterType === "all" ||
          (transactionFilterType === "residential" && payment.category === "Residential") ||
          (transactionFilterType === "commercial" && payment.category === "Commercial"),
      )
      .map((payment) => [
        payment.plot_no,
        payment.phase,
        payment.sector,
        payment.street_no,
        payment.cat_area,
        payment.category,
        payment.name,
        payment.base_price,
        payment.received_amount,
        payment.payment_date ? new Date(payment.payment_date).toLocaleString() : "N/A",
        payment.status,
      ])

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create a download link and trigger the download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Add a function to handle status update
  // Add this function before the return statement:
  const handleStatusUpdate = async () => {
    if (!selectedTransaction) return

    try {
      setIsUpdatingStatus(true)

      // Simulate API call to update status
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the transaction in the local state
      const updatedTransactions = filteredTransactions.map((transaction) =>
        transaction.id === selectedTransaction.id ? { ...transaction, status: "completed" } : transaction,
      )

      // Update the original array as well
      recentTransactions.forEach((transaction, index) => {
        if (transaction.id === selectedTransaction.id) {
          recentTransactions[index] = { ...transaction, status: "completed" }
        }
      })

      // Show success message
      alert("Transaction status updated successfully")
    } catch (error) {
      alert("Failed to update transaction status")
    } finally {
      setIsUpdatingStatus(false)
      setIsStatusDialogOpen(false)
      setSelectedTransaction(null)
    }
  }

  // Update the inventory distribution chart data
  // Add this function after the getPieData function
  const getInventoryData = () => {
    if (isStatsLoading || !dashboardStats) {
      return getPieData() // Return dummy data while loading
    }

    // Create real data based on API response
    const { total_plots, total_sold_plots, plots_under_bidding, plot_categories } = dashboardStats
    const available = total_plots - total_sold_plots - plots_under_bidding

    // For all plots
    const allPlotsData = [
      { name: "Available", value: available, color: "#10b981", type: "all" },
      { name: "Sold", value: total_sold_plots, color: "#f59e0b", type: "all" },
      { name: "Bidding", value: plots_under_bidding, color: "#3b82f6", type: "all" },
    ]

    // For residential plots (no bidding)
    const residentialAvailable = plot_categories.residential - (total_sold_plots - plots_under_bidding)
    const residentialData = [
      { name: "Available", value: residentialAvailable, color: "#10b981", type: "residential" },
      { name: "Sold", value: total_sold_plots - plots_under_bidding, color: "#3b82f6", type: "residential" },
    ]

    // For commercial plots (includes bidding)
    const commercialAvailable = plot_categories.commercial - plots_under_bidding
    const commercialData = [
      { name: "Available", value: commercialAvailable, color: "#10b981", type: "commercial" },
      { name: "Sold", value: 0, color: "#3b82f6", type: "commercial" }, // Assuming all commercial plots are either available or under bidding
      { name: "Bidding", value: plots_under_bidding, color: "#f59e0b", type: "commercial" },
    ]

    switch (chartFilterType) {
      case "residential":
        return residentialData
      case "commercial":
        return commercialData
      default:
        return allPlotsData
    }
  }

  // Update the top bidders section
  // Replace the topBidders array with this:
  const getTopBidders = () => {
    // If we have payments data from the API, use it to create top bidders list
    if (!isPaymentsLoading && payments && payments.length > 0) {
      // Filter payments to only include those with bid_amount > 0
      const biddingPayments = payments
        .filter((payment) => Number(payment.bid_amount) > 0)
        // Sort by bid_amount in descending order
        .sort((a, b) => Number(b.bid_amount) - Number(a.bid_amount))
        // Take top 10 or all if less than 10
        .slice(0, 10)

      return biddingPayments.map((payment, index) => ({
        id: payment.id,
        name: payment.name,
        totalAmount: Number(payment.bid_amount),
        plotId: payment.plot_no,
        plotType: payment.category,
        plotSize: payment.cat_area,
        phase: payment.phase,
        sector: payment.sector,
        street: payment.street_no,
        basePrice: payment.base_price,
        tokenAmount: payment.token_amount,
        paymentDate: payment.payment_date,
        dimension: payment.dimension,
        rank_no: payment.rank_no,
      }))
    }

    // If no payments data or no bidding payments, use dashboard stats if available
    if (!isStatsLoading && dashboardStats && dashboardStats.top_bidders) {
      return dashboardStats.top_bidders.map((bidder) => ({
        id: bidder.id,
        name: bidder.user.name,
        totalAmount: Number.parseFloat(bidder.bid_amount),
        plotId: bidder.plot.plot_no,
        plotType: bidder.plot.category,
        plotSize: bidder.plot.cat_area || "Standard",
        phase: bidder.plot.phase || "N/A",
        sector: bidder.plot.sector || "N/A",
        street: bidder.plot.street_no || "N/A",
        basePrice: bidder.plot.base_price || "0",
        tokenAmount: bidder.plot.token_amount || "0",
        paymentDate: bidder.created_at || "N/A",
        dimension: bidder.plot.dimension || "N/A",
        rank_no: bidder.rank_no,
      }))
    }

    // Fallback to dummy data if no real data is available
    return topBidders
  }

  // Add this function to handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= paymentsPagination.lastPage) {
      setPaymentsPagination((prev) => ({
        ...prev,
        currentPage: newPage,
      }))
    }
  }

  const getAuthToken = () => {
    // Check if running on the client-side
    if (typeof window !== "undefined") {
      // Retrieve the token from local storage
      const token = localStorage.getItem("token")
      return token || null // Return the token or null if not found
    }
    return null // Return null if running on the server-side
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Add the Winners button here in the top navigation */}
          <Link href="/admin/winners">
            <Button variant="outline" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              View Winners
            </Button>
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* Update the Stats Cards section to use real data */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
        <Card className="border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Inventory</CardTitle>
            <Building className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {isStatsLoading ? "..." : (dashboardStats?.total_plots || 0).toLocaleString()}
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-amber-500 mr-1"></div>
                <span className="text-muted-foreground">Residential:</span>
                <span className="ml-1 font-medium">
                  {isStatsLoading ? "..." : dashboardStats?.plot_categories?.residential || 0}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-muted-foreground">Commercial:</span>
                <span className="ml-1 font-medium">
                  {isStatsLoading ? "..." : dashboardStats?.plot_categories?.commercial || 0}
                </span>
              </div>
              <div className="col-span-1">
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  {!isStatsLoading && dashboardStats?.total_plots > 0 && (
                    <>
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${(dashboardStats.plot_categories.residential / dashboardStats.total_plots) * 100}%`,
                          float: "left",
                        }}
                      ></div>
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(dashboardStats.plot_categories.commercial / dashboardStats.total_plots) * 100}%`,
                        }}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Sold</CardTitle>
            <Home className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {isStatsLoading ? "..." : (dashboardStats?.total_sold_plots || 0).toLocaleString()}
            </div>
            <div className="mt-1">
              <p className="text-xs text-muted-foreground inline">
                <span className="text-green-600 inline-flex items-center">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  {isStatsLoading || !dashboardStats?.total_plots
                    ? "0%"
                    : Math.round(
                        (dashboardStats.total_sold_plots / dashboardStats?.plot_categories?.residential) * 100,
                      ) + "%"}
                </span>{" "}
                of total inventory
              </p>
              <div className="mt-1">
                <Badge className="bg-amber-100 text-amber-800 text-xs">Residential Only</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Under Bidding</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {isStatsLoading ? "..." : (dashboardStats?.plots_under_bidding || 0).toLocaleString()}
            </div>
            <div className="mt-1">
              <p className="text-xs text-muted-foreground inline">
                {isStatsLoading || !dashboardStats?.total_plots
                  ? "0%"
                  : Math.round(
                      (dashboardStats.plots_under_bidding / dashboardStats?.plot_categories?.commercial) * 100,
                    ) + "%"}{" "}
                of total inventory
              </p>
              <div className="mt-1">
                <Badge className="bg-blue-100 text-blue-800 text-xs">Commercial Only</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <span className="h-4 w-4 text-green-500 font-bold text-xs">PKR</span>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              PKR{" "}
              {isStatsLoading
                ? "..."
                : ((dashboardStats?.total_base_price_revenue || 0) / 1000000000)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
              Bn
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 inline-flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                Token Collected:
              </span>
            </div>
            <div className="text-xs font-medium mt-1">
              PKR{" "}
              {isStatsLoading
                ? "..."
                : ((dashboardStats?.total_token_amount || 0) / 1000000)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
              Mn
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {isUsersLoading ? "..." : (registeredUsers?.total_count || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-purple-600 inline-flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                Active accounts
              </span>
            </p>
            <div className="mt-1">
              <Badge className="bg-purple-100 text-purple-800 text-xs">Verified Users</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="tabs-list w-full border-b overflow-x-auto">
          <TabsTrigger value="overview" className="tab-trigger">
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="tab-trigger">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="bidders" className="tab-trigger">
            Bidders
          </TabsTrigger>
          {/* Removed Final Candidates tab as requested */}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader className="p-4">
                <CardTitle className="text-base md:text-lg">Sales Overview</CardTitle>
                <CardDescription className="text-xs md:text-sm">Daily sales by time interval</CardDescription>
              </CardHeader>
              <CardContent className="pl-2 h-[350px] md:h-[400px] card-content">
                <CustomBarChart
                  data={salesChartData}
                  isLoading={isSalesDataLoading}
                  error={salesDataError}
                  onRetry={() => {
                    setIsSalesDataLoading(true)
                    setSalesDataError(null)
                    // This will trigger the useEffect to re-fetch data
                  }}
                />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4">
                <div>
                  <CardTitle className="text-base md:text-lg">Inventory Distribution</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Current status of all plots</CardDescription>
                </div>
                <Select value={chartFilterType} onValueChange={setChartFilterType} className="mt-2 sm:mt-0">
                  <SelectTrigger className="w-[120px] md:w-[140px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[350px] card-content">
                <CustomPieChart data={getPieData()} chartFilterType={chartFilterType} />
                {chartFilterType === "residential" && (
                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    <p>Note: Residential plots are not eligible for bidding</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest plot sales and payments</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                <Select value={transactionFilterType} onValueChange={setTransactionFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={exportTransactionsCSV}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto card-content">
              {isPaymentsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : paymentsError ? (
                <div className="text-center py-8 text-red-500">
                  <p>{paymentsError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handlePageChange(paymentsPagination.currentPage)}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-full min-w-[800px]">
                    <Table className="transactions-table w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Sr No.</TableHead>
                          <TableHead className="w-[80px] md:w-[100px]">Plot ID</TableHead>
                          <TableHead>Phase</TableHead>
                          <TableHead>Sector</TableHead>
                          <TableHead>Street</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Base Price</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-4">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments
                            .filter(
                              (payment) =>
                                transactionFilterType === "all" ||
                                (transactionFilterType === "residential" && payment.category === "Residential") ||
                                (transactionFilterType === "commercial" && payment.category === "Commercial"),
                            )
                            .map((payment, index) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell className="font-medium">{payment.plot_no}</TableCell>
                                <TableCell>{payment.phase}</TableCell>
                                <TableCell>{payment.sector}</TableCell>
                                <TableCell>{payment.street_no}</TableCell>
                                <TableCell>{payment.cat_area}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      payment.category === "Residential"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {payment.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>{payment.name}</TableCell>
                                <TableCell>PKR {Number(payment.base_price).toLocaleString()}</TableCell>
                                <TableCell>PKR {Number(payment.received_amount).toLocaleString()}</TableCell>
                                <TableCell>
                                  {payment.payment_date ? (
                                    <div className="flex flex-col">
                                      <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(payment.payment_date).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        payment.status.toLowerCase() === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : payment.status.toLowerCase() === "inprogress"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-gray-100 text-gray-800"
                                      }
                                    >
                                      {payment.status}
                                    </Badge>

                                    {isFinanceUser && payment.status.toLowerCase() === "inprogress" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => {
                                          setSelectedTransaction(payment)
                                          setIsStatusDialogOpen(true)
                                        }}
                                      >
                                        Mark Paid
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {payments.length} of {paymentsPagination.total} transactions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(paymentsPagination.currentPage - 1)}
                        disabled={paymentsPagination.currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: paymentsPagination.lastPage }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === paymentsPagination.currentPage ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(paymentsPagination.currentPage + 1)}
                        disabled={paymentsPagination.currentPage === paymentsPagination.lastPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bidders">
          <Card>
            <CardHeader>
              <CardTitle>Top Bidders</CardTitle>
              <CardDescription>Users with the highest bids for commercial plots</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto card-content">
              <div className="min-w-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Plot ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Payment Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getTopBidders().map((bidder, index) => (
                      <TableRow key={bidder.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{bidder.name}</TableCell>
                        <TableCell>PKR {(bidder.totalAmount / 1000000).toFixed(2)}M</TableCell>
                        <TableCell>{bidder.rank_no}</TableCell>
                        <TableCell>{bidder.plotId}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs">Phase {bidder.phase}</span>
                            <span className="text-xs">Sector {bidder.sector}</span>
                            <span className="text-xs">Street {bidder.street}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge className="bg-amber-100 text-amber-800 mb-1 w-fit">{bidder.plotType}</Badge>
                            <span className="text-xs">Size: {bidder.plotSize}</span>
                            <span className="text-xs">Dim: {bidder.dimension}</span>
                            <span className="text-xs text-muted-foreground">
                              Base: PKR {(Number(bidder.basePrice) / 1000000).toFixed(2)}M
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Token: PKR {Number(bidder.tokenAmount).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {bidder.paymentDate ? (
                            <div className="flex flex-col">
                              <span className="text-xs">{new Date(bidder.paymentDate).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(bidder.paymentDate).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {getTopBidders().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No bidding data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Button - Removed the View Winners button from here as it's now in the top navigation */}
      <div className="mt-8 flex justify-end print:hidden">
        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Official Report
        </Button>
      </div>

      {/* Official Endorsement - Only visible when printing */}
      <div className="hidden print:block mt-8 border-t pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Official DHA Islamabad Report</h3>
            <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-600">Officially Endorsed</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm mb-1">Prepared by:</p>
            <div className="h-10 border-b border-dashed"></div>
            <p className="text-sm mt-1">Admin Officer</p>
          </div>
          <div>
            <p className="text-sm mb-1">Approved by:</p>
            <div className="h-10 border-b border-dashed"></div>
            <p className="text-sm mt-1">Director, DHA Islamabad</p>
          </div>
        </div>
      </div>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this transaction as paid? This action cannot be undone.
              {selectedTransaction && (
                <div className="mt-2 p-2 bg-gray-50 rounded border">
                  <p>
                    <span className="font-medium">Plot ID:</span> {selectedTransaction.plotId}
                  </p>
                  <p>
                    <span className="font-medium">Buyer:</span> {selectedTransaction.buyer}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> PKR {(selectedTransaction.amount / 1000000).toFixed(2)}
                    M
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isUpdatingStatus ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add this CSS to ensure proper mobile display */}
      <style jsx global>{`
  @media (max-width: 640px) {
    .final-candidates-table td:nth-child(2),
    .final-candidates-table td:nth-child(4) {
      display: table-cell !important;
      font-size: 0.75rem;
    }
    .final-candidates-table th:nth-child(2),
    .final-candidates-table th:nth-child(4) {
      display: table-cell !important;
      font-size: 0.75rem;
    }
    
    /* Make transactions table responsive with horizontal scroll */
    .transactions-table {
      width: 100%;
      min-width: 800px;
      white-space: nowrap;
    }
    
    .transactions-table th,
    .transactions-table td {
      padding: 8px 6px;
      font-size: 0.75rem;
    }
    
    /* Make badges smaller on mobile */
    .transactions-table .badge,
    .final-candidates-table .badge {
      padding: 0.125rem 0.375rem;
      font-size: 0.65rem;
    }
    
    /* Add visual indicator for horizontal scroll */
    .card-content {
      position: relative;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .card-content:after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.7));
      pointer-events: none;
      z-index: 10;
      display: block;
    }
  }
`}</style>
    </div>
  )
}
