const API_BASE_URL = "https://expodigital5432apis.dhai-r.com.pk/api"

export const PLOT_ENDPOINTS = {
  ALL_PLOTS: `${API_BASE_URL}/plots`,
  FILTERED_PLOTS: `${API_BASE_URL}/filtered-plots`,
  PLOT_DETAILS: (id) => `${API_BASE_URL}/plots/${id}`,
  RESERVE_PLOT: `${API_BASE_URL}/reserve-plot`,
  UPDATE_BID: (id, amount) => `${API_BASE_URL}/update-bid/${id}/${amount}`,
}

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}
