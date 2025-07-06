interface BidRankIndicatorProps {
  rank: number
  totalBids?: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export default function BidRankIndicator({ rank, totalBids, size = "md", showLabel = true }: BidRankIndicatorProps) {
  // Determine the color based on rank
  const getColorClass = () => {
    if (rank === 1) return "bg-green-100 text-green-800 border-green-200"
    if (rank <= 3) return "bg-blue-100 text-blue-800 border-blue-200"
    if (rank <= 10) return "bg-amber-100 text-amber-800 border-amber-200"
    return "bg-gray-100 text-gray-700 border-gray-200"
  }

  // Determine the size class
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-6 w-6 text-xs"
      case "lg":
        return "h-12 w-12 text-xl"
      default:
        return "h-9 w-9 text-sm"
    }
  }

  // Get the label text
  const getLabelText = () => {
    if (rank === 1) return "Highest Bid!"
    if (rank <= 3) return "Top 3 Bid"
    if (rank <= 10) return "Top 10 Bid"
    return `Rank #${rank}`
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${getSizeClass()} ${getColorClass()} rounded-full flex items-center justify-center font-bold border`}
      >
        #{rank}
      </div>
      {showLabel && (
        <p className={`mt-1 ${size === "sm" ? "text-xs" : "text-sm"} font-medium`}>
          {getLabelText()}
          {totalBids && <span className="text-gray-500 text-xs"> of {totalBids}</span>}
        </p>
      )}
    </div>
  )
}
