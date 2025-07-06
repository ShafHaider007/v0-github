// Function to convert country code to flag emoji
export function getCountryFlag(countryCode) {
  if (!countryCode) return ""

  // Convert country code to uppercase
  const code = countryCode.toUpperCase()

  // Convert each letter to its corresponding regional indicator symbol
  const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0))

  // Convert code points to emoji
  return String.fromCodePoint(...codePoints)
}

// List of common country codes and their flags
export const countryFlags = {
  US: getCountryFlag("US"), // United States
  GB: getCountryFlag("GB"), // United Kingdom
  IN: getCountryFlag("IN"), // India
  PK: getCountryFlag("PK"), // Pakistan
  CN: getCountryFlag("CN"), // China
  DE: getCountryFlag("DE"), // Germany
  FR: getCountryFlag("FR"), // France
  IT: getCountryFlag("IT"), // Italy
  RU: getCountryFlag("RU"), // Russia
  JP: getCountryFlag("JP"), // Japan
  KR: getCountryFlag("KR"), // South Korea
  BR: getCountryFlag("BR"), // Brazil
  MX: getCountryFlag("MX"), // Mexico
  AU: getCountryFlag("AU"), // Australia
  NZ: getCountryFlag("NZ"), // New Zealand
  ZA: getCountryFlag("ZA"), // South Africa
  AE: getCountryFlag("AE"), // UAE
  SA: getCountryFlag("SA"), // Saudi Arabia
  EG: getCountryFlag("EG"), // Egypt
  NG: getCountryFlag("NG"), // Nigeria
  // Add more countries as needed
}
