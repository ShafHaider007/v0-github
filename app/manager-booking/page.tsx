"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Filter, FileText, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import ManagerBookingForm from "@/components/manager/manager-booking-form"
import PlotSelectionList from "@/components/manager/plot-selection-list"
import { PLOT_ENDPOINTS } from "@/config/api-config"
import { MARKETING_ENDPOINTS } from "../../config/api-config"

export default function ManagerBookingPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [plots, setPlots] = useState([])
  const [filteredPlots, setFilteredPlots] = useState([])
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [selectedPhase, setSelectedPhase] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [availableSizes, setAvailableSizes] = useState({})
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    cnic: "",
    passportNo: "",
    mailingAddress: "",
    officePhone: "",
    residencePhone: "",
    phone: "",
    email: "",
    paymentPlan: "lumpSum", // lumpSum or installment
    installmentYears: "1",
    processingFee: true,
    totalAmount: "",
    tokenReceived: "",
    balanceDownPayment: "",
    totalBalancePayment: "",
    date: "",
    bank_name: "",
    cheque_no: "",
    cheque_date: "",
    heardFrom: "sms",
    is_filler: "1",
    plot_id: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [formSuccess, setFormSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("filter")
  const printFormRef = useRef(null)
  const [apiError, setApiError] = useState("")

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token")
    }
    return null
  }

  // Load plots data based on phase
  const loadPlotsByPhase = async (phase) => {
    try {
      setIsFilterLoading(true)
      setApiError("")
      setSelectedSize("") // Reset size when phase changes
      setFilteredPlots([]) // Clear plots when phase changes

      const token = getAuthToken()
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${phase}&category=Residential`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch plots")
      }

      const data = await response.json()

      if (data.success) {
        // Store available sizes
        setAvailableSizes(data.data.counts.sizes || {})

        // If there are plots, set them
        if (data.data.plots && data.data.plots.length > 0) {
          setFilteredPlots(data.data.plots)
        } else {
          setFilteredPlots([])
        }
      } else {
        setApiError(data.message || "Failed to fetch plots")
        setFilteredPlots([])
        setAvailableSizes({})
      }
    } catch (error) {
      setApiError(error.message || "Failed to fetch plots")
      setFilteredPlots([])
      setAvailableSizes({})
    } finally {
      setIsFilterLoading(false)
      setIsLoading(false)
    }
  }

  // Load plots data based on phase and size
  const loadPlotsByPhaseAndSize = async (phase, size) => {
    try {
      setIsFilterLoading(true)
      setApiError("")

      const token = getAuthToken()
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const encodedSize = encodeURIComponent(size)
      const response = await fetch(
        `${PLOT_ENDPOINTS.FILTERED_PLOTS}?size=${encodedSize}&category=Residential&phase=${phase}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch plots")
      }

      const data = await response.json()

      if (data.success) {
        // If there are plots, set them
        if (data.data.plots && data.data.plots.length > 0) {
          setFilteredPlots(data.data.plots)
        } else {
          setFilteredPlots([])
        }
      } else {
        setApiError(data.message || "Failed to fetch plots")
        setFilteredPlots([])
      }
    } catch (error) {
      setApiError(error.message || "Failed to fetch plots")
      setFilteredPlots([])
    } finally {
      setIsFilterLoading(false)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    } else if (isAuthenticated) {
      setIsLoading(false)
    }
  }, [authLoading, isAuthenticated, router])

  // Handle phase selection
  const handlePhaseSelect = (phase) => {
    setSelectedPhase(phase)
    loadPlotsByPhase(phase)
  }

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size)
    if (selectedPhase) {
      loadPlotsByPhaseAndSize(selectedPhase, size)
    }
  }

  // Handle plot selection
  const handlePlotSelect = async (plot) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`${MARKETING_ENDPOINTS.HOLD_PLOT}?plot_id=${plot.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to hold plot")
      }

      setSelectedPlot(plot)
      // Update the plot_id in formData
      setFormData((prev) => ({
        ...prev,
        plot_id: plot.id,
      }))
      setActiveTab("booking")
    } catch (error) {
      setApiError(error.message || "Failed to hold plot")
    }
  }

  // Handle back to selection
  const handleBackToSelection = () => {
    setActiveTab("filter")
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Manager Booking Form</h1>
          <p className="text-muted-foreground mt-1">
            Help users book plots and place bids without using the map interface
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filter" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter Plots</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-2" disabled={!selectedPlot}>
              <FileText className="h-4 w-4" />
              <span>Booking Form</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filter" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Filter Available Plots</CardTitle>
                  <CardDescription>Select phase and size to find available plots</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Phase Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Phase</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((phase) => (
                          <Button
                            key={phase}
                            variant={selectedPhase === phase.toString() ? "default" : "outline"}
                            onClick={() => handlePhaseSelect(phase.toString())}
                            className="w-full"
                          >
                            Phase {phase}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection - Only show if phase is selected and sizes are available */}
                    {selectedPhase && Object.keys(availableSizes).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Size</label>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(availableSizes).map(([size, count]) => (
                            <Button
                              key={size}
                              variant={selectedSize === size ? "default" : "outline"}
                              onClick={() => handleSizeSelect(size)}
                              className="w-full justify-between"
                            >
                              <span>{size}</span>
                              <span className="bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
                                {count}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show message if no sizes available */}
                    {selectedPhase && Object.keys(availableSizes).length === 0 && !isFilterLoading && (
                      <Alert>
                        <AlertDescription>No plots available in Phase {selectedPhase}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Available Plots</CardTitle>
                    <CardDescription>{filteredPlots.length} plots found</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {isFilterLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : apiError ? (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <AlertDescription>{apiError}</AlertDescription>
                    </Alert>
                  ) : filteredPlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {selectedPhase ? (
                        selectedSize ? (
                          <p>No plots available for the selected criteria</p>
                        ) : (
                          <p>Please select a size to view available plots</p>
                        )
                      ) : (
                        <p>Please select a phase to begin</p>
                      )}
                    </div>
                  ) : (
                    <PlotSelectionList
                      plots={filteredPlots}
                      onPlotSelect={handlePlotSelect}
                      selectedPlot={selectedPlot}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="booking" className="mt-6">
            {selectedPlot ? (
              <ManagerBookingForm plot={selectedPlot} onBackToSelection={handleBackToSelection} />
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">Please select a plot first from the Filter Plots tab</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("filter")}>
                    Go to Plot Selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
