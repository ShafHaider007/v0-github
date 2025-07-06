"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import ManagerBookingForm from "@/components/manager/manager-booking-form"
import PlotSelectionList from "@/components/manager/plot-selection-list"
import PlotFilterForm from "@/components/manager/plot-filter-form"

export default function MarketingDashboard() {
  const { user, logout } = useAuth()
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [filterCriteria, setFilterCriteria] = useState({
    phase: "",
    sector: "",
    category: "",
    size: "",
    priceMin: "",
    priceMax: "",
  })

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilterCriteria((prev) => ({ ...prev, [name]: value }))
  }

  const handlePlotSelect = (plot) => {
    setSelectedPlot(plot)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Marketing Booking</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user?.name || "Marketing User"}</span>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {!selectedPlot ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Filter Plots</h2>
                <PlotFilterForm filterCriteria={filterCriteria} onFilterChange={handleFilterChange} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Available Plots</h2>
                <PlotSelectionList filterCriteria={filterCriteria} onPlotSelect={handlePlotSelect} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <ManagerBookingForm plot={selectedPlot} onBackToSelection={() => setSelectedPlot(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
