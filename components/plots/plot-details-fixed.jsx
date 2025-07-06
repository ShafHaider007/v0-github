export default function PlotDetails({ plot }) {
  // Add console logging to see the plot data

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
      case "Unsold":
        return "bg-green-100 text-green-800"
      case "sold":
      case "Sold":
        return "bg-red-100 text-red-800"
      case "bidding":
        return "bg-orange-100 text-orange-800"
      case "Payment Done (Confirmation Awaited)":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "residential":
        return "bg-green-100 text-green-800"
      case "commercial":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Update the price label text based on phase and sector
  const getPriceLabel = () => {
    if ((plot.phase === "4" && plot.sector === "RVN") || (plot.phase === "6" && plot.sector === "B3")) {
      return "2 Year Installment"
    } else {
      return plot.category === "Commercial" ? "Reserve Price" : "Lump Sum Price"
    }
  }

  // Function to determine if payment plan should be shown
  const shouldShowPaymentPlan = () => {
    if (plot.phase === "4" && plot.sector === "RVN" && plot.category?.toLowerCase() === "residential") {
      return "/images/payment_plan_rvn.jpg"
    } else if (plot.phase === "6" && plot.sector === "B3" && plot.category?.toLowerCase() === "residential") {
      return "/images/payment_plan_b3.jpg"
    }
    return null
  }

  const paymentPlanUrl = shouldShowPaymentPlan()

  // Check if remarks exist and are not "NULL"
  const hasRemarks = plot.remarks && plot.remarks !== "NULL"
  const displayCategory = hasRemarks ? `${plot.category} (${plot.remarks})` : plot.category || plot.type

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{plot.plot_no}</h3>
        <div className="flex gap-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(plot.category)}`}>
            {displayCategory}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plot.status)}`}>
            {plot.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500">Size</p>
          <p className="font-medium">{plot.size}</p>
        </div>
        <div>
          <p className="text-gray-500">Phase/Sector</p>
          <p className="font-medium">
            {plot.phase}/{plot.sector}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">{getPriceLabel()}</p>
          <p className="font-bold text-lg">PKR {Number(plot.base_price).toLocaleString()}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Token Amount</p>
          <p className="font-medium">PKR {Number(plot.token_amount).toLocaleString()}</p>
        </div>
      </div>

      {/* Conditionally show payment plan link */}
      {paymentPlanUrl && (
        <div className="mt-3 text-center">
          <a
            href={paymentPlanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View Payment Plan
          </a>
        </div>
      )}
    </div>
  )
}
