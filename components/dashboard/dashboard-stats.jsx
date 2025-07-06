export default function DashboardStats() {
  // Consistent stats data that matches with admin dashboard
  const statsData = {
    availablePlots: 850,
    availableResidential: 630,
    availableCommercial: 220,
    bidClosesIn: "2d 14h",
  }

  return (
    <div className="bg-gray-50 p-1 md:p-2 grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
      <div className="bg-white p-1 md:p-2 rounded-lg shadow-sm border-l-4 border-accent">
        <h3 className="text-xs font-medium text-gray-500">Available Plots</h3>
        <p className="text-sm md:text-base lg:text-lg font-bold">{statsData.availablePlots}</p>
      </div>
      <div className="bg-white p-1 md:p-2 rounded-lg shadow-sm border-l-4 border-blue-500">
        <h3 className="text-xs font-medium text-gray-500">Available Residential</h3>
        <p className="text-sm md:text-base lg:text-lg font-bold">{statsData.availableResidential}</p>
      </div>
      <div className="bg-white p-1 md:p-2 rounded-lg shadow-sm border-l-4 border-green-500">
        <h3 className="text-xs font-medium text-gray-500">Available Commercial</h3>
        <p className="text-sm md:text-base lg:text-lg font-bold">{statsData.availableCommercial}</p>
      </div>
      <div className="bg-white p-1 md:p-2 rounded-lg shadow-sm border-l-4 border-primary">
        <h3 className="text-xs font-medium text-gray-500">Bidding Closes In</h3>
        <p className="text-sm md:text-base lg:text-lg font-bold">{statsData.bidClosesIn}</p>
      </div>
    </div>
  )
}
