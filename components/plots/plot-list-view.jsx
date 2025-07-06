"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function PlotListView({ plots, onPlotSelect, selectedPlots, activeFilters, onFilteredPlotsChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPlots, setFilteredPlots] = useState([])

  // Modify the useEffect that filters plots to check if any filters are active
  // Update the useEffect that handles filtering to check if any filters are active
  useEffect(() => {
    // First convert API data to plot objects
    const plotItems = plots
      .filter((plot) => {
        // Skip plots that are sold
        const isSold = plot.status === "Sold" || plot.status === "Reserved"
        return !isSold
      })
      .map((plot) => {
        return {
          id: plot.id.toString(),
          name: `Plot ${plot.plot_no}`,
          sector: `Sector ${plot.sector}`,
          block: plot.phase || "Unknown",
          size: plot.size || "Unknown",
          type: plot.category ? plot.category.toLowerCase() : "unknown",
          price: calculatePrice(plot),
          status: plot.status === "Unsold" ? "available" : "bidding",
          subtype: "Standard", // API doesn't provide subtype
          street: plot.street_no || "Unknown",
          area: plot.size ? Number.parseInt(plot.size, 10) : 4500, // Use size from API
          plotId: `plot-${plot.id}`,
          plot_no: plot.plot_no,
          st_asgeojson: plot.st_asgeojson, // Store the GeoJSON string for direct access
          phase: plot.phase,
          cat_area: plot.cat_area || "Unknown",
          category: plot.category,
          remarks: plot.remarks,
        }
      })

    // Check if any filters are active
    const hasActiveFilters =
      activeFilters &&
      ((activeFilters.phase &&
        (Object.values(activeFilters.plotType).some((value) => value) ||
          Object.values(activeFilters.plotSize).some((value) => value))) ||
        Object.values(activeFilters.plotType).some((value) => value) ||
        Object.values(activeFilters.plotSize).some((value) => value))

    // If no filters are active, set empty filtered plots
    if (!hasActiveFilters) {
      setFilteredPlots([])
      if (onFilteredPlotsChange) {
        onFilteredPlotsChange(0)
      }
      return
    }

    // Then apply filters and search
    const filtered = plotItems.filter((plot) => {
      // Apply search filter
      const matchesSearch =
        plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plot.plotId && plot.plotId.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchesSearch) return false

      // Apply active filters if they exist
      if (activeFilters) {
        const filterResult = filterPlots(plotItems)
        return filterResult.includes(plot)
      }

      return true
    })

    setFilteredPlots(filtered)

    // Notify parent component about the filtered plots count
    if (onFilteredPlotsChange) {
      onFilteredPlotsChange(filtered.length)
    }
  }, [plots, searchTerm, activeFilters, onFilteredPlotsChange])

  // Replace the calculatePrice function with a simpler version that returns 100
  function calculatePrice(plot) {
    // Return fixed price of 100
    return 100
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "sold":
        return "bg-red-100 text-red-800"
      case "bidding":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Handle plot selection with custom popup display
  const handlePlotSelect = (plot) => {
    // First, select the plot
    onPlotSelect(plot, true, true)
    // Then, zoom to the plot on the map and show popup after zoom completes
    if (window.map && window.map.zoomToPlot) {
      window.map.zoomToPlot(plot);
      // Wait for the map to finish moving/zooming, then show the popup
      const onMoveEnd = () => {
        if (window.map && window.map.showPopupForPlot) {
          window.map.showPopupForPlot(plot);
        }
        window.map.off('moveend', onMoveEnd); // Clean up the event listener
      };
      window.map.on('moveend', onMoveEnd);
    }
  }

  const filterPlots = (plots) => {
    if (!plots) return []

    return plots.filter((plot) => {
      // Phase filter
      if (activeFilters.phase && plot.phase !== activeFilters.phase) {
        return false
      }

      // Plot type filter (category)
      const plotTypeFilters = Object.keys(activeFilters.plotType).filter((key) => activeFilters.plotType[key])
      if (plotTypeFilters.length > 0) {
        // Convert plot.category to lowercase for case-insensitive comparison
        const plotCategory = plot.category ? plot.category.toLowerCase() : ""
        if (!plotTypeFilters.some((type) => plotCategory === type.toLowerCase())) {
          return false
        }
      }

      // Plot size filter
      const plotSizeFilters = Object.keys(activeFilters.plotSize).filter((key) => activeFilters.plotSize[key])
      if (plotSizeFilters.length > 0) {
        // Check if the plot's size matches any of the selected sizes
        // Use cat_area or size field depending on what's available
        const plotSize = plot.cat_area || plot.size || ""
        if (!plotSizeFilters.some((size) => plotSize === size)) {
          return false
        }
      }

      return true
    })
  }

  // Replace the existing return statement with this updated one that shows a message when no filters are active
  return (
    <div>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by plot ID, name, or number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {/* Check if any filters are active */}
        {!activeFilters ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Please select filters to view available plots.</p>
            <p className="text-sm text-gray-400">Use the filter panel to select phase, plot type, and size.</p>
          </div>
        ) : activeFilters.phase &&
          !Object.values(activeFilters.plotType).some((value) => value) &&
          !Object.values(activeFilters.plotSize).some((value) => value) ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Please select plot type or size in filters to view available plots.</p>
            <p className="text-sm text-gray-400">
              Phase {activeFilters.phase} is selected. Now select plot type or size to see plots.
            </p>
          </div>
        ) : filteredPlots.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No plots found matching your search criteria.</p>
        ) : (
          filteredPlots.map((plot) => {
            const isSelected = selectedPlots.some((p) => p.id === plot.id)

            return (
              <div
                key={plot.id}
                className={`plot-card border rounded-lg p-4 transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">Plot {plot.plot_no}</h3>
                      <Badge className={getStatusColor(plot.status)}>
                        {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge className="bg-gray-100 text-gray-800">{plot.sector || "Unknown Sector"}</Badge>
                      <Badge className="bg-gray-100 text-gray-800">{plot.cat_area || plot.size}</Badge>
                      <Badge className="bg-gray-100 text-gray-800">
                        {plot.remarks && plot.remarks !== "NULL" ? `${plot.type} (${plot.remarks})` : plot.type}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-800">Phase {plot.phase}</Badge>
                      <Badge className="bg-gray-100 text-gray-800">
                        Street {plot.street || plot.street_no || "N/A"}
                      </Badge>
                    </div>
                  </div>

                  <Button variant={isSelected ? "default" : "outline"} size="sm" onClick={() => handlePlotSelect(plot)}>
                    {isSelected ? "Viewing" : "View"}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
