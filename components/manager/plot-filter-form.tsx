"use client"

import { Button } from "@/components/ui/button"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PlotFilterForm({ onFilterChange }) {
  const [filters, setFilters] = useState({
    category: "all",
    phase: "all",
    sector: "all",
    size: "all",
    priceRange: "all",
  })

  const handleCategoryChange = (value) => {
    setFilters((prev) => ({ ...prev, category: value }))
    onFilterChange({ ...filters, category: value })
  }

  const handleSelectChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    onFilterChange({ ...filters, [field]: value })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    onFilterChange({ ...filters, [name]: value })
  }

  const handleReset = () => {
    const resetFilterValues = {
      category: "all",
      phase: "all",
      sector: "all",
      size: "all",
      priceRange: "all",
    }

    setFilters(resetFilterValues)
    onFilterChange(resetFilterValues)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">Plot Category</Label>
        <RadioGroup value={filters.category} onValueChange={handleCategoryChange} className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="residential" id="residential" />
            <Label htmlFor="residential">Residential</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="commercial" id="commercial" />
            <Label htmlFor="commercial">Commercial</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="phase" className="text-base">
          Phase
        </Label>
        <Select value={filters.phase} onValueChange={(value) => handleSelectChange("phase", value)}>
          <SelectTrigger id="phase" className="mt-2">
            <SelectValue placeholder="Select Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="1">Phase 1</SelectItem>
            <SelectItem value="2">Phase 2</SelectItem>
            <SelectItem value="3">Phase 3</SelectItem>
            <SelectItem value="4">Phase 4</SelectItem>
            <SelectItem value="5">Phase 5</SelectItem>
            <SelectItem value="6">Phase 6</SelectItem>
            <SelectItem value="7">Phase 7</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sector" className="text-base">
          Sector
        </Label>
        <Select value={filters.sector} onValueChange={(value) => handleSelectChange("sector", value)}>
          <SelectTrigger id="sector" className="mt-2">
            <SelectValue placeholder="Select Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            <SelectItem value="A">Sector A</SelectItem>
            <SelectItem value="B">Sector B</SelectItem>
            <SelectItem value="C">Sector C</SelectItem>
            <SelectItem value="D">Sector D</SelectItem>
            <SelectItem value="E">Sector E</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="size" className="text-base">
          Plot Size
        </Label>
        <Select value={filters.size} onValueChange={(value) => handleSelectChange("size", value)}>
          <SelectTrigger id="size" className="mt-2">
            <SelectValue placeholder="Select Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="5 Marla">5 Marla</SelectItem>
            <SelectItem value="8 Marla">8 Marla</SelectItem>
            <SelectItem value="10 Marla">10 Marla</SelectItem>
            <SelectItem value="1 Kanal">1 Kanal</SelectItem>
            <SelectItem value="2 Kanal">2 Kanal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="priceRange" className="text-base">
          Price Range
        </Label>
        <Select value={filters.priceRange} onValueChange={(value) => handleSelectChange("priceRange", value)}>
          <SelectTrigger id="priceRange" className="mt-2">
            <SelectValue placeholder="Select Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="0-10000000">Under 10 Million</SelectItem>
            <SelectItem value="10000000-20000000">10 - 20 Million</SelectItem>
            <SelectItem value="20000000-30000000">20 - 30 Million</SelectItem>
            <SelectItem value="30000000-50000000">30 - 50 Million</SelectItem>
            <SelectItem value="50000000+">50 Million +</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleReset} variant="outline" className="w-full">
        Reset Filters
      </Button>
    </div>
  )
}
