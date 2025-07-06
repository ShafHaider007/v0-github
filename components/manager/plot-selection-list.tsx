"use client"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PlotSelectionList({ plots, onPlotSelect, selectedPlot }) {
  const [open, setOpen] = useState(false)
  const [selectedPlotId, setSelectedPlotId] = useState(null)

  const handlePlotClick = (plot) => {
    setSelectedPlotId(plot.id)
    setOpen(true)
  }

  const handleConfirmHold = () => {
    onPlotSelect(plots.find((plot) => plot.id === selectedPlotId))
    setOpen(false)
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to hold this plot?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPlotId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmHold}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-2">
        {plots.map((plot) => (
          <div
            key={plot.id}
            className={`flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-gray-100 ${
              selectedPlot?.id === plot.id ? "bg-blue-50 border-blue-500" : "border-gray-200"
            }`}
            onClick={() => handlePlotClick(plot)}
          >
            <div className="flex items-center">
              <Checkbox
                id={`plot-${plot.id}`}
                checked={selectedPlot?.id === plot.id}
                readOnly // Make checkbox read-only since the whole div is clickable
              />
              <Label htmlFor={`plot-${plot.id}`} className="ml-2 cursor-pointer">
                {plot.plot_no} - {plot.category}
                <span className="text-muted-foreground ml-2">
                  (Phase {plot.phase}, Sector {plot.sector}, Street {plot.street_no})
                </span>
              </Label>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
