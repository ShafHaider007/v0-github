// Function to convert country code to flag emoji
export function countryCodeToFlagEmoji(countryCode) {
  if (!countryCode) return ""

  // Convert country code to uppercase
  const code = countryCode.toUpperCase()

  // Convert each letter to its corresponding regional indicator symbol
  const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0))

  // Convert code points to emoji
  return String.fromCodePoint(...codePoints)
}

// Get flag emoji for a country
export function getCountryFlag(countryCode) {
  if (!countryCode) return ""
  return countryCodeToFlagEmoji(countryCode)
}

// Check if the browser supports flag emojis
export function supportsFlagEmojis() {
  // Most modern browsers support flag emojis
  return true
}

// Fallback for browsers that don't support flag emojis
export function getFallbackFlag(countryCode) {
  if (!countryCode) return ""
  return `[${countryCode}]`
}
