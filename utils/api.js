import { USER_ENDPOINTS, PLOT_ENDPOINTS, ADMIN_ENDPOINTS } from "../config/api-config"
import proj4 from "proj4"

// Define projections
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs")
proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs")

// Add this helper function to get auth token if it doesn't exist
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export const fetchDhaBiding = async () => {
  // Public API: no token required
  const response = await fetch(PLOT_ENDPOINTS.DHA_BIDDING_FLAG, {
    headers: { 
      'Content-Type': 'application/json'
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch DHA Biding data")
  }

  const result = await response.json()
  if (result === 0 || result === 1) {
    return result
  }

  throw new Error("Invalid DHA Biding response format")
}

// Update the fetchAllPlots function to handle errors more gracefully
export const fetchAllPlots = async () => {
  try {
    console.log("Fetching plots from API:", PLOT_ENDPOINTS.FILTERED_PLOTS)
    const token = getAuthToken()

    // Check if token exists and add it to the headers
    const headers = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(PLOT_ENDPOINTS.FILTERED_PLOTS, {
      headers,
    })

    if (!response.ok) {
      throw new Error("Something went wrong, please try again.")
    }

    const responseData = await response.json()
    console.log("API response:", responseData)

    // Extract plots from the new response structure
    if (responseData.success && responseData.data && responseData.data.plots) {
      return responseData.data.plots
    } else {
      throw new Error("Invalid response format from API")
    }
  } catch (error) {
    console.error("Error fetching plots:", error)
    throw new Error("Something went wrong, please try again.")
  }
}

// Update the fetchPlotById function to handle errors more gracefully
export const fetchPlotById = async (id) => {
  try {
    const token = getAuthToken()

    // Check if token exists and add it to the headers
    const headers = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(PLOT_ENDPOINTS.PLOT_DETAILS(id), {
      headers,
    })

    if (!response.ok) {
      throw new Error("Something went wrong, please try again.")
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching plot ${id}:`, error)
    throw new Error("Something went wrong, please try again.")
  }
}

// Update the fetchUserProfile function to handle errors more gracefully
export const fetchUserProfile = async () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication token not found")
  }

  try {
    const response = await fetch(USER_ENDPOINTS.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Something went wrong, please try again.")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw new Error("Something went wrong, please try again.")
  }
}

// Update the reservePlot function to handle the plan_type parameter
export const reservePlot = async (plotData) => {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error("Authentication token not found")
    }

    const formData = new FormData()
    formData.append("plot_id", plotData.plot_id)

    if (plotData.token_amount) {
      formData.append("token_amount", plotData.token_amount)
    }

    if (plotData.bid_amount) {
      formData.append("bid_amount", plotData.bid_amount)
    }

    formData.append("payment_method", plotData.payment_method)

    // Add this line to include plan_type if it exists
    if (plotData.plan_type) {
      formData.append("plan_type", plotData.plan_type)
    }

    const response = await fetch(PLOT_ENDPOINTS.RESERVE_PLOT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error("Error reserving plot:", error)
    throw error
  }
}

// Update the updateBidAmount function to use the correct API endpoint format
export const updateBidAmount = async (reserveBookingId, bidAmount) => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication token not found")
  }

  try {
    const response = await fetch(
      `https://expodigital5432apis.dhai-r.com.pk/api/update-bid-amount?reserve_booking_id=${reserveBookingId}&bid_amount=${bidAmount}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const responseData = await response.json()

    if (!response.ok) {
      // Pass through the complete error response
      throw responseData
    }

    return responseData
  } catch (error) {
    console.error("Error updating bid amount:", error)
    // Pass through the complete error object from the API
    throw error
  }
}

// Enhance the convertPlotsToGeoJSON function to properly handle the st_asgeojson field
export const convertPlotsToGeoJSON = (plots) => {
  if (!plots || !Array.isArray(plots)) {
    return { type: "FeatureCollection", features: [] }
  }

  const features = plots.map((plot) => {
    // Parse the GeoJSON string from the API
    let geometry
    try {
      if (plot.st_asgeojson) {
        const parsedGeometry = JSON.parse(plot.st_asgeojson)

        // Check if the geometry is in UTM (EPSG:32643) and convert to WGS84 (EPSG:4326)
        if (
          parsedGeometry.crs &&
          parsedGeometry.crs.properties &&
          parsedGeometry.crs.properties.name === "EPSG:32643"
        ) {
          // For MultiPolygon, convert each coordinate
          if (parsedGeometry.type === "MultiPolygon") {
            const convertedCoordinates = parsedGeometry.coordinates.map((polygon) =>
              polygon.map((ring) =>
                ring.map((coord) => {
                  // Convert from UTM to WGS84
                  const [lon, lat] = proj4("EPSG:32643", "EPSG:4326", coord)
                  return [lon, lat] // GeoJSON uses [longitude, latitude]
                }),
              ),
            )

            geometry = {
              type: "MultiPolygon",
              coordinates: convertedCoordinates,
            }
          } else {
            // Handle other geometry types if needed
            geometry = parsedGeometry
          }
        } else {
          // If not explicitly in UTM, assume it's already in the right format
          geometry = parsedGeometry
        }
      } else {
        // Default geometry if none provided
        geometry = {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
              ],
            ],
          ],
        }
      }
    } catch (error) {
      console.error("Error parsing GeoJSON:", error, plot.st_asgeojson)
      geometry = {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
            ],
          ],
        ],
      }
    }

    return {
      type: "Feature",
      properties: {
        id: plot.id.toString(),
        PLOT_NO: plot.plot_no,
        CATEGORY: plot.category,
        SIZE: plot.cat_area,
        PLOT_SIZE: plot.size,
        //   CAT_AREA: plot.cat_area, // Store the size directly from API
        PLOT_STATU: plot.status,
        TYPE: "Plot",
        SUBTYPE: "Standard",
        SECTOR: plot.sector || "Unknown",
        PHASE: plot.phase || "Unknown",
        STREET_NO: plot.street_no || "Unknown",
        GIS_UID: `plot-${plot.id}`,
        base_price: plot.base_price,
        token_amount: plot.token_amount,
        remarks: plot.remarks, // Add the remarks field
        // Store the original st_asgeojson for reference
        original_geometry: plot.st_asgeojson,
      },
      geometry: geometry,
    }
  })

  return {
    type: "FeatureCollection",
    features: features,
  }
}

// Add this function to the existing functions
export const fetchDashboardStats = async () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication token not found")
  }

  try {
    const response = await fetch(ADMIN_ENDPOINTS.DASHBOARD_STATS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw new Error("Failed to fetch dashboard stats. Please try again.")
  }
}

// Let's update the fetchPaymentList function to support a larger page size parameter
// Find the fetchPaymentList function and update it:

export const fetchPaymentList = async (page = 1, pageSize = 50) => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication token not found")
  }

  try {
    const response = await fetch(
      `https://expodigital5432apis.dhai-r.com.pk/api/payment-list?page=${page}&per_page=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch payment list")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching payment list:", error)
    throw new Error("Failed to fetch payment list. Please try again.")
  }
}

// Add this new function to fetch the KuickPay processing fee
export const fetchKuickPayFee = async (tokenAmount) => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication token not found")
  }

  try {
    const response = await fetch(
      `https://expodigital5432apis.dhai-r.com.pk/api/kuick-pay-fee?token_amount=${tokenAmount}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch processing fee")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching KuickPay fee:", error)
    throw new Error("Failed to fetch processing fee. Please try again.")
  }
}

// Add this new function after the fetchKuickPayFee function
export const fetchRegisteredUsers = async () => {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication token not found")
  }

  try {
    const response = await fetch("https://expodigital5432apis.dhai-r.com.pk/api/registered-users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch registered users")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching registered users:", error)
    throw new Error("Failed to fetch registered users. Please try again.")
  }
  
}
