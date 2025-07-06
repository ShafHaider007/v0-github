"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Filter, ShoppingCart } from "lucide-react"
import FilterPanel from "@/components/filters/filter-panel"
import PlotDetails from "@/components/plots/plot-details"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import PlotListView from "@/components/plots/plot-list-view"
import { useRouter } from "next/navigation"
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
import { fetchDhaBiding } from "@/utils/api"
import { PLOT_ENDPOINTS } from "@/utils/endpoints"
import { isAppleDevice } from "@/utils/device-detection"

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
})

export default function PlotDashboardUnauth() {
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
  const [mapData, setMapData] = useState(null)
  const [activeTab, setActiveTab] = useState("list")
  const [filteredPlotsCount, setFilteredPlotsCount] = useState(0)
  const [totalPlotsCount, setTotalPlotsCount] = useState(0)
  const [availablePlotTypes, setAvailablePlotTypes] = useState({})
  const [availablePlotSizes, setAvailablePlotSizes] = useState({})
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingSizes, setIsLoadingSizes] = useState(false)
  const [showAppleDeviceWarning, setShowAppleDeviceWarning] = useState(false)
  const [isAppleDeviceDetected, setIsAppleDeviceDetected] = useState(false)
  const [hasShownInitialFilter, setHasShownInitialFilter] = useState(false)
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
  useEffect(() => {
    setIsBrowser(true)
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])
  const loadPlotsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(PLOT_ENDPOINTS.FILTERED_PLOTS)
      if (!response.ok) {
        throw new Error("Failed to load plots data")
      }
      const responseData = await response.json()
      if (responseData.success && responseData.data) {
        setPlotsData(responseData.data.plots)
        setMapData(responseData.data.plots)
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
  useEffect(() => {
    if (isBrowser) {
      loadPlotsData()
    }
  }, [isBrowser])

  // Prevent filter dropdown from opening automatically on mobile
  useEffect(() => {
    if (isMobile && !hasShownInitialFilter) {
      setFilterDropdownOpen(false)
    }
  }, [isMobile, hasShownInitialFilter])

  // Hide left panel by default on mobile
  useEffect(() => {
    if (isMobile) {
      setShowLeftPanel(false)
    } else {
      setShowLeftPanel(true)
    }
  }, [isMobile])
  const handlePlotSelect = (plot, fromListView = false, zoomToPlot = false) => {
    const isAlreadySelected = selectedPlots.some((p) => p.id === plot.id)
    if (isAlreadySelected) {
      setSelectedPlots([])
      if (mapInstanceRef.current) {
        mapInstanceRef.current.closePopup()
      }
      return;
    }
    setSelectedPlots([plot])
    if (!isMobile) {
      setShowRightPanel(true)
    }
    setActiveTab("plots")
    if (fromListView && window.innerWidth < 768) {
      setShowRightPanel(false)
    }
    if (zoomToPlot && mapInstanceRef.current) {
      mapInstanceRef.current.zoomToPlot(plot)
    }
    if (isMobile && fromListView && slidingPanelRef.current && slidingPanelRef.current.collapsePanel) {
      slidingPanelRef.current.collapsePanel()
    }
  }
  const clearSelection = () => {
    setSelectedPlots([])
    if (mapInstanceRef.current) {
      mapInstanceRef.current.closePopup()
    }
    if (window.innerWidth < 768) {
      setShowRightPanel(false)
      if (isMobile && slidingPanelRef.current && slidingPanelRef.current.collapsePanel) {
        slidingPanelRef.current.collapsePanel()
      }
    }
  }
  const handleFilterChange = (filters) => {
    setActiveFilters(filters)
  }
  const handleFilteredPlotsChange = (count) => {
    setFilteredPlotsCount(count)
  }
  const setMapInstance = (mapInstance) => {
    mapInstanceRef.current = mapInstance
    window.map = mapInstance
  }
  const toggleLeftPanel = () => {
    setShowLeftPanel(prev => {
      const next = !prev;
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current.invalidateSize({ animate: false }), 310);
      }
      return next;
    });
  };
  const toggleRightPanel = () => {
    setShowRightPanel(prev => {
      const next = !prev;
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current.invalidateSize({ animate: false }), 310);
      }
      return next;
    });
  };
  const handleFilterButtonClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAppleDevice()) {
      setShowAppleDeviceWarning(true)
    } else {
      setFilterDropdownOpen(true)
    }
  }
  const zoomToAllPhases = () => {
    if (mapInstanceRef.current) {
      const allPhasesBounds = window.L.latLngBounds(
        [33.464901, 73.054898],
        [33.591134, 73.361106],
      )
      mapInstanceRef.current.fitBounds(allPhasesBounds, {
        padding: [50, 50],
        maxZoom: 12,
        animate: true,
      })
      if (selectedPlots.length > 0) {
        clearSelection()
      }
    }
  }
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }
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
        {selectedPlots.length > 0 && selectedPlots[0] ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Selected Plot</h3>
            {selectedPlots.map((plot) => (
              <PlotDetails key={plot.id} plot={plot} />
            ))}
            <div className="mt-4">
              <Button
                onClick={() => {
                  try {
                    router.push("/login")
                  } catch (e) {
                    // fallback: reload to login
                    window.location.href = "/login"
                  }
                }}
                          className="w-full"
              >
                {dhaBiding === 1 && (selectedPlots[0]?.type === "commercial" || selectedPlots[0]?.category === "Commercial")
                  ? "Pay Token to bid"
                  : "Secure Your Plot"}
                        </Button>
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
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 flex min-w-0 relative overflow-hidden">
        <div
          className={`h-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${
            showLeftPanel
              ? 'w-full md:w-36 lg:w-40 xl:w-48'
              : 'w-0'
          } flex-shrink-0 z-20`}
        >
          <div className={`h-full overflow-auto relative ${showLeftPanel ? "block" : "hidden"}`}>
            <FilterPanel onFilterChange={handleFilterChange} mapInstance={mapInstanceRef.current} />
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
          {isBrowser && isMobile && (
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <div className="relative">
                <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      className="shadow-lg flex items-center gap-2 px-3"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setFilterDropdownOpen(true)
                        setHasShownInitialFilter(true)
                      }}
                    >
                      <Filter className="h-4 w-4" />
                      <span className="text-sm">Filters</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Phase</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Select
                        value={activeFilters.phase}
                        onValueChange={(value) => {
                          const newFilters = {
                            ...activeFilters,
                            phase: value,
                            plotType: {},
                            plotSize: {},
                          }
                          setActiveFilters(newFilters)
                          setAvailablePlotSizes({})
                          if (value) {
                            setIsLoadingTypes(true)
                            fetch(`${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${value}`)
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
                            setAvailablePlotTypes({})
                          }
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
                              const leafletBounds = window.L.latLngBounds(bounds.southWest, bounds.northEast)
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
                                  let updatedPlotTypes = {}
                                  if (checked) {
                                    updatedPlotTypes = { [type]: true }
                                  }
                                  const newFilters = {
                                    ...activeFilters,
                                    plotType: updatedPlotTypes,
                                    plotSize: {},
                                  }
                                  setActiveFilters(newFilters)
                                  if (checked && activeFilters.phase) {
                                    setIsLoadingSizes(true)
                                    const formattedType = type.charAt(0).toUpperCase() + type.slice(1)
                                    fetch(
                                      `${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${activeFilters.phase}&category=${formattedType}`
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
        {isMobile && isBrowser && (
          <SlidingPanel ref={slidingPanelRef} totalPlots={filteredPlotsCount}>
            {renderPanelContent()}
          </SlidingPanel>
        )}
      </div>
    </div>
  )
}
