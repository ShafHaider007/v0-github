import { getCountryFlag } from "./country-flags"

// Get country code from phone number
export function getCountryFromPhone(phoneNumber) {
  if (!phoneNumber) return null

  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")

  // Common country codes
  const countryCodes = {
    1: "US", // United States
    44: "GB", // United Kingdom
    91: "IN", // India
    92: "PK", // Pakistan
    86: "CN", // China
    49: "DE", // Germany
    33: "FR", // France
    39: "IT", // Italy
    7: "RU", // Russia
    81: "JP", // Japan
    82: "KR", // South Korea
    55: "BR", // Brazil
    52: "MX", // Mexico
    61: "AU", // Australia
    64: "NZ", // New Zealand
    27: "ZA", // South Africa
    971: "AE", // UAE
    966: "SA", // Saudi Arabia
    20: "EG", // Egypt
    234: "NG", // Nigeria
    254: "KE", // Kenya
    255: "TZ", // Tanzania
    256: "UG", // Uganda
    250: "RW", // Rwanda
    251: "ET", // Ethiopia
    233: "GH", // Ghana
    962: "JO", // Jordan
    961: "LB", // Lebanon
    963: "SY", // Syria
    964: "IQ", // Iraq
    965: "KW", // Kuwait
    968: "OM", // Oman
    974: "QA", // Qatar
    973: "BH", // Bahrain
    972: "IL", // Israel
    90: "TR", // Turkey
    98: "IR", // Iran
    93: "AF", // Afghanistan
    880: "BD", // Bangladesh
    94: "LK", // Sri Lanka
    977: "NP", // Nepal
    975: "BT", // Bhutan
    960: "MV", // Maldives
    95: "MM", // Myanmar
    856: "LA", // Laos
    855: "KH", // Cambodia
    84: "VN", // Vietnam
    66: "TH", // Thailand
    62: "ID", // Indonesia
    60: "MY", // Malaysia
    63: "PH", // Philippines
    65: "SG", // Singapore
    673: "BN", // Brunei
    852: "HK", // Hong Kong
    853: "MO", // Macau
    886: "TW", // Taiwan
  }

  // Try to match country code
  for (const code in countryCodes) {
    if (digits.startsWith(code)) {
      return countryCodes[code]
    }
  }

  return null
}

// Format phone number with country code
export function formatPhoneNumber(phoneNumber, countryCode) {
  if (!phoneNumber) return ""

  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, "")

  // Format based on country code
  switch (countryCode) {
    case "US": // United States
      if (digits.length === 10) {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      }
      break
    case "GB": // United Kingdom
      if (digits.length === 10) {
        return `+44 ${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
      }
      break
    case "PK": // Pakistan
      if (digits.length === 10) {
        return `+92 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      }
      break
    // Add more country-specific formatting as needed
    default:
      // Default formatting
      if (digits.length > 6) {
        return `+${countryCode} ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      }
      break
  }

  // If no specific formatting, return with country code
  return `+${countryCode} ${digits}`
}

// Get country flag emoji
export function getCountryFlagEmoji(countryCode) {
  return getCountryFlag(countryCode)
}

// Get country name from country code
export function getCountryName(countryCode) {
  const countries = {
    US: "United States",
    GB: "United Kingdom",
    IN: "India",
    PK: "Pakistan",
    CN: "China",
    DE: "Germany",
    FR: "France",
    IT: "Italy",
    RU: "Russia",
    JP: "Japan",
    KR: "South Korea",
    BR: "Brazil",
    MX: "Mexico",
    AU: "Australia",
    NZ: "New Zealand",
    ZA: "South Africa",
    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
    EG: "Egypt",
    NG: "Nigeria",
    // Add more countries as needed
  }

  return countries[countryCode] || countryCode
}
