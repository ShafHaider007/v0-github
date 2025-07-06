"use client"

import { useState, useEffect } from "react"
import { fetchCountryFlag, getFlagEmoji } from "@/utils/country-flags"

export default function FlagComparisonTest() {
  const [apiFlags, setApiFlags] = useState({})
  const [unicodeFlags, setUnicodeFlags] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const countryCodes = ["PK", "US", "GB", "IN", "CN", "JP", "DE", "FR", "NG", "NE"]

  useEffect(() => {
    const loadFlags = async () => {
      try {
        setLoading(true)
        const apiFlagsPromises = countryCodes.map(async (code) => {
          const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(code)
          const flag = await fetchCountryFlag(countryName)
          return { code, flag }
        })
        const apiFlagsArray = await Promise.all(apiFlagsPromises)

        const apiFlagsObject = {}
        apiFlagsArray.forEach((item) => {
          apiFlagsObject[item.code] = item.flag
        })
        setApiFlags(apiFlagsObject)

        const unicodeFlagsObject = {}
        countryCodes.forEach((code) => {
          unicodeFlagsObject[code] = getFlagEmoji(code)
        })
        setUnicodeFlags(unicodeFlagsObject)
      } catch (err) {
        setError(err.message || "Failed to load flags")
      } finally {
        setLoading(false)
      }
    }

    loadFlags()
  }, [])

  if (loading) {
    return <p>Loading flags...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  return (
    <div>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">Country Code</th>
            <th className="border px-4 py-2">Country Name</th>
            <th className="border px-4 py-2">Emoji API</th>
            <th className="border px-4 py-2">Unicode</th>
          </tr>
        </thead>
        <tbody>
          {countryCodes.map((code) => {
            const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(code)
            return (
              <tr key={code}>
                <td className="border px-4 py-2">{code}</td>
                <td className="border px-4 py-2">{countryName}</td>
                <td className="border px-4 py-2 text-center">{apiFlags[code] || "N/A"}</td>
                <td className="border px-4 py-2 text-center">{unicodeFlags[code] || "N/A"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
