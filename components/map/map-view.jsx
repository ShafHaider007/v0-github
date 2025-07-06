"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { fetchAllPlots, convertPlotsToGeoJSON } from "@/utils/api"

// Import CSS for Leaflet
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// ——— platform helper (added for iOS memory fix) ———
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const rendererForPlatform = isIOS
  ? L.canvas({ padding: 2 })
  : L.svg({ padding: 2 });

// Dynamically import the MapContainer component with no SSR
const MapWithNoSSR = dynamic(() => import("./map-container"), { ssr: false })

// Main MapView component
export default function MapView({ selectedPlots, onPlotSelect, activeFilters, onMapReady }) {
  // Add this line to preload the GeoJSON data
  useEffect(() => {
    // Preload the GeoJSON data
    const link = document.createElement("link")
    link.rel = "preload"
    link.href = "/data/data.geojson"
    link.as = "fetch"
    link.crossOrigin = "anonymous"
    document.head.appendChild(link)

    // Preload the PDF
    const pdfLink = document.createElement("link")
    pdfLink.rel = "preload"
    pdfLink.href = "/payment-plan.pdf"
    pdfLink.as = "document"
    document.head.appendChild(pdfLink)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(pdfLink)
    }
  }, [])

  const [isClient, setIsClient] = useState(false)
  const [mapData, setMapData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const mapRef = useRef(null)
  // Add this line to make the geoJsonLayerRef accessible
  const geoJsonLayerRef = useRef(null)

  // Fetch plot data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const plotsData = await fetchAllPlots()

        // Convert API data to GeoJSON format
        const geoJsonData = convertPlotsToGeoJSON(plotsData)
        setMapData(geoJsonData)
      } catch (err) {
        setError(err.message || "Failed to load plot data")
      } finally {
        setIsLoading(false)
      }
    }

    if (isClient) {
      fetchData()
    }
  }, [isClient])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Function to handle map instance reference
  const handleMapReady = (mapInstance) => {
    mapRef.current = mapInstance
    // Pass the geoJsonLayerRef to the map instance
    mapInstance.geoJsonLayerRef = geoJsonLayerRef
    if (onMapReady) {
      onMapReady(mapInstance)
    }
  }

  // ——— ensure first paint ———
  useEffect(() => {
    if (!mapRef.current) return;

    // Run on next paint so the wrapper already has height
    requestAnimationFrame(() => {
      mapRef.current.invalidateSize({
        animate: false,
        pan: false,
        debounceMoveend: false,
        noMoveStart: true,
      });
    });
  }, []);          // ← run exactly once

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-4 bg-red-50 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Map Data</h3>
          <p className="text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Filter the features based on active filters
  const filteredFeatures =
    mapData?.features?.filter((feature) => {
      if (!feature.properties) return false

      const plotCategory = feature.properties.CATEGORY?.toLowerCase() || ""
      const plotPhase = feature.properties.PHASE?.toString() || ""

      // Get plot size directly from the SIZE property
      const plotSize = feature.properties.SIZE || ""

      // Skip features that don't have a category or are not plots
      if (!plotCategory || plotCategory === "null" || feature.properties.TYPE === "Green") {
        return false
      }

      // Filter by plot type (residential/commercial)
      if (
        !(
          (activeFilters.plotType.residential && plotCategory === "residential") ||
          (activeFilters.plotType.commercial && plotCategory === "commercial")
        )
      ) {
        return false
      }

      // Filter by phase
      if (activeFilters.phase && plotPhase !== activeFilters.phase) {
        return false
      }

      // Filter by plot size - check if any selected size matches this plot's size
      if (Object.keys(activeFilters.plotSize).some((size) => activeFilters.plotSize[size])) {
        const sizeMatch = Object.entries(activeFilters.plotSize).some(([size, isSelected]) => {
          if (!isSelected) return false
          return plotSize === size
        })

        if (!sizeMatch) {
          return false
        }
      }

      return true
    }) || []

  const updatedMapData = mapData ? { ...mapData, features: filteredFeatures } : null

  return (
    <div className="w-full h-full min-h-[500px] relative">
      <MapWithNoSSR
        mapData={updatedMapData}
        selectedPlots={selectedPlots}
        onPlotSelect={onPlotSelect}
        activeFilters={activeFilters}
        onMapReady={handleMapReady}
        isLoading={isLoading}
      />
    </div>
  )
}
