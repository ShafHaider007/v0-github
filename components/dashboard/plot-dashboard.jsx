"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Filter, ShoppingCart } from "lucide-react"
import FilterPanel from "@/components/filters/filter-panel"
import PlotDetails from "@/components/plots/plot-details"
import LoginPrompt from "@/components/auth/login-prompt"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { useAuth } from "@/hooks/use-auth"
import PlotListView from "@/components/plots/plot-list-view"
import { useRouter } from "next/navigation"
import { reservePlot } from "@/utils/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Copy } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { SlidingPanel } from "@/components/ui/sliding-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { fetchKuickPayFee, fetchDhaBiding } from "@/utils/api"
import { PLOT_ENDPOINTS, getAuthToken } from "@/utils/endpoints"

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
})

export default function PlotDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedPlots, setSelectedPlots] = useState([])
  const [plotsData, setPlotsData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [isBrowser, setIsBrowser] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const mapInstanceRef = useRef(null)
  const slidingPanelRef = useRef(null)
  const [activeFilters, setActiveFilters] = useState({
    plotType: {
      residential: false,
      commercial: false,
    },
    plotSize: {
      "5 Marla": false,
      "8 Marla": false,
      "10 Marla": false,
    },
    phase: "",
  })

  const [reservationError, setReservationError] = useState("")
  const [reservationSuccess, setReservationSuccess] = useState("")
  const [mapData, setMapData] = useState(null)
  const [activeTab, setActiveTab] = useState("list")

  // Add a new state variable to track whether payment options are visible
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)

  // Change the payment method state to be null by default instead of "Credit-Debit"
  const [paymentMethod, setPaymentMethod] = useState(null)

  // Add a new state for storing the PSID/challan information
  const [challanInfo, setChallanInfo] = useState(null)

  // Add a new state variable for processing fee
  const [processingFee, setProcessingFee] = useState(0)

  // Add loading state for processing fee
  const [loadingFee, setLoadingFee] = useState(false)

  // Add a state to track the filtered plots count from the list view
  const [filteredPlotsCount, setFilteredPlotsCount] = useState(0)

  // Add a new state for total plots count
  const [totalPlotsCount, setTotalPlotsCount] = useState(0)

  // Add these state variables after the existing state declarations
  const [availablePlotTypes, setAvailablePlotTypes] = useState({})
  const [availablePlotSizes, setAvailablePlotSizes] = useState({})
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingSizes, setIsLoadingSizes] = useState(false)

  // Add a new state for showing the warning modal
  const [showAppleDeviceWarning, setShowAppleDeviceWarning] = useState(false)

  // Add this with the other state declarations
  const [isAppleDeviceDetected, setIsAppleDeviceDetected] = useState(false)

  // Add a new state for payment plan type after the other state declarations
  const [paymentPlanType, setPaymentPlanType] = useState(null)

    //Dha-bidding flag storing state with default 0
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

  // Set isBrowser to true once component mounts
  useEffect(() => {
    setIsBrowser(true)

    // Check if we're on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Update the loadPlotsData function to store the total count
  const loadPlotsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(PLOT_ENDPOINTS.FILTERED_PLOTS, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load plots data")
      }

      const responseData = await response.json()

      if (responseData.success && responseData.data) {
        setPlotsData(responseData.data.plots)
        setMapData(responseData.data.plots)

        // Store the total count
        if (responseData.data.counts && responseData.data.counts.total_count) {
          setTotalPlotsCount(responseData.data.counts.total_count)
        }
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // Replace the existing useEffect that calls fetchAllPlots with this
  useEffect(() => {
    // Only fetch plots data if the user is authenticated and the browser is ready
    if (isBrowser && isAuthenticated) {
      loadPlotsData()
    }
  }, [isBrowser, isAuthenticated])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // On mobile, hide both panels by default
  useEffect(() => {
    if (!isBrowser) return

    // Set initial state only once
    if (window.innerWidth < 768) {
      setShowLeftPanel(false)
      setShowRightPanel(false)
    } else {
      setShowLeftPanel(true)
      setShowRightPanel(true)
    }
  }, [isBrowser])

  // Add this useEffect to the existing ones in the component
  useEffect(() => {
    if (!isBrowser) return

    // Function to set the viewport height
    const setViewportHeight = () => {
      // First we get the viewport height and multiply it by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty("--vh", `${vh}px`)
    }

    // Set the height initially
    setViewportHeight()

    // We listen to the resize event
    window.addEventListener("resize", setViewportHeight)

    // We also listen to orientation changes
    window.addEventListener("orientationchange", () => {
      // Add a small delay to ensure the browser has updated the viewport dimensions
      setTimeout(setViewportHeight, 100)
    })

    // Check for safe area insets (for notched devices)
    if (CSS.supports("padding-bottom: env(safe-area-inset-bottom)")) {
      document.documentElement.style.setProperty("--sat-bottom-inset", "env(safe-area-inset-bottom)")
    }

    return () => {
      window.removeEventListener("resize", setViewportHeight)
      window.removeEventListener("orientationchange", setViewportHeight)
    }
  }, [isBrowser])

  // Modified to allow only single plot selection and reset reservation states
  const handlePlotSelect = (plot, fromListView = false, zoomToPlot = false) => {
    const isAlreadySelected = selectedPlots.some((p) => p.id === plot.id)

    // Reset reservation states when selecting a new plot
    setReservationError("")
    setReservationSuccess("")
    setShowPaymentOptions(false)
    setProcessingFee(0)

    if (isAlreadySelected && fromListView) {
      // Only deselect if the user clicked in the list view
      setSelectedPlots([])
      if (mapInstanceRef.current) {
        mapInstanceRef.current.closePopup()
      }
      return;
    }

    setSelectedPlots([plot])

    // Always open the right panel on desktop when a plot is selected
    if (!isMobile) {
      setShowRightPanel(true)
    }

    // Switch to plots tab when selecting a plot
    setActiveTab("plots")

    // On mobile, close the right panel if from list view
    if (fromListView && window.innerWidth < 768) {
      setShowRightPanel(false)
    }

    // If zoomToPlot is true, zoom to the plot on the map
    if (zoomToPlot && mapInstanceRef.current) {
      // Trigger zoom to plot in the map component
      mapInstanceRef.current.zoomToPlot(plot)
    }

    // Collapse the sliding panel on mobile after selecting a plot from list view
    if (isMobile && fromListView && slidingPanelRef.current && slidingPanelRef.current.collapsePanel) {
      slidingPanelRef.current.collapsePanel()
    }
  }

  const clearSelection = () => {
    setSelectedPlots([])

    // Close any open popups on the map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.closePopup()
    }

    // Close the right panel on mobile
    if (window.innerWidth < 768) {
      setShowRightPanel(false)

      // Collapse the sliding panel on mobile
      if (isMobile && slidingPanelRef.current && slidingPanelRef.current.collapsePanel) {
        slidingPanelRef.current.collapsePanel()
      }
    }
  }

  // Handler for filter changes
  const handleFilterChange = (filters) => {
    setActiveFilters(filters)
  }

  // Handler for filtered plots count changes from PlotListView
  const handleFilteredPlotsChange = (count) => {
    setFilteredPlotsCount(count)
  }

  // Update the setShowPaymentOptions function to fetch the processing fee
  const handleSecurePlot = async () => {
    if (selectedPlots.length > 0) {
      try {
        setLoadingFee(true)
        const tokenAmount = Number(selectedPlots[0].token_amount) || 10
        const feeResponse = await fetchKuickPayFee(tokenAmount)


        // Set the processing fee from the API response
        if (feeResponse && feeResponse.fee) {
          setProcessingFee(Number(feeResponse.fee))
        } else {
          setProcessingFee(0)
        }

        // Set KuickPay as the default payment method
        setPaymentMethod("KuickPay")

        // Show payment options
        setShowPaymentOptions(true)
      } catch (error) {
        // If there's an error, still show payment options but with zero fee
        setProcessingFee(0)
        setPaymentMethod("KuickPay") // Set default payment method even on error
        setShowPaymentOptions(true)
      } finally {
        setLoadingFee(false)
      }
    }
  }

  // Update the handlePayToken function to use the fetched processing fee
  const handlePayToken = async () => {
    if (!selectedPlots.length) return

    try {
      setReservationError("")
      setReservationSuccess("")
      setChallanInfo(null)

      const plot = selectedPlots[0]

      // Get token amount from the plot data
      const tokenAmount = Number(plot.token_amount) || 10

      // Add processing fee for both payment methods
      const totalAmount = tokenAmount + processingFee

      const plotData = {
        plot_id: plot.id,
        token_amount: totalAmount,
        bid_amount: plot.base_price || 0,
        payment_method: paymentMethod,
      }

      // Add plan_type if it's set and the plot is in the specific sectors
      if (
        paymentPlanType !== null &&
        ((plot.phase === "4" && plot.sector === "RVN") || (plot.phase === "6" && plot.sector === "B3")) &&
        plot.category?.toLowerCase() === "residential"
      ) {
        plotData.plan_type = paymentPlanType.toString()
      }

      const response = await reservePlot(plotData)

      // Handle different payment methods differently
      if (paymentMethod === "Credit-Debit") {
        setReservationSuccess("Plot reserved successfully! Redirecting to payment...")

        // If there's a redirect URL, navigate to it
        if (response.data && response.data.redirect_url) {
          setTimeout(() => {
            window.location.href = response.data.redirect_url
          }, 1500)
        } else {
          // Otherwise, redirect to profile page
          setTimeout(() => {
            router.push("/profile")
          }, 1500)
        }
      } else {
        // For KuickPay
        setReservationSuccess("Plot reserved successfully!")

        // Store the PSID/challan information
        if (response.data && response.data.psid) {
          setChallanInfo({
            psid: response.data.psid,
            amount: totalAmount,
            method: paymentMethod,
          })
        }
      }
    } catch (error) {

      // Improved error handling to show complete validation errors
      if (error.errors) {
        // Format validation errors - remove field names
        const errorMessages = Object.values(error.errors).flat().join("\n")
        setReservationError(errorMessages || "Validation failed")
      } else if (typeof error === "object" && error.message) {
        setReservationError(error.message)
      } else {
        setReservationError("Failed to reserve plot. Please try again.")
      }
    }
  }

  // Function to store map instance reference
  const setMapInstance = (mapInstance) => {
    mapInstanceRef.current = mapInstance

    // Store the map instance globally for access from other components
    window.map = mapInstance
  }

  // Toggle the left filter panel  
  const toggleLeftPanel = () => {
    setShowLeftPanel(prev => {
      const next = !prev;
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current.invalidateSize({ animate: false }), 310);
      }
      return next;
    });
  };

  // Toggle the right "cart / details" panel  
  const toggleRightPanel = () => {
    setShowRightPanel(prev => {
      const next = !prev;
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current.invalidateSize({ animate: false }), 310);
      }
      return next;
    });
  };

  // Add a function to check if the user is on an iPhone/iPad before showing filters
  const handleFilterButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isAppleDevice()) {
      // Show the Apple device warning modal instead of opening filters
      setShowAppleDeviceWarning(true)
    } else {
      // Not an Apple device, proceed normally
      setFilterDropdownOpen(true)
    }
  }

  // Add this function after the handleFilterButtonClick function
  const zoomToAllPhases = () => {
    if (mapInstanceRef.current) {
      // Create a Leaflet bounds object with the specified coordinates
      const allPhasesBounds = window.L.latLngBounds(
        [33.464901, 73.054898], // SouthWest
        [33.591134, 73.361106], // NorthEast
      )

      // Fit the map to these bounds with some padding
      mapInstanceRef.current.fitBounds(allPhasesBounds, {
        padding: [50, 50],
        maxZoom: 12,
        animate: true,
      })

      // Clear any selected plots and close popups
      if (selectedPlots.length > 0) {
        clearSelection()
      }
    }
  }

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // Render the panel content (used in both desktop and mobile views)
  const renderPanelContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2 sticky top-0 z-10 bg-white">
        <TabsTrigger value="list" className="data-[state=active]:bg-gray-300 data-[state=active]:text-gray-800">
          List View
        </TabsTrigger>
        <TabsTrigger value="plots" className="data-[state=active]:bg-gray-300 data-[state=active]:text-gray-800">
          Selected {selectedPlots.length > 0 && `(${selectedPlots.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plots" className="p-4">
        {selectedPlots.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Selected Plot</h3>

            {selectedPlots.map((plot) => (
              <PlotDetails key={plot.id} plot={plot} />
            ))}

            <div className="mt-4">
              {isAuthenticated ? (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  {/* Button heading removed as requested */}

                  {!showPaymentOptions ? (
                    <Button onClick={handleSecurePlot} className="w-full" disabled={loadingFee}>
                      {loadingFee
                        ? "Loading..."
                        : dhaBiding === 1 && (selectedPlots[0].type === "commercial" || selectedPlots[0].category === "Commercial")
                          ? "Pay Token to bid"
                          : "Secure Your Plot"}
                    </Button>
                  ) : (
                    <>
                      {/* Add payment plan options for specific sectors */}
                      {selectedPlots[0] &&
                        ((selectedPlots[0].phase === "4" && selectedPlots[0].sector === "RVN") ||
                          (selectedPlots[0].phase === "6" && selectedPlots[0].sector === "B3")) &&
                        selectedPlots[0].category?.toLowerCase() === "residential" && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Plan</label>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="lumpsum"
                                  name="paymentPlan"
                                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                  checked={paymentPlanType === 0}
                                  onChange={() => setPaymentPlanType(0)}
                                />
                                <label htmlFor="lumpsum" className="ml-2 block text-sm text-gray-700">
                                  Lump sum 
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="installment"
                                  name="paymentPlan"
                                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                  checked={paymentPlanType === 2}
                                  onChange={() => setPaymentPlanType(2)}
                                />
                                <label htmlFor="installment" className="ml-2 block text-sm text-gray-700">
                                  2 Year Installment 
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className={`py-2 px-3 border rounded-md text-sm ${
                              paymentMethod === "KuickPay"
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => setPaymentMethod("KuickPay")}
                          >
                            KuickPay
                          </button>
                          <button
                            type="button"
                            className={`py-2 px-3 border rounded-md text-sm ${
                              paymentMethod === "Credit-Debit"
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => setPaymentMethod("Credit-Debit")}
                          >
                            Credit-Debit
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 my-4">
                        <div className="flex justify-between">
                          <span>Token Amount:</span>
                          <span>PKR {Number(selectedPlots[0].token_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Fee:</span>
                          <span>PKR {processingFee.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                          <span>Total Amount:</span>
                          <span>PKR {(Number(selectedPlots[0].token_amount) + processingFee).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <a
                          href={
                            selectedPlots[0]?.type === "commercial" || selectedPlots[0]?.category === "Commercial"
                              ? "/Commercial_terms.pdf"
                              : "/Residential_terms.pdf"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Terms and Conditions
                        </a>
                      </div>

                      {reservationError && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{reservationError}</AlertDescription>
                        </Alert>
                      )}
                      {reservationSuccess && (
                        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div className="flex flex-col gap-2"></div>
                          <div className="flex flex-col gap-2">
                            <AlertDescription>{reservationSuccess}</AlertDescription>

                            {challanInfo && (
                              <div className="mt-2 p-3 bg-white rounded-md border border-green-200">
                                <h4 className="font-medium text-green-800 mb-2">Payment Information</h4>
                                <div className="mb-2">
                                  <div className="text-sm mb-1 flex flex-col">
                                    <span className="font-medium">PSID/Challan:</span>
                                    <div className="flex items-center mt-1">
                                      <span>{challanInfo.psid}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyToClipboard(challanInfo.psid)
                                        }}
                                        className="p-1 ml-1 hover:bg-gray-100 rounded-full"
                                        title="Copy PSID"
                                        style={{ display: "inline-flex" }}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {challanInfo.method === "KuickPay" && (
                                    <p className="text-xs italic ml-1">
                                      (Go to your banking app/kuick pay and enter PSID)
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm">
                                  <span className="font-medium">Amount:</span> PKR {challanInfo.amount.toLocaleString()}
                                </p>
                                <p className="text-sm mb-3">
                                  <span className="font-medium">Method:</span> {challanInfo.method}
                                </p>
                                <p className="text-xs text-red-600 font-medium mb-2">
                                  Your reservation will expire in 15 min if payment is not received.
                                </p>
                                <p className="text-xs text-gray-600 mb-2">
                                  {selectedPlots[0].category === "Commercial" || selectedPlots[0].type === "commercial"
                                    ? "Once paid, go to my bookings for bidding"
                                    : "Once paid, go to my bookings"}
                                </p>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full mt-1 bg-blue-600 hover:bg-blue-700"
                                  onClick={() => router.push("/profile")}
                                >
                                  Go to My Bookings
                                </Button>
                              </div>
                            )}
                          </div>
                        </Alert>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handlePayToken}
                          className="w-full"
                          disabled={!!reservationSuccess || !paymentMethod}
                        >
                         {dhaBiding === 1 && (selectedPlots[0].type === "commercial" || selectedPlots[0].category === "Commercial") ?(
                            "Pay Token Amount for Bidding"
                          ) : (
                            <div className="flex flex-col">
                              <span>Pay Token Amount</span>
                              <span className="text-xs font-normal">(Adjustable, non-refundable token)</span>
                            </div>
                          )}
                        </Button>

                        {(selectedPlots[0].type === "commercial" || selectedPlots[0].category === "Commercial") && (
                          <>
                            {Number(selectedPlots[0].token_amount) === 1000000 && (
                              <p className="text-xs text-center text-gray-600 mt-1">
                                Reserve price for lump sum (inclusive of tax) - payment plan may be increased upto 2 years at 7.5% increase per year in final price
                              </p>
                            )}
                            {Number(selectedPlots[0].token_amount) === 500000 && (
                              <p className="text-xs text-center text-gray-600 mt-1">
                                Reserve price for lump sum (inclusive of tax) - payment plan may be increased upto 1 year at 7.5% increase in final price
                              </p>
                            )}
                          </>
                        )}

                        <p className="text-xs text-center text-gray-500 mt-1">
                          After payment, you can manage your plot and{" "}
                          {selectedPlots[0].type === "commercial" || selectedPlots[0].category === "Commercial"
                            ? "place bids"
                            : "view details"}{" "}
                          in your profile.
                        </p>

                        {selectedPlots[0]?.phase === "4" &&
                        selectedPlots[0]?.sector === "RVN" &&
                        selectedPlots[0]?.category?.toLowerCase() === "residential" ? (
                          <div className="mt-3 text-center">
                            <a
                              href="/images/payment_plan_rvn.jpg"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Payment Plan
                            </a>
                          </div>
                        ) : selectedPlots[0]?.phase === "6" &&
                          selectedPlots[0]?.sector === "B3" &&
                          selectedPlots[0]?.category?.toLowerCase() === "residential" ? (
                          <div className="mt-3 text-center">
                            <a
                              href="/images/payment_plan_b3.jpg"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Payment Plan
                            </a>
                          </div>
                        ) : null}

                        <div className="mt-3 text-center">
                          <a
                            href={
                              selectedPlots[0]?.type === "commercial" || selectedPlots[0]?.category === "Commercial"
                                ? "/Commercial_terms.pdf"
                                : "/Residential_terms.pdf"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Terms and Conditions
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <LoginPrompt />
              )}
            </div>

            <button
              onClick={clearSelection}
              className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Select a plot on the map to view details</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="list" className="p-4 overflow-auto">
        <PlotListView
          plots={plotsData || []}
          onPlotSelect={(plot, fromListView, zoomToPlot) => handlePlotSelect(plot, fromListView, zoomToPlot)}
          selectedPlots={selectedPlots}
          activeFilters={activeFilters}
          onFilteredPlotsChange={handleFilteredPlotsChange}
        />
      </TabsContent>
    </Tabs>
  )

  // Ensure map zooms to phase bounds if mapInstance becomes available after phase is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !activeFilters.phase) return;
    const PHASE_BOUNDS = {
      1: {
        southWest: [33.522675, 73.084847],
        northEast: [33.555491, 73.11721],
      },
      2: {
        southWest: [33.509562, 73.128907],
        northEast: [33.542692, 73.183331],
      },
      3: {
        southWest: [33.463783, 73.11683],
        northEast: [33.517631, 73.198346],
      },
      4: {
        southWest: [33.471374, 72.989226],
        northEast: [33.531711, 73.089317],
      },
      5: {
        southWest: [33.500307, 73.181263],
        northEast: [33.545447, 73.237663],
      },
      6: {
        southWest: [33.522786, 73.226116],
        northEast: [33.590846, 73.339476],
      },
      7: {
        southWest: [33.471093, 73.238744],
        northEast: [33.550395, 73.36507],
      },
    };
    const bounds = PHASE_BOUNDS[activeFilters.phase];
    if (bounds) {
      const leafletBounds = window.L.latLngBounds(bounds.southWest, bounds.northEast);
      mapInstanceRef.current.fitBounds(leafletBounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [activeFilters.phase, mapInstanceRef.current]);

  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 flex min-w-0 relative overflow-hidden">
        {/* Left Panel - Filters */}
        <div
          className={`h-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${
            showLeftPanel
              ? 'w-full md:w-36 lg:w-40 xl:w-48'
              : 'w-0'
          } flex-shrink-0 z-20`}
        >
          <div className={`h-full overflow-auto relative ${showLeftPanel ? "block" : "hidden"}`}>
            <FilterPanel onFilterChange={handleFilterChange} mapInstance={mapInstanceRef.current} />

            {/* Toggle button for left panel - Attached to panel */}
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 z-50 shadow-md"
              onClick={toggleLeftPanel}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Center - Map */}
        <div className="flex-1 min-w-0 relative z-10">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="absolute inset-0">
              <MapView
                selectedPlots={selectedPlots}
                onPlotSelect={handlePlotSelect}
                activeFilters={activeFilters}
                onMapReady={setMapInstance}
              />
            </div>
          )}

          {/* Mobile controls for panels */}
          {isBrowser && isMobile && (
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <div className="relative">
                <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                  {/* Filter button remains unchanged */}
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="shadow-lg flex items-center gap-2 px-3"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (isAppleDevice()) {
                          setShowAppleDeviceWarning(true)
                        } else {
                          setFilterDropdownOpen(true)
                        }
                      }}
                    >
                      <Filter className="h-4 w-4" />
                      <span className="text-sm">Filters</span>
                    </Button>
                  </DropdownMenuTrigger>
                  {/* Rest of the dropdown menu content remains unchanged */}
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Phase</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Select
                        value={activeFilters.phase}
                        onValueChange={(value) => {
                          // Create a new filters object with the updated phase
                          const newFilters = {
                            ...activeFilters,
                            phase: value,
                            plotType: {}, // Reset plot type when phase changes
                            plotSize: {}, // Reset plot size when phase changes
                          }

                          setActiveFilters(newFilters)

                          // Clear available plot sizes
                          setAvailablePlotSizes({})

                          // Fetch plot types if a phase is selected
                          if (value) {
                            setIsLoadingTypes(true)
                            // Fetch plot types from API
                            fetch(`${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${value}`, {
                              headers: {
                                Authorization: `Bearer ${getAuthToken()}`,
                              },
                            })
                              .then((response) => response.json())
                              .then((data) => {
                                if (data.success && data.data && data.data.counts && data.data.counts.categories) {
                                  setAvailablePlotTypes(data.data.counts.categories)
                                } else {
                                  setAvailablePlotTypes({})
                                }
                                setIsLoadingTypes(false)
                              })
                              .catch((error) => {
                                setAvailablePlotTypes({})
                                setIsLoadingTypes(false)
                              })
                          } else {
                            // Clear available options if phase is deselected
                            setAvailablePlotTypes({})
                          }

                          // Zoom to phase bounds if a phase is selected
                          if (value && mapInstanceRef.current) {
                            const PHASE_BOUNDS = {
                              1: {
                                southWest: [33.522675, 73.084847],
                                northEast: [33.555491, 73.11721],
                              },
                              2: {
                                southWest: [33.509562, 73.128907],
                                northEast: [33.542692, 73.183331],
                              },
                              3: {
                                southWest: [33.463783, 73.11683],
                                northEast: [33.517631, 73.198346],
                              },
                              4: {
                                southWest: [33.471374, 72.989226],
                                northEast: [33.531711, 73.089317],
                              },
                              5: {
                                southWest: [33.500307, 73.181263],
                                northEast: [33.545447, 73.237663],
                              },
                              6: {
                                southWest: [33.522786, 73.226116],
                                northEast: [33.590846, 73.339476],
                              },
                              7: {
                                southWest: [33.471093, 73.238744],
                                northEast: [33.550395, 73.36507],
                              },
                            }

                            const bounds = PHASE_BOUNDS[value]
                            if (bounds) {
                              // Create a Leaflet bounds object
                              const leafletBounds = window.L.latLngBounds(bounds.southWest, bounds.northEast)

                              // Fit the map to these bounds with some padding
                              mapInstanceRef.current.fitBounds(leafletBounds, {
                                padding: [50, 50],
                                maxZoom: 16,
                                animate: true,
                              })
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Phases</SelectItem>
                          <SelectItem value="1">Phase 1</SelectItem>
                          <SelectItem value="2">Phase 2</SelectItem>
                          <SelectItem value="3">Phase 3</SelectItem>
                          <SelectItem value="4">Phase 4</SelectItem>
                          <SelectItem value="5">Phase 5</SelectItem>
                          <SelectItem value="6">Phase 6</SelectItem>
                          <SelectItem value="7">Phase 7</SelectItem>
                        </SelectContent>
                      </Select>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {/* Only show plot types if a phase is selected */}
                    {activeFilters.phase && (
                      <>
                        <DropdownMenuLabel>Plot Type</DropdownMenuLabel>
                        {isLoadingTypes ? (
                          <div className="p-2 text-sm text-gray-500">Loading plot types...</div>
                        ) : Object.keys(availablePlotTypes).length > 0 ? (
                          Object.keys(availablePlotTypes).map((type) => (
                            <DropdownMenuItem
                              key={type}
                              className="flex items-center gap-2 cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Checkbox
                                id={`type-${type}-mobile`}
                                checked={!!activeFilters.plotType[type]}
                                onCheckedChange={(checked) => {
                                  // Implement radio-like behavior for plot types
                                  let updatedPlotTypes = {}
                                  if (checked) {
                                    updatedPlotTypes = { [type]: true }
                                  }

                                  const newFilters = {
                                    ...activeFilters,
                                    plotType: updatedPlotTypes,
                                    plotSize: {}, // Reset plot size when plot type changes
                                  }

                                  setActiveFilters(newFilters)

                                  // Fetch plot sizes if a plot type is selected
                                  if (checked && activeFilters.phase) {
                                    setIsLoadingSizes(true)
                                    // Capitalize the first letter of the category
                                    const formattedType = type.charAt(0).toUpperCase() + type.slice(1)

                                    fetch(
                                      `${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${activeFilters.phase}&category=${formattedType}`,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${getAuthToken()}`,
                                        },
                                      },
                                    )
                                      .then((response) => response.json())
                                      .then((data) => {
                                        if (data.success && data.data && data.data.counts && data.data.counts.sizes) {
                                          setAvailablePlotSizes(data.data.counts.sizes)
                                        } else {
                                          setAvailablePlotSizes({})
                                        }
                                        setIsLoadingSizes(false)
                                      })
                                      .catch((error) => {
                                        setAvailablePlotSizes({})
                                        setIsLoadingSizes(false)
                                      })
                                  } else {
                                    setAvailablePlotSizes({})
                                  }
                                }}
                              />
                              <label htmlFor={`type-${type}-mobile`} className="cursor-pointer flex-1">
                                {type} ({availablePlotTypes[type]})
                              </label>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">No plot types available</div>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {activeFilters.phase && Object.keys(activeFilters.plotType).length > 0 && (
                      <>
                        <DropdownMenuLabel>Plot Size</DropdownMenuLabel>
                        {isLoadingSizes ? (
                          <div className="p-2 text-sm text-gray-500">Loading plot sizes...</div>
                        ) : Object.keys(availablePlotSizes).length > 0 ? (
                          Object.keys(availablePlotSizes).map((size) => (
                            <DropdownMenuItem
                              key={size}
                              className="flex items-center gap-2 cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Checkbox
                                id={`size-${size}-mobile`}
                                checked={!!activeFilters.plotSize[size]}
                                onCheckedChange={(checked) => {
                                  const newFilters = {
                                    ...activeFilters,
                                    plotSize: {
                                      ...activeFilters.plotSize,
                                      [size]: checked,
                                    },
                                  }
                                  setActiveFilters(newFilters)
                                }}
                              />
                              <label htmlFor={`size-${size}-mobile`} className="cursor-pointer flex-1">
                                {size} ({availablePlotSizes[size]})
                              </label>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">No plot sizes available</div>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <div className="p-2 flex gap-2">
                      <Button className="w-full" onClick={() => setFilterDropdownOpen(false)}>
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setActiveFilters({
                            plotType: {},
                            plotSize: {},
                            phase: "",
                          })
                          setAvailablePlotTypes({})
                          setAvailablePlotSizes({})
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Show toggle buttons when panels are hidden on desktop */}
          {!showLeftPanel && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-4 z-50 shadow-md hidden md:flex"
              onClick={toggleLeftPanel}
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}

          {!showRightPanel && !isMobile && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-4 z-50 shadow-md hidden md:flex"
              onClick={toggleRightPanel}
            >
              <ShoppingCart className="h-4 w-4" />
              {selectedPlots.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedPlots.length}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Right Panel - Selections, Bidding, etc. (Desktop only) */}
        {!isMobile && (
          <div
            className={`h-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${
              showRightPanel
                ? 'md:w-72 lg:w-80 xl:w-96'
                : 'w-0'
            } flex-shrink-0 z-20`}
          >
            <div className={`h-full overflow-auto relative ${showRightPanel ? "block" : "hidden"}`}>
              {renderPanelContent()}

              {/* Toggle button for right panel - Attached to panel */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-2 z-50 shadow-md"
                onClick={toggleRightPanel}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Sliding Panel - Removed the title text */}
        {isMobile && isBrowser && (
          <SlidingPanel ref={slidingPanelRef} totalPlots={filteredPlotsCount}>
            {renderPanelContent()}
          </SlidingPanel>
        )}
      </div>
    </div>
  )
}
