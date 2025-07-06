"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { MapContainer, useMap, Popup } from "react-leaflet"
import L from "leaflet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Layers, FileText, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { islamabadCoordinates } from "@/utils/geo-utils"
import proj4 from "proj4"
import { PhaseBoundaries, AmenitiesLayer } from "./phase-overlays"

// ——— platform helper (added for iOS memory fix) ———
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const rendererForPlatform = isIOS
  ? L.canvas({ padding: 2 })
  : L.svg({ padding: 2 });

// Define projections for coordinate conversion
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs")
proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs")

// Remove unused helper functions and simplify the code
function calculatePrice(properties) {
  // Return fixed price of 100
  return 100
}

// Update the plotStyle function to change the colors
// Find the plotStyle function (around line 50-80) and update the color assignments:

function plotStyle(feature, selectedPlots, pingedPlots = []) {
  // Check if feature or feature.properties is undefined
  if (!feature || !feature.properties) {
    return {
      fillColor: "#CCCCCC", // Default gray for invalid features
      weight: 0.5, // Very thin border
      opacity: 1,
      color: "#666666",
      fillOpacity: 1,
      className: "plot-polygon", // Add this class to all polygons
    }
  }

  // Check if this plot is in the selectedPlots array
  const isSelected = selectedPlots.some((p) => p.id === feature.properties.id || p.id === feature.properties.GIS_UID)

  // Determine plot status - check both PLOT_STATU and NEW_PLOT_S fields
  const status = feature.properties.PLOT_STATU || feature.properties.NEW_PLOT_S
  const isBidding = status === "bidding"

  // Determine plot type
  const plotType = feature.properties.CATEGORY ? feature.properties.CATEGORY.toLowerCase() : "unknown"
  const isCommercial = plotType === "commercial"
  const isResidential = plotType === "residential"

  // Set the fill color based on status, type and selection
  let fillColor = "#CCCCCC" // Default gray

  if (isSelected) {
    fillColor = "#10B981" // Selected (green)
  } else if (isCommercial) {
    fillColor = "#2563EB" // Commercial (blue)
  } else if (isResidential) {
    fillColor = "#F59E0B" // Residential (yellow)
  }

  // Check if this plot is in the pingedPlots array
  const isPinged = pingedPlots.includes(feature.properties.id) || pingedPlots.includes(feature.properties.GIS_UID)

  // Determine which pulsating class to use based on plot type
  let polygonClass = "plot-polygon"
  if (isSelected) {
    polygonClass = "plot-polygon plot-selected-pulse"
  } else if (isCommercial) {
    polygonClass = "plot-polygon plot-commercial-pulse"
  } else if (isResidential) {
    polygonClass = "plot-polygon plot-residential-pulse"
  }

  // Add ping class if needed
  if (isPinged) {
    if (isCommercial) polygonClass += " plot-ping-commercial"
    if (isResidential) polygonClass += " plot-ping-residential"
  }

  // Get current zoom level
  const currentZoom = map.getZoom()

  // Adjust stroke width and opacity based on zoom level
  let strokeWidth = 1
  let strokeOpacity = 0.7
  let fillOpacity = 0.85

  if (currentZoom >= 15) {
    strokeWidth = 3
    strokeOpacity = 1
    fillOpacity = 0.7 // More transparent fill to show boundaries better
  } else if (currentZoom >= 13) {
    strokeWidth = 2
    strokeOpacity = 0.9
    fillOpacity = 0.75
  }

  // Use minimal borders for all polygons but increase fill opacity for better visibility
  return {
    fillColor,
    weight: isSelected ? strokeWidth + 1 : strokeWidth, // Thicker borders for selected plots
    opacity: strokeOpacity,
    color: "#000000", // Black color for boundaries
    fillOpacity: fillOpacity, // Adjusted fill opacity
    className: polygonClass, // Add the appropriate class
  }
}

// Find the basemaps array and update the imageUrl paths to use local files
const basemaps = [
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    imageUrl: "/images/map-osm.png",
  },
  {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18,
    imageUrl: "/images/map-satellite.png",
  },
]

const MAX_MAP_ZOOM = 18;

// Update the BasemapSwitcher component to remove the overlay layers section
// Find the BasemapSwitcher function and replace it with this version:

function BasemapSwitcher({ showAmenities, setShowAmenities }) {
  const map = useMap()
  const [selectedBasemap, setSelectedBasemap] = useState("Satellite")
  const basemapLayerRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Function to change the basemap
  const changeBasemap = (basemapName) => {
    setSelectedBasemap(basemapName)
    if (basemapLayerRef.current) {
      map.removeLayer(basemapLayerRef.current)
    }
    if (basemapName !== "None") {
      const basemap = basemaps.find((bm) => bm.name === basemapName)
      if (basemap) {
        try {
          const newLayer = L.tileLayer(basemap.url, {
            attribution: basemap.attribution,
            maxZoom: basemap.maxZoom,
          })
          if (newLayer && map) {
            basemapLayerRef.current = newLayer
            basemapLayerRef.current.addTo(map)
          }
        } catch (error) {
          console.error("Error creating basemap layer:", error)
          basemapLayerRef.current = null
        }
      }
    } else {
      basemapLayerRef.current = null
    }
  }

  // Initialize with no basemap
  useEffect(() => {
    if (!map) return
    
    // Remove any existing TileLayers that might be added elsewhere
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer)
      }
    })
    if (selectedBasemap === "Satellite") {
      changeBasemap("Satellite")
    }
    return () => {
      if (basemapLayerRef.current && map) {
        map.removeLayer(basemapLayerRef.current)
      }
    }
  }, [map])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white shadow-lg h-10 w-10 p-0">
          <Layers className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={isMobile ? "w-56" : "w-60"}>
        <div className="flex flex-col gap-2 p-2">
          <h4 className="font-semibold text-sm mb-1">Base Maps</h4>
          <div className="flex items-center">
            <input
              type="radio"
              id="basemap-none"
              name="basemap-selection"
              checked={selectedBasemap === "None"}
              onChange={() => changeBasemap("None")}
              className="mr-2"
            />
            <label htmlFor="basemap-none" className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center mr-2">
                <Layers className="h-4 w-4 text-gray-500" />
              </div>
              <span>None</span>
            </label>
          </div>
          {basemaps.map((basemap) => (
            <div key={basemap.name} className="flex items-center">
              <input
                type="radio"
                id={`basemap-${basemap.name}`}
                name="basemap-selection"
                checked={selectedBasemap === basemap.name}
                onChange={() => changeBasemap(basemap.name)}
                className="mr-2"
              />
              <label htmlFor={`basemap-${basemap.name}`} className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  {basemap.name === "OpenStreetMap" ? (
                    <Layers className="h-4 w-4 text-blue-500" />
                  ) : basemap.name === "Satellite" ? (
                    <Layers className="h-4 w-4 text-green-500" />
                  ) : (
                    <Layers className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <span className={`text-sm ${isMobile ? "truncate max-w-[100px]" : ""}`}>{basemap.name}</span>
              </label>
            </div>
          ))}
          <div className="flex items-center mt-2 border-t pt-2">
            <input
              type="checkbox"
              id="toggle-amenities"
              checked={showAmenities}
              onChange={() => setShowAmenities((v) => !v)}
              className="mr-2"
            />
            <label htmlFor="toggle-amenities" className="text-sm">Show Amenities</label>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper function to find the center of a polygon
function findPolygonCenter(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  // Support both Polygon and MultiPolygon
  let coords;
  if (geometry.type === "Polygon") {
    coords = geometry.coordinates[0];
  } else if (geometry.type === "MultiPolygon") {
    coords = geometry.coordinates[0][0];
  } else {
    return null;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  coords.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  // Return [lat, lng] for Leaflet
  return [(minY + maxY) / 2, (minX + maxX) / 2];
}

// Function to convert UTM coordinates to WGS84 (lat/lng)
function utmToLatLng(x, y) {
  try {
    const [lon, lat] = proj4("EPSG:32643", "EPSG:4326", [x, y])
    return [lat, lon] // Leaflet uses [lat, lon]
  } catch (error) {
    return null
  }
}

// Function to parse GeoJSON from API response
function parseGeoJSON(geoJsonString) {
  try {
    if (!geoJsonString) return null

    const geoJson = JSON.parse(geoJsonString)

    // Check if the geometry is in UTM (EPSG:32643) and convert to WGS84 (EPSG:4326)
    if (geoJson.crs && geoJson.crs.properties && geoJson.crs.properties.name === "EPSG:32643") {
      // For MultiPolygon, convert each coordinate
      if (geoJson.type === "MultiPolygon") {
        const convertedCoordinates = geoJson.coordinates.map((polygon) =>
          polygon.map((ring) =>
            ring.map((coord) => {
              // Convert from UTM to WGS84
              const latLng = utmToLatLng(coord[0], coord[1])
              return latLng ? [latLng[1], latLng[0]] : [0, 0] // GeoJSON uses [longitude, latitude]
            }),
          ),
        )

        return {
          type: "MultiPolygon",
          coordinates: convertedCoordinates,
        }
      }
    }

    return geoJson
  } catch (error) {
    return null
  }
}

// Function to open payment plan in a new window
function openPaymentPlan(planUrl) {
  // Use a timeout to ensure this runs after any other event handlers
  setTimeout(() => {
    const width = 800
    const height = 600
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    window.open(
      planUrl,
      "paymentPlan",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
    )
  }, 100)
}

// Update the MobilePopup component to show remarks
// Find the MobilePopup function (around line 400-450) and modify it:

function MobilePopup({ properties, onClose }) {
  if (!properties) return null

  const status = properties.isSelected
    ? "Selected"
    : properties.isSold
      ? "Sold"
      : properties.isBidding
        ? "Bidding"
        : properties.status || "Available"

  const statusColor = properties.isSelected
    ? "bg-blue-100 text-blue-800"
    : properties.isSold
      ? "bg-red-100 text-red-800"
      : properties.isBidding
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800"

  const category = properties.CATEGORY || properties.category || ""
  const remarks = properties.remarks && properties.remarks !== "NULL" ? properties.remarks : null
  const displayCategory = remarks ? `${category} (${remarks})` : category
  const typeColor = category.toLowerCase() === "commercial" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

  // Use actual price from properties
  const price = properties.base_price ? Number(properties.base_price).toLocaleString() : "N/A"

  // Determine which payment plan to show
  let paymentPlanUrl = null
  if (
    properties.PHASE === "4" &&
    properties.SECTOR === "RVN" &&
    (properties.CATEGORY?.toLowerCase() === "residential" || properties.category?.toLowerCase() === "residential")
  ) {
    paymentPlanUrl = "/images/payment_plan_rvn.jpg"
  } else if (
    properties.PHASE === "6" &&
    properties.SECTOR === "B3" &&
    (properties.CATEGORY?.toLowerCase() === "residential" || properties.category?.toLowerCase() === "residential")
  ) {
    paymentPlanUrl = "/images/payment_plan_b3.jpg"
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-[280px] z-[3000]">
      {/* Header with plot number and close button */}
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-bold text-base">Plot {properties.PLOT_NO || properties.plot_no}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 ml-1 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            if (onClose) onClose()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Badges */}
      <div className="flex justify-between px-3 py-2">
        <Badge className={`${typeColor} text-xs px-2 py-0.5 h-5`}>{displayCategory}</Badge>
        <Badge className={`${statusColor} text-xs px-2 py-0.5 h-5`}>{status}</Badge>
      </div>

      {/* Compact info */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2 text-sm">
        <div>
          <span className="text-gray-500">Phase:</span> {properties.PHASE || properties.phase || "N/A"}
        </div>
        <div>
          <span className="text-gray-500">Sector:</span> {properties.SECTOR || properties.sector || "N/A"}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Street:</span> {properties.STREET_NO || properties.street_no || "N/A"}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Size:</span>
          <span className="block truncate">{properties.SIZE || properties.size || "N/A"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Price:</span> PKR {price}
        </div>
      </div>

      {/* Payment plan link */}
      {paymentPlanUrl && (
        <div className="p-3 pt-2 border-t">
          <a
            href={paymentPlanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => {
              e.preventDefault()
              // Close the popup first
              if (onClose) onClose()
              // Then open the payment plan in a new window
              openPaymentPlan(paymentPlanUrl)
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            View Payment Plan
          </a>
        </div>
      )}
    </div>
  )
}

// Update the PlotPopupComponent to use fixed price and fix the street layout
function PlotPopupComponent({ properties, onClose }) {
  if (!properties) return null

  const status = properties.isSelected
    ? "Selected"
    : properties.isSold
      ? "Sold"
      : properties.isBidding
        ? "Bidding"
        : "Available"

  const statusColor = properties.isSelected
    ? "bg-blue-100 text-blue-800"
    : properties.isSold
      ? "bg-red-100 text-red-800"
      : properties.isBidding
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800"

  const category = properties.CATEGORY || properties.category || ""
  const remarks = properties.remarks && properties.remarks !== "NULL" ? properties.remarks : null
  const displayCategory = remarks ? `${category} (${remarks})` : category
  const typeColor = category.toLowerCase() === "commercial" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

  // Use actual price from properties
  const price = properties.base_price ? Number(properties.base_price).toLocaleString() : "N/A"

  // Determine which payment plan to show
  let paymentPlanUrl = null
  if (
    properties.PHASE === "4" &&
    properties.SECTOR === "RVN" &&
    (properties.CATEGORY?.toLowerCase() === "residential" || properties.category?.toLowerCase() === "residential")
  ) {
    paymentPlanUrl = "/images/payment_plan_rvn.jpg"
  } else if (
    properties.PHASE === "6" &&
    properties.SECTOR === "B3" &&
    (properties.CATEGORY?.toLowerCase() === "residential" || properties.category?.toLowerCase() === "residential")
  ) {
    paymentPlanUrl = "/images/payment_plan_b3.jpg"
  }

  return (
    <div className="relative bg-white rounded-md shadow-lg w-[160px] mobile-popup">
      {/* Header with plot number and close button */}
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-bold text-sm">Plot {properties.PLOT_NO}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 ml-1 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            if (onClose) onClose()
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Badges */}
      <div className="flex justify-between px-2 py-1">
        <Badge className={`${typeColor} text-[10px] px-1 py-0 h-4`}>{displayCategory}</Badge>
        <Badge className={`${statusColor} text-[10px] px-1 py-0 h-4`}>{status}</Badge>
      </div>

      {/* Compact info */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-2 py-1 text-xs">
        <div>
          <span className="text-gray-500">Phase:</span> {properties.PHASE || properties.phase || "N/A"}
        </div>
        <div>
          <span className="text-gray-500">Sector:</span> {properties.SECTOR || properties.sector || "N/A"}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Street:</span>
          <span className="block truncate">{properties.STREET_NO || properties.street_no || "N/A"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Size:</span>
          <span className="block truncate">{properties.SIZE || properties.size || "N/A"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">
            {properties.category === "Commercial" ? "Reserve Price" : "Lump Sum Price"}
          </span>{" "}
          {Number(properties.base_price).toLocaleString()}
        </div>
      </div>

      {/* Payment plan link */}
      {paymentPlanUrl && (
        <div className="p-2 pt-1">
          <a
            href={paymentPlanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => {
              e.preventDefault()
              // Close the popup first
              if (onClose) onClose()
              // Then open the payment plan in a new window
              openPaymentPlan(paymentPlanUrl)
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            View Payment Plan
          </a>
        </div>
      )}
    </div>
  )
}

// Add this constant near the top with other constants
const PLOT_LABEL_MIN_ZOOM = 16

// Update the GeoJSONLayer component to always show the base layer
const GeoJSONLayer = ({ mapData, selectedPlots, onPlotSelect, activeFilters, pingedPlots = [] }) => {
  const map = useMap()
  const geoJsonLayerRef = useRef(null)
  const [activePopup, setActivePopup] = useState(null)
  const [showMobilePopup, setShowMobilePopup] = useState(false)
  const baseLayerRef = useRef(null)
  const initialLoadRef = useRef(true)
  const mapInitializedRef = useRef(false)
  const FIXED_ZOOM_LEVEL = 17
  const isMobileRef = useRef(false)
  const plotLayersRef = useRef({})
  // Add the plot label refs
  const plotLabelRefs = useRef({})
  const mapRef = useRef(null)
  const pendingTimeouts = useRef([])

  // Check if we're on mobile
  const checkMobile = useCallback(() => {
    isMobileRef.current = window.innerWidth < 768
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [checkMobile])

  // This effect will run when the map is ready or when mapData changes
  useEffect(() => {
    // Store the plotLayersRef in the map object for external access
    map.plotLayersRef = plotLayersRef

    // Clear existing labels before creating new ones
    Object.values(plotLabelRefs.current).forEach(m => map.removeLayer(m))
    plotLabelRefs.current = {}

    // Add the base layer immediately
    if (!baseLayerRef.current) {
      const loadBaseLayer = async () => {
        try {
          // Load GeoJSON data from the public directory with retry logic
          const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
            try {
              const response = await fetch(url)
              if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
              return await response.json()
            } catch (error) {
              if (retries <= 0) throw error
              await new Promise((resolve) => setTimeout(resolve, delay))
              return fetchWithRetry(url, retries - 1, delay * 1.5)
            }
          }

          const geojsonData = await fetchWithRetry("/data/data.geojson")

          // Create a GeoJSON layer
          const geojsonLayer = L.geoJSON(geojsonData, {
            style: {
              color: "#000000",
              weight: 0.5,
              opacity: 0.3,
            },
            interactive: false,
          })

          // Add GeoJSON layer to the map as the base layer
          baseLayerRef.current = geojsonLayer
          baseLayerRef.current.addTo(map)
          baseLayerRef.current.bringToBack()

          // On initial load, fit to the GeoJSON bounds
          if (initialLoadRef.current) {
            initialLoadRef.current = false
          }
        } catch (error) {}
      }

      // Execute the async function
      loadBaseLayer()
    }

    if (!mapData) {
      return
    }

    // Clear existing GeoJSON layers if they exist
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.clearLayers()
      map.removeLayer(geoJsonLayerRef.current)
    }

    // Create a new layer group
    geoJsonLayerRef.current = L.layerGroup().addTo(map)

    // Filter the features based on active filters
    const filteredFeatures = mapData.features.filter((feature) => {
      if (!feature.properties) return false

      const plotCategory = feature.properties.CATEGORY?.toLowerCase() || ""
      const plotPhase = feature.properties.PHASE?.toString() || ""

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

      return true
    })

    // Close any open popups if the active popup's polygon is no longer visible due to filter changes
    if (activePopup) {
      // Check if the active popup's polygon is still visible after filtering
      const popupPolygonVisible = filteredFeatures.some(
        (feature) =>
          feature.properties &&
          (feature.properties.id === activePopup.id || feature.properties.GIS_UID === activePopup.GIS_UID),
      )

      // If the polygon is no longer visible, close the popup
      if (!popupPolygonVisible) {
        setActivePopup(null)
        setShowMobilePopup(false)
      }
    }

    // Create a bounds object to fit the map to the features
    const bounds = L.latLngBounds([])
    let hasValidFeatures = false

    // Process each feature
    filteredFeatures.forEach((feature) => {
      if (!feature.geometry || !feature.geometry.coordinates) {
        return
      }

      try {
        // Create a GeoJSON feature
        const geoJsonFeature = {
          type: "Feature",
          properties: feature.properties,
          geometry: feature.geometry,
        }

        // Define the style for this feature
        const style = plotStyle(feature, selectedPlots, pingedPlots)

        // Add the feature to the map
        const layer = L.geoJSON(geoJsonFeature, {
          style: style,
          clipPath: false,
          renderer: rendererForPlatform,
          onEachFeature: (feature, layer) => {
            // Skip if feature or properties is undefined
            if (!feature || !feature.properties) return

            // Store a reference to this layer by plot ID
            if (feature.properties.id) {
              plotLayersRef.current[feature.properties.id] = layer
            }
            if (feature.properties.GIS_UID) {
              plotLayersRef.current[feature.properties.GIS_UID] = layer
            }

            // Add plot number label
            const centre = findPolygonCenter(feature.geometry)
            if (centre) {
              const plotId = feature.properties.id || feature.properties.GIS_UID
              const lbl = L.marker(centre, {
                icon: L.divIcon({
                  html: `<span class="plot-label">${feature.properties.PLOT_NO || feature.properties.plot_no}</span>`,
                  className: "plot-label-container",
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                }),
                interactive: false,
              })
              plotLabelRefs.current[plotId] = lbl
              // Do not add to map here; syncLabels will handle it
            }

            layer.on({
              click: (e) => {
                const status =
                  feature.properties.PLOT_STATU || feature.properties.NEW_PLOT_S || feature.properties.status
                const isSold = status === "allotted" || status === "Sold" || status === "Reserved"
                const isBidding = status === "bidding"
                const plotType = feature.properties.CATEGORY || feature.properties.category || "unknown"

                // Create a more complete plot object with all available properties
                const plot = {
                  id:
                    feature.properties.id ||
                    feature.properties.GIS_UID ||
                    `unknown-${Math.random().toString(36).substr(2, 9)}`,
                  plot_no: feature.properties.PLOT_NO || feature.properties.plot_no || "Unknown",
                  sector: feature.properties.SECTOR || feature.properties.sector || "Unknown",
                  phase: feature.properties.PHASE || feature.properties.phase || "Unknown",
                  size: feature.properties.SIZE || feature.properties.size || "Unknown",
                  category: plotType.charAt(0).toUpperCase() + plotType.slice(1),
                  type: plotType,
                  base_price: feature.properties.base_price || feature.properties.PRICE || 0,
                  token_amount: feature.properties.token_amount || 10,
                  status: isSold ? "Sold" : isBidding ? "Bidding" : feature.properties.status || "Available",
                  street_no: feature.properties.STREET_NO || feature.properties.street_no || "Unknown",
                  dimension: feature.properties.dimension || "Unknown",
                  st_asgeojson: feature.properties.st_asgeojson || null,
                  remarks: feature.properties.remarks || null, // Add the remarks field
                }

                // Check if this plot is already selected
                const isAlreadySelected = selectedPlots.some((p) => p.id === plot.id)

                // Toggle selection
                onPlotSelect(plot)

                // If the plot was already selected and is now being unselected, close the popup
                if (isAlreadySelected) {
                  setActivePopup(null)
                  setShowMobilePopup(false)
                } else {
                  // Find the center of the polygon for better popup positioning
                  const polygonCenter = findPolygonCenter(feature.geometry)

                  // Otherwise, show the popup for the newly selected plot
                  const popupData = {
                    ...feature.properties,
                    ...plot, // Include all plot data in the popup
                    geometry: feature.geometry,
                    isSelected: true,
                    isSold: isSold,
                    isBidding: isBidding,
                    plotType: plotType,
                    // Use polygon center for popup position
                    polygonCenter: polygonCenter,
                  }

                  setActivePopup(popupData)

                  // On mobile, show the custom popup instead of the Leaflet popup
                  if (isMobileRef.current) {
                    setShowMobilePopup(true)
                  }
                }

                // Prevent click from propagating to the map
                L.DomEvent.stopPropagation(e)
              },
            })
          },
        }).addTo(geoJsonLayerRef.current)

        // Try to extend the bounds with this feature
        try {
          if (feature.geometry.type === "MultiPolygon" && feature.geometry.coordinates[0][0].length > 0) {
            // For MultiPolygon, get the coordinates
            const coords = feature.geometry.coordinates[0][0]
            coords.forEach((coord) => {
              if (Array.isArray(coord) && coord.length >= 2) {
                bounds.extend([coord[1], coord[0]])
                hasValidFeatures = true
              }
            })
          }
        } catch (boundsError) {}
      } catch (featureError) {}
    })

    // Fit the map to the bounds if we have valid features and not on initial load
    if (hasValidFeatures && !initialLoadRef.current) {
      // Do nothing - removed zoom functionality
    }

    // Add label sync function
    const syncLabels = () => {
      const show = map.getZoom() >= PLOT_LABEL_MIN_ZOOM;
      map.eachLayer(layer => {
        // Only process GeoJSON layers representing plots
        if (layer.feature && layer.feature.properties) {
          const feature = layer.feature;
          const plotId = feature.properties.id || feature.properties.GIS_UID;
          const centre = findPolygonCenter(feature.geometry);
          let lbl = plotLabelRefs.current[plotId];
          if (show && !lbl && centre) {
            // Create and add label if missing
            lbl = L.marker(centre, {
              icon: L.divIcon({
                html: `<span class="plot-label">${feature.properties.PLOT_NO || feature.properties.plot_no}</span>`,
                className: "plot-label-container",
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              }),
              interactive: false,
            });
            plotLabelRefs.current[plotId] = lbl;
            lbl.addTo(map);
          } else if (lbl) {
            const visible = map.hasLayer(lbl);
            if (show && !visible) lbl.addTo(map);
            if (!show && visible) map.removeLayer(lbl);
          }
        }
      });
    };

    // Initial sync
    syncLabels()

    // Add zoom event listener
    map.on("zoomend", syncLabels)

    // Set up a click handler to close popups and clear selection
    map.on("click", () => {
      setActivePopup(null)
      setShowMobilePopup(false)
      // if (selectedPlots.length > 0) {
      //   onPlotSelect(selectedPlots[0])
      // }
    })

    // Only fit bounds to all filtered plots if no plot is selected
    if (
      typeof window !== 'undefined' &&
      filteredFeatures.length > 0 &&
      (!selectedPlots || selectedPlots.length === 0)
    ) {
      setTimeout(() => {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: true });
      }, 200);
    }

    return () => {
      // Clean up when component unmounts
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current)
      }
      map.off("click")
      map.off("zoomend", syncLabels)
      // Clean up labels
      Object.values(plotLabelRefs.current).forEach(m => map.removeLayer(m))
      // Clear any pending timeouts
      pendingTimeouts.current.forEach(clearTimeout)
      pendingTimeouts.current = []
    }
  }, [map, mapData, selectedPlots, activeFilters, onPlotSelect, pingedPlots])

  // Add this new effect to handle map movement
  useEffect(() => {
    if (!map || !geoJsonLayerRef.current) return

    // Function to redraw layers when map moves
    const handleMapMove = () => {
      if (geoJsonLayerRef.current) {
        // Force redraw of all layers
        geoJsonLayerRef.current.eachLayer((layer) => {
          if (layer.redraw) {
            layer.redraw()
          }
        })
      }
    }

    // Add event listeners for map movement
    map.on("moveend", handleMapMove)
    map.on("zoomend", handleMapMove)

    return () => {
      // Clean up event listeners
      map.off("moveend", handleMapMove)
      map.off("zoomend", handleMapMove)
    }
  }, [map])

  // Handle popup close - also clear selection
  const handlePopupClose = () => {
    setActivePopup(null)
    setShowMobilePopup(false)
    // Do not clear the selection when closing the popup
    // if (selectedPlots.length > 0) {
    //   onPlotSelect(selectedPlots[0])
    // }
  }

  // Expose the popup state to the map instance for external control
  useEffect(() => {
    if (map) {
      // Add a custom method to close popups programmatically
      map.closePopup = () => {
        setActivePopup(null)
        setShowMobilePopup(false)
      }

      // Add a custom method to show popups programmatically
      map.showPopupForPlot = (plot) => {
        if (!plot) return
        // Find the feature for this plot
        const plotId = plot.id
        const plotLayer = plotLayersRef.current[plotId]
        if (plotLayer) {
          // Trigger the click event on the layer
          plotLayer.fire("click")
        } else {
          // If we can't find the layer, create a popup manually
          const status = plot.status
          const isSold = status === "sold"
          const isBidding = status === "bidding"
          const popupData = {
            PLOT_NO: plot.plot_no || plot.name.replace("Plot ", ""),
            CATEGORY: plot.type.charAt(0).toUpperCase() + plot.type.slice(1),
            PHASE: plot.block,
            SECTOR: plot.sector,
            SIZE: plot.size,
            isSelected: true,
            isSold: isSold,
            isBidding: isBidding,
            plotType: plot.type,
          }
          setActivePopup(popupData)
          // On mobile, show the custom popup
          if (isMobileRef.current) {
            setShowMobilePopup(true)
          }
        }
      }

      // Add a custom method to zoom to a plot programmatically
      map.zoomToPlot = (plot) => {
        if (!plot) return;
        if (plot.st_asgeojson) {
          const geometry = parseGeoJSON(plot.st_asgeojson);
          if (geometry && geometry.coordinates) {
            const tempLayer = L.geoJSON({
              type: "Feature",
              geometry: geometry,
            });
            const bounds = tempLayer.getBounds();
            map.fitBounds(bounds, { maxZoom: 19, animate: true });
            // Optionally remove the tempLayer if you add it to the map
          }
        }
      }
    }
  }, [map])

  // Add this to the useEffect that handles dynamic styles
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      /* Plot label styles */
      .plot-label-container {
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        width: 100%;
        height: 100%;
      }
      .plot-label {
        font-weight: 700;
        text-shadow: 0 0 2px #fff;
        pointer-events: none;
        font-size: 12px;
      }
      /* Font size per zoom level */
      .leaflet-zoom-level-19 .plot-label { font-size: 12px }
      .leaflet-zoom-level-18 .plot-label { font-size: 11px }
      .leaflet-zoom-level-17 .plot-label { font-size: 10px }
      .leaflet-zoom-level-16 .plot-label { font-size: 9px }
      .leaflet-zoom-level-15 .plot-label { font-size: 0 }
      .leaflet-zoom-level-14 .plot-label { font-size: 0 }
      .leaflet-zoom-level-13 .plot-label { font-size: 0 }
      .leaflet-zoom-level-12 .plot-label { font-size: 0 }
      .leaflet-zoom-level-11 .plot-label { font-size: 0 }
      .leaflet-zoom-level-10 .plot-label { font-size: 0 }
      .leaflet-zoom-level-9 .plot-label { font-size: 0 }
      .leaflet-zoom-level-8 .plot-label { font-size: 0 }
      .leaflet-zoom-level-7 .plot-label { font-size: 0 }
      .leaflet-zoom-level-6 .plot-label { font-size: 0 }
      .leaflet-zoom-level-5 .plot-label { font-size: 0 }
      .leaflet-zoom-level-4 .plot-label { font-size: 0 }
      .leaflet-zoom-level-3 .plot-label { font-size: 0 }
      .leaflet-zoom-level-2 .plot-label { font-size: 0 }
      .leaflet-zoom-level-1 .plot-label { font-size: 0 }
      .leaflet-zoom-level-0 .plot-label { font-size: 0 }

      /* Base styles for all plots */
      .plot-polygon {
        stroke-linejoin: round;
        stroke-linecap: round;
        paint-order: fill; /* default (low zoom) */
      }

      /* High zoom levels - stroke on top */
      .leaflet-zoom-level-15 .plot-polygon,
      .leaflet-zoom-level-16 .plot-polygon,
      .leaflet-zoom-level-17 .plot-polygon,
      .leaflet-zoom-level-18 .plot-polygon,
      .leaflet-zoom-level-19 .plot-polygon {
        paint-order: stroke;
      }

      /* Thin, semi-transparent outline when far away */
      .leaflet-zoom-level-14 .plot-polygon,
      .leaflet-zoom-level-13 .plot-polygon,
      .leaflet-zoom-level-12 .plot-polygon,
      .leaflet-zoom-level-11 .plot-polygon,
      .leaflet-zoom-level-10 .plot-polygon,
      .leaflet-zoom-level-9 .plot-polygon {
        stroke-width: 0.5px !important;
        stroke-opacity: 0.6 !important;
      }

      /* Enhanced commercial plot style */
      .plot-commercial-pulse {
        stroke: #000000;
        stroke-width: 1px;
        animation: commercialPulse 2s infinite;
        filter: drop-shadow(0 0 3px #F59E0B);
      }

      /* Enhanced residential plot style */
      .plot-residential-pulse {
        stroke: #000000;
        stroke-width: 1px;
        animation: residentialPulse 2s infinite;
        filter: drop-shadow(0 0 3px #F59E0B);
      }

      /* Enhanced selected plot style */
      .plot-selected-pulse {
        stroke: #000000;
        stroke-width: 2px;
        animation: selectedPulse 1.5s infinite;
        filter: drop-shadow(0 0 5px #F59E0B);
      }

      /* Zoom level specific adjustments */
      /* At very low zoom levels (far out), make the effect even stronger */
      .leaflet-zoom-level-9 .plot-commercial-pulse,
      .leaflet-zoom-level-10 .plot-commercial-pulse,
      .leaflet-zoom-level-11 .plot-commercial-pulse,
      .leaflet-zoom-level-9 .plot-residential-pulse,
      .leaflet-zoom-level-10 .plot-residential-pulse,
      .leaflet-zoom-level-11 .plot-residential-pulse {
        stroke-width: 2px;
      }

      /* Disable pulse animations on touch devices */
      @media (pointer: coarse) {
        .plot-commercial-pulse,
        .plot-residential-pulse,
        .plot-selected-pulse {
          animation: none !important;
          filter: none !important;
        }
      }

      /* At medium zoom levels, keep standard effect */
      .leaflet-zoom-level-12 .plot-commercial-pulse,
      .leaflet-zoom-level-13 .plot-commercial-pulse,
      .leaflet-zoom-level-14 .plot-commercial-pulse,
      .leaflet-zoom-level-12 .plot-residential-pulse,
      .leaflet-zoom-level-13 .plot-residential-pulse,
      .leaflet-zoom-level-14 .plot-residential-pulse {
        stroke-width: 2px;
        animation-duration: 2s;
        filter: drop-shadow(0 0 5px #F59E0B);
      }

      /* At high zoom levels (close up), enhance the boundary visibility */
      .leaflet-zoom-level-15 .plot-commercial-pulse,
      .leaflet-zoom-level-16 .plot-commercial-pulse,
      .leaflet-zoom-level-17 .plot-commercial-pulse,
      .leaflet-zoom-level-18 .plot-commercial-pulse,
      .leaflet-zoom-level-19 .plot-commercial-pulse,
      .leaflet-zoom-level-15 .plot-residential-pulse,
      .leaflet-zoom-level-16 .plot-residential-pulse,
      .leaflet-zoom-level-17 .plot-residential-pulse,
      .leaflet-zoom-level-18 .plot-residential-pulse,
      .leaflet-zoom-level-19 .plot-residential-pulse {
        stroke-width: 3px;
        stroke-opacity: 1;
        filter: drop-shadow(0 0 2px #F59E0B);
      }

      /* Keep the selected pulse effect at all zoom levels */
      .leaflet-zoom-level-15 .plot-selected-pulse,
      .leaflet-zoom-level-16 .plot-selected-pulse,
      .leaflet-zoom-level-17 .plot-selected-pulse,
      .leaflet-zoom-level-18 .plot-selected-pulse,
      .leaflet-zoom-level-19 .plot-selected-pulse {
        animation: selectedPulse 2s infinite;
        animation-duration: 3s;
        stroke-width: 3.5px;
        filter: drop-shadow(0 0 3px #F59E0B);
      }

      /* --- PING EFFECT --- */
      .plot-ping-commercial::after, .plot-ping-residential::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 40px;
        height: 40px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.7;
        z-index: 10;
        animation: plotPing 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .plot-ping-commercial::after {
        background: rgba(37, 99, 235, 0.4); /* blue */
      }
      .plot-ping-residential::after {
        background: rgba(245, 158, 11, 0.4); /* yellow */
      }
      @keyframes plotPing {
        0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.7); }
        70% { opacity: 0.3; transform: translate(-50%, -50%) scale(1.5); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Render the popup if we have an active one
  return (
    <>
      {/* For desktop, use Leaflet's Popup component */}
      {activePopup && activePopup.geometry && !isMobileRef.current ? (
        <Popup
          position={
            // Use the polygon center for positioning
            activePopup.polygonCenter ||
            // Fallback to first coordinate if center calculation failed
            (activePopup.geometry.type === "MultiPolygon" && activePopup.geometry.coordinates[0][0].length > 0
              ? [activePopup.geometry.coordinates[0][0][0][1], activePopup.geometry.coordinates[0][0][0][0]]
              : islamabadCoordinates.center)
          }
          closeButton={false}
          closeOnClick={false}
          className="custom-popup"
          // Enable autoPan to ensure the popup is visible
          autoPan={true}
          // Use different offsets for mobile and desktop
          offset={[0, 0]}
          // Add these additional props to improve mobile positioning
          autoPanPadding={[50, 50]}
          keepInView={true}
        >
          <PlotPopupComponent properties={activePopup} onClose={handlePopupClose} />
        </Popup>
      ) : null}

      {/* For mobile, use our custom popup component */}
      {showMobilePopup && activePopup && isMobileRef.current && (
        <MobilePopup properties={activePopup} onClose={handlePopupClose} />
      )}
    </>
  )
}

// Popup component
function PlotPopup({ properties, onClose }) {
  if (!properties) return null

  const status = properties.isSelected
    ? "Selected"
    : properties.isSold
      ? "Sold"
      : properties.isBidding
        ? "Bidding"
        : properties.status || "Available"

  const statusColor = properties.isSelected
    ? "bg-blue-100 text-blue-800"
    : properties.isSold
      ? "bg-red-100 text-red-800"
      : properties.isBidding
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-800"

  const category = properties.CATEGORY || properties.category || ""
  const remarks = properties.remarks && properties.remarks !== "NULL" ? properties.remarks : null
  const displayCategory = remarks ? `${category} (${remarks})` : category
  const typeColor = category.toLowerCase() === "commercial" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

  // Use actual price from properties
  const price = properties.base_price ? Number(properties.base_price).toLocaleString() : "N/A"

  // Determine which payment plan to show
  let paymentPlanUrl = null
  if (
    properties.PHASE === "4" &&
    properties.SECTOR === "RVN" &&
    (properties.CATEGORY?.toLowerCase() === "residential" || properties.category?.toLowerCase() === "residential")
  ) {
    paymentPlanUrl = "/images/payment_plan_rvn.jpg"
  } else if (
    properties.PHASE === "6" &&
    properties.SECTOR === "B3" &&
    (properties.CATEGORY?.toLowerCase() === "residential" || properties.category?.toLowerCase() === "residential")
  ) {
    paymentPlanUrl = "/images/payment_plan_b3.jpg"
  }

  return (
    <div className="relative bg-white rounded-md shadow-lg w-[180px] mobile-popup">
      {/* Header with plot number and close button */}
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-bold text-sm">Plot {properties.PLOT_NO || properties.plot_no}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 ml-1 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            if (onClose) onClose()
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Badges */}
      <div className="flex justify-between px-2 py-1">
        <Badge className={`${typeColor} text-[10px] px-1 py-0 h-4`}>{displayCategory}</Badge>
        <Badge className={`${statusColor} text-[10px] px-1 py-0 h-4`}>{status}</Badge>
      </div>

      {/* Compact info */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-2 py-1 text-xs">
        <div>
          <span className="text-gray-500">Phase:</span> {properties.PHASE || properties.phase || "N/A"}
        </div>
        <div>
          <span className="text-gray-500">Sector:</span> {properties.SECTOR || properties.sector || "N/A"}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Street:</span> {properties.STREET_NO || properties.street_no || "N/A"}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Size:</span> {properties.SIZE || properties.size || "N/A"}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">
            {properties.category === "Commercial" ? "Reserve Price" : "Lump Sum Price"}
          </span>{" "}
          {Number(properties.base_price).toLocaleString()}
        </div>
      </div>

      {/* Payment plan link */}
      {paymentPlanUrl && (
        <div className="p-2 pt-1">
          <a
            href={paymentPlanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => {
              e.preventDefault()
              // Close the popup first
              if (onClose) onClose()
              // Then open the payment plan in a new window
              openPaymentPlan(paymentPlanUrl)
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            View Payment Plan
          </a>
        </div>
      )}
    </div>
  )
}

// Find the MapControls component and update its positioning
// Around line 1000-1020, replace the MapControls component with this updated version:

function MapControls({ showAmenities, setShowAmenities }) {
  const map = useMap()

  // Function to zoom to all phases
  const zoomToAllPhases = () => {
    // Create a Leaflet bounds object with the specified coordinates
    const allPhasesBounds = L.latLngBounds(
      [33.464901, 73.054898], // Southwest corner (min lat, min lng)
      [33.591134, 73.36507], // Northeast corner (max lat, max lng)
    )

    // Fit the map to these bounds with some padding
    map.fitBounds(allPhasesBounds, {
      padding: [50, 50],
      maxZoom: 12,
      animate: true,
    })
  }

  return (
    <div className="absolute z-[2000]" style={{ bottom: "120px", right: "10px" }}>
      <div className="flex flex-col gap-2">
        {/* All Phases button for desktop */}
        <Button variant="outline" size="sm" className="bg-white shadow-lg p-1 text-xs" onClick={zoomToAllPhases}>
          All Phases
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg h-10 w-10 p-0"
          onClick={() => {
            if (map.getZoom() < map.getMaxZoom()) map.zoomIn();
          }}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="bg-white shadow-lg h-10 w-10 p-0" onClick={() => map.zoomOut()}>
          <span className="text-xl font-bold">−</span>
        </Button>
        {/* Pass amenities toggle to BasemapSwitcher */}
        <BasemapSwitcher showAmenities={showAmenities} setShowAmenities={setShowAmenities} />
      </div>
    </div>
  )
}

// Now update the MapLegend component to match the new colors and remove unnecessary items
// Find the MapLegend function (around line 1030-1050) and replace it with:

function MapLegend() {
  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg p-2 z-[2000] max-w-[140px]"
      style={{ bottom: "120px", left: "10px" }}
    >
      <h4 className="font-semibold mb-1 text-xs">Map Legend</h4>
      <div className="flex items-center mb-1">
        <div className="w-3 h-3 bg-[#2563EB] mr-1.5 rounded-sm"></div>
        <span className="text-xs">Commercial</span>
      </div>
      <div className="flex items-center mb-1">
        <div className="w-3 h-3 bg-[#F59E0B] mr-1.5 rounded-sm"></div>
        <span className="text-xs">Residential</span>
      </div>
    </div>
  )
}

// Add this new PhaseLabels component after the MapLegend component (around line 1050)

function PhaseLabels() {
  const map = useMap()
  const [currentZoom, setCurrentZoom] = useState(map.getZoom())
  const labelRef = useRef({})

  // Define the center points and bounds for each phase
  const phaseData = {
    1: {
      center: [33.539083, 73.101028],
      bounds: {
        southWest: [33.522675, 73.084847],
        northEast: [33.555491, 73.11721],
      },
    },
    2: {
      center: [33.526127, 73.156119],
      bounds: {
        southWest: [33.509562, 73.128907],
        northEast: [33.542692, 73.183331],
      },
    },
    3: {
      center: [33.490707, 73.157588],
      bounds: {
        southWest: [33.463783, 73.11683],
        northEast: [33.517631, 73.198346],
      },
    },
    4: {
      center: [33.519914, 73.072962],
      bounds: {
        southWest: [33.471374, 72.989226],
        northEast: [33.531711, 73.089317],
      },
    },
    5: {
      center: [33.522877, 73.209463],
      bounds: {
        southWest: [33.500307, 73.181263],
        northEast: [33.545447, 73.237663],
      },
    },
    6: {
      center: [33.556816, 73.282796],
      bounds: {
        southWest: [33.522786, 73.226116],
        northEast: [33.590846, 73.339476],
      },
    },
    7: {
      center: [33.510744, 73.301907],
      bounds: {
        southWest: [33.471093, 73.238744],
        northEast: [33.550395, 73.36507],
      },
    },
    '4_RVS': {
      center: [33.4839, 72.9988],
      // bounds: Add if needed
    },
    '4_RVN': {
      center: [33.4952, 73.0267],
      // bounds: Add if needed
    },
  }

  // Add CSS for phase labels (ensure correct style)
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .phase-label-container {
        background: transparent;
      }
      .phase-label {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .phase-label-inner {
        background: none !important;
        color: #fff !important;
        font-weight: 900 !important;
        font-size: 1rem !important;
        text-shadow:
          2px 2px 6px #000,
          -2px -2px 6px #000,
          2px -2px 6px #000,
          -2px 2px 6px #000,
          0 0 10px #000;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        white-space: nowrap;
        text-align: center;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Update zoom level when map zooms
  useEffect(() => {
    const updateZoom = () => {
      setCurrentZoom(map.getZoom())
    }
    map.on("zoomend", updateZoom)
    return () => {
      map.off("zoomend", updateZoom)
    }
  }, [map])

  // Create and manage the phase labels
  useEffect(() => {
    // Create labels for each phase
    Object.entries(phaseData).forEach(([phase, data]) => {
      // Create a div element for the label
      const labelDiv = document.createElement("div")
      labelDiv.className = "phase-label"
      // Use correct inner HTML structure
      labelDiv.innerHTML = `<div class=\"phase-label-inner\">Phase ${phase}</div>`

      // Create the label as a Leaflet DivIcon
      const icon = L.divIcon({
        className: "phase-label-container",
        html: labelDiv,
        iconSize: [100, 40],
        iconAnchor: [50, 20],
      })

      // Create a marker with the label
      const marker = L.marker(data.center, {
        icon: icon,
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map)

      // Store the marker reference
      labelRef.current[phase] = marker
    })

    // Cleanup function
    return () => {
      Object.values(labelRef.current).forEach((marker) => {
        if (marker) map.removeLayer(marker)
      })
    }
  }, [map])

  // Show/hide labels based on zoom level
  useEffect(() => {
    const showLabels = currentZoom < 13
    Object.entries(labelRef.current).forEach(([phase, marker]) => {
      if (marker) {
        const labelElement = marker.getElement()
        if (labelElement) {
          if (showLabels) {
            labelElement.style.display = "block"
          } else {
            labelElement.style.display = "none"
          }
        }
      }
    })
  }, [currentZoom])

  return null
}

// Map fixer component
function MapFixer({ onMapReady }) {
  const map = useMap()
  const initialLoadRef = useRef(true)

  useEffect(() => {
    // Initial map setup
    const initializeMap = () => {
      console.log("Initializing map with professional handling")

      // Force a resize event to ensure proper initialization
      window.dispatchEvent(new Event('resize'))

      // Use a more robust invalidation approach with multiple attempts
      const invalidateMap = () => {
        map.invalidateSize({
          animate: false,
          pan: false,
          debounceMoveend: false,
          noMoveStart: true,
        })
      }

      // Try multiple times to ensure the map is properly sized
      invalidateMap()
      setTimeout(invalidateMap, 100)
      setTimeout(invalidateMap, 500)

      // Only fit to initial bounds if this is the first load and no phase filter is active
      if (window.initialMapBounds && initialLoadRef.current && !window.phaseFilterActive) {
        console.log("Fitting map to initial bounds of all phases")
        map.fitBounds(window.initialMapBounds, {
          padding: [50, 50],
          maxZoom: 12,
          animate: false,
        })
      }

      // Mark that initial load is complete
      initialLoadRef.current = false

      // Add zoomToPlot method to map instance
      map.zoomToPlot = (plot) => {
        console.log("Zooming to plot:", plot)

        // Try to find the plot in the API data
        if (plot.id) {
          console.log("Looking for plot with ID:", plot.id)

          // Check all possible ID formats
          const possibleIds = [plot.id, `plot-${plot.id}`, plot.plotId]

          // Log all available layers for debugging
          console.log("Available plot layers:", Object.keys(map.plotLayersRef.current))

          // Try to find the layer using any of the possible IDs
          let plotLayer = null
          for (const id of possibleIds) {
            if (map.plotLayersRef.current[id]) {
              plotLayer = map.plotLayersRef.current[id]
              console.log(`Found plot layer with ID: ${id}`)
              break
            }
          }

          if (plotLayer) {
            // Get the bounds of the plot
            const bounds = plotLayer.getBounds()
            console.log("Plot bounds:", bounds)

            // Zoom to the bounds with some padding
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 18,
              animate: true,
            })

            // Open popup for this feature
            setTimeout(() => {
              console.log("Triggering click event on plot layer")
              plotLayer.fire("click")
            }, 500)
          } else {
            console.warn("Plot layer not found for ID:", plot.id)

            // If we have the st_asgeojson data, try to use that
            if (plot.st_asgeojson) {
              console.log("Using st_asgeojson data to zoom to plot")
              const geometry = parseGeoJSON(plot.st_asgeojson)

              if (geometry && geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
                // Create a temporary layer for the plot
                const tempLayer = L.geoJSON({
                  type: "Feature",
                  geometry: geometry,
                })

                // Zoom to the bounds of the temporary layer
                const bounds = tempLayer.getBounds()
                map.fitBounds(bounds, {
                  padding: [50, 50],
                  maxZoom: 18,
                  animate: true,
                })

                // Don't add the temporary layer to the map
              }
            }
          }
        }
      }

      // Add zoom level class to map container for CSS targeting
      const updateZoomClass = () => {
        const zoomLevel = map.getZoom()
        const container = map.getContainer()

        // Remove all zoom level classes
        for (let i = 0; i <= 19; i++) {
          container.classList.remove(`leaflet-zoom-level-${i}`)
        }

        // Add current zoom level class
        container.classList.add(`leaflet-zoom-level-${zoomLevel}`)
      }

      // Call initially and on zoom events
      updateZoomClass()
      map.on("zoomend", updateZoomClass)

      if (onMapReady) {
        onMapReady(map)
      }
    }

    // Initial setup with slight delay to ensure DOM is ready
    setTimeout(initializeMap, 100)

    // Handle window resize events
    const handleResize = () => {
      // Invalidate size without animation
      map.invalidateSize({
        animate: false,
        pan: false,
        debounceMoveend: false,
        noMoveStart: true,
      })
    }

    // Debounce the resize handler to prevent multiple rapid calls
    let resizeTimeout
    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 100)
    }

    window.addEventListener("resize", debouncedResize)

    return () => {
      window.removeEventListener("resize", debouncedResize)
      clearTimeout(resizeTimeout)
    }
  }, [map, onMapReady])

  return null
}

// Update the MapContainer component to store a reference to whether a phase filter is active
// Around line 1100-1130, modify the MapContainer component:

// Main MapContainer
export default function MapContainerComponent({
  mapData,
  selectedPlots,
  onPlotSelect,
  activeFilters,
  onMapReady,
  isLoading,
}) {
  // Fix Leaflet icon issues
  useEffect(() => {
    // Fix Leaflet icon issues
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    })

    // Store whether a phase filter is active
    window.phaseFilterActive = activeFilters && activeFilters.phase && activeFilters.phase !== ""
  }, [activeFilters])

  // Get initial map center
  const getMapCenter = () => {
    // Define bounds that encompass all phases
    const allPhasesBounds = L.latLngBounds(
      [33.463783, 73.053932], // Southwest corner (min lat, min lng)
      [33.590846, 73.36507], // Northeast corner (max lat, max lng)
    )

    // Store the bounds for use in the MapFixer component
    window.initialMapBounds = allPhasesBounds

    // Return the center of all phases, but move a little to the right (increase longitude by ~0.01)
    const center = allPhasesBounds.getCenter()
    return [center.lat, center.lng + 0.01]
  }

  // Add showAmenities state at the top level
  const [showAmenities, setShowAmenities] = useState(true)
  // Add pingedPlots state
  const [pingedPlots, setPingedPlots] = useState([])

  // 3. Listen for plot type filter changes and trigger ping
  useEffect(() => {
    if (!mapData || !activeFilters || !activeFilters.plotType) return
    const selectedType = Object.keys(activeFilters.plotType).find((k) => activeFilters.plotType[k])
    if (!selectedType) return
    // Find all visible plots of this type
    const plotIds = mapData.features
      .filter(f => f.properties && (f.properties.CATEGORY?.toLowerCase() === selectedType.toLowerCase()))
      .map(f => f.properties.id || f.properties.GIS_UID)
    if (plotIds.length > 0) {
      setPingedPlots(plotIds)
      // Remove ping after 1s
      const timeout = setTimeout(() => setPingedPlots([]), 1000)
      return () => clearTimeout(timeout)
    }
  }, [mapData, activeFilters?.plotType])

  // Show loading state if data is still loading
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg">Loading map data...</p>
      </div>
    )
  }

  // Update the MapContainer component to ensure the controls are in the correct order
  return (
    <MapContainer
      center={getMapCenter()}
      zoom={11.5} // Slightly higher zoom for better default view
      style={{ height: "100%", width: "100%" }}
      className="z-10 map-container"
      zoomControl={false}
      preferCanvas={isIOS ? true : false} // Use SVG renderer to prevent clipping issues
      renderer={L.svg({ padding: 100 })} // Add padding to prevent clipping
      fadeAnimation={false} // Disable fade animation for better performance
      markerZoomAnimation={false} // Disable marker zoom animation for better performance
      maxZoom={MAX_MAP_ZOOM}
    >
      {/* Add our custom components */}
      <MapControls showAmenities={showAmenities} setShowAmenities={setShowAmenities} />
      <GeoJSONLayer
        mapData={mapData}
        selectedPlots={selectedPlots}
        onPlotSelect={onPlotSelect}
        activeFilters={activeFilters}
        pingedPlots={pingedPlots}
      />
      {/* Always show PhaseBoundaries */}
      <PhaseBoundaries />
      {/* Only show AmenitiesLayer if showAmenities is true */}
      {showAmenities && <AmenitiesLayer />}
      <MapFixer onMapReady={onMapReady} />
      <MapLegend />
      <PhaseLabels />
      {/* Conditionally render only the MBTiles overlay for the selected phase */}
      {activeFilters.phase === '1' && <Phase1TilesOverlay />}
      {activeFilters.phase === '2' && <Phase2TilesOverlay />}
      {activeFilters.phase === '3' && <Phase3TilesOverlay />}
      {activeFilters.phase === '4' && <Phase4TilesOverlay />}
      {activeFilters.phase === '4_gv' && <Phase4GVTilesOverlay />}
      {activeFilters.phase === '4_rvn' && <Phase4RVNTilesOverlay />}
      {activeFilters.phase === '4_rvs' && <Phase4RVSTilesOverlay />}
    </MapContainer>
  )
}

// Add Phase 1 MBTiles overlay component
function Phase1TilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase1Layer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase1/{z}/{x}/{y}.png", {
      attribution: "Phase 1 Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase1Layer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase1Layer.addTo(map);
    return () => {
      map.removeLayer(phase1Layer);
    };
  }, [map]);
  return null;
}

function Phase2TilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase2Layer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase2/{z}/{x}/{y}.png", {
      attribution: "Phase 2 Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase2Layer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase2Layer.addTo(map);
    return () => {
      map.removeLayer(phase2Layer);
    };
  }, [map]);
  return null;
}

function Phase3TilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase3Layer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase3/{z}/{x}/{y}.png", {
      attribution: "Phase 3 Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase3Layer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase3Layer.addTo(map);
    return () => {
      map.removeLayer(phase3Layer);
    };
  }, [map]);
  return null;
}

function Phase4TilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase4Layer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase4/{z}/{x}/{y}.png", {
      attribution: "Phase 4 Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase4Layer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase4Layer.addTo(map);
    return () => {
      map.removeLayer(phase4Layer);
    };
  }, [map]);
  return null;
}

function Phase4GVTilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase4GVLayer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase4_gv/{z}/{x}/{y}.png", {
      attribution: "Phase 4 GV Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase4GVLayer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase4GVLayer.addTo(map);
    return () => {
      map.removeLayer(phase4GVLayer);
    };
  }, [map]);
  return null;
}

function Phase4RVNTilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase4RVNLayer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase4_rvn/{z}/{x}/{y}.png", {
      attribution: "Phase 4 RVN Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase4RVNLayer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase4RVNLayer.addTo(map);
    return () => {
      map.removeLayer(phase4RVNLayer);
    };
  }, [map]);
  return null;
}

function Phase4RVSTilesOverlay() {
  const map = useMap();
  useEffect(() => {
    const phase4RVSLayer = L.tileLayer("https://tiles.dhamarketplace.com/data/phase4_rvs/{z}/{x}/{y}.png", {
      attribution: "Phase 4 RVS Raster Overlay",
      maxZoom: 22,
      opacity: 1,
    });
    phase4RVSLayer.on('tileerror', function(e) {
      if (e && e.tile) {
        e.tile.style.display = 'none';
      }
    });
    phase4RVSLayer.addTo(map);
    return () => {
      map.removeLayer(phase4RVSLayer);
    };
  }, [map]);
  return null;
}
