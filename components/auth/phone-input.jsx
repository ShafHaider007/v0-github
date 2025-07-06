"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCountries, getCountryCallingCode } from "libphonenumber-js"
import countryData from "country-data"

export default function PhoneInput({
  value,
  onChange,
  required = false,
  placeholder = "Phone number",
  name = "phone",
  id = "phone",
}) {
  const [countryCode, setCountryCode] = useState("+92") // Default Pakistan
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countries, setCountries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFlag, setSelectedFlag] = useState("https://flagcdn.com/w40/pk.png") // Default Pakistan flag
  const [isValid, setIsValid] = useState(true) // Track validation state

  // Memoize the country list to avoid recalculating on every render
  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true)
      const countryCodes = getCountries()

      const countryList = countryCodes
        .map((code) => {
          const country = countryData.countries[code]
          return {
            code,
            name: country?.name || code,
            flag: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
            dialCode: `+${getCountryCallingCode(code)}`,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      // Default to Pakistan flag
      const pakistan = countryList.find((country) => country.code === "PK")
      if (pakistan) {
        setSelectedFlag(pakistan.flag)
      }

      setCountries(countryList)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load countries only once on component mount
  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // Update phone number when value changes
  useEffect(() => {
    if (value && countries.length > 0) {
      // Find the country code in the value
      const matchedCountry = countries.find((country) => value.startsWith(country.dialCode))
      if (matchedCountry) {
        setCountryCode(matchedCountry.dialCode)
        setPhoneNumber(value.substring(matchedCountry.dialCode.length))
        setSelectedFlag(matchedCountry.flag)
      } else {
        setPhoneNumber(value)
      }
    }
  }, [value, countries])

  // Memoize the country selection handler
  const handleCountryCodeChange = useCallback(
    (value) => {
      // The value is now in format "code:dialCode" to ensure uniqueness
      const [code, dialCode] = value.split(":")
      const selectedCountry = countries.find((country) => country.code === code)

      if (selectedCountry) {
        setSelectedFlag(selectedCountry.flag)
        setCountryCode(dialCode)
        onChange(dialCode + phoneNumber)

        // Validate the phone number with the new country code
        validatePhoneNumber(phoneNumber, dialCode)
      }
    },
    [countries, onChange, phoneNumber],
  )

  // Add a handler that ensures only numeric input
  const handlePhoneNumberChange = useCallback(
    (e) => {
      const value = e.target.value

      // Only allow numbers
      const numericValue = value.replace(/\D/g, "")

      setPhoneNumber(numericValue)

      // Validate the phone number
      validatePhoneNumber(numericValue, countryCode)

      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        onChange(countryCode + numericValue)
      })
    },
    [countryCode, onChange],
  )

  // Add validation function to check phone number length based on country
  const validatePhoneNumber = (number, country) => {
    if (!number) {
      setIsValid(true)
      return true
    }

    const phoneDigits = number.replace(/\D/g, "")

    // Common country phone lengths
    const phoneLengths = {
      "+1": [10], // US/Canada
      "+44": [10], // UK
      "+91": [10], // India
      "+92": [10], // Pakistan
      "+86": [11], // China
      "+49": [10, 11], // Germany
      // Add more countries as needed
    }

    // If we have specific country rules, use them, otherwise allow 8-15 digits
    const validLengths = phoneLengths[country] || [8, 9, 10, 11, 12, 13, 14, 15]

    const valid =
      validLengths.includes(phoneDigits.length) ||
      (Array.isArray(validLengths) &&
        phoneDigits.length >= validLengths[0] &&
        phoneDigits.length <= validLengths[validLengths.length - 1])

    setIsValid(valid)
    return valid
  }

  // Memoize the select value to avoid recalculating on every render
  const selectValue = useMemo(() => {
    const selectedCountry = countries.find((c) => c.dialCode === countryCode)
    return selectedCountry ? `${selectedCountry.code}:${countryCode}` : ""
  }, [countries, countryCode])

  return (
    <div className="flex flex-col">
      <div className="flex">
        <Select value={selectValue} onValueChange={handleCountryCodeChange}>
          <SelectTrigger className="w-[110px] rounded-r-none border-r-0">
            <SelectValue placeholder={isLoading ? "Loading..." : "Code"}>
              <div className="flex items-center">
                <span>{countryCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-80">
              <SelectGroup>
                <SelectLabel>Countries</SelectLabel>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-2">Loading countries...</span>
                  </div>
                ) : (
                  countries.map((country) => (
                    <SelectItem key={country.code} value={`${country.code}:${country.dialCode}`}>
                      <span className="flex items-center">
                        <span className="mr-1">{country.dialCode}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[100px]">{country.name}</span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </ScrollArea>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Input
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            required={required}
            className={`rounded-l-none pl-10 w-full ${!isValid ? "border-red-500" : ""}`}
            placeholder={placeholder}
            disabled={isLoading}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <img src={selectedFlag || "/placeholder.svg"} alt="" className="w-6 h-4 rounded-sm" />
          </div>
        </div>
      </div>
      {/* Error message in a separate div to prevent layout shifts */}
      <div className="h-5 mt-1">
        {!isValid && <p className="text-xs text-red-500">Invalid phone number length for selected country</p>}
      </div>
    </div>
  )
}
