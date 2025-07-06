// Base API URL
const API_BASE_URL = "https://expodigital5432apis.dhai-r.com.pk/api"

// Authentication endpoints
const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  VERIFY_OTP: `${API_BASE_URL}/verify-otp`,
  RESEND_OTP: `${API_BASE_URL}/resend-otp`,
  CHANGE_PASSWORD: `${API_BASE_URL}/change-password`,
  FORGOT_PASSWORD: `${API_BASE_URL}/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/reset-password`,
}

// User endpoints
const USER_ENDPOINTS = {
  PROFILE: `${API_BASE_URL}/user`,
  UPDATE_PROFILE: `${API_BASE_URL}/update-profile`,
}

// Plot endpoints
const PLOT_ENDPOINTS = {
  ALL_PLOTS: `${API_BASE_URL}/plots`,
  FILTERED_PLOTS: `${API_BASE_URL}/filtered-plots`,
  PLOT_DETAILS: (id) => `${API_BASE_URL}/plots/${id}`,
  RESERVE_PLOT: `${API_BASE_URL}/reserve-plot`,
  UPDATE_BID: (id, amount) => `${API_BASE_URL}/update-bid/${id}/${amount}`,
  DHA_BIDDING_FLAG: `${API_BASE_URL}/dha-bidding`,

}

// Payment endpoints
const PAYMENT_ENDPOINTS = {
  PROCESS_PAYMENT: `${API_BASE_URL}/process-payment`,
  PAYMENT_STATUS: (paymentId) => `${API_BASE_URL}/payment-status/${paymentId}`,
}

// Add the dashboard stats endpoint to the appropriate section
const ADMIN_ENDPOINTS = {
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard-stats`,
}

// Marketing endpoints
const MARKETING_ENDPOINTS = {
  SALE_RESERVE_BOOKING: `${API_BASE_URL}/sale-reserve-booking`,
  HOLD_PLOT: `${API_BASE_URL}/hold-plot`,
}

// Export all endpoints
export {
  API_BASE_URL,
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  PLOT_ENDPOINTS,
  PAYMENT_ENDPOINTS,
  ADMIN_ENDPOINTS,
  MARKETING_ENDPOINTS,
}
