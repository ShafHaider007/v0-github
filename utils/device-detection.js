// Utility function to detect iPhone and iPad devices
export const isIPhone = () => {
  if (typeof window === "undefined") return false

  // Check for iPhone specifically in the user agent
  // This will detect iPhones but not iPads or MacBooks
  const userAgent = window.navigator.userAgent
  return /iPhone/i.test(userAgent)
}

// New function to detect iPad devices
export const isIPad = () => {
  if (typeof window === "undefined") return false

  const userAgent = window.navigator.userAgent

  // Modern iPads report as Macintosh but have touch support
  if (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 0) {
    return true
  }

  // Older iPads
  return /iPad/i.test(userAgent)
}

// Combined function to detect any iOS device (iPhone or iPad)
export const isAppleDevice = () => {
  return isIPhone() || isIPad()
}
