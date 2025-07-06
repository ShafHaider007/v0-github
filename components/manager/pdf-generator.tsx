"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import ReactDOM from "react-dom/client"
import PrintableForm from "./printable-form"
import { useState } from "react"

export function PDFGenerator({ bookingData }) {
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const generatePDF = async () => {
    if (!bookingData) return

    setPdfGenerating(true)
 
    try {
      // Create a temporary div to render the printable form
      const tempDiv = document.createElement("div")
      tempDiv.id = "pdf-container"
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.top = "0"
      tempDiv.style.width = "794px" // A4 width in pixels at 96 DPI
      tempDiv.style.backgroundColor = "#ffffff"
      document.body.appendChild(tempDiv)

      // Render the PrintableForm into the temporary div
      const root = ReactDOM.createRoot(tempDiv)
      root.render(<PrintableForm bookingData={bookingData} />)

      // Wait for the content to render
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Get the application form and terms & conditions sections
      const applicationForm = document.getElementById("application-form")
      const termsConditions = document.getElementById("terms-conditions")

      if (!applicationForm || !termsConditions) {
        throw new Error("Could not find form sections")
      }

      // Function to add a section to the PDF
      const addSectionToPDF = async (element, pageIndex = 0) => {
        try {
          // Add a new page if not the first page
          if (pageIndex > 0) {
            pdf.addPage()
          }

          // Capture the element as an image
          const canvas = await html2canvas(element, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          })

          // Check if canvas has valid dimensions
          if (canvas.width <= 0 || canvas.height <= 0) {
            return false
          }

          // Convert to image data
          const imgData = canvas.toDataURL("image/jpeg", 0.95)

          // Get PDF dimensions
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = pdf.internal.pageSize.getHeight()

          // Calculate scaling to fit the page
          const imgWidth = canvas.width
          const imgHeight = canvas.height

          // Use safe values for ratio calculation
          let ratio = Math.min(pdfWidth / Math.max(1, imgWidth), pdfHeight / Math.max(1, imgHeight))

          // Ensure ratio is valid
          ratio = isNaN(ratio) || ratio <= 0 ? 0.7 : ratio

          // Calculate dimensions with safe values
          const scaledWidth = Math.max(1, imgWidth) * ratio
          const scaledHeight = Math.max(1, imgHeight) * ratio

          // Ensure coordinates are valid
          const x = Math.max(0, (pdfWidth - scaledWidth) / 2)
          const y = Math.max(0, (pdfHeight - scaledHeight) / 2)

          // Add the image to the PDF with safe coordinates
          pdf.addImage(imgData, "JPEG", x, y, scaledWidth, scaledHeight)
          return true
        } catch (err) {
          return false
        }
      }

      // Add application form to first page
      const firstPageSuccess = await addSectionToPDF(applicationForm, 0)

      // Add terms & conditions to second page
      if (firstPageSuccess) {
        await addSectionToPDF(termsConditions, 1)
      }

      // Clean up the temporary div
      document.body.removeChild(tempDiv)

      // Download the PDF
      pdf.save(`DHA_Plot_Booking_${bookingData.booking_id || "Form"}.pdf`)
    } catch (err) {
    } finally {
      setPdfGenerating(false)
    }
  }

  return (
    <Button onClick={generatePDF} disabled={pdfGenerating} className="flex items-center">
      <Download className="h-4 w-4 mr-2" />
      {pdfGenerating ? "Generating PDF..." : "Download PDF"}
    </Button>
  )
}
