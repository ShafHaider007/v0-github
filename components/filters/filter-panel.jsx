"use client"

import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Sliders } from "lucide-react"
import { PLOT_ENDPOINTS, getAuthToken } from "@/utils/endpoints"

// Define phase bounds
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

// Update the component definition to accept props
export default function FilterPanel({ onFilterChange, mapInstance }) {
  // Update the filters state structure to handle dynamic options
  const [filters, setFilters] = useState({
    plotType: {},
    plotSize: {},
    phase: "",
  })

  // Add state for available plot types and sizes
  const [availablePlotTypes, setAvailablePlotTypes] = useState({})
  const [availablePlotSizes, setAvailablePlotSizes] = useState({})
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingSizes, setIsLoadingSizes] = useState(false)

  // Add effect to emit initial filter state
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [])

  // Add function to fetch plot types when phase is selected
  const fetchPlotTypes = async (phase) => {
    if (!phase) return

    setIsLoadingTypes(true)
    try {
      const response = await fetch(`${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${phase}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch plot types")
      }

      const data = await response.json()

      if (data.success && data.data && data.data.counts && data.data.counts.categories) {
        setAvailablePlotTypes(data.data.counts.categories)

        // Reset plot type filters when new types are loaded
        setFilters((prev) => ({
          ...prev,
          plotType: {},
          plotSize: {}, // Also reset plot sizes
        }))
      }
    } catch (error) {
    } finally {
      setIsLoadingTypes(false)
    }
  }

  // Add function to fetch plot sizes when phase and plot type are selected
  const fetchPlotSizes = async (phase, category) => {
    if (!phase || !category) return

    setIsLoadingSizes(true)
    try {
      // Capitalize the first letter of the category
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1)

      const response = await fetch(`${PLOT_ENDPOINTS.FILTERED_PLOTS}?phase=${phase}&category=${formattedCategory}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch plot sizes")
      }

      const data = await response.json()

      if (data.success && data.data && data.data.counts && data.data.counts.sizes) {
        setAvailablePlotSizes(data.data.counts.sizes)

        // Reset plot size filters when new sizes are loaded
        setFilters((prev) => ({
          ...prev,
          plotSize: {},
        }))
      } else {
        setAvailablePlotSizes({})
      }
    } catch (error) {
      setAvailablePlotSizes({})
    } finally {
      setIsLoadingSizes(false)
    }
  }

  // Update handleCheckboxChange to work with dynamic options
  const handleCheckboxChange = (category, value) => {
    let updatedCategory

    // For plotType, implement radio-like behavior (only one selection allowed)
    if (category === "plotType") {
      // If the clicked checkbox is already checked, uncheck it
      if (filters[category][value]) {
        updatedCategory = {}
      } else {
        // Otherwise, clear all other selections and check only this one
        updatedCategory = { [value]: true }
      }
    } else {
      // For other categories (like plotSize), keep the existing toggle behavior
      updatedCategory = {
        ...filters[category],
        [value]: !filters[category][value],
      }
    }

    const updatedFilters = {
      ...filters,
      [category]: updatedCategory,
    }

    setFilters(updatedFilters)

    // If this is a plot type change, fetch plot sizes if a type is selected
    if (category === "plotType") {
      // Find the first selected plot type
      const selectedType = Object.keys(updatedCategory).find((key) => updatedCategory[key])
      if (selectedType && filters.phase) {
        fetchPlotSizes(filters.phase, selectedType)
      } else {
        // Clear plot sizes if no plot type is selected
        setAvailablePlotSizes({})
      }
    }

    // Emit filter changes immediately when checkboxes change
    if (onFilterChange) {
      onFilterChange(updatedFilters)
    }
  }

  // Update the phase selection logic to fetch plot types
  const handlePhaseSelect = (phaseNum) => {
    // Convert to string to match API data format
    const phaseStr = String(phaseNum)

    // If the current phase is already selected, deselect it (set to empty string)
    // Otherwise, set it to the new value
    const newPhase = filters.phase === phaseStr ? "" : phaseStr

    const updatedFilters = {
      ...filters,
      phase: newPhase,
      plotType: {}, // Reset plot type when phase changes
      plotSize: {}, // Reset plot size when phase changes
    }

    setFilters(updatedFilters)

    // Always clear available plot sizes when phase changes
    setAvailablePlotSizes({})

    // Fetch plot types if a phase is selected
    if (newPhase) {
      fetchPlotTypes(newPhase)
      // Clear available plot types but they will be refetched
      setAvailablePlotTypes({})
    } else {
      // Clear available options if phase is deselected
      setAvailablePlotTypes({})
    }

    // Apply filters immediately when a phase is selected/deselected
    if (onFilterChange) {
      onFilterChange(updatedFilters)
    }

    // Zoom to phase bounds if a phase is selected and mapInstance is available
    if (newPhase !== "" && mapInstance) {
      const bounds = PHASE_BOUNDS[phaseNum]
      if (bounds) {

        // Create a Leaflet bounds object
        const leafletBounds = window.L.latLngBounds(bounds.southWest, bounds.northEast)

        // Fit the map to these bounds with some padding
        // Use a timeout to ensure this happens after any other map operations
        setTimeout(() => {
          mapInstance.fitBounds(leafletBounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
          })
        }, 100)
      }
    } else if (newPhase === "" && mapInstance && window.initialMapBounds) {
      // If phase is deselected, return to the full view
      setTimeout(() => {
        mapInstance.fitBounds(window.initialMapBounds, {
          padding: [50, 50],
          maxZoom: 12,
          animate: true,
        })
      }, 100)
    }
  }

  // Update the resetFilters function
  const resetFilters = () => {
    const resetFilterValues = {
      plotType: {},
      plotSize: {},
      phase: "",
    }

    setFilters(resetFilterValues)
    setAvailablePlotTypes({})
    setAvailablePlotSizes({})

    // Emit filter reset
    if (onFilterChange) {
      onFilterChange(resetFilterValues)
    }
  }

  return (
    <div className="filter-panel h-full flex flex-col">
      <div className="filter-panel-header flex items-center justify-between bg-primary py-2 px-3">
        <div className="flex items-center gap-2 text-black font-medium text-sm">
          <Sliders className="h-4 w-4" />
          <h2>Filters</h2>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <Accordion type="multiple" defaultValue={["phase", "plot-type", "plot-size"]} className="w-full">
          <AccordionItem value="phase" className="border-b">
            <AccordionTrigger className="py-3 font-medium">DHA Phases</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[1, 2, 3, 4, 5, 6, 7].map((phaseNum) => (
                  <Button
                    key={phaseNum}
                    variant={filters.phase === String(phaseNum) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePhaseSelect(phaseNum)}
                    className="h-9"
                  >
                    {phaseNum}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="plot-type" className="border-b">
            <AccordionTrigger className="py-3 font-medium">Plot Type</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2 mt-2 pl-1">
                {isLoadingTypes ? (
                  <div className="py-2 text-sm text-gray-500">Loading plot types...</div>
                ) : Object.keys(availablePlotTypes).length > 0 ? (
                  Object.keys(availablePlotTypes).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={!!filters.plotType[type]}
                        onCheckedChange={() => handleCheckboxChange("plotType", type)}
                      />
                      <Label htmlFor={`type-${type}`} className="cursor-pointer flex-1">
                        {type.charAt(0).toUpperCase() + type.slice(1)} ({availablePlotTypes[type]})
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-sm text-gray-500">
                    {filters.phase ? "No plot types available" : "Select a phase first"}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="plot-size" className="border-b">
            <AccordionTrigger className="py-3 font-medium">Plot Size</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2 mt-2 pl-1">
                {isLoadingSizes ? (
                  <div className="py-2 text-sm text-gray-500">Loading plot sizes...</div>
                ) : Object.keys(availablePlotSizes).length > 0 ? (
                  Object.keys(availablePlotSizes).map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={!!filters.plotSize[size]}
                        onCheckedChange={() => handleCheckboxChange("plotSize", size)}
                      />
                      <Label htmlFor={`size-${size}`} className="cursor-pointer flex-1">
                        {size} ({availablePlotSizes[size]})
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-sm text-gray-500">
                    {Object.keys(filters.plotType).some((key) => filters.plotType[key])
                      ? "No plot sizes available"
                      : "Select a plot type first"}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="p-4 border-t mt-auto">
        <div className="flex flex-col gap-2">
          <Button onClick={resetFilters} variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
