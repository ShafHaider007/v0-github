import proj4 from "proj4"
import L from "leaflet"

// Define the EPSG:4326 (WGS84) projection - standard lat/lon
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs")

// Define the UTM Zone 43N projection (for Islamabad area)
proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs")

/**
 * Converts coordinates from UTM to WGS84 (latitude/longitude)
 * @param x Easting coordinate
 * @param y Northing coordinate
 * @returns [longitude, latitude] array
 */
export function utmToLatLng(x, y) {
  // Convert from UTM to WGS84 (EPSG:4326)
  const [lon, lat] = proj4("EPSG:32643", "EPSG:4326", [x, y])
  return [lat, lon] // Leaflet uses [lat, lon]
}

/**
 * Creates a Leaflet image overlay from a georeferenced PNG with PGW data
 * @param imageUrl URL of the PNG image
 * @param pgwData Object containing PGW file parameters
 * @returns Leaflet ImageOverlay instance
 */
export function createGeoReferencedImageOverlay(imageUrl, pgwData) {
  // Extract PGW parameters
  const { xScale, yScale, xOrigin, yOrigin } = pgwData

  // Calculate the bounds of the image in UTM coordinates
  // We need to determine the image dimensions
  const img = new Image()
  img.src = imageUrl

  // Default dimensions in case image isn't loaded yet
  let imgWidth = 1000
  let imgHeight = 1000

  // Try to get actual dimensions if possible
  if (img.complete) {
    imgWidth = img.width
    imgHeight = img.height
  }

  // Calculate the UTM coordinates of the corners
  const utmTopLeft = [xOrigin, yOrigin]
  const utmTopRight = [xOrigin + imgWidth * xScale, yOrigin]
  const utmBottomLeft = [xOrigin, yOrigin + imgHeight * yScale]
  const utmBottomRight = [xOrigin + imgWidth * xScale, yOrigin + imgHeight * yScale]

  // Convert to WGS84 (lat/lng)
  const topLeft = utmToLatLng(utmTopLeft[0], utmTopLeft[1])
  const topRight = utmToLatLng(utmTopRight[0], utmTopRight[1])
  const bottomLeft = utmToLatLng(utmBottomLeft[0], utmBottomLeft[1])
  const bottomRight = utmToLatLng(utmBottomRight[0], utmBottomRight[1])

  // Create bounds for the image
  const bounds = L.latLngBounds([topLeft, topRight, bottomLeft, bottomRight])

  // Create and return the image overlay
  return L.imageOverlay(imageUrl, bounds, {
    opacity: 0.8,
    interactive: false,
    zIndex: 50, // Make sure it's below the GeoJSON layers
  })
}

// PGW data for the provided image
export const basemapPgwData = {
  xScale: 2.4257500518,
  yRotation: 0.0,
  xRotation: 0.0,
  yScale: -2.4249164857,
  xOrigin: 325991.8940703166,
  yOrigin: 3713222.0675642807,
}

// Calculate the bounds of the base layer for reference
export const baseLayerBounds = (() => {
  // Create a temporary image to get dimensions
  const img = new Image()
  img.src = "/images/baselayer2.png"

  // Default dimensions
  const imgWidth = 1000
  const imgHeight = 1000

  // Calculate the UTM coordinates of the corners
  const utmTopLeft = [basemapPgwData.xOrigin, basemapPgwData.yOrigin]
  const utmTopRight = [basemapPgwData.xOrigin + imgWidth * basemapPgwData.xScale, basemapPgwData.yOrigin]
  const utmBottomLeft = [basemapPgwData.xOrigin, basemapPgwData.yOrigin + imgHeight * basemapPgwData.yScale]
  const utmBottomRight = [
    basemapPgwData.xOrigin + imgWidth * basemapPgwData.xScale,
    basemapPgwData.yOrigin + imgHeight * basemapPgwData.yScale,
  ]

  // Convert to WGS84 (lat/lng)
  const topLeft = utmToLatLng(utmTopLeft[0], utmTopLeft[1])
  const topRight = utmToLatLng(utmTopRight[0], utmTopRight[1])
  const bottomLeft = utmToLatLng(utmBottomLeft[0], utmBottomLeft[1])
  const bottomRight = utmToLatLng(utmBottomRight[0], utmBottomRight[1])

  // Create bounds for the image
  return L.latLngBounds([topLeft, topRight, bottomLeft, bottomRight])
})()

// Calculate center point for the base layer
export const baseLayerCenter = [
  (baseLayerBounds.getNorth() + baseLayerBounds.getSouth()) / 2,
  (baseLayerBounds.getEast() + baseLayerBounds.getWest()) / 2,
]

// Islamabad coordinates for reference
export const islamabadCoordinates = {
  center: [33.6844, 73.0479],
  zoom: 13,
}

// Convert WGS84 (latitude/longitude) to UTM coordinates
export function latLngToUtm(lat, lng) {
  const [easting, northing] = proj4("EPSG:4326", "EPSG:32643", [lng, lat])
  return { easting, northing }
}

// Calculate distance between two points in meters
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  return d // in meters
}

// Calculate area of a polygon in square meters
export function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length === 0) return 0

  // Ensure coordinates are in the format [[lng, lat], [lng, lat], ...]
  const points = coordinates.map((coord) => {
    return { lng: coord[0], lat: coord[1] }
  })

  let area = 0
  const R = 6371e3 // Earth's radius in meters

  if (points.length < 3) {
    return 0
  }

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const φ1 = (points[i].lat * Math.PI) / 180
    const φ2 = (points[j].lat * Math.PI) / 180
    const λ1 = (points[i].lng * Math.PI) / 180
    const λ2 = (points[j].lng * Math.PI) / 180

    area += (λ2 - λ1) * (2 + Math.sin(φ1) + Math.sin(φ2))
  }

  area = Math.abs((area * R * R) / 2)
  return area // in square meters
}

// Get center point of a polygon
export function getPolygonCenter(coordinates) {
  if (!coordinates || coordinates.length === 0) return { lat: 0, lng: 0 }

  let sumLat = 0
  let sumLng = 0
  let count = 0

  // Handle nested arrays in case of MultiPolygon
  const processCoords = (coords) => {
    if (Array.isArray(coords[0]) && !Array.isArray(coords[0][0])) {
      // Simple polygon [[lng, lat], [lng, lat], ...]
      coords.forEach((coord) => {
        sumLng += coord[0]
        sumLat += coord[1]
        count++
      })
    } else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      // MultiPolygon or Polygon with holes
      coords.forEach((ring) => {
        processCoords(ring)
      })
    }
  }

  processCoords(coordinates)

  if (count === 0) return { lat: 0, lng: 0 }
  return { lat: sumLat / count, lng: sumLng / count }
}
