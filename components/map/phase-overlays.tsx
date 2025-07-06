import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const PHASE_FILES = [
  'Phase1.geojson',
  'Phase2.geojson',
  'Phase3.geojson',
  'Phase4.geojson',
  'Phase4_GV.geojson',
  'Phase4_RVN.geojson',
  'Phase4_RVS.geojson',
  'Phase5.geojson',
  'Phase6.geojson'
]

const phaseStyle: L.PathOptions = {
  color: '#000000',
  weight: 3,
  opacity: 0.8,
  fillColor: '#808080',
  fillOpacity: 0.1,
  dashArray: '6 4'
}

// Define amenity colors with type
type AmenityType = 'Park' | 'Graveyard' | 'Masjid' | 'School' | 'Play Ground' | 'Petrol Pump' | 'Health Facility' | 'Others';

const AMENITY_COLORS: Record<AmenityType, string> = {
  'Park': '#43a047',
  'Graveyard': '#5d4037',
  'Masjid': '#1565c0',
  'School': '#fbc02d',
  'Play Ground': '#e53935',
  'Petrol Pump': '#ff6f00',
  'Health Facility': '#00897b',
  'Others': '#7b1fa2'
}

// Map amenity types to icon filenames
const AMENITY_ICONS: Record<AmenityType, string> = {
  'Park': '/images/amenities/park.png',
  'Graveyard': '/images/amenities/graveyard.png',
  'Masjid': '/images/amenities/masjid.png',
  'School': '/images/amenities/school.png',
  'Play Ground': '/images/amenities/playground.png',
  'Petrol Pump': '/images/amenities/petrol_pump.png',
  'Health Facility': '/images/amenities/health_facility.png',
  'Others': '/images/amenities/others.png',
}

// Helper to get centroid of a polygon (GeoJSON format)
function getPolygonCentroid(coordinates: any): [number, number] {
  // Handles both Polygon and MultiPolygon
  let coords = coordinates
  if (Array.isArray(coords[0][0][0])) {
    // MultiPolygon: use first polygon
    coords = coords[0]
  }
  let x = 0, y = 0, n = 0
  coords[0].forEach((coord: number[]) => {
    x += coord[0]
    y += coord[1]
    n++
  })
  return [x / n, y / n]
}

// Create legend component
function AmenityLegend() {
  const map = useMap()
  const [isMobile, setIsMobile] = useState(false)
  const legendRef = useRef<L.Control | null>(null)

  useEffect(() => {
    // Function to check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)

    const legend = new L.Control({ position: 'bottomleft' })

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend amenity-legend')
      
      // Base styles
      const styles = {
        backgroundColor: 'white',
        padding: isMobile ? '6px' : '10px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        marginBottom: isMobile ? '90px' : '220px', // Reduced margin for mobile
        marginLeft: '10px',
        fontSize: isMobile ? '10px' : '12px',
        maxHeight: isMobile ? '180px' : 'none',
        overflowY: isMobile ? 'auto' : 'visible',
        maxWidth: isMobile ? '120px' : '150px',
        position: 'relative',
        zIndex: '1000'
      }

      // Apply styles
      Object.entries(styles).forEach(([key, value]) => {
        div.style[key as any] = value
      })

      // Add custom class for additional positioning
      div.className = 'info legend amenity-legend' + (isMobile ? ' mobile' : '')

      div.innerHTML = `<h4 style="margin:0 0 5px 0;font-weight:bold;font-size:${isMobile ? '11px' : '13px'}">Amenities</h4>`
      
      Object.entries(AMENITY_COLORS).forEach(([amenity, color]) => {
        const iconUrl = AMENITY_ICONS[amenity as AmenityType] || AMENITY_ICONS['Others'];
        const haloColor = color + '33'; // 20% opacity for halo (hex with alpha)
        div.innerHTML += `
          <div style="display:flex;align-items:center;margin:3px 0">
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              box-shadow: 0 0 8px 2px ${color}55;
              margin-right:5px;
            ">
              <img src='${iconUrl}' alt='${amenity}' style="width:${isMobile ? '16px' : '20px'};height:${isMobile ? '16px' : '20px'};object-fit:contain;display:block;filter:${getColorFilter(color)};" />
            </span>
            <span style="font-size:${isMobile ? '10px' : '12px'}">${amenity}</span>
          </div>
        `
      })

      // Add CSS for better positioning and scrollbar styling
      const style = document.createElement('style')
      style.textContent = `
        .amenity-legend {
          transform: translateY(-20px); /* Move up slightly */
        }
        .amenity-legend.mobile {
          transform: translateY(0px); /* No move up on mobile */
        }
        .amenity-legend::-webkit-scrollbar {
          width: 4px;
        }
        .amenity-legend::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }
        .amenity-legend::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }
        .amenity-legend::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `
      document.head.appendChild(style)

      return div
    }

    legendRef.current = legend
    legend.addTo(map)

    // Cleanup function
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (legendRef.current) {
        legendRef.current.remove()
      }
      // Remove the style element
      const styleElement = document.querySelector('style')
      if (styleElement) {
        styleElement.remove()
      }
    }
  }, [map, isMobile])

  return null
}

// Helper to get icon size based on zoom
function getAmenityIconSize(zoom: number) {
  if (zoom >= 17) return 34;
  if (zoom >= 15) return 26;
  if (zoom >= 13) return 20;
  return 24;
}

// Helper to get CSS filter for a given color (approximate)
function getColorFilter(hex: string) {
  // Use a CSS filter to colorize black PNGs to the amenity color
  // These are approximate filter values for each color in the AMENITY_COLORS palette
  switch(hex) {
    case '#43a047': // Park - Deep green
      return 'invert(41%) sepia(77%) saturate(749%) hue-rotate(77deg) brightness(90%) contrast(101%)';
    case '#5d4037': // Graveyard - Dark brown
      return 'invert(23%) sepia(34%) saturate(749%) hue-rotate(7deg) brightness(80%) contrast(101%)';
    case '#1565c0': // Masjid - Strong blue
      return 'invert(27%) sepia(99%) saturate(749%) hue-rotate(183deg) brightness(90%) contrast(101%)';
    case '#fbc02d': // School - School bus yellow
      return 'invert(88%) sepia(99%) saturate(749%) hue-rotate(1deg) brightness(101%) contrast(101%)';
    case '#e53935': // Play Ground - Bright red
      return 'invert(32%) sepia(99%) saturate(749%) hue-rotate(-7deg) brightness(101%) contrast(101%)';
    case '#ff6f00': // Petrol Pump - Orange
      return 'invert(60%) sepia(99%) saturate(749%) hue-rotate(-20deg) brightness(101%) contrast(101%)';
    case '#00897b': // Health Facility - Teal
      return 'invert(49%) sepia(99%) saturate(749%) hue-rotate(135deg) brightness(101%) contrast(101%)';
    case '#7b1fa2': // Others - Purple
      return 'invert(19%) sepia(99%) saturate(749%) hue-rotate(270deg) brightness(101%) contrast(101%)';
    default:
      return '';
  }
}

// --- NEW: PhaseBoundaries component ---
export function PhaseBoundaries() {
  const map = useMap()
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    let isMounted = true
    const layerGroup = L.layerGroup()
    layerGroupRef.current = layerGroup

    // Fetch all phase GeoJSONs in parallel and add to group
    Promise.all(
      PHASE_FILES.map(async (filename) => {
        const response = await fetch(`/geojsons/${filename}`)
        if (!response.ok) throw new Error(`Failed to fetch ${filename}: ${response.statusText}`)
        const data = await response.json()
        return L.geoJSON(data, { style: phaseStyle })
      })
    ).then(layers => {
      if (!isMounted) return
      layers.forEach(layer => layerGroup.addLayer(layer))
      map.addLayer(layerGroup)
    })

    return () => {
      isMounted = false
      if (layerGroupRef.current) {
        layerGroupRef.current.remove()
      }
    }
  }, [map])

  return null
}

// --- NEW: AmenitiesLayer component ---
export function AmenitiesLayer() {
  const map = useMap()
  const amenityLayerRef = useRef<L.LayerGroup | null>(null)
  const amenityMarkersRef = useRef<L.Marker[]>([])
  const [amenityData, setAmenityData] = useState<any[]>([])

  // Zoom threshold for showing markers
  const AMENITY_MARKER_ZOOM = 14

  // Helper to add amenity markers
  const addAmenityMarkers = () => {
    if (!map || !amenityData.length) return
    // Remove existing markers
    amenityMarkersRef.current.forEach(marker => marker.remove())
    amenityMarkersRef.current = []
    // Only add if zoom is high enough
    if (map.getZoom() >= AMENITY_MARKER_ZOOM) {
      const group = amenityLayerRef.current
      const iconSize = getAmenityIconSize(map.getZoom())
      const imgSize = Math.round(iconSize * 0.8)
      amenityData.forEach((feature: any) => {
        const amenityType = (feature?.properties?.Type || 'Others') as AmenityType
        const color = AMENITY_COLORS[amenityType] || AMENITY_COLORS['Others']
        const iconUrl = AMENITY_ICONS[amenityType] || AMENITY_ICONS['Others']
        const coords = getPolygonCentroid(feature.geometry.coordinates)
        const latlng = [coords[1], coords[0]]
        const filter = getColorFilter(color)
        const icon = L.divIcon({
          className: '',
          iconSize: [iconSize, iconSize],
          iconAnchor: [Math.round(iconSize / 2), Math.round(iconSize / 2)],
          html: `
            <div style="
              width:${iconSize}px;height:${iconSize}px;
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="
                display:inline-flex;
                align-items:center;
                justify-content:center;
                box-shadow: 0 0 8px 2px ${color}55;
                margin-right:5px;
              ">
                <img src='${iconUrl}' alt='${amenityType}' style="width:${imgSize}px;height:${imgSize}px;object-fit:contain;display:block;filter:${getColorFilter(color)};" />
              </span>
            </div>
          `
        })
        const marker = L.marker(latlng as [number, number], { icon })
        // Add popup with amenity details
        let popupContent = `<div style='min-width:120px'>`
        popupContent += `<div style='font-weight:bold;font-size:1rem;margin-bottom:2px;'>${amenityType}</div>`
        Object.entries(feature.properties || {}).forEach(([key, value]) => {
          if (key !== 'Type' && value) {
            popupContent += `<div><span style='font-weight:500'>${key}:</span> ${value}</div>`
          }
        })
        popupContent += `</div>`
        marker.bindPopup(popupContent)
        marker.addTo(group!)
        amenityMarkersRef.current.push(marker)
      })
    }
  }

  useEffect(() => {
    let isMounted = true
    const amenityGroup = L.layerGroup()
    amenityLayerRef.current = amenityGroup

    // Load amenities GeoJSON
    fetch('/geojsons/Amenities.geojson')
      .then(response => response.json())
      .then(data => {
        if (!isMounted) return
        setAmenityData(data.features)
      })
      .catch(error => console.error('Error loading amenities:', error))

    // Add amenity group to map
    map.addLayer(amenityGroup)

    return () => {
      isMounted = false
      if (amenityLayerRef.current) {
        amenityLayerRef.current.remove()
      }
      // Remove markers
      amenityMarkersRef.current.forEach(marker => marker.remove())
      amenityMarkersRef.current = []
    }
  }, [map])

  // Add/remove markers on zoom or data change
  useEffect(() => {
    if (!map) return
    const handleZoom = () => {
      addAmenityMarkers()
    }
    map.on('zoomend', handleZoom)
    addAmenityMarkers()
    return () => {
      map.off('zoomend', handleZoom)
      // Remove markers
      amenityMarkersRef.current.forEach(marker => marker.remove())
      amenityMarkersRef.current = []
    }
  }, [map, amenityData])

  return <AmenityLegend />
}

// --- Legacy: PhaseOverlays for backward compatibility (can be removed if not used elsewhere) ---
export function PhaseOverlays() {
  // This is now a wrapper for backward compatibility, can be removed if not used elsewhere
  return <>
    <PhaseBoundaries />
    <AmenitiesLayer />
  </>
}